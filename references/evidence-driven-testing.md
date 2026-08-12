# Evidence-Driven Testing

Use this reference when a feature changes user-observable behavior or another flow that benefits
from visual proof. This includes web and desktop UI, HTTP APIs exercised through Swagger UI,
CLI interactions, and background jobs with an observable source-of-truth result. It adapts the
evidence-driven testing skill from
https://github.com/michaelshimeles/skills/blob/main/evidence-driven-testing/SKILL.md.

## Inputs

- Test targets: required, phrased as testable behavior statements.
- PR, issue, or tracker destination: optional. If unavailable, report evidence to the requester.

## Choose The Evidence Surface

Use the surface through which the behavior can be observed truthfully:

- **Web or desktop UI:** record the real user flow in the browser or application.
- **HTTP API:** when Swagger UI or another OpenAPI explorer is available, record the endpoint
  invocation there, including method, server/environment, request, response status, response body,
  and relevant non-sensitive headers.
- **CLI:** record the command, input, exit result, and output in a readable terminal session.
- **Background processing:** record the initiating action and the resulting state in the actual
  system of record, such as an admin view, queue monitor, database query, or deployment console.

Swagger UI is evidence only when the recording uses **Try it out** (or its equivalent) and shows
the actual request and response. Viewing generated API documentation without executing the
endpoint is not behavioral evidence.

## Procedure

1. Prepare the screen.
   - Maximize the browser or app window.
   - Close unrelated popups, notifications, and panels.
   - Navigate to the authenticated starting state before recording unless setup is under test.
   - For Swagger UI, select or visibly identify the exact server/environment being tested.
   - Remove or mask authorization tokens, cookies, API keys, personal data, and sensitive headers.

2. Start recording.
   - Begin before the first meaningful action.
   - Add a setup annotation describing the starting context.

3. Annotate while testing.
   - Add `test_start` annotations in plain test language.
   - Add `assertion` annotations after meaningful state changes.
   - Mark each assertion `passed`, `failed`, or `untested`.
   - Keep assertions short and specific.
   - Use `untested` with a reason when prerequisites are missing.
   - For APIs, annotate the expected request, status code, response schema or body, and each
     required error case.

4. Stop and review.
   - Confirm the recording captured the setup, actions, and results.
   - Re-record if the key evidence is missing or unreadable.

5. Report evidence.
   - State the exact commit, branch, deployment or local URL, browser, and environment.
   - Summarize each tested behavior with pass/fail/untested status.
   - Attach or link the recording when the destination supports it.
   - For GitHub PRs, include a PR-viewable embed, not only a downloadable video file.
   - Record caveats honestly.

## API Evidence Through Swagger UI

For an API feature, capture at least:

1. The endpoint path and HTTP method.
2. The selected server or environment.
3. The request parameters, body, and safe headers.
4. The executed request.
5. The response status code.
6. The response body or schema-relevant fields.
7. Required negative or boundary cases such as `400`, `401`, `404`, `409`, or `429`.

The API evidence layer supplements rather than replaces executable verification. A passing API
feature still requires appropriate automated unit, integration, or contract tests and any needed
source-of-truth checks. If Swagger UI is unavailable, use another real API client and capture the
same facts; terminal output alone is acceptable only when the CLI interaction itself is the chosen
and readable evidence surface.

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
- Do not expose credentials, authorization values, cookies, personal data, or secrets in evidence.
- Do not treat an OpenAPI schema or documentation page as proof that the implementation works.
- Do not replace automated tests with Swagger UI evidence.
