#!/usr/bin/env bash
# verify-feature.sh — harness-controlled feature state transition
# Usage: ./scripts/verify-feature.sh <FEATURE_ID> [feature_list.json]
#
# This optional harness shows one concrete way to advance a feature to "passing".
# An agent must never hand-edit feature_list.json's state field directly —
# see DECISIONS.example.md's case study: a feature was marked "passing"
# with fabricated evidence via a manual JSON edit, and it went undetected
# for days because nothing had actually run the verification.
#
# Verification modes:
#   If the feature has a "layers" array, each layer runs in order.
#   Layer N does not run if layer N-1 fails.
#   On failure, the layer's "repair" instruction is printed so the agent
#   can self-correct without human intervention.
#   If no "layers" field, falls back to the single "verification" command.

set -euo pipefail

FEATURE_ID="${1:-}"
FL="${2:-feature_list.json}"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
RESET='\033[0m'

if [[ -z "$FEATURE_ID" ]]; then
  echo -e "Usage: $0 <FEATURE_ID> [feature_list.json]"
  echo -e "Example: $0 F01"
  echo ""
  echo -e "Available features:"
  if command -v jq >/dev/null 2>&1 && [[ -f "$FL" ]]; then
    jq -r '.[] | "  \(.id)  [\(.state)]  \(.behavior)"' "$FL"
  fi
  exit 1
fi

if [[ ! -f "$FL" ]]; then
  echo -e "${RED}ERROR:${RESET} $FL not found. Run from repo root or pass the path as the second argument."
  exit 1
fi

if ! command -v jq >/dev/null 2>&1; then
  echo -e "${RED}ERROR:${RESET} jq is required. Install: brew install jq  |  apt install jq"
  exit 1
fi

# ── Look up the feature ────────────────────────────────────────────────────────
feature="$(jq --arg id "$FEATURE_ID" '.[] | select(.id == $id)' "$FL")"

if [[ -z "$feature" ]]; then
  echo -e "${RED}ERROR:${RESET} Feature '$FEATURE_ID' not found in $FL"
  echo ""
  echo "Available IDs:"
  jq -r '.[].id' "$FL" | sed 's/^/  /'
  exit 1
fi

state="$(echo "$feature" | jq -r '.state')"
behavior="$(echo "$feature" | jq -r '.behavior')"
has_layers="$(echo "$feature" | jq 'has("layers") and (.layers | length > 0)')"

echo -e "${BOLD}Feature:${RESET}  $FEATURE_ID"
echo -e "${BOLD}Behavior:${RESET} $behavior"
echo -e "${BOLD}State:${RESET}    $state"
echo ""

# ── State guards ───────────────────────────────────────────────────────────────
if [[ "$state" == "passing" ]]; then
  echo -e "${GREEN}Already passing${RESET} — nothing to do."
  exit 0
fi

if [[ "$state" == "not_started" || "$state" == "planned" ]]; then
  echo -e "${YELLOW}Feature is '$state'.${RESET} Set state to 'active' in $FL first, then re-run."
  exit 1
fi

if [[ "$state" == "blocked" ]]; then
  echo -e "${RED}Feature is blocked.${RESET} Resolve the blocker, set state to 'active', then re-run."
  exit 1
fi

if [[ "$state" != "active" ]]; then
  echo -e "${RED}Unexpected state '$state'.${RESET} Expected 'active'."
  exit 1
fi

# ── Run verification ───────────────────────────────────────────────────────────
run_layer() {
  local label="$1"
  local cmd="$2"
  local repair="$3"

  echo -e "${CYAN}${BOLD}$label${RESET}"
  echo -e "  ${BOLD}Command:${RESET} $cmd"
  echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"

  # This eval is the whole point of the script: cmd must be real, executable bash,
  # not a human-readable description of an action. A layer whose "cmd" is prose
  # (e.g. "push to main and inspect the deploy") can never legitimately pass here —
  # eval will just fail on it as a syntax/command error, forever. If a layer needs to
  # verify something a human did out-of-band, its cmd must instead query the actual
  # system of record for proof (a CI run's conclusion, a deployed endpoint's response,
  # a database row) — see DECISIONS.example.md for a worked example of rewriting a
  # prose layer into a real check.
  set +e
  eval "$cmd"
  local exit_code=$?
  set -e

  echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"

  if [[ $exit_code -eq 0 ]]; then
    echo -e "  ${GREEN}PASS${RESET} — $label"
    echo ""
    return 0
  else
    echo -e "  ${RED}FAIL${RESET} — $label (exit $exit_code)"
    if [[ -n "$repair" ]]; then
      echo ""
      echo -e "  ${YELLOW}${BOLD}How to fix:${RESET}"
      echo -e "  $repair"
    fi
    echo ""
    return 1
  fi
}

all_passed=true

if [[ "$has_layers" == "true" ]]; then
  # ── multi-layer validation ────────────────────────────────────────────────
  layer_count="$(echo "$feature" | jq '.layers | length')"
  echo -e "${BOLD}Running $layer_count-layer verification...${RESET}"
  echo ""

  for i in $(seq 0 $((layer_count - 1))); do
    label="$(echo "$feature" | jq -r ".layers[$i].label")"
    cmd="$(echo "$feature" | jq -r ".layers[$i].cmd")"
    repair="$(echo "$feature" | jq -r ".layers[$i].repair // \"\"")"

    if ! run_layer "$label" "$cmd" "$repair"; then
      all_passed=false
      remaining=$(( layer_count - i - 1 ))
      if [[ $remaining -gt 0 ]]; then
        echo -e "  ${YELLOW}Skipping $remaining remaining layer(s) — fix layer $((i+1)) first.${RESET}"
      fi
      break
    fi
  done
else
  # ── single verification command ─────────────────────────────────────────────
  verification="$(echo "$feature" | jq -r '.verification')"
  echo -e "${BOLD}Running verification...${RESET}"
  echo -e "  ${BOLD}Command:${RESET} $verification"
  echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"

  set +e
  eval "$verification"
  exit_code=$?
  set -e

  echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"

  if [[ $exit_code -ne 0 ]]; then
    all_passed=false
    echo -e "  ${RED}FAIL${RESET} — verification exited $exit_code"
    echo ""
    echo -e "Fix the issue, then re-run: ${BOLD}$0 $FEATURE_ID${RESET}"
  fi
fi

# ── State transition ───────────────────────────────────────────────────────────
# This is the only place in the whole workflow that is allowed to flip state to
# "passing" — and it only does so after eval has actually run and exited 0. This
# script writing the state field itself (instead of an agent editing the JSON by
# hand) is the entire guardrail: "passing" can only ever mean "the harness ran
# this and it worked," never "an agent said so."
if [[ "$all_passed" == "true" ]]; then
  commit="$(git rev-parse --short HEAD 2>/dev/null || echo "no-git")"
  verified_on="$(date '+%Y-%m-%d')"
  evidence="commit $commit, verified $verified_on"

  tmp="$(mktemp)"
  jq --arg id "$FEATURE_ID" --arg ev "$evidence" \
    'map(if .id == $id then .state = "passing" | .evidence = $ev else . end)' \
    "$FL" > "$tmp" && mv "$tmp" "$FL"

  echo -e "${GREEN}${BOLD}ALL LAYERS PASSED${RESET} — feature is now passing"
  echo -e "  State updated:  active → ${GREEN}passing${RESET}"
  echo -e "  Evidence:       $evidence"
  echo ""
  echo -e "Next: run your project's full checks, then commit ${BOLD}$FL${RESET} with the updated state."
  exit 0
else
  echo -e "${RED}${BOLD}VERIFICATION FAILED${RESET} — state unchanged: $state"
  echo -e "Fix the failing layer, then re-run: ${BOLD}$0 $FEATURE_ID${RESET}"
  exit 1
fi
