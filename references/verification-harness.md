# Verification Harness

The workflow can use any verification harness, but it must preserve one rule:

`passing` means the checks actually ran and passed.

## Harness Contract

A valid harness must:

- Read the requested feature from `feature_list.json`.
- Refuse to verify unknown, blocked, planned, or not-started features.
- Run verification layers in order.
- Stop after the first failing layer.
- Print the exact command, result, and repair instruction.
- Update `state` to `passing` only after every required check succeeds.
- Record evidence with commit, date, environment, and command output summary.

The optional [scripts/verify-feature.sh](../scripts/verify-feature.sh) file implements this
contract for bash and `jq`. Agents may copy or adapt it into a target repository when a shell
harness is appropriate.

## Executable Checks

Every `cmd` field should be real shell that can succeed or fail:

```bash
pytest tests/test_rate_limit.py -v
```

Do not write prose in `cmd`:

```text
Push to main and check that deployment looks good
```

When a check depends on another system, query that system's source of truth:

```bash
gh run list --branch main --limit 1 --json conclusion,name \
  -q '.[] | select(.name == "Deploy") | .conclusion' | grep -q success
```

If the source of truth cannot be queried in the current session, record the missing evidence
and do not mark the feature `passing`.

## Tester Evidence

The Tester report should include:

- The feature ID and final state.
- The commit and branch tested.
- The exact commands run.
- A pass/fail result for each layer.
- Any skipped or untestable checks with reasons.
- Links or paths to UI recordings when evidence-driven testing applies.
