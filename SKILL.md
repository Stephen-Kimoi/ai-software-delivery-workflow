---
name: ai-software-delivery-workflow
description: >
  Use turn-based Planner, Verifier, Implementer, and Tester roles to ship one
  feature at a time, then generate a goal-based verification handoff for final
  completion audit. This skill is agent-agnostic: read the referenced files and
  follow the contract directly without installing an npm package or plugin.
metadata:
  version: "2.0"
---

# AI Software Delivery Workflow

Use this skill when a requester asks an agent to plan, implement, and verify a feature with
separate planning, review, implementation, and testing responsibilities.

The workflow combines two loop types:

```text
Turn-based workflow = controlled implementation loop
Goal-based loop = completion and verification loop
```

Do not treat `/goal` as a replacement for the four roles. Treat it as the handoff after the
Tester finishes, when the user needs a final autonomous audit against a clear finish line.

## Read First

Before starting work, read these files in order:

1. `references/role-contract.md`
2. `references/feature-tracking.md`
3. `references/verification-harness.md`
4. `references/goal-verification-handoff.md`
5. `references/evidence-driven-testing.md` when the feature changes user-observable UI, API,
   CLI, or background-processing behavior that benefits from recorded evidence
6. The target repository's `feature_list.json`, `AGENTS.md` or equivalent agent instructions,
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
5. **Goal Verification Handoff:** generate a copyable `/goal` prompt for final audit, repair,
   PR readiness, or diagnostic completion when the task has a verifiable finish line.

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
- For user-observable behavior, use the appropriate evidence surface: record the real UI flow,
  execute HTTP APIs through Swagger UI when available, record CLI interaction, or show a
  background job's source-of-truth result. Annotate assertions and report the exact commit,
  environment, results, and caveats. Recorded evidence supplements executable tests.
- After Tester, produce a recommended `/goal` prompt unless the task is too small or has no
  verifiable follow-up state. If you skip it, say why.

## Done Criteria

A feature is done only when:

- The Verifier approved the plan before implementation.
- The Implementer changed only the files needed for the verified plan, or documented deviations.
- The Tester independently ran every executable check.
- User-observable UI, API, CLI, or background-processing changes include recorded evidence when
  a suitable interaction surface is available.
- `feature_list.json` records a truthful state and evidence.
- `DECISIONS.md` records the implementation, verification, and any remaining gaps.
- The final response includes a Goal Verification Handoff, or explicitly explains why `/goal`
  would be overkill.

Use [prompts/run-feature.md](prompts/run-feature.md) when you need a copyable prompt for another
agent.
