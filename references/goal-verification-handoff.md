# Goal Verification Handoff

The workflow uses turn-based roles for controlled implementation and a goal-based handoff for
final completion verification.

Core model:

```text
Turn-based workflow = controlled implementation loop
Goal-based loop = completion and verification loop
```

Do not use `/goal` to replace Planner, Verifier, Implementer, or Tester. Use `/goal` after those
phases when the remaining work has a clear finish line.

## When To Generate A `/goal` Prompt

Generate a Goal Verification Handoff when the feature involves:

- PR creation, PR update, or PR readiness
- evidence-driven testing
- multiple acceptance criteria
- external system checks
- multi-file implementation
- live-system constraints such as "do not merge" or "do not deploy"
- final audit, repair, or documentation cleanup

Do not force a `/goal` handoff for tiny tasks where the normal Tester report is enough.

## Required Shape

The handoff must be copyable. It should include:

- the intended outcome
- observable completion criteria
- verification evidence required
- constraints
- a turn cap or blocked condition

Template:

```text
/goal [Outcome]

Completion is true only when:
- [observable condition 1]
- [observable condition 2]
- [observable condition 3]

Verification:
- [command, PR check, file, evidence, link, or manual check]

Constraints:
- Do not [dangerous or out-of-scope action].
- Preserve [important existing state].
- Stop and report evidence if [credential/access/live-system blocker].

Iteration cap:
- Stop after [N] turns if incomplete and report current state, blockers, and next recommended action.
```

## PR Readiness Example

```text
/goal Verify that feature <FEATURE_ID> is complete and PR-ready.

Completion is true only when:
- the implementation matches the verified plan
- every required test/check has passed or a blocker is explicitly evidenced
- evidence-driven testing is attached when user-observable UI, API, CLI, or background-processing
  behavior changed; API evidence shows an executed Swagger UI flow when available
- the PR description includes acceptance criteria, verification commands, and evidence links
- mergeability has been checked
- no merge or deployment has been performed

Verification:
- inspect the changed files
- rerun the feature checks
- check the PR description and mergeability status
- confirm evidence links render inline where applicable

Constraints:
- Do not merge the PR.
- Do not deploy.
- Preserve unrelated user changes.

Iteration cap:
- Stop after 6 turns if incomplete and report exact blockers.
```

## Diagnostic Example

```text
/goal Retrieve the requested artifact, or prove with evidence that it cannot be retrieved.

Completion is true only when:
- the artifact is saved or linked, or
- the unavailable state is proven through source-of-truth checks

Constraints:
- Do not change live-system state.
- Stop if missing credentials, permissions, or user authorization blocks progress.

Iteration cap:
- Stop after 5 turns if incomplete.
```
