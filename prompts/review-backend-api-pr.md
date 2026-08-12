# Review A Backend API Pull Request

Replace `<PR_URL>` and copy this prompt into your coding agent.

```text
Review this backend API pull request using the AI Software Delivery Workflow's verification
harness and evidence-driven testing:

<PR_URL>

Use the workflow from:
https://github.com/Stephen-Kimoi/ai-software-delivery-workflow

This is a review and verification task. Do not modify the implementation, push changes, merge the
PR, or claim success for checks that did not run.

Check out the exact PR head commit and record the repository, PR number, branch, commit SHA, and
test environment. Inspect the PR description, acceptance criteria, complete diff against the base
branch, relevant implementation and tests, migrations, configuration, API contracts, and affected
background jobs.

Build a verification matrix mapping every required behavior to:
- implementation location
- automated test
- executable verification command
- Swagger UI evidence
- final status: passed, failed, or untested

Run the repository's formatting, linting, type checks, unit tests, integration tests, and API or
contract tests. Run every command for real and report its exit code. Do not treat zero tests
discovered as passing. Independently test regressions, validation, authorization, boundaries,
idempotency, retries, concurrency, and failure behavior where relevant.

Use Swagger UI as the recorded API evidence surface when available:
- start the application and required dependencies
- visibly identify the exact server and environment
- use Try it out to execute the real endpoints
- show the HTTP method and endpoint
- show safe request parameters, body, and headers
- show the response status and relevant response body
- test successful requests and required failure cases
- verify asynchronous results through their real source of truth

Mask authorization tokens, cookies, API keys, personal data, and secrets before recording.
Swagger UI evidence supplements automated tests; it does not replace unit, integration, contract,
persistence, queue, or source-of-truth verification. Viewing API documentation without executing
the endpoint is not evidence.

Review the recording before accepting it. Requests and responses must be readable, each assertion
must be annotated as passed, failed, or untested, and essential missing evidence must be
re-recorded. Save the full-quality MP4 and an inline-viewable GIF when possible.

Return:
- overall verdict: approve, request changes, or blocked
- findings ordered by severity, with exact file and line references
- verification matrix
- commands executed and their real results
- Swagger UI scenarios and assertion results
- evidence paths or links
- security, privacy, concurrency, and data-integrity concerns
- untested behavior and exact blockers
- recommended fixes without implementing them
- a final statement saying whether the implementation is genuinely verified

Do not approve merely because existing tests pass. Approval requires the implementation,
automated checks, API behavior, and recorded evidence to agree.
```
