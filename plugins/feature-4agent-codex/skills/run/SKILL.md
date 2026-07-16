---
name: run
description: Run a feature through the Planner, Verifier, Implementer, and Tester loop.
disable-model-invocation: false
---

Run the requested feature through the four roles. The feature ID is the argument after
`$` (for example, `/feature-4agent-codex:run F01`). Initialize first if the workflow files
are missing.

Use this turn-based contract:

1. Planner: inspect `feature_list.json`, `AGENTS.md`, and `DECISIONS.md`; write a concise plan.
2. Verifier: turn every plan item into an executable check and reject vague/manual checks.
3. Implementer: make the smallest changes needed to satisfy the verified checks.
4. Tester: run every check, repair failures when safe, and record the outcome in `DECISIONS.md`.

Do not claim success unless all checks pass and the feature state is `passing`. If blocked,
report the exact check and evidence needed to continue.
