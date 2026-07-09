#!/usr/bin/env bash
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$ROOT"

mkdir -p docs/debat/live docs/rat docs/vote .brain/snapshots
touch .brain/events.jsonl .brain/decisions.jsonl .brain/handoffs.jsonl

[[ -f .brain/tasks.json ]] || echo '{"tasks":[]}' > .brain/tasks.json
[[ -f .brain/state.json ]] || echo '{}' > .brain/state.json

cat > ./4ucker <<'SH'
#!/usr/bin/env bash
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$ROOT"

ACTION="${1:-team}"
shift || true

mkdir -p docs/debat/live docs/rat docs/vote .brain/snapshots

LIVE_DIR="docs/debat/live"
STATE="$LIVE_DIR/debate-state.json"
EVENTS="$LIVE_DIR/debate-events.jsonl"
INDEX="$LIVE_DIR/index.html"

slugify() {
  python3 - "$1" <<'PY'
import re, sys
s = sys.argv[1].strip().lower()
s = re.sub(r"[^a-z0-9äöüß]+", "-", s).strip("-") or "thema"
print(s[:80])
PY
}

remember() {
  [[ -x ./1brain ]] && ./1brain remember "$1" >/dev/null || true
}

write_dashboard() {
  cat > "$INDEX" <<'HTML'
<!doctype html>
<html lang="de">
<head>
  <meta charset="utf-8">
  <title>4ucker Live Debate</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    :root { color-scheme: dark; font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif; }
    body { margin: 0; background: #0b0f14; color: #e8edf2; }
    header { padding: 18px 22px; border-bottom: 1px solid #253040; background: #101722; position: sticky; top: 0; z-index: 2; }
    h1 { margin: 0 0 6px; font-size: 22px; }
    .meta { color: #9db0c5; font-size: 13px; }
    main { padding: 20px; display: grid; gap: 18px; }
    .grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; }
    .card { background: #111a26; border: 1px solid #26364a; border-radius: 14px; padding: 16px; box-shadow: 0 10px 30px rgba(0,0,0,.25); }
    .card h2 { margin: 0 0 10px; font-size: 16px; }
    .role { color: #9dd1ff; font-weight: 700; }
    .vote { display: inline-block; padding: 3px 8px; border-radius: 999px; border: 1px solid #3d516a; color: #cfe6ff; font-size: 12px; }
    pre { white-space: pre-wrap; word-break: break-word; color: #d7e1eb; font-size: 13px; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    td, th { border-bottom: 1px solid #26364a; padding: 8px; text-align: left; vertical-align: top; }
    .events { max-height: 360px; overflow: auto; }
    @media (max-width: 900px) { .grid { grid-template-columns: 1fr; } }
  </style>
</head>
<body>
<header>
  <h1>4ucker Live Debate</h1>
  <div class="meta" id="meta">loading...</div>
</header>
<main>
  <section class="card">
    <h2>Thema</h2>
    <pre id="topic"></pre>
  </section>

  <section class="grid">
    <article class="card"><h2><span class="role">Builder</span> <span class="vote" id="vote-builder">no vote</span></h2><pre id="builder"></pre></article>
    <article class="card"><h2><span class="role">Reviewer</span> <span class="vote" id="vote-reviewer">no vote</span></h2><pre id="reviewer"></pre></article>
    <article class="card"><h2><span class="role">Product</span> <span class="vote" id="vote-product">no vote</span></h2><pre id="product"></pre></article>
  </section>

  <section class="card">
    <h2>Vote Record</h2>
    <table>
      <thead><tr><th>Role</th><th>Vote</th><th>Reason</th></tr></thead>
      <tbody id="votes"></tbody>
    </table>
  </section>

  <section class="card">
    <h2>Events</h2>
    <pre class="events" id="events"></pre>
  </section>

  <section class="card">
    <h2>Reports</h2>
    <pre id="reports"></pre>
  </section>
</main>
<script>
async function loadText(url) {
  try { const r = await fetch(url + '?t=' + Date.now()); return r.ok ? await r.text() : ''; } catch { return ''; }
}
async function loadJson(url) {
  try { const r = await fetch(url + '?t=' + Date.now()); return r.ok ? await r.json() : null; } catch { return null; }
}
function set(id, v) { document.getElementById(id).textContent = v || ''; }
async function refresh() {
  const s = await loadJson('debate-state.json');
  const e = await loadText('debate-events.jsonl');
  if (!s) return;
  set('meta', `${s.action || ''} · ${s.created_at || ''} · status: ${s.status || ''}`);
  set('topic', s.topic || '');
  set('builder', s.agents?.builder?.text || '');
  set('reviewer', s.agents?.reviewer?.text || '');
  set('product', s.agents?.product?.text || '');
  set('vote-builder', s.votes?.builder?.vote || 'no vote');
  set('vote-reviewer', s.votes?.reviewer?.vote || 'no vote');
  set('vote-product', s.votes?.product?.vote || 'no vote');
  const tbody = document.getElementById('votes');
  tbody.innerHTML = '';
  for (const role of ['builder','reviewer','product']) {
    const v = s.votes?.[role] || {};
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${role}</td><td>${v.vote || ''}</td><td>${v.reason || ''}</td>`;
    tbody.appendChild(tr);
  }
  set('events', e);
  set('reports', `Debate: ${s.reports?.debate || ''}\nVote: ${s.reports?.vote || ''}`);
}
refresh();
setInterval(refresh, 1500);
</script>
</body>
</html>
HTML
}

init_state() {
  local action="$1"
  local topic="$2"
  local debate="$3"
  local vote="$4"
  local now
  now="$(date -Iseconds)"
  python3 - "$STATE" "$action" "$topic" "$debate" "$vote" "$now" <<'PY'
import json, sys
from pathlib import Path
state = {
  "status": "started",
  "action": sys.argv[2],
  "topic": sys.argv[3],
  "created_at": sys.argv[6],
  "updated_at": sys.argv[6],
  "agents": {
    "builder": {"text": "", "updated_at": ""},
    "reviewer": {"text": "", "updated_at": ""},
    "product": {"text": "", "updated_at": ""}
  },
  "votes": {
    "builder": {"vote": "", "reason": "", "updated_at": ""},
    "reviewer": {"vote": "", "reason": "", "updated_at": ""},
    "product": {"vote": "", "reason": "", "updated_at": ""}
  },
  "reports": {"debate": sys.argv[4], "vote": sys.argv[5]}
}
Path(sys.argv[1]).write_text(json.dumps(state, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
PY
  : > "$EVENTS"
  write_dashboard
}

append_event() {
  local role="$1"
  shift || true
  local text="$*"
  python3 - "$EVENTS" "$STATE" "$role" "$text" <<'PY'
import json, sys
from pathlib import Path
from datetime import datetime, timezone
events=Path(sys.argv[1]); statep=Path(sys.argv[2]); role=sys.argv[3]; text=sys.argv[4]
ts=datetime.now(timezone.utc).isoformat()
entry={"ts":ts,"type":"event","role":role,"text":text}
with events.open("a", encoding="utf-8") as f:
    f.write(json.dumps(entry, ensure_ascii=False) + "\n")
try: state=json.loads(statep.read_text(encoding="utf-8"))
except Exception: state={}
agents=state.setdefault("agents", {})
slot=agents.setdefault(role, {"text":"","updated_at":""})
slot["text"]=(slot.get("text","") + ("\n\n" if slot.get("text") else "") + text).strip()
slot["updated_at"]=ts
state["updated_at"]=ts
statep.write_text(json.dumps(state, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
PY
}

append_vote() {
  local role="$1"
  local vote="$2"
  shift 2 || true
  local reason="$*"
  python3 - "$EVENTS" "$STATE" "$role" "$vote" "$reason" <<'PY'
import json, sys
from pathlib import Path
from datetime import datetime, timezone
events=Path(sys.argv[1]); statep=Path(sys.argv[2]); role=sys.argv[3]; vote=sys.argv[4]; reason=sys.argv[5]
ts=datetime.now(timezone.utc).isoformat()
entry={"ts":ts,"type":"vote","role":role,"vote":vote,"reason":reason}
with events.open("a", encoding="utf-8") as f:
    f.write(json.dumps(entry, ensure_ascii=False) + "\n")
try: state=json.loads(statep.read_text(encoding="utf-8"))
except Exception: state={}
votes=state.setdefault("votes", {})
votes[role]={"vote":vote,"reason":reason,"updated_at":ts}
state["updated_at"]=ts
statep.write_text(json.dumps(state, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
PY
}

case "$ACTION" in
  live)
    echo "Live dashboard:"
    echo "  $INDEX"
    echo "State:"
    echo "  $STATE"
    echo "Events:"
    echo "  $EVENTS"
    exit 0
  ;;
  live-open)
    write_dashboard
    echo "Serve dashboard:"
    echo "  python3 -m http.server 8765 -d docs/debat/live"
    echo
    echo "Open:"
    echo "  http://127.0.0.1:8765/"
    echo
    echo "File:"
    echo "  $INDEX"
    exit 0
  ;;
  live-event)
    role="${1:-event}"
    shift || true
    text="$*"
    [[ -n "$text" ]] || { echo 'Usage: ./4ucker live-event <role> "message"' >&2; exit 2; }
    append_event "$role" "$text"
    echo "live event added: $role"
    exit 0
  ;;
  live-vote)
    role="${1:-}"
    vote="${2:-}"
    shift 2 || true
    reason="$*"
    [[ -n "$role" && -n "$vote" && -n "$reason" ]] || { echo 'Usage: ./4ucker live-vote <role> <vote> "reason"' >&2; exit 2; }
    append_vote "$role" "$vote" "$reason"
    echo "live vote added: $role -> $vote"
    exit 0
  ;;
esac

if [[ "$ACTION" == "vote" ]]; then
  TYPE="${1:-team}"
  shift || true
  DECISION="$*"
  [[ -n "$DECISION" ]] || DECISION="No vote decision provided"
  SLUG="$(slugify "$DECISION")"
  STAMP="$(date +%Y%m%d-%H%M%S)"
  VOTE="docs/vote/${SLUG}.${STAMP}.md"
  cat > "$VOTE" <<EOFV
# Vote: $DECISION

## Vote Type

$TYPE

## Vote Record

| Voter | Role | Vote | Confidence | Reason | Condition / Blocker |
|---|---|---|---|---|---|

## Vote Chair

## Vote Recorder

## Vote Auditor

## Result
EOFV
  cat <<EOFV
Vote protocol started.

Vote report: $VOTE

Required visible vote agents:
@bkg-vote-chair
@bkg-vote-recorder
@bkg-vote-auditor

No vote record, no approval.
EOFV
  remember "vote started: $VOTE"
  exit 0
fi

if [[ "$ACTION" == "rat" ]]; then
  TYPE="${1:-problem}"
  shift || true
  TOPIC="$*"
  [[ -n "$TOPIC" ]] || TOPIC="No council topic provided"
  SLUG="$(slugify "$TOPIC")"
  STAMP="$(date +%Y%m%d-%H%M%S)"
  RAT="docs/rat/${SLUG}.${STAMP}.md"
  VOTE="docs/vote/${SLUG}.${STAMP}.md"
  cat > "$RAT" <<EOFR
# Agent Rat: $TOPIC

## Typ

$TYPE

## Agentenantworten

### @bkg-rat-architect
### @bkg-rat-builder
### @bkg-rat-reviewer
### @bkg-rat-product
### @bkg-rat-growth
### @bkg-rat-contrarian

## Entscheidung

## Begründung
EOFR
  cat > "$VOTE" <<EOFV
# Vote: Agent Rat - $TOPIC

## Vote Type

council/$TYPE

## Vote Record

| Voter | Role | Vote | Confidence | Reason | Condition / Blocker |
|---|---|---|---|---|---|

## Result
EOFV
  cat <<EOFR
Agent Rat started.

Rat report: $RAT
Vote report: $VOTE

Required visible council agents:
@bkg-rat-architect
@bkg-rat-builder
@bkg-rat-reviewer
@bkg-rat-product
@bkg-rat-contrarian
(+ @bkg-rat-growth for posts/communication)

Required visible vote agents:
@bkg-vote-chair
@bkg-vote-recorder
@bkg-vote-auditor
EOFR
  remember "agent rat started: $RAT"
  remember "vote started: $VOTE"
  exit 0
fi

TEXT="$*"
[[ -n "$TEXT" ]] || TEXT="No problem text provided"
case "$ACTION" in
  team|think|research|approve|ui) ;;
  *) echo "Usage: ./4ucker team|think|research|approve|ui \"problem\" | rat <type> \"topic\" | vote <type> \"decision\" | live|live-open|live-event|live-vote" >&2; exit 2 ;;
esac

SLUG="$(slugify "$TEXT")"
STAMP="$(date +%Y%m%d-%H%M%S)"
DEBAT="docs/debat/${SLUG}.${STAMP}.md"
VOTE="docs/vote/${SLUG}.${STAMP}.md"

cat > "$DEBAT" <<EOFD
# 4ucker Team Debate: $TEXT

## Ausgangsproblem

## Quellen / Recherche

## Was als Lösung im Raum stand

## Real Team Calls

### @bkg-4ucker-builder
### @bkg-4ucker-reviewer
### @bkg-4ucker-product

## Live Dashboard

docs/debat/live/index.html

## Approval Ergebnis

See vote report: $VOTE

## Finale Lösung

## Begründung

## Nächste Schritte
EOFD

cat > "$VOTE" <<EOFV
# Vote: 4ucker Team - $TEXT

## Vote Type

team/$ACTION

## Vote Record

| Voter | Role | Vote | Confidence | Reason | Condition / Blocker |
|---|---|---|---|---|---|

## Result
EOFV

init_state "$ACTION" "$TEXT" "$DEBAT" "$VOTE"

cat <<EOFD
4ucker live team debate started.

Action: $ACTION
Problem: $TEXT

Live dashboard:
  docs/debat/live/index.html

Debate report:
  $DEBAT

Vote report:
  $VOTE

Open dashboard:
  ./4ucker live-open

Required visible team agents:
@bkg-4ucker-builder
@bkg-4ucker-reviewer
@bkg-4ucker-product

After each answer:
  ./4ucker live-event builder "..."
  ./4ucker live-event reviewer "..."
  ./4ucker live-event product "..."

After votes:
  ./4ucker live-vote builder approve|reject|revise|blocker "reason"
  ./4ucker live-vote reviewer approve|reject|revise|blocker "reason"
  ./4ucker live-vote product approve|reject|revise|blocker "reason"

Required visible vote agents:
@bkg-vote-chair
@bkg-vote-recorder
@bkg-vote-auditor

No vote record, no approval.
EOFD

remember "4ucker live debate started: $DEBAT"
remember "vote started: $VOTE"
SH

chmod +x ./4ucker
echo "patched ./4ucker with live debate dashboard"
