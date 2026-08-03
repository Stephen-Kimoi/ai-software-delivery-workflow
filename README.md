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

For a broader repo setup pattern around agent instructions, harnesses, and project structure,
see the [harness engineering template](https://github.com/Stephen-Kimoi/harness-engineering-template).
It is useful companion material, but this workflow does not require it.

## Files

| File | Purpose |
|---|---|
| [SKILL.md](SKILL.md) | Main workflow entry point for agents |
| [references/role-contract.md](references/role-contract.md) | Responsibilities and handoff rules for each role |
| [references/feature-tracking.md](references/feature-tracking.md) | `feature_list.json` schema and state rules |
| [references/verification-harness.md](references/verification-harness.md) | Harness-controlled verification contract |
| [references/evidence-driven-testing.md](references/evidence-driven-testing.md) | UI evidence workflow adapted from evidence-driven testing |
| [references/goal-verification-handoff.md](references/goal-verification-handoff.md) | How to generate a `/goal` prompt after the build loop |
| [prompts/run-feature.md](prompts/run-feature.md) | Copyable end-to-end prompt |
| [feature_list.example.json](feature_list.example.json) | Example feature tracking file |
| [DECISIONS.example.md](DECISIONS.example.md) | Example decisions and verification incident log |
| [scripts/verify-feature.sh](scripts/verify-feature.sh) | Optional bash harness an agent can copy into a target repo |

## How To Use In Another Repository

1. Add a `feature_list.json` entry for the feature, or let the Planner create one.
2. Add a `DECISIONS.md` file, or use `DECISIONS.example.md` as the starting shape.
3. Ask the agent to read `SKILL.md` and follow the referenced files.
4. If the feature changes UI behavior, require the evidence-driven testing layer.
5. Ask the Tester to produce a Goal Verification Handoff when the work has a clear finish line.
6. Keep `state: "passing"` reserved for verified evidence, never a self-report.

## Why The Roles Do Not Trust Each Other

The workflow exists because feature state can be falsified accidentally or intentionally if
an agent hand-edits a tracker. The Tester must independently run the checks, capture real
evidence, and only then record the outcome. For UI work, the Tester should also collect
screen-recorded evidence with structured annotations.

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
