---
name: four-agent-feature-workflow
description: >
  Use a Planner, Verifier, Implementer, and Tester loop to ship one feature at a
  time with executable checks and recorded evidence. This skill is agent-agnostic:
  read the referenced files and follow the contract directly without installing an
  npm package or plugin.
metadata:
  version: "2.0"
---

# Four-Agent Feature Workflow

Use this skill when a requester asks an agent to plan, implement, and verify a feature with
separate planning, review, implementation, and testing responsibilities.

## Read First

Before starting work, read these files in order:

1. `references/role-contract.md`
2. `references/feature-tracking.md`
3. `references/verification-harness.md`
4. `references/evidence-driven-testing.md` when the feature changes UI behavior
5. The target repository's `feature_list.json`, `AGENTS.md` or equivalent agent instructions,
   and `DECISIONS.md` or equivalent decision log

If a referenced file is missing in the target repository, create the smallest compatible file
needed for the workflow instead of stopping.

## Workflow

Run the feature through these roles in sequence:

1. **Planner:** read real source files and produce a locked design.
2. **Verifier:** independently check the plan for missing facts, vague checks, bad assumptions,
   and untestable claims. Loop back to Planner until the plan is executable or blocked.
3. **Implementer:** make the smallest code and test changes that satisfy the verified plan.
4. **Tester:** independently run checks, capture evidence, update feature state only through
   verified results, and record the outcome.

Keep the roles separate even when one agent performs all four phases. A role must not trust
the previous role's self-report; it must inspect files and evidence directly.

## Required Rules

- Do not install or require an npm package, Claude plugin, Codex plugin, marketplace entry, or
  platform-specific command.
- Do not mark a feature `passing` because an agent says it is done.
- Every verification layer must be a real executable check or a clearly recorded manual evidence
  item with proof attached.
- If a check cannot be run, leave the feature `active` or mark it `blocked`; record the gap.
- The Implementer does not commit and does not update the feature state.
- The Tester owns final verification evidence and the final state update.
- For UI behavior, use evidence-driven testing: record the tested flow, annotate assertions, and
  report the exact commit, environment, results, and caveats.

## Done Criteria

A feature is done only when:

- The Verifier approved the plan before implementation.
- The Implementer changed only the files needed for the verified plan, or documented deviations.
- The Tester independently ran every executable check.
- UI changes include recorded evidence when a GUI environment is available.
- `feature_list.json` records a truthful state and evidence.
- `DECISIONS.md` records the implementation, verification, and any remaining gaps.

Use [prompts/run-feature.md](prompts/run-feature.md) when you need a copyable prompt for another
agent.
