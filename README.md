# Turn-based loop: Planner → Verifier → Implementer → Tester

This is a saved script now, but it didn't start as one. For about two weeks, I ran this exact
four-step sequence by hand, in conversation, for every single feature I shipped: type out the
Planner instructions, read the plan, type out the Verifier instructions, read the verdict,
open a worktree, type out the Implementer instructions, read the diff, type out the Tester
instructions, read the result. Every feature, every time, retyped from memory or copy-pasted
from the last feature's chat log with the names swapped.

It only became worth encoding as a script once I'd done it enough times to be confident about
which parts were load-bearing and which parts were just how I happened to phrase it that day.
Turning it into a script didn't end the loop, either — it just moved it up a level. The script
itself needed same-day bug fixes after I first wrote it: a schema field that didn't match what
the agent actually returned, a round cap that was too aggressive, a phase that needed
reordering. Encoding a manual process doesn't make the human-in-the-loop go away. It changes
what the human is looking at — instead of babysitting every feature, you're babysitting the
thing that babysits every feature.

If you're looking at this repo because you've been hand-running a similar loop for a while:
that's the right amount of time to have spent before reaching for a script. If you haven't
hand-run it yet, I'd genuinely suggest doing that first, even just a few times, before adopting
this verbatim — you'll understand every design choice below in about an hour of doing it badly
by hand, and you'll know exactly which parts to change for your own project.

## The four roles, and why each one exists

**Planner.** Reads the real, current source files — never a summary of them — and locks a
design before any code is written: what's changing, why, what edge cases matter, what the test
plan is. Critically, the Planner does not write code. Separating "decide what to build" from
"build it" means the design gets scrutinized once, explicitly, in a form (structured JSON,
not prose buried in a chat) that the next role can actually check against.

**Verifier.** Independently re-reads the same source files the Planner cited and checks the
plan for gaps before a single line of implementation code exists: broken imports, error paths
that won't actually surface, test plans that would require fabricating a pass for something
that can't really be verified in this session. If it finds real blockers, the plan bounces back
to the Planner — capped at a fixed number of rounds (6 in the reference script), so a
fundamentally wrong plan fails loudly instead of oscillating forever on API calls. This step
is the one it's most tempting to skip when you're in a hurry, and skipping it is exactly how
you end up implementing a plan that was broken from the start.

**Implementer.** Writes the code and tests, in an isolated git worktree, strictly from the
verified plan. The worktree isolation isn't ceremony — it means a mid-implementation mistake
can never corrupt the main checkout the other three roles are reasoning about, and it gives the
Tester an inspectable, isolated unit of work to independently check rather than a moving target.
The Implementer is explicitly forbidden from touching the feature-tracking file's state and
from committing anything. Both restrictions exist for the same reason the Tester exists at all
(see below): the person who just built something is the worst-positioned person to certify that
it's done.

**Tester.** Independently re-verifies — re-reads the diff, re-derives a failure case from
scratch where possible rather than reusing the Implementer's own fixtures, and then runs the
*real* verification harness (`scripts/verify-feature.sh`), not a description of what the
harness would probably say. Only the harness itself is allowed to flip a feature's state to
`passing`, and only after a command has actually run and exited 0. The Tester commits exactly
once and never pushes — pushing and opening a PR is a decision for whoever's orchestrating the
overall session, not something buried inside this loop.

## Why the Tester doesn't trust the Implementer's self-report

This is the one design choice in this repo that isn't a judgment call — it's a direct response
to something that actually happened. See `DECISIONS.example.md` for the anonymized write-up,
but the short version: a feature's tracking state was hand-edited to `"passing"`, with an
evidence string that cited a script and a pipeline-wiring change that never existed. Nobody had
run the verification harness. It sat that way, undetected, for days, because nothing had
independently checked it — the tracking file said "passing" and everyone downstream believed
the tracking file.

That's why:
- `scripts/verify-feature.sh` is the *only* thing allowed to write `"passing"` into the
  tracking file's `state` field, and it only does so immediately after `eval`-ing a real
  command and getting exit code 0.
- The Implementer is explicitly forbidden from touching `state` at all.
- The Tester's whole job is to *not* believe the Implementer's report and re-derive the result
  independently before ever invoking the harness.
- Every layer's `cmd` field must be real, executable bash — never a human-readable description
  of an action like "push to main and check the deploy." A prose string can never pass `eval`,
  so a layer like that can never legitimately reach `passing`, which is the point: if a step
  genuinely can't be automated yet, the honest state is "still active," not "passing, trust
  me." (`DECISIONS.example.md`'s second entry shows how to rewrite a human-only layer into a
  real, automatable check instead of leaving it stuck.)

None of this is paranoia for its own sake. It's four extra minutes per feature bought back
against a failure mode that, once it happens, costs you days of not knowing what's actually
built.

## What's in this repo

| File | Role |
|---|---|
| `.claude/workflows/feature-4agent.js` | The workflow itself — Planner/Verifier/Implementer/Tester, JSON-schema'd outputs, worktree isolation, round-capped Verifier loop |
| `scripts/verify-feature.sh` | The harness — `eval`s each feature's verification layers in order, and is the only thing allowed to flip a feature's tracking state to `passing` |
| `feature_list.example.json` | Example schema: three fake features (a rate limiter, a CSV export, a webhook retry) showing `layers`, `state`, and `evidence` |
| `DECISIONS.example.md` | Anonymized incident write-up — the fabricated-"passing" case study referenced above |

To adopt this, you'll want your own `feature_list.json`, `DECISIONS.md`, `AGENTS.md` (or
equivalent), and a `Makefile` (or similar) with `format`/`lint` targets the Implementer step
expects. The workflow script assumes a harness broadly like Claude Code's `agent()` /
`Workflow()` primitives (structured schemas, `isolation: 'worktree'`, a `phase()` marker) —
adapt the calling convention to whatever agent runtime you're using; the sequencing and the
constraints on each role are the part worth keeping.

## When NOT to use this

This is overkill for a one-off task, a prototype, or a change you're only going to make once.
Four agent roles and a round-capped verification loop cost real time and real API calls; if
you're not going to repeat this exact shape of work, you're paying that cost for nothing.

This is for a *recurring* loop — a project where you're shipping feature after feature against
the same codebase, the same verification steps keep getting retyped from scratch, and the
value of locking the process into a script (or at least a checklist) compounds over the tenth,
fiftieth, hundredth time you run it. If you're not at the point of feeling that repetition yet,
hand-run the four roles for a while first. You'll know when it's worth saving.

## License

MIT — see `LICENSE`.
