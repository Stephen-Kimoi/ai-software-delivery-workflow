# create-feature-4agent

Bootstrap a verified Planner → Verifier → Implementer → Tester workflow in any repository.

## Usage

```bash
npx create-feature-4agent@latest
```

This creates the workflow, verification harness, `feature_list.json`, `AGENTS.md`, and
`DECISIONS.md`. Existing files are preserved; use `--force` only when you intend to replace
the workflow files.

```bash
npx create-feature-4agent --force
```

After initialization, add features to `feature_list.json` and run the workflow from your host
agent. The package contains the Claude workflow and shell verification harness; it does not
require runtime dependencies.

Repository: https://github.com/Stephen-Kimoi/turn-based-loop-workflow
