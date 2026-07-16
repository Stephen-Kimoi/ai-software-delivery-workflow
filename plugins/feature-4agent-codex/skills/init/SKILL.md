---
name: init
description: Bootstrap the feature-4agent workflow in the current repository.
disable-model-invocation: false
---

Initialize the workflow in the current repository.

1. Check whether `.claude/workflows/feature-4agent.js`, `scripts/verify-feature.sh`,
   `feature_list.json`, `AGENTS.md`, and `DECISIONS.md` already exist.
2. Preserve existing files. For missing workflow assets, copy the matching files from
   `${CODEX_PLUGIN_ROOT}/templates/` into the repository.
3. Create `feature_list.json` with `[]` and starter `AGENTS.md` / `DECISIONS.md` only when absent.
4. Make `scripts/verify-feature.sh` executable.
5. Report the files created and suggest adding a real feature to `feature_list.json`.
