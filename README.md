# Turn-based loop: Planner → Verifier → Implementer → Tester

A Claude Code workflow that ships one feature at a time through four independent roles:
1. **Planner** locks a design
2. **Verifier** checks it before code exists
3. **Implementer** builds it in an isolated [worktree](https://code.claude.com/docs/en/worktrees)
4. **Tester** independently re-verifies and is the only role allowed to mark the feature "passing." No role trusts the previous role's self-report.

## Requirements

- Claude Code with the `Workflow` tool (agent/phase/worktree-isolation primitives)
- `jq` (`brew install jq` / `apt install jq`)
- A repo with a `Makefile` exposing `format` and `lint` targets
- `git`

## Quickstart

Choose the entry point that matches your host:

- **npm (recommended):** run `npx create-feature-4agent@latest` in the target repo. This installs the workflow, verifier, starter `feature_list.json`, `AGENTS.md`, and `DECISIONS.md` without overwriting existing files.
- **Claude Code plugin:** add this repository as a marketplace, install `feature-4agent`, then run `/feature-4agent:init` and `/feature-4agent:run F01`.
- **Codex plugin:** install `plugins/feature-4agent-codex` from this repository, then use its `init`, `run`, and `verify` skills. Codex executes the same contract natively; it does not depend on Claude's `Workflow` tool.

The manual setup below remains available when you want complete control over each file.

1. Copy these files into your repo, keeping the paths:
   ```
   .claude/workflows/feature-4agent.js
   scripts/verify-feature.sh
   ```
2. Copy `feature_list.example.json` → `feature_list.json` at your repo root, delete the example
   entries, and add your own. Each feature needs `id`, `behavior`, `state` (`active` /
   `passing` / `blocked`), and either a single `verification` command or a `layers` array
   (`label`, `cmd`, optional `repair`). **`cmd` must be real, executable bash** — it gets
   `eval`'d — not a prose description of a manual step.
3. Add a `DECISIONS.md` and `AGENTS.md` (or equivalent) to your repo root — the Planner reads
   these for precedent, and the Tester logs an entry after every feature.
4. Run the workflow for one feature:
   ```
   Workflow({ name: 'feature-4agent', args: { featureId: 'F01' } })
   ```
   or, for a feature not yet in `feature_list.json`, pass `extraContext` describing what to build.
5. Check a feature's state manually at any time:
   ```
   ./scripts/verify-feature.sh F01
   ```

The workflow returns `{ status: 'implemented', ... }` on success or
`{ status: 'blocked_at_plan', ... }` if the Verifier couldn't sign off within 6 rounds.

## Files

| File | Role |
|---|---|
| `.claude/workflows/feature-4agent.js` | The workflow: Planner/Verifier/Implementer/Tester, JSON-schema'd outputs, round-capped Verifier loop, worktree-isolated Implementer |
| `scripts/verify-feature.sh` | Runs a feature's verification layers in order; the only thing allowed to flip `state` to `passing` |
| `feature_list.example.json` | Schema reference — copy to `feature_list.json` and replace with your own features |
| `DECISIONS.example.md` | Why the Tester never trusts the Implementer's self-report, and why `cmd` must be real bash, not prose — worked incident + fix |

## Why the roles don't trust each other

Short version, full incident in `DECISIONS.example.md`: a feature was once hand-marked
`"passing"` with fabricated evidence, and it went undetected for days because nothing
independently re-checked it. That's why only `verify-feature.sh` can write `"passing"`, the
Implementer can't touch `state` or commit, and the Tester re-derives results independently
instead of trusting the Implementer's report.

## When not to use this

Overkill for a one-off task or a prototype. It pays off on a *recurring* feature-shipping loop,
once you've noticed yourself retyping the same verification steps by hand every time.

## License

MIT — see `LICENSE`.
