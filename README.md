# Turn-based loop: Planner → Verifier → Implementer → Tester

A Claude Code workflow that ships one feature at a time through four independent roles:
1. **Planner** locks a design
2. **Verifier** checks it before code exists
3. **Implementer** builds it in an isolated [worktree](https://code.claude.com/docs/en/worktrees)
4. **Tester** independently re-verifies and is the only role allowed to mark the feature "passing." No role trusts the previous role's self-report.

## Requirements

- Claude Code with the `Workflow` tool (agent/phase/worktree-isolation primitives)
- `jq` (`brew install jq` / `apt install jq`)
- A repo with a `Makefile` exposing `format` and `lint` targets
- `git`

## Quickstart

Choose the entry point that matches your host:

- **npm (recommended):** run `npx create-feature-4agent@latest` in the target repo. This installs the workflow, verifier, starter `feature_list.json`, `AGENTS.md`, and `DECISIONS.md` without overwriting existing files.
- **Claude Code plugin:** install the plugin:
  ```bash
  claude plugin install feature-4agent@turn-based-loop-workflow
  ```
  If this is your first time using the marketplace, run this once first:
  ```bash
  claude plugin marketplace add Stephen-Kimoi/turn-based-loop-workflow
  ```
  Then run `/feature-4agent:init` and `/feature-4agent:run F01`.
- **Codex plugin:** install the Codex adapter:
  ```bash
  codex plugin add feature-4agent-codex@turn-based-loop-workflow
  ```
  If this is your first time using the marketplace, run this once first:
  ```bash
  codex plugin marketplace add https://github.com/Stephen-Kimoi/turn-based-loop-workflow
  ```
  Then use the `init`, `run`, and `verify` skills. Codex executes the same contract natively; it does not depend on Claude's `Workflow` tool.

The workflow returns `{ status: 'implemented', ... }` on success or `{ status: 'blocked_at_plan', ... }` if the Verifier couldn't sign off within 6 rounds.

## Using the workflow

After installation, add a feature to `feature_list.json`, then send this end-to-end prompt:

```text
Use the feature-4agent workflow end to end for feature F01. Read feature_list.json,
AGENTS.md, and DECISIONS.md; have the Planner create the plan, the Verifier approve
executable checks, the Implementer make the changes, and the Tester independently run
all checks and record the result. Do not claim success unless every check passes and
F01 is marked passing by the verification harness.
```

For example, `feature_list.json` might contain:

```json
{
  "id": "F01",
  "behavior": "Add a health endpoint that returns HTTP 200 and {\"status\":\"ok\"}.",
  "state": "active",
  "verification": "curl -fsS http://localhost:3000/health | jq -e '.status == \"ok\"'"
}
```

Run it with your host agent:

- **Claude Code:** `/feature-4agent:run F01`
- **Codex:** `Use the feature-4agent workflow to plan, verify, implement, and test feature F01.`

Then verify independently:

```text
Verify feature F01. Run every executable verification layer, report the evidence,
and do not mark it passing unless all layers succeed.
```

## File structure: 

| File | Role |
|---|---|
| `.claude/workflows/feature-4agent.js` | The workflow: Planner/Verifier/Implementer/Tester, JSON-schema'd outputs, round-capped Verifier loop, worktree-isolated Implementer |
| `scripts/verify-feature.sh` | Runs a feature's verification layers in order; the only thing allowed to flip `state` to `passing` |
| `feature_list.example.json` | Schema reference — copy to `feature_list.json` and replace with your own features |
| `DECISIONS.example.md` | Why the Tester never trusts the Implementer's self-report, and why `cmd` must be real bash, not prose — worked incident + fix |

## Why the roles don't trust each other

Short version, full incident in `DECISIONS.example.md`: a feature was once hand-marked
`"passing"` with fabricated evidence, and it went undetected for days because nothing
independently re-checked it. That's why only `verify-feature.sh` can write `"passing"`, the
Implementer can't touch `state` or commit, and the Tester re-derives results independently
instead of trusting the Implementer's report.

## When not to use this

Overkill for a one-off task or a prototype. It pays off on a *recurring* feature-shipping loop,
once you've noticed yourself retyping the same verification steps by hand every time.

## License

MIT — see `LICENSE`.
