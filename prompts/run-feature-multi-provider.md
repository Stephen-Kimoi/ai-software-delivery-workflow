# Implement A Feature With The Multi-Provider Runner

Replace `<FEATURE_DESCRIPTION>` and use this prompt from the target repository.

```text
Use the AI Software Delivery Workflow's multi-provider runner to implement this feature:

<FEATURE_DESCRIPTION>

Use the workflow from:
https://github.com/Stephen-Kimoi/ai-software-delivery-workflow

Work in the current repository. Read the workflow's SKILL.md, create the required active feature
entry with the next available feature ID, and run scripts/run-workflow.py with --execute.

Do not simulate the roles in one Codex session. Run the configured providers:
- Planner: Claude Opus 5
- Verifier: Claude Opus 5
- Implementer: GPT-5.6 Luna through Codex
- Tester: GPT-5.6 Sol through Codex

For user-observable behavior, follow the workflow's evidence-driven testing reference. For a
backend HTTP API, execute and record the real endpoints through Swagger UI when available. Show
the environment, method, endpoint, safe request data, response status, response body, success
cases, and required failure cases. Mask secrets. Swagger evidence supplements automated unit,
integration, and contract tests; it does not replace them.

If the workflow is not available locally, obtain it first. If Claude Code or Codex is missing or
unauthenticated, stop and report the exact setup required. Do not claim completion unless the
Tester records passing evidence. If planning and verification already passed but implementation
must be retried, use --resume-after-verifier rather than repeating the approved phases.
```
