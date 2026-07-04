export const meta = {
  name: 'feature-4agent',
  description: 'Planner -> Verifier -> Implementer -> Tester workflow for one feature in feature_list.json',
  whenToUse:
    'The mandatory process for all feature work in this repo (see AGENTS.md "4-Agent Workflow"). Do not hand-write an ad-hoc Planner/Verifier/Implementer/Tester agent sequence instead of calling this.',
  phases: [
    { title: 'Plan', detail: 'Planner locks a design by reading real source files' },
    { title: 'Verify', detail: 'Verifier independently re-checks the plan; loops back to Plan up to 6 rounds' },
    { title: 'Implement', detail: 'Implementer writes code + tests in an isolated worktree' },
    { title: 'Test', detail: 'Tester independently re-verifies, runs the verification harness, commits once' },
  ],
}

const PLAN_SCHEMA = {
  type: 'object',
  properties: {
    plan_summary: { type: 'string' },
    rationale: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          decision: { type: 'string' },
          why: { type: 'string' },
          precedent: { type: 'string', description: 'DECISIONS.md/PROGRESS.md precedent cited, if any' },
        },
        required: ['decision', 'why'],
      },
    },
    files_to_change: { type: 'array', items: { type: 'string' } },
    edge_cases: { type: 'array', items: { type: 'string' } },
    test_plan: { type: 'array', items: { type: 'string' } },
    is_new_feature: { type: 'boolean' },
    feature_entry: {
      type: ['object', 'null'],
      properties: {
        id: { type: 'string' },
        behavior: { type: 'string' },
        verification: { type: 'string' },
        layers: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              label: { type: 'string' },
              cmd: { type: 'string' },
              repair: { type: 'string' },
            },
            required: ['label', 'cmd'],
          },
        },
      },
    },
    open_questions_resolved: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          question: { type: 'string' },
          decision: { type: 'string' },
          precedent_cited: { type: 'string' },
        },
        required: ['question', 'decision'],
      },
    },
  },
  required: ['plan_summary', 'rationale', 'files_to_change', 'edge_cases', 'test_plan', 'is_new_feature'],
}

const VERIFY_SCHEMA = {
  type: 'object',
  properties: {
    verified: { type: 'boolean' },
    blockers: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          issue: { type: 'string' },
          location: { type: 'string' },
          fix_direction: { type: 'string' },
        },
        required: ['issue'],
      },
    },
    notes: { type: 'string' },
  },
  required: ['verified', 'blockers'],
}

const IMPLEMENT_SCHEMA = {
  type: 'object',
  properties: {
    worktree_path: { type: 'string' },
    branch_name: { type: 'string' },
    files_changed: { type: 'array', items: { type: 'string' } },
    make_format_result: { type: 'string' },
    make_lint_result: { type: 'string' },
    test_results: { type: 'string' },
    real_world_checks: { type: 'array', items: { type: 'string' } },
    deviations_from_plan: { type: 'array', items: { type: 'string' } },
  },
  required: ['worktree_path', 'branch_name', 'files_changed', 'test_results'],
}

const TEST_SCHEMA = {
  type: 'object',
  properties: {
    independent_verification: { type: 'string' },
    feature_list_updated: { type: 'boolean' },
    verify_feature_output: { type: 'string' },
    final_state: { type: 'string', enum: ['active', 'passing', 'blocked'] },
    decisions_entry_added: { type: 'boolean' },
    committed: { type: 'boolean' },
    commit_sha: { type: 'string' },
    honest_gaps: { type: 'array', items: { type: 'string' } },
  },
  required: ['independent_verification', 'verify_feature_output', 'final_state', 'committed'],
}

const parsedArgs = typeof args === 'string' ? JSON.parse(args) : args || {}
const { featureId, extraContext } = parsedArgs
if (!featureId) {
  throw new Error('feature-4agent requires args = { featureId: "FXX", extraContext?: "..." }')
}

// agent() returns null on a terminal API error (e.g. a transient 529 Overloaded) after the
// harness's own retries are exhausted. Every call in this script is a required, sequential
// step, so a null here must not crash on the next property access — retry once with a fresh
// label (changes the cache key), then fail with a clear, resumable error.
async function agentRequired(prompt, opts) {
  let result = await agent(prompt, opts)
  if (result === null) {
    log(`${opts.label || 'agent'} returned null (likely a transient API error) — retrying once`)
    result = await agent(prompt, { ...opts, label: `${opts.label || 'agent'}-retry` })
  }
  if (result === null) {
    throw new Error(
      `${opts.label || 'agent'} failed twice (returned null) — likely a persistent API issue, not a script bug. ` +
        `Re-invoke with the same scriptPath/args and resumeFromRunId set to this run's ID; earlier successful calls replay from cache.`
    )
  }
  return result
}

phase('Plan')

let plan = null
let verdict = null
let verified = false
let round = 0

// Round cap: 6 is a judgment call, not a magic constant to copy blindly. It's high enough
// that a plan with a real, fixable gap gets several honest shots at revision, but low enough
// that a plan that's fundamentally wrong (wrong abstraction, missing precedent, etc.) fails
// loudly and stops burning API calls instead of oscillating forever. Tune per your own team's
// tolerance for back-and-forth vs. cost.
while (round < 6 && !verified) {
  round++

  const planPrompt = `
You are the Planner for feature ${featureId} in this repo. You do NOT write or edit any code.

${extraContext ? `Extra context from the requester: ${extraContext}\n` : ''}
${round > 1 ? `This is round ${round}. The previous plan was rejected by the Verifier with these blockers — revise your plan to resolve every one of them:\n${JSON.stringify(verdict?.blockers, null, 2)}\n` : ''}

Do this:
1. Read the REAL current contents of every file relevant to this feature — AGENTS.md, PROGRESS.md, feature_list.json (find the entry for ${featureId}; if it doesn't exist, this is a new feature), DECISIONS.md, and every source file you expect to touch. Never trust a summary of what a file contains — open it and read it yourself.
2. Produce a locked design: plan_summary, a rationale entry for every non-obvious choice (decision + why, and a precedent field if you found one), an exact files_to_change list, an edge_cases list, and a test_plan.
3. If ${featureId} is NOT yet in feature_list.json, also produce feature_entry: {id, behavior, verification, layers?}.
4. For any layer whose "cmd" would represent a human-only action (e.g. "push to main and inspect the deploy") — do NOT leave it as human-readable prose. scripts/verify-feature.sh literally \`eval\`s the cmd field, so prose that isn't valid bash will always fail, meaning that layer can never legitimately pass even after a human performs the action manually. Instead design the cmd to query the actual system of record with real bash — e.g. \`gh run list --branch main --limit 1 --json conclusion -q '.[0].conclusion' | grep -q success\` to check the latest deploy's Actions run, or a curl against an already-deployed endpoint, or a check against an external API's own state. Every layer must be genuinely capable of passing, not just descriptive.
5. For any cross-cutting design question where reasonable engineers could disagree (e.g. fail-open vs fail-closed on an ambiguous check outcome) — do not guess in isolation. Search DECISIONS.md and PROGRESS.md for a precedent from a similar past call in this repo, cite it, and lock a reasoned decision yourself. Record these under open_questions_resolved.

Return the structured plan.
`.trim()

  plan = await agentRequired(planPrompt, { phase: 'Plan', schema: PLAN_SCHEMA, label: `planner-r${round}` })

  phase('Verify')

  const verifyPrompt = `
You are the Verifier for feature ${featureId} in this repo. Review this locked plan for gaps before any code is written:

${JSON.stringify(plan, null, 2)}

Do this:
1. Independently re-read the real source files yourself — do not trust the Planner's claims about file contents, line numbers, or function signatures. Open the files named in files_to_change and confirm they match what the plan assumes.
2. Specifically hunt for:
   - Import/dependency resolution problems across the actual directory structure (a plan can look fine but break existing imports or tests once files move/change).
   - Whether every new failure/error path the plan introduces actually gets persisted or surfaced the way downstream consumers expect — not silently swallowed.
   - Whether the plan's test_plan and any feature_entry.verification/layers are honest given what can actually be verified in this session — flag anything that would require fabricating a pass for a step the agent can't actually perform (e.g. a real git push to a protected branch, or a human visually confirming something in a UI).
3. Return verified=true ONLY if there are zero blockers. Otherwise return verified=false with concrete, specific blockers (issue + location + fix_direction) the Planner can act on.
`.trim()

  verdict = await agentRequired(verifyPrompt, { phase: 'Verify', schema: VERIFY_SCHEMA, label: `verifier-r${round}` })
  verified = verdict.verified === true && (!verdict.blockers || verdict.blockers.length === 0)

  log(`Round ${round}: verified=${verified}${verified ? '' : ` — ${verdict.blockers?.length || 0} blocker(s)`}`)
}

if (!verified) {
  log(`Plan for ${featureId} not verified after ${round} rounds — stopping before any implementation.`)
  return { status: 'blocked_at_plan', featureId, rounds: round, plan, verdict }
}

phase('Implement')

const implementPrompt = `
You are the Implementer for feature ${featureId} in this repo. Write the code and tests exactly per this verified plan — do not deviate without noting it:

${JSON.stringify(plan, null, 2)}

Do this:
1. Implement files_to_change exactly as planned (or note deviations_from_plan if reality forced a change).
2. Write the tests from test_plan.
3. Run \`make format\` then \`make lint\`, fixing every issue yourself until both are clean.
4. Actually run the new tests/checks yourself and report the real output in test_results — never write "should pass" or similar without having run it.
5. Where the plan calls for real-world verification (not just mocks) and it's safe/read-mostly/already-precedented in this repo (e.g. hitting this project's own already-deployed public endpoint read-only), do it and record it in real_world_checks. Do NOT push to main, do NOT trigger a deploy, do NOT touch any production system, and do NOT commit — committing is the Tester's job, not yours.
6. Do NOT touch feature_list.json's "state" field under any circumstances.
7. Report worktree_path (run \`pwd\`) and branch_name (run \`git branch --show-current\`) accurately — the Tester needs these to pick up your work.

Return the structured report.
`.trim()

// isolation: 'worktree' is not a stylistic preference. The Implementer is the only role in
// this loop that writes code, and giving it its own git worktree means a mid-implementation
// failure (bad edit, broken test run, wrong branch) can never corrupt the main checkout that
// the Planner/Verifier/Tester are reasoning about. It also means the Tester's "independently
// re-verify" step below is checking an isolated, inspectable unit of work rather than a
// moving target in the same working directory the rest of the loop is using.
const implementation = await agentRequired(implementPrompt, {
  phase: 'Implement',
  schema: IMPLEMENT_SCHEMA,
  isolation: 'worktree',
  label: 'implementer',
})

phase('Test')

const testPrompt = `
You are the Tester for feature ${featureId} in this repo. Do NOT simply trust the Implementer's self-report — independently verify.

The Implementer's work is in the git worktree at: ${implementation.worktree_path}
On branch: ${implementation.branch_name}
cd into that exact directory for every git/test/file operation below — do not operate on the main repo checkout.

Implementer's report (verify this, do not just believe it):
${JSON.stringify(implementation, null, 2)}

Verified plan this was built from:
${JSON.stringify(plan, null, 2)}

Do this:
1. Independently re-run the actual verification steps yourself, ideally via a path different from the Implementer's own fixtures/mocks (e.g. re-derive a failure condition from scratch rather than reusing the Implementer's exact test fixture). Report this in independent_verification.
2. If ${featureId} does not yet exist in feature_list.json (the orchestrating session may not have pre-added it), add it now using the Planner's feature_entry, with state set to "active" — this is not a blocker, it's expected for new features. Set feature_list_updated=true if you did this.
3. Run \`./scripts/verify-feature.sh ${featureId}\` FOR REAL and paste its real output into verify_feature_output. Never hand-edit feature_list.json's state field directly — that is a hard rule in this repo (see DECISIONS.example.md's fabricated-evidence case study: a feature was silently marked complete while fully unimplemented, undetected for days, because the state was hand-edited instead of harness-verified).
4. If a layer genuinely cannot pass this session because it requires a human action (e.g. pushing to main, or a human visually confirming something in a UI), the feature must honestly remain in "active" state with real, specific evidence about exactly what was and wasn't verified — final_state must reflect the true \`verify-feature.sh\` outcome. Never fabricate "passing". List any such gaps in honest_gaps.
5. Log a DECISIONS.md entry describing what was implemented, what was verified, and any open gap. Set decisions_entry_added=true.
6. Commit exactly once (in this worktree, on this branch) — everything: code, tests, feature_list.json, DECISIONS.md. Never push, never merge, never touch main directly. Pushing the branch and opening the PR is the orchestrating session's job, after this workflow returns. Report the commit sha in commit_sha and set committed=true.

Return the structured report.
`.trim()

const testResult = await agentRequired(testPrompt, { phase: 'Test', schema: TEST_SCHEMA, label: 'tester' })

log(
  `${featureId}: final_state=${testResult.final_state}, committed=${testResult.committed}` +
    (testResult.honest_gaps?.length ? `, ${testResult.honest_gaps.length} honest gap(s) logged` : '')
)

return {
  status: 'implemented',
  featureId,
  rounds: round,
  plan,
  verdict,
  implementation,
  testResult,
}
