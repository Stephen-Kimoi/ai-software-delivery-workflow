# Review A Specific Backend API PR

Replace `<PR_URL>`, `<PR_NUMBER>`, and `<FEATURE_NAME>` before using this prompt.

```text
Review PR #<PR_NUMBER>, which implements <FEATURE_NAME>:

<PR_URL>

Use the AI Software Delivery Workflow:
https://github.com/Stephen-Kimoi/ai-software-delivery-workflow

Specifically follow:
- verification harness:
  https://github.com/Stephen-Kimoi/ai-software-delivery-workflow/blob/main/references/verification-harness.md
- evidence-driven testing:
  https://github.com/Stephen-Kimoi/ai-software-delivery-workflow/blob/main/references/evidence-driven-testing.md

This is a review and verification task. Do not modify the implementation, push changes, or merge
the PR.

1. Check out the exact PR head commit and record the repository, PR number, branch, commit SHA,
   and local or deployed test environment.
2. Inspect the PR description, acceptance criteria, complete base-branch diff, implementation,
   tests, migrations, configuration, API contracts, queues, and background jobs.
3. Map every required behavior to its implementation location, automated test, executable check,
   Swagger UI evidence, and passed, failed, or untested status.
4. Run all available formatting, linting, type, unit, integration, API, and contract checks for
   real. Report exit codes, reject zero-test runs, and independently test regressions and boundary
   cases instead of trusting the PR author's report.
5. Through Swagger UI, execute the real endpoints changed by the PR. Record the selected server,
   environment, method, endpoint, safe request data, status, response, successful feature flow,
   validation failures, malformed input, authentication and authorization, missing resources,
   conflicts or duplicates, boundaries, retries, idempotency, concurrency, and failures where
   applicable. Verify asynchronous results through their real source of truth.
6. Mask authorization tokens, cookies, API keys, personal data, and secrets.
7. Treat Swagger evidence as a supplement to automated and source-of-truth verification, never a
   replacement. Viewing Swagger documentation without executing an endpoint is not evidence.
8. Review the recording for readability and annotate every assertion as passed, failed, or
   untested. Re-record missing evidence. Save the MP4 and an inline-viewable GIF when possible.

Return an approve, request-changes, or blocked verdict; severity-ordered findings with exact file
and line references; verification matrix; commands and real results; Swagger scenarios and
assertions; evidence links; security, privacy, concurrency, and data-integrity concerns; untested
behavior and blockers; recommended fixes without implementing them; and a final statement saying
whether <FEATURE_NAME> is genuinely verified.

Do not approve merely because existing tests pass. Approval requires the implementation,
automated checks, API behavior, and recorded evidence to agree.
```
