---
name: init
description: Install the feature-4agent workflow into the current repository.
disable-model-invocation: true
---

Install the project-local feature workflow by running:

```bash
"${CLAUDE_PLUGIN_ROOT}/scripts/install-workflow.sh"
```

Preserve existing files. After installation, tell the user to add features to `feature_list.json` and run the workflow for a feature.
