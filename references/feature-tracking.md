# Feature Tracking

Track work in `feature_list.json`. The file should contain an array of feature objects.

## Schema

```json
{
  "id": "F01",
  "behavior": "A testable description of the user-visible or system-visible behavior.",
  "verification": "pytest tests/test_feature.py -v",
  "layers": [
    {
      "label": "Layer 1 - Syntax and static checks",
      "cmd": "make lint",
      "repair": "Run make lint and fix every reported issue."
    }
  ],
  "state": "active",
  "evidence": null,
  "notes": "Constraints, dependencies, or context the Planner must preserve."
}
```

## State Rules

Allowed states:

- `not_started`: the feature is known but not ready to plan.
- `planned`: a design exists but implementation should not start yet.
- `active`: the feature is ready for the AI software delivery workflow.
- `blocked`: progress requires external input or another dependency.
- `passing`: every required check passed and evidence was recorded.

Rules:

- Start implementation only for `active` features.
- Do not hand-edit a feature to `passing`.
- Do not use `passing` for partial verification.
- If a check cannot be run, keep the feature `active` or mark it `blocked`.
- Evidence must name the exact commit, branch, environment, date, and verification commands or
  recordings used.

## Verification Layers

Prefer layers over a single command for non-trivial features:

1. Static checks: formatting, linting, type checks.
2. Unit or integration behavior checks.
3. Boundary, persistence, distributed, deployment, or interaction-surface evidence checks as
   needed. For HTTP APIs, this can include a recorded Swagger UI execution in addition to
   automated API or contract tests.

Each layer must be specific enough that a different agent can run it and know whether it passed.
