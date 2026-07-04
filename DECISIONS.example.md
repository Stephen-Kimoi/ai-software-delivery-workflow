# DECISIONS.example.md

This is an example decisions log — an append-only architectural-decision record that the
Planner reads for precedent and the Tester writes to after every feature. Nothing below is
from a real project; it's a worked, anonymized case study included because it's the actual
reason this repo's Tester agent is designed the way it is (see the README's "Why the Tester
doesn't trust the Implementer" section).

In a real repo, this file grows one entry per non-trivial decision or incident, newest at the
bottom (or top — pick one convention and stay consistent), each with a date and a short title.

---

### [example] A feature was marked "passing" with fabricated evidence — no script or wiring ever existed

**Finding:** A feature-tracking file's `state` field for one feature was already set to
`"passing"`, with an `evidence` string citing a specific commit and describing a verification
script as "deployed" and "wired into the deploy pipeline." That evidence was false. The cited
script had never existed in any commit — `git log --all --diff-filter=A -- <the script path>`
returned nothing. The commit named in the evidence touched only the feature-tracking JSON file
itself, adding the entry with `state: not_started`; it never touched the deploy workflow file
it claimed to have modified. The verification harness had never been run to produce this
evidence — the `state` field had been hand-edited directly, in violation of the project's own
rule that state transitions to `passing` must go through the harness script, never a manual
JSON edit.

**Why this matters:** This is exactly the failure mode a harness-controlled state transition
exists to prevent — a feature can be silently marked complete without ever having been
executed, hiding a fully unimplemented feature (no script, no gate, no CI wiring) behind a
"passing" badge that looks identical, in the tracking file, to a feature that actually shipped.
The root cause traced back to a bulk cleanup commit that marked several adjacent, genuinely
shipped features as `passing` in the same commit as this one — and this feature's entry got
swept along without anyone individually confirming its implementation code actually existed.

**Resolution:** The feature was implemented for real. Per the project's rule that the
Implementer never touches the `state` field, `state` was left untouched by the implementation
work and only updated by a genuine harness run afterward, whose real outcome (some layers
passed, one layer legitimately could not be verified this session) was recorded honestly —
including leaving the feature at `active`, not `passing`, until every layer could truly pass.

**Consequences:**
- Any other feature marked `passing` by that same bulk "mark shipped features passing" commit
  should be spot-checked against actual repo contents rather than trusted at face value — an
  evidence string that references a commit or PR number is not proof the described artifacts
  exist. Go read the diff.
- Bulk "chore: mark X passing" commits that don't go through the verification script should be
  treated as a process smell worth flagging on sight, since they bypass the one guardrail
  (the script's real, `eval`-based execution of each layer) designed to make "passing" mean
  "this actually ran and worked," not "someone typed passing."

---

### [example] A verification layer that can never pass, rewritten as a real check

**Decision:** A layer whose `cmd` field had been left as human-readable prose (something like
`"Push to main and inspect the Actions run to confirm it deployed cleanly"`) was rewritten as
an actual bash command that queries the deploy pipeline's own run history — e.g.
`gh run list --branch main --limit 1 --json conclusion -q '.[0].conclusion' | grep -q success`
— and asserts on its exit code.

**Why:** The underlying human action this layer exists to verify (someone pushed to main,
watched the deploy, confirmed it worked) had genuinely happened — the deploy really had
succeeded in production. But the verification script's `eval "$cmd"` can never succeed against
a string that isn't valid bash, no matter what a human did out of band. That meant this
feature could never legitimately reach `passing` through the harness-controlled path — the
exact path the incident above exists to protect. Hand-editing `state` to `passing` to work
around the stuck layer would have repeated the same mistake documented above. Instead, the
layer was rewritten to check the *actual, checkable proof* that the human step happened (the
CI run's own conclusion), so it can be verified honestly and automatically, now and on any
future re-run.

**Consequences:**
- Any future layer that is inherently a "did a human do X" check should use this pattern —
  query the real system of record for proof (a CI run's conclusion, a database row, a deployed
  artifact's response) rather than prose that can never be `eval`'d.
