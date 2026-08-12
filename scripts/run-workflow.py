#!/usr/bin/env python3
"""Run the four-role workflow through Claude Code and Codex adapters.

The runner uses JSON artifacts as hard boundaries between roles. It is dry-run
by default. Use --mock to test the complete orchestration without provider
calls, or --execute to invoke the configured CLIs in a target repository.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import shlex
import shutil
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path


WORKFLOW_ROOT = Path(__file__).resolve().parents[1]
SCHEMA_ROOT = WORKFLOW_ROOT / "workflow" / "schemas"
ROLES = ("planner", "verifier", "implementer", "tester")


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def read_json(path: Path):
    with path.open(encoding="utf-8") as handle:
        return json.load(handle)


def write_json(path: Path, value) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, indent=2) + "\n", encoding="utf-8")


def feature_entry(feature_id: str, feature_file: Path):
    features = read_json(feature_file)
    for feature in features:
        if feature.get("id") == feature_id:
            return feature
    raise SystemExit(f"Feature {feature_id!r} not found in {feature_file}")


def profile(profile_file: Path) -> dict:
    # The profile deliberately uses a tiny YAML subset so the runner has no
    # third-party dependency. Environment variables override its model choices.
    text = profile_file.read_text(encoding="utf-8")
    values = {}
    for role in ROLES:
        match = re.search(
            rf"^  {role}:\s*\n    provider:\s*([^\s#]+)\s*\n    model:\s*([^\s#]+)",
            text,
            re.MULTILINE,
        )
        if not match:
            raise SystemExit(f"Invalid role profile: missing {role} in {profile_file}")
        values[role] = {"provider": match.group(1), "model": match.group(2)}
    return {
        role: {
            "provider": os.getenv(f"WORKFLOW_{role.upper()}_PROVIDER", values[role]["provider"]),
            "model": os.getenv(f"WORKFLOW_{role.upper()}_MODEL", values[role]["model"]),
        }
        for role in values
    }


def command_for(provider: str, model: str, prompt: str, role: str) -> list[str]:
    if provider == "claude-code":
        binary = os.getenv("CLAUDE_BIN", "claude")
        return [binary, "-p", "--add-dir", str(WORKFLOW_ROOT), "--model", model, "--output-format", "json", prompt]
    if provider == "codex":
        binary = os.getenv("CODEX_BIN", "codex")
        sandbox = "workspace-write" if role in ("implementer", "tester") else "read-only"
        return [binary, "exec", "--sandbox", sandbox, "--model", model, prompt]
    raise ValueError(f"Unsupported provider: {provider}")


def mock_payload(role: str) -> dict:
    if role == "planner":
        return {
            "plan_summary": "Mock plan for orchestration validation",
            "rationale": "Mock provider; no repository changes made",
            "files_to_change": [],
            "edge_cases": [],
            "test_plan": [{"name": "mock check", "cmd": "true"}],
            "open_questions_resolved": [],
        }
    if role == "verifier":
        return {"approved": True, "blockers": [], "required_revisions": []}
    if role == "implementer":
        return {"changed_files": [], "commands_run": [], "deviations": [], "remaining_risks": []}
    return {
        "final_state": "active",
        "commands": [],
        "results": [],
        "skipped_checks": [],
        "gaps": ["Mock execution did not run repository checks"],
    }


def validate_payload(role: str, payload: object) -> dict:
    schema = read_json(SCHEMA_ROOT / f"{role}.schema.json")
    if not isinstance(payload, dict):
        raise SystemExit(f"{role} output must be a JSON object")
    missing = [key for key in schema["required"] if key not in payload]
    if missing:
        raise SystemExit(f"{role} output is missing required fields: {', '.join(missing)}")
    for key, expected in schema.get("types", {}).items():
        if key not in payload:
            continue
        valid = {
            "array": isinstance(payload[key], list),
            "boolean": isinstance(payload[key], bool),
            "string": isinstance(payload[key], str),
        }.get(expected, True)
        if not valid:
            raise SystemExit(f"{role}.{key} must be a {expected}")
    return payload


def extract_payload(stdout: str) -> dict:
    """Accept raw JSON or Claude's JSON envelope containing a result string."""
    try:
        value = json.loads(stdout)
    except json.JSONDecodeError:
        value = None
    if isinstance(value, dict) and isinstance(value.get("result"), str):
        try:
            return json.loads(value["result"])
        except json.JSONDecodeError:
            fenced = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", value["result"], re.DOTALL)
            if fenced:
                return json.loads(fenced.group(1))
    if isinstance(value, dict):
        return value
    # Allow a model to surround its final JSON with whitespace or a code fence.
    match = re.search(r"\{.*\}", stdout, re.DOTALL)
    if match:
        return json.loads(match.group(0))
    raise SystemExit("Provider output did not contain a JSON object")


def reuse_payload(role: str, output: Path) -> dict:
    if not output.exists():
        raise SystemExit(f"Cannot reuse {role}; artifact not found: {output}")
    record = read_json(output)
    payload = record.get("payload")
    if payload is None and isinstance(record.get("stdout"), str):
        payload = extract_payload(record["stdout"])
    payload = validate_payload(role, payload)
    print(f"{role}: reused -> {output}")
    return payload


def invoke(
    role: str,
    provider: str,
    model: str,
    prompt: str,
    output: Path,
    repo_root: Path,
    execute: bool,
    mock: bool,
) -> dict | None:
    command = command_for(provider, model, prompt, role)
    record = {
        "role": role,
        "provider": provider,
        "model": model,
        "created_at": utc_now(),
        "command": shlex.join(command[:-1]) + " <prompt>",
        "prompt": prompt,
        "status": "dry-run",
    }
    if mock:
        payload = mock_payload(role)
        record.update({"status": "mock", "payload": payload})
    elif execute:
        binary = command[0]
        if shutil.which(binary) is None:
            raise SystemExit(f"{binary!r} is not on PATH; configure the CLI or use --mock.")
        result = subprocess.run(command, cwd=repo_root, text=True, capture_output=True)
        record.update({"exit_code": result.returncode, "stdout": result.stdout, "stderr": result.stderr})
        if result.returncode != 0:
            record["status"] = "failed"
            write_json(output, record)
            raise SystemExit(f"{role} failed; see {output}")
        try:
            payload = extract_payload(result.stdout)
            record.update({"status": "completed", "payload": validate_payload(role, payload)})
        except SystemExit as error:
            record.update({"status": "invalid-output", "validation_error": str(error)})
            write_json(output, record)
            raise
    else:
        print(f"{role}: dry-run -> {record['command']}")
        return None
    write_json(output, record)
    print(f"{role}: {record['status']} -> {output}")
    return record["payload"]


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("feature_id")
    parser.add_argument("--repo-root", default=".", help="target application repository")
    parser.add_argument("--feature-file", default="feature_list.json")
    parser.add_argument("--profile", default=str(WORKFLOW_ROOT / "workflow" / "roles.yaml"))
    parser.add_argument("--execute", action="store_true", help="invoke configured CLIs")
    parser.add_argument("--mock", action="store_true", help="run the complete flow without provider calls")
    parser.add_argument(
        "--resume-after-verifier",
        action="store_true",
        help="reuse already validated Planner and Verifier artifacts",
    )
    args = parser.parse_args()
    if args.execute and args.mock:
        raise SystemExit("Choose only one of --execute or --mock")

    repo_root = Path(args.repo_root).resolve()
    feature_file = (repo_root / args.feature_file).resolve()
    profile_file = Path(args.profile).resolve()
    if not feature_file.exists():
        raise SystemExit(f"Feature file not found: {feature_file}")
    if not profile_file.exists():
        raise SystemExit(f"Role profile not found: {profile_file}")
    feature = feature_entry(args.feature_id, feature_file)
    if (args.execute or args.mock) and feature.get("state") != "active":
        raise SystemExit(f"Feature {args.feature_id} must be active; current state is {feature.get('state')!r}")

    roles = profile(profile_file)
    artifact_dir = repo_root / ".artifacts" / args.feature_id
    if args.execute or args.mock:
        artifact_dir.mkdir(parents=True, exist_ok=True)
        write_json(artifact_dir / "feature-input.json", feature)
    else:
        print(f"Dry run for {args.feature_id}; no files will be written under {artifact_dir}")

    planner_prompt = (
        "Act as the Planner for the AI software delivery workflow. Read the workflow contract at "
        f"{WORKFLOW_ROOT / 'SKILL.md'} and the repository plus feature input at "
        f"{artifact_dir / 'feature-input.json'}. Do not edit files. Return only JSON matching "
        f"{SCHEMA_ROOT / 'planner.schema.json'}. Required fields: plan_summary (string), "
        "rationale (string), files_to_change (array), edge_cases (array), test_plan (array), "
        "open_questions_resolved (array). No Markdown or commentary."
    )
    planner_output = artifact_dir / "planner-output.json"
    if args.resume_after_verifier:
        planner = reuse_payload("planner", planner_output)
    else:
        planner = invoke("planner", roles["planner"]["provider"], roles["planner"]["model"], planner_prompt,
                         planner_output, repo_root, args.execute, args.mock)
    if not (args.execute or args.mock):
        return 0

    verifier_prompt = (
        "Act as the independent Verifier for the AI software delivery workflow. Read the role "
        f"contract at {WORKFLOW_ROOT / 'references' / 'role-contract.md'}, the feature input, "
        f"and planner output in {artifact_dir}. Do not edit files. Return only JSON matching "
        f"{SCHEMA_ROOT / 'verifier.schema.json'}. Required fields: approved (boolean), "
        "blockers (array), required_revisions (array). No Markdown or commentary."
    )
    verifier_output = artifact_dir / "verifier-output.json"
    if args.resume_after_verifier:
        verifier = reuse_payload("verifier", verifier_output)
    else:
        verifier = invoke("verifier", roles["verifier"]["provider"], roles["verifier"]["model"], verifier_prompt,
                          verifier_output, repo_root, args.execute, args.mock)
    if not verifier["approved"]:
        raise SystemExit(f"Verifier rejected the plan: {json.dumps(verifier['blockers'])}")

    implementer_prompt = (
        "Act as the Implementer for the AI software delivery workflow. Read the verified plan "
        f"and feature input in {artifact_dir}. Make the smallest required code and test changes. "
        "Do not edit feature state to passing. Return only JSON matching "
        f"{SCHEMA_ROOT / 'implementer.schema.json'}. Required fields: changed_files (array), "
        "commands_run (array), deviations (array), remaining_risks (array). No Markdown or commentary."
    )
    invoke("implementer", roles["implementer"]["provider"], roles["implementer"]["model"], implementer_prompt,
           artifact_dir / "implementer-output.json", repo_root, args.execute, args.mock)

    tester_prompt = (
        "Act as the independent Tester for the AI software delivery workflow. Read the feature "
        f"input, plan, implementation report, current repository from {artifact_dir}, and the "
        f"evidence contract at {WORKFLOW_ROOT / 'references' / 'evidence-driven-testing.md'}. Re-run "
        "every executable check. Update feature_list.json and DECISIONS.md only according to real "
        "evidence: set passing only if every required check passes; otherwise keep the feature "
        "active or blocked and record the gaps. For user-observable behavior, capture evidence on "
        "the appropriate interaction surface; for HTTP APIs, use an executed Swagger UI flow when "
        "available, without exposing secrets, and never substitute it for automated tests. Return "
        "only JSON matching "
        f"{SCHEMA_ROOT / 'tester.schema.json'}. Required fields: final_state (string), "
        "commands (array), results (array), skipped_checks (array), gaps (array). No Markdown "
        "or commentary. You alone may recommend passing."
    )
    tester = invoke("tester", roles["tester"]["provider"], roles["tester"]["model"], tester_prompt,
                    artifact_dir / "tester-output.json", repo_root, args.execute, args.mock)
    if not args.mock and tester["final_state"] != "passing":
        raise SystemExit(
            f"Tester did not approve {args.feature_id} as passing; final_state={tester['final_state']!r}"
        )
    return 0


if __name__ == "__main__":
    sys.exit(main())
