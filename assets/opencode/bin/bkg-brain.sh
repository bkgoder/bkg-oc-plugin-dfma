#!/usr/bin/env bash
set -euo pipefail

cmd="${1:-help}"
shift || true

root="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$root"

brain=".brain"
ts="$(date -Iseconds)"
project="$(basename "$root")"

init_brain() {
  mkdir -p "$brain/snapshots"
  touch "$brain/events.jsonl" "$brain/decisions.jsonl" "$brain/handoffs.jsonl"
  if [[ ! -f "$brain/state.json" ]]; then
    cat > "$brain/state.json" <<JSON
{
  "project": "$project",
  "current_blocker": "",
  "current_focus": "",
  "last_verified": "",
  "active_files": [],
  "known_gates": [],
  "next_action": "",
  "updated_at": "$ts"
}
JSON
  fi
  if [[ ! -f "$brain/tasks.json" ]]; then
    echo '{"tasks":[]}' > "$brain/tasks.json"
  fi
  if [[ ! -f "$brain/index.json" ]]; then
    echo '{"version":1,"files":["state.json","events.jsonl","decisions.jsonl","handoffs.jsonl","tasks.json"]}' > "$brain/index.json"
  fi
  if [[ ! -f "$brain/README.md" ]]; then
    cat > "$brain/README.md" <<'MD'
# Project Brain

Project-local durable memory for agents and model handoffs.

Files:

- state.json: current project state
- events.jsonl: work log
- decisions.jsonl: architecture/product decisions
- handoffs.jsonl: model/session handoffs
- tasks.json: durable task list
- snapshots/: longer handoff snapshots

No secrets.
MD
  fi
}

json_escape() {
  python3 -c 'import json,sys; print(json.dumps(sys.stdin.read().strip()))'
}

append_event() {
  init_brain
  local kind="${1:-note}"
  shift || true
  local summary="${*:-manual event}"
  local escaped
  escaped="$(printf '%s' "$summary" | json_escape)"
  cat >> "$brain/events.jsonl" <<JSON
{"ts":"$ts","actor":"manual","project":"$project","kind":"$kind","summary":$escaped,"files":[],"commands":[],"tests":[],"result":"","next":"","blockers":[],"refs":[]}
JSON
  python3 - "$brain/state.json" "$summary" "$ts" <<'PY'
import json, sys
from pathlib import Path
p = Path(sys.argv[1])
summary = sys.argv[2]
ts = sys.argv[3]
data = json.loads(p.read_text())
data["current_focus"] = summary
data["updated_at"] = ts
p.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n")
PY
}

case "$cmd" in
  init)
    init_brain
    append_event init "Initialized project brain"
    echo "initialized .brain in $root"
    ;;
  remember)
    append_event note "$@"
    echo "remembered in .brain/events.jsonl"
    ;;
  event)
    kind="${1:-note}"
    shift || true
    append_event "$kind" "$@"
    echo "event written: $kind"
    ;;
  show)
    init_brain
    echo "== .brain/state.json =="
    cat "$brain/state.json"
    echo
    echo "== recent events =="
    tail -n 20 "$brain/events.jsonl" || true
    ;;
  dump)
    init_brain
    snapshot="$brain/snapshots/handoff-$(date +%Y%m%d-%H%M%S).json"
    git_status="$(git status --short 2>/dev/null || true)"
    python3 - "$snapshot" "$brain/handoffs.jsonl" "$project" "$ts" "$git_status" <<'PY'
import json, sys
from pathlib import Path
snapshot = Path(sys.argv[1])
handoffs = Path(sys.argv[2])
project = sys.argv[3]
ts = sys.argv[4]
git_status = sys.argv[5]
data = {
  "ts": ts,
  "actor": "manual",
  "project": project,
  "kind": "handoff",
  "summary": "Manual handoff snapshot",
  "git_status": git_status,
  "next": "",
  "blockers": [],
}
snapshot.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n")
with handoffs.open("a", encoding="utf-8") as f:
    f.write(json.dumps(data, ensure_ascii=False) + "\n")
PY
    echo "wrote $snapshot"
    ;;
  help|*)
    cat <<HELP
Usage:
  bkg-brain.sh init
  bkg-brain.sh remember "summary"
  bkg-brain.sh event <kind> "summary"
  bkg-brain.sh show
  bkg-brain.sh dump
HELP
    ;;
esac
