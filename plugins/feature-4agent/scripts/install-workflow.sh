#!/usr/bin/env bash
set -euo pipefail

repo_root="$(pwd)"
plugin_root="${CLAUDE_PLUGIN_ROOT:?CLAUDE_PLUGIN_ROOT is required}"

copy_if_missing() {
  local source="$1"
  local destination="$2"
  if [[ -e "$destination" ]]; then
    echo "skip ${destination#"$repo_root"/} (already exists)"
    return
  fi
  mkdir -p "$(dirname "$destination")"
  cp "$source" "$destination"
  echo "created ${destination#"$repo_root"/}"
}

copy_if_missing "$plugin_root/templates/.claude/workflows/feature-4agent.js" "$repo_root/.claude/workflows/feature-4agent.js"
copy_if_missing "$plugin_root/templates/scripts/verify-feature.sh" "$repo_root/scripts/verify-feature.sh"

if [[ ! -e "$repo_root/feature_list.json" ]]; then
  printf '[]\n' > "$repo_root/feature_list.json"
  echo "created feature_list.json"
else
  echo "skip feature_list.json (already exists)"
fi

if [[ ! -e "$repo_root/AGENTS.md" ]]; then
  printf '# Agent instructions\n\nUse the four-agent feature workflow for feature work.\n' > "$repo_root/AGENTS.md"
  echo "created AGENTS.md"
else
  echo "skip AGENTS.md (already exists)"
fi

if [[ ! -e "$repo_root/DECISIONS.md" ]]; then
  printf '# Decisions\n\nAppend non-trivial decisions here.\n' > "$repo_root/DECISIONS.md"
  echo "created DECISIONS.md"
else
  echo "skip DECISIONS.md (already exists)"
fi
