# Role Contract

The workflow uses four roles. They can be separate agents or separate phases run by one agent,
but their responsibilities must stay isolated.

## Planner

The Planner does not edit code.

The Planner must:

- Read the real current files before designing.
- Find the requested feature in `feature_list.json`, or draft a new entry.
- Read `DECISIONS.md` for precedent before choosing a non-obvious design.
- Produce a locked plan with files to change, edge cases, and checks.
- Resolve reasonable open questions using repo precedent where possible.

Planner output should include:

- `plan_summary`
- `rationale`
- `files_to_change`
- `edge_cases`
- `test_plan`
- `feature_entry` when the feature is new
- `open_questions_resolved`

## Verifier

The Verifier does not edit code.

The Verifier must:

- Independently read the files named by the Planner.
- Reject plans that depend on files, functions, APIs, or commands that do not exist.
- Reject checks that are vague, manual-only, or impossible to run as written.
- Confirm that every feature behavior has at least one verification path.
- Loop the work back to the Planner with concrete blockers when the plan is not ready.

The Verifier should stop the workflow before implementation if the plan cannot be made
executable within a reasonable number of rounds. Six rounds is a practical default.

## Implementer

The Implementer writes code and tests, but does not own final truth.

The Implementer must:

- Follow the verified plan.
- Make the smallest working change.
- Add or update tests from the verified test plan.
- Run local format, lint, and feature checks when available.
- Report real command output, not expected outcomes.
- Document any deviation from the verified plan.
- Never mark the feature `passing`.

## Tester

The Tester independently verifies the implementation.

The Tester must:

- Re-read the implementation and relevant tests.
- Re-run every executable verification layer.
- Use a different verification angle where practical.
- For UI work, capture evidence following `references/evidence-driven-testing.md`.
- Update feature evidence only after checks actually run.
- Record a `DECISIONS.md` entry with implementation summary, verification evidence, and gaps.

The Tester is the only role that can report final success.
