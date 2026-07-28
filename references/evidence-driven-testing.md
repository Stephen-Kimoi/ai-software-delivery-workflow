# Evidence-Driven Testing

Use this reference when the feature changes UI behavior or another flow that benefits from
visual proof. It adapts the evidence-driven testing skill from
https://github.com/michaelshimeles/skills/blob/main/evidence-driven-testing/SKILL.md.

## Inputs

- Test targets: required, phrased as testable behavior statements.
- PR, issue, or tracker destination: optional. If unavailable, report evidence to the requester.

## Procedure

1. Prepare the screen.
   - Maximize the browser or app window.
   - Close unrelated popups, notifications, and panels.
   - Navigate to the authenticated starting state before recording unless setup is under test.

2. Start recording.
   - Begin before the first meaningful action.
   - Add a setup annotation describing the starting context.

3. Annotate while testing.
   - Add `test_start` annotations in plain test language.
   - Add `assertion` annotations after meaningful state changes.
   - Mark each assertion `passed`, `failed`, or `untested`.
   - Keep assertions short and specific.
   - Use `untested` with a reason when prerequisites are missing.

4. Stop and review.
   - Confirm the recording captured the setup, actions, and results.
   - Re-record if the key evidence is missing or unreadable.

5. Report evidence.
   - State the exact commit, branch, deployment or local URL, browser, and environment.
   - Summarize each tested behavior with pass/fail/untested status.
   - Attach or link the recording when the destination supports it.
   - Record caveats honestly.

## Guardrails

- Do not record a partial, tiled, or obscured app window.
- When verifying a fix, show or reference the old failure and the new passing behavior when
  practical.
- Do not claim visual success from memory; use recording or screenshots as evidence.
- If the environment cannot record video, capture screenshots and explain the limitation.
