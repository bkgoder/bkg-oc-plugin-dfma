#!/usr/bin/env bash
set -euo pipefail

GLOBAL="${OPENCODE_CONFIG_DIR:-${XDG_CONFIG_HOME:-$HOME/.config}/opencode}"
ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$ROOT"

mkdir -p .opencode/rules .opencode/commands .opencode/agents

ln -sfn "$GLOBAL/rules/bkg-global" .opencode/rules/bkg-global
ln -sfn "$GLOBAL/commands/shutup.md" .opencode/commands/shutup.md
ln -sfn "$GLOBAL/agents/bkg-orchestrator.md" .opencode/agents/bkg-orchestrator.md

echo "Linked BKG OpenCode pack into: $ROOT"
ls -la .opencode/rules || true
ls -la .opencode/commands || true
ls -la .opencode/agents || true

# v12 fix: ensure visible 4ucker team helper is installed.
GLOBAL="${OPENCODE_CONFIG_DIR:-${XDG_CONFIG_HOME:-$HOME/.config}/opencode}"
if [[ -x "$GLOBAL/bin/install-bkg-4ucker-team-helper.sh" ]]; then
  "$GLOBAL/bin/install-bkg-4ucker-team-helper.sh" >/dev/null || true
fi
