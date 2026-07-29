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
   - For GitHub PRs, include a PR-viewable embed, not only a downloadable video file.
   - Record caveats honestly.

## GitHub PR Video Embeds

GitHub does not reliably render committed MP4 files as inline playable media in PR comments,
especially in private repositories. A blob link may only show `View raw`, and a relative MP4
link can be interpreted incorrectly.

For GitHub PR evidence:

- Keep the full-quality MP4 in the repo or attached artifact.
- Also convert the same recording to a GIF for inline review.
- Embed the GIF with markdown image syntax:

```markdown
![Feature walkthrough](https://github.com/<org>/<repo>/raw/<commit-sha>/<path>/walkthrough.gif)
```

- Use an absolute GitHub `raw/<commit-sha>/...gif` URL, not a relative file link.
- Mention the MP4 path separately as the full-quality source.

Expected PR evidence shape:

```markdown
![F59 website-slug walkthrough](https://github.com/lablab-ai/lablab-discord-admin/raw/af9c0d540c3e246ac1fb63221baa8261fa491c1d/docs/tasks/f59-evidence/f59-website-slug-walkthrough.gif)

Full-quality video: `docs/tasks/f59-evidence/f59-website-slug-walkthrough.mp4`.
```

## Guardrails

- Do not record a partial, tiled, or obscured app window.
- When verifying a fix, show or reference the old failure and the new passing behavior when
  practical.
- Do not substitute screenshots or terminal print logs for video when the test calls for a
  browser walkthrough.
- Do not claim visual success from memory; use recording or screenshots as evidence.
- If the environment cannot record video, capture screenshots and explain the limitation.
