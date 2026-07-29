# Run A Feature

Copy this prompt into the coding agent you want to use.

```text
Use the four-agent feature workflow from SKILL.md for feature <FEATURE_ID>.

Read these files before acting:
- SKILL.md
- references/role-contract.md
- references/feature-tracking.md
- references/verification-harness.md
- references/evidence-driven-testing.md if the feature changes UI behavior
- feature_list.json or feature_list.example.json
- AGENTS.md or the repo's equivalent agent instructions, if present
- DECISIONS.md or DECISIONS.example.md

Run the work as four separate phases:

1. Planner: inspect the real source files and produce a locked plan. Do not edit code.
2. Verifier: independently inspect the files and reject vague, missing, or untestable plan items.
   Loop back to Planner until the plan is executable or blocked.
3. Implementer: make the smallest code and test changes needed for the verified plan. Do not mark
   the feature passing.
4. Tester: independently rerun every executable check. For UI behavior, capture evidence-driven
   testing proof with annotated assertions. If posting to a GitHub PR, include an inline-viewable
   GIF embed using an absolute `https://github.com/<org>/<repo>/raw/<commit>/<path>.gif` URL, and
   keep the MP4 as the full-quality artifact. Update feature state and DECISIONS.md only according
   to real evidence.

Do not claim success unless every required check passes. If any required check cannot run, leave
the feature active or blocked and report the exact missing evidence.
```
