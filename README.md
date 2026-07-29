# Four-Agent Feature Workflow

An agent-agnostic skill for shipping one feature at a time through four separate roles:

1. **Planner** locks the design.
2. **Verifier** checks the plan before code exists.
3. **Implementer** makes the smallest code and test changes.
4. **Tester** independently verifies the result and records evidence.

## Quickstart

Give your agent this repository, then prompt it with:

```text
Use the four-agent feature workflow in SKILL.md for feature F01.
Read the referenced files before acting. Plan, verify the plan, implement the
feature, and independently test it. Do not claim success unless every executable
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
| [prompts/run-feature.md](prompts/run-feature.md) | Copyable end-to-end prompt |
| [feature_list.example.json](feature_list.example.json) | Example feature tracking file |
| [DECISIONS.example.md](DECISIONS.example.md) | Example decisions and verification incident log |
| [scripts/verify-feature.sh](scripts/verify-feature.sh) | Optional bash harness an agent can copy into a target repo |

## How To Use In Another Repository

1. Add a `feature_list.json` entry for the feature, or let the Planner create one.
2. Add a `DECISIONS.md` file, or use `DECISIONS.example.md` as the starting shape.
3. Ask the agent to read `SKILL.md` and follow the referenced files.
4. If the feature changes UI behavior, require the evidence-driven testing layer.
5. Keep `state: "passing"` reserved for verified evidence, never a self-report.

## Why The Roles Do Not Trust Each Other

The workflow exists because feature state can be falsified accidentally or intentionally if
an agent hand-edits a tracker. The Tester must independently run the checks, capture real
evidence, and only then record the outcome. For UI work, the Tester should also collect
screen-recorded evidence with structured annotations.

## License

MIT, see [LICENSE](LICENSE).
