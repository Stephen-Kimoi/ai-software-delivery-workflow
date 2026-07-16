#!/usr/bin/env node

import { existsSync, mkdirSync, readFileSync, cpSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const templateRoot = join(packageRoot, 'templates')
const repoRoot = process.cwd()
const args = process.argv.slice(2)
const command = args[0] || 'init'
const force = args.includes('--force')

const files = [
  '.claude/workflows/feature-4agent.js',
  'scripts/verify-feature.sh',
  'feature_list.json',
  'AGENTS.md',
  'DECISIONS.md',
]

const templates = {
  'feature_list.json': JSON.stringify([], null, 2) + '\n',
  'AGENTS.md': `# Agent instructions\n\n## Feature workflow\n\nUse the four-agent workflow for feature work:\n\n1. Planner\n2. Verifier\n3. Implementer\n4. Tester\n\nOnly the verification harness may change a feature state to \\"passing\\".\n`,
  'DECISIONS.md': `# Decisions\n\nAppend non-trivial architectural decisions and verification incidents here.\n`,
}

function fail(message) {
  console.error(`create-feature-4agent: ${message}`)
  process.exitCode = 1
}

function installFile(relativePath) {
  const destination = join(repoRoot, relativePath)
  if (existsSync(destination) && !force) {
    console.log(`skip ${relativePath} (already exists; use --force to replace)`)
    return
  }
  const wasPresent = existsSync(destination)
  mkdirSync(dirname(destination), { recursive: true })
  if (templates[relativePath] !== undefined) writeFileSync(destination, templates[relativePath])
  else cpSync(join(templateRoot, relativePath), destination)
  console.log(`${wasPresent ? 'updated' : 'created'} ${relativePath}`)
}

if (command === 'init') {
  for (const file of files) installFile(file)
  console.log('\nNext steps:')
  console.log('  1. Add features to feature_list.json')
  console.log("  2. Run Workflow({ name: 'feature-4agent', args: { featureId: 'F01' } })")
  console.log('  3. Check a feature with ./scripts/verify-feature.sh F01')
} else if (command === 'check') {
  const missing = files.filter((file) => !existsSync(join(repoRoot, file)))
  if (missing.length) fail(`missing workflow files:\n- ${missing.join('\n- ')}`)
  else {
    const list = JSON.parse(readFileSync(join(repoRoot, 'feature_list.json'), 'utf8'))
    if (!Array.isArray(list)) fail('feature_list.json must contain a JSON array')
    else console.log(`feature-4agent: ready (${list.length} feature${list.length === 1 ? '' : 's'})`)
  }
} else if (command === 'update') {
  console.log('Run `npx create-feature-4agent@latest init` to preview updates; existing files are preserved by default.')
  console.log('Use `--force` only after reviewing the release notes.')
} else if (command === '--help' || command === '-h') {
  console.log('Usage: create-feature-4agent [init|check|update] [--force]')
} else {
  fail(`unknown command ${command}; use init, check, update, or --help`)
}
