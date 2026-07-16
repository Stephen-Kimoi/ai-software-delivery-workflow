---
name: run
description: Run the verified feature workflow for a feature ID supplied by the user.
disable-model-invocation: true
---

For feature ID `$ARGUMENTS`, first confirm that the current repository contains `.claude/workflows/feature-4agent.js`. If it is missing, run the plugin's init skill first. Then invoke:

```js
Workflow({ name: 'feature-4agent', args: { featureId: '$ARGUMENTS' } })
```

Report the workflow's structured result without claiming a feature passed unless the Tester set its final state to `passing`.
