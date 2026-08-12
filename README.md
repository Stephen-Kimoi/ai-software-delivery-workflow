# AI Software Delivery Workflow

A structured, agent-agnostic workflow for shipping software with controlled implementation
and explicit completion verification.

Core idea:

```text
Build with turn-based agent roles. Finish with goal-based verification.
```

The workflow has two layers:

1. **Build loop:** four role-separated phases for planning, implementation, and testing.
2. **Completion loop:** an optional `/goal` prompt that verifies the work is truly done.

The build loop ships one feature at a time through four separate roles:

1. **Planner** locks the design.
2. **Verifier** checks the plan before code exists.
3. **Implementer** makes the smallest code and test changes.
4. **Tester** independently verifies the result and records evidence.

After the Tester finishes, the workflow should produce a **Goal Verification Handoff**: a
copyable `/goal` prompt the user can run for final autonomous audit, repair, and PR-readiness
verification.

## Quickstart

Give your agent this repository, then prompt it with:

```text
Use the AI software delivery workflow in SKILL.md for feature F01.
Read the referenced files before acting. Plan, verify the plan, implement the
feature, independently test it, and generate a recommended /goal verification
prompt for final completion audit. Do not claim success unless every executable
check passes and the final evidence is recorded.
```

For a longer prompt, use [prompts/run-feature.md](prompts/run-feature.md).

## Copyable Prompts

- [Review a backend API PR](prompts/review-backend-api-pr.md) — generic read-only PR review with
  executable verification and recorded Swagger UI evidence.
- [Review a specific backend API PR](prompts/review-specific-backend-api-pr.md) — expanded review
  template using placeholders for the PR URL, PR number, and feature name.
- [Implement a feature with the multi-provider runner](prompts/run-feature-multi-provider.md) —
  natural-language feature request routed through Opus Planner/Verifier and Codex
  Implementer/Tester.
- [Implement a feature with the cost-balanced runner](prompts/run-feature-multi-provider-budget.md)
  — lower-cost Sonnet Planner/Verifier and Luna/Terra Codex Implementer/Tester.

For a broader repo setup pattern around agent instructions, harnesses, and project structure,
see the [harness engineering template](https://github.com/Stephen-Kimoi/harness-engineering-template).
It is useful companion material, but this workflow does not require it.

## Optional Multi-Provider Runner

The core workflow remains agent-agnostic. The optional `workflow/roles.yaml` profile assigns
Planner and Verifier to Claude Opus 5, Implementer to GPT-5.6 Luna through Codex, and Tester
to GPT-5.6 Sol through Codex. Run a safe command preview with:

```bash
python3 scripts/run-workflow.py F01 --repo-root /path/to/application --feature-file feature_list.json
```

Use `--mock` to test the complete four-role orchestration without provider calls. Pass
`--execute` only after both CLIs are installed and authenticated. The runner writes one artifact
directory per feature under `.artifacts/<FEATURE_ID>/`, validates every role output against
`workflow/schemas/`, and stops if the Verifier rejects the plan. Models can be overridden with
`WORKFLOW_<ROLE>_MODEL` environment variables; provider-specific adapter commands are
intentionally kept out of the core role contracts.

```bash
python3 scripts/run-workflow.py F01 --repo-root /path/to/application --execute
```

If implementation must be retried after an approved plan, add `--resume-after-verifier` to reuse
the validated Planner and Verifier artifacts rather than paying to repeat those phases.

For a lower-cost run, use `workflow/roles-budget.yaml`. This profile assigns Planner and Verifier
to Claude Sonnet 5, Implementer to GPT-5.6 Luna through Codex, and Tester to GPT-5.6 Terra through
Codex:

```bash
python3 scripts/run-workflow.py F01 \
  --repo-root /path/to/application \
  --profile workflow/roles-budget.yaml \
  --execute
```

The corresponding copyable prompt is
[prompts/run-feature-multi-provider-budget.md](prompts/run-feature-multi-provider-budget.md).

## Files

| File | Purpose |
|---|---|
| [SKILL.md](SKILL.md) | Main workflow entry point for agents |
| [references/role-contract.md](references/role-contract.md) | Responsibilities and handoff rules for each role |
| [references/feature-tracking.md](references/feature-tracking.md) | `feature_list.json` schema and state rules |
| [references/verification-harness.md](references/verification-harness.md) | Harness-controlled verification contract |
| [references/evidence-driven-testing.md](references/evidence-driven-testing.md) | Recorded evidence for UI, Swagger/API, CLI, and background flows |
| [references/goal-verification-handoff.md](references/goal-verification-handoff.md) | How to generate a `/goal` prompt after the build loop |
| [prompts/run-feature.md](prompts/run-feature.md) | Copyable end-to-end prompt |
| [prompts/review-backend-api-pr.md](prompts/review-backend-api-pr.md) | Generic backend API PR review prompt |
| [prompts/review-specific-backend-api-pr.md](prompts/review-specific-backend-api-pr.md) | Placeholder-driven backend API PR review prompt |
| [prompts/run-feature-multi-provider.md](prompts/run-feature-multi-provider.md) | Multi-provider feature implementation prompt |
| [prompts/run-feature-multi-provider-budget.md](prompts/run-feature-multi-provider-budget.md) | Cost-balanced multi-provider feature implementation prompt |
| [feature_list.example.json](feature_list.example.json) | Example feature tracking file |
| [DECISIONS.example.md](DECISIONS.example.md) | Example decisions and verification incident log |
| [scripts/verify-feature.sh](scripts/verify-feature.sh) | Optional bash harness an agent can copy into a target repo |
| [workflow/roles.yaml](workflow/roles.yaml) | Optional multi-provider model profile |
| [workflow/roles-budget.yaml](workflow/roles-budget.yaml) | Cost-balanced multi-provider model profile |
| [scripts/run-workflow.py](scripts/run-workflow.py) | Dry-run/execute runner for provider adapters |
| [workflow/schemas/](workflow/schemas/) | Required JSON fields and types for each role handoff |

## How To Use In Another Repository

1. Add a `feature_list.json` entry for the feature, or let the Planner create one.
2. Add a `DECISIONS.md` file, or use `DECISIONS.example.md` as the starting shape.
3. Ask the agent to read `SKILL.md` and follow the referenced files.
4. If the feature changes user-observable UI, API, CLI, or background-processing behavior,
   require the appropriate evidence-driven testing layer. For HTTP APIs, use an executed Swagger
   UI flow when available, alongside automated tests.
5. Ask the Tester to produce a Goal Verification Handoff when the work has a clear finish line.
6. Keep `state: "passing"` reserved for verified evidence, never a self-report.

## Why The Roles Do Not Trust Each Other

The workflow exists because feature state can be falsified accidentally or intentionally if
an agent hand-edits a tracker. The Tester must independently run the checks, capture real
evidence, and only then record the outcome. For user-observable work, the Tester should also
collect screen-recorded evidence with structured annotations. For HTTP APIs, Swagger UI can provide the
recorded interaction surface when the evidence shows the actual request, response, environment,
and required error cases; viewing API documentation alone is not proof.

## Why `/goal` Is A Handoff, Not A Fifth Role

The four roles are still the right tool for controlled implementation. `/goal` should not replace
Planner, Verifier, Implementer, or Tester.

Instead, `/goal` is the finish-line enforcement layer after the build loop:

```text
Turn-based roles build the feature.
/goal verifies the feature is complete, evidenced, and PR-ready.
```

Use the Goal Verification Handoff when the remaining work is checklist-driven:

- PR mergeability checks
- evidence-driven testing attachment
- PR description updates
- final test reruns
- multi-PR audit and repair
- diagnostic tasks where success means either artifact found or blocker proven

## License

MIT, see [LICENSE](LICENSE).
