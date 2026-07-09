#!/usr/bin/env bash
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$ROOT"

mkdir -p .brain/snapshots docs/debat docs/rat docs/vote
touch .brain/events.jsonl .brain/decisions.jsonl .brain/handoffs.jsonl
[[ -f .brain/tasks.json ]] || echo '{"tasks":[]}' > .brain/tasks.json
[[ -f .brain/state.json ]] || cat > .brain/state.json <<STATE
{
  "project": "$(basename "$ROOT")",
  "current_blocker": "",
  "current_focus": "",
  "last_verified": "",
  "active_files": [],
  "known_gates": [],
  "next_action": "",
  "updated_at": "$(date -Iseconds)"
}
STATE
[[ -f .brain/index.json ]] || echo '{"version":1,"files":["state.json","events.jsonl","decisions.jsonl","handoffs.jsonl","tasks.json"]}' > .brain/index.json

cat > ./1brain <<'SH'
#!/usr/bin/env bash
set -euo pipefail
ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$ROOT"
mkdir -p .brain/snapshots
touch .brain/events.jsonl .brain/decisions.jsonl .brain/handoffs.jsonl
[[ -f .brain/tasks.json ]] || echo '{"tasks":[]}' > .brain/tasks.json
[[ -f .brain/state.json ]] || echo '{}' > .brain/state.json
CMD="${1:-look}"; shift || true
case "$CMD" in
  remember|fix|blocker|verify)
    KIND="$CMD"; [[ "$KIND" == remember ]] && KIND=note
    TEXT="$*"; [[ -n "$TEXT" ]] || { echo "text required" >&2; exit 2; }
    python3 - ".brain/events.jsonl" ".brain/state.json" "$KIND" "$TEXT" <<'PY'
import json,sys
from pathlib import Path
from datetime import datetime,timezone
events=Path(sys.argv[1]); statep=Path(sys.argv[2]); kind=sys.argv[3]; text=sys.argv[4]
low=text.lower()
if any(x in low for x in ["sk-","password=","passwd=","cookie:","authorization:","bearer ","private key"]):
    raise SystemExit("Refusing likely secret.")
ts=datetime.now(timezone.utc).isoformat(); project=Path.cwd().name
entry={"ts":ts,"actor":"1brain","project":project,"kind":kind,"summary":text,"files":[],"commands":["./1brain "+kind],"tests":[],"result":"","next":"","blockers":[],"refs":[]}
with events.open("a") as f: f.write(json.dumps(entry,ensure_ascii=False)+"\n")
try: state=json.loads(statep.read_text())
except Exception: state={}
state["project"]=project; state["current_focus"]=text; state["updated_at"]=ts
if kind=="blocker": state["current_blocker"]=text
if kind=="verify": state["last_verified"]=text
statep.write_text(json.dumps(state,indent=2,ensure_ascii=False)+"\n")
PY
    echo "remembered: $TEXT"
  ;;
  decision)
    TEXT="$*"; [[ -n "$TEXT" ]] || { echo "decision text required" >&2; exit 2; }
    python3 - ".brain/decisions.jsonl" ".brain/events.jsonl" "$TEXT" <<'PY'
import json,sys
from pathlib import Path
from datetime import datetime,timezone
text=sys.argv[3]; ts=datetime.now(timezone.utc).isoformat()
entry={"ts":ts,"actor":"1brain","project":Path.cwd().name,"kind":"decision","summary":text,"files":[],"commands":["./1brain decision"],"tests":[],"result":"recorded","next":"","blockers":[],"refs":[]}
for p in [Path(sys.argv[1]),Path(sys.argv[2])]:
    with p.open("a") as f: f.write(json.dumps(entry,ensure_ascii=False)+"\n")
PY
    echo "decision recorded"
  ;;
  look|"") echo "== state =="; cat .brain/state.json; echo; echo "== tasks =="; cat .brain/tasks.json; echo; echo "== recent events =="; tail -n 25 .brain/events.jsonl || true ;;
  show) cat .brain/state.json ;;
  events) tail -n "${1:-50}" .brain/events.jsonl || true ;;
  dump)
    SNAP=".brain/snapshots/handoff-$(date +%Y%m%d-%H%M%S).json"
    python3 - "$SNAP" <<'PY'
import json,subprocess,sys
from pathlib import Path
from datetime import datetime,timezone
snap=Path(sys.argv[1])
def sh(c):
    try: return subprocess.check_output(c,shell=True,text=True,stderr=subprocess.STDOUT).splitlines()
    except Exception as e: return [str(e)]
entry={"ts":datetime.now(timezone.utc).isoformat(),"actor":"1brain","project":Path.cwd().name,"kind":"handoff","summary":"handoff snapshot","state":json.loads(Path(".brain/state.json").read_text()),"tasks":json.loads(Path(".brain/tasks.json").read_text()),"git":{"branch":sh("git branch --show-current"),"head":sh("git rev-parse HEAD"),"status":sh("git status --short")}}
snap.write_text(json.dumps(entry,indent=2,ensure_ascii=False)+"\n")
for p in [Path(".brain/handoffs.jsonl"),Path(".brain/events.jsonl")]:
    with p.open("a") as f: f.write(json.dumps(entry,ensure_ascii=False)+"\n")
PY
    echo "wrote $SNAP"
  ;;
  validate) python3 - <<'PY'
import json
from pathlib import Path
ok=True
for p in [Path(".brain/state.json"),Path(".brain/tasks.json"),Path(".brain/index.json")]:
    try: json.loads(p.read_text())
    except Exception as e: ok=False; print("bad",p,e)
for p in [Path(".brain/events.jsonl"),Path(".brain/decisions.jsonl"),Path(".brain/handoffs.jsonl")]:
    for i,l in enumerate(p.read_text().splitlines(),1):
        if l.strip():
            try: json.loads(l)
            except Exception as e: ok=False; print("bad",p,i,e)
print("ok" if ok else "bad")
raise SystemExit(0 if ok else 1)
PY
  ;;
  *) echo "Usage: ./1brain remember|look|show|events|decision|dump|validate ..." >&2; exit 2 ;;
esac
SH
chmod +x ./1brain

cat > ./3some <<'SH'
#!/usr/bin/env bash
set -euo pipefail
ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$ROOT"
mkdir -p .brain/snapshots
touch .brain/events.jsonl
[[ -f .brain/tasks.json ]] || echo '{"tasks":[]}' > .brain/tasks.json
[[ -f .brain/state.json ]] || echo '{}' > .brain/state.json
CMD="${1:-list}"; shift || true
python3 - ".brain/tasks.json" ".brain/events.jsonl" ".brain/state.json" "$CMD" "$@" <<'PY'
import json,sys,time
from pathlib import Path
from datetime import datetime,timezone
tp=Path(sys.argv[1]); ep=Path(sys.argv[2]); sp=Path(sys.argv[3]); cmd=sys.argv[4]; args=sys.argv[5:]
def now(): return datetime.now(timezone.utc).isoformat()
def load():
    try: d=json.loads(tp.read_text())
    except Exception: d={"tasks":[]}
    if not isinstance(d,dict) or not isinstance(d.get("tasks"),list): d={"tasks":[]}
    return d
def save(d): tp.write_text(json.dumps(d,indent=2,ensure_ascii=False)+"\n")
def ev(summary,tid=""):
    e={"ts":now(),"actor":"3some","project":Path.cwd().name,"kind":"task","summary":summary,"task_id":tid,"files":[".brain/tasks.json"],"commands":["./3some "+cmd],"tests":[],"result":"","next":"","blockers":[],"refs":[]}
    with ep.open("a") as f: f.write(json.dumps(e,ensure_ascii=False)+"\n")
def state(t):
    try: s=json.loads(sp.read_text())
    except Exception: s={}
    s["project"]=Path.cwd().name; s["updated_at"]=now()
    if t: s["current_focus"]=t["title"]; s["next_action"]=f"task {t['id']} is {t['status']}"
    sp.write_text(json.dumps(s,indent=2,ensure_ascii=False)+"\n")
d=load()
if cmd=="add":
    title=" ".join(args).strip()
    if not title: raise SystemExit('Usage: ./3some add "task"')
    tid=str(int(time.time()*1000)); ts=now()
    t={"id":tid,"title":title,"status":"pending","created_at":ts,"updated_at":ts,"started_at":"","done_at":"","notes":[],"evidence":{"commands":[],"files":[],"tests":[],"result":""}}
    d["tasks"].append(t); save(d); ev(f"added task: {title}",tid); state(t); print(tid)
elif cmd=="list":
    for t in d["tasks"]: print(f"{t['id']} [{t['status']}] {t['title']}")
elif cmd=="run":
    t=next((x for x in d["tasks"] if x.get("status")=="pending"),None)
    if not t: print("no pending task"); raise SystemExit(0)
    t["status"]="in_progress"; t["started_at"]=t.get("started_at") or now(); t["updated_at"]=now(); save(d); ev(f"started task: {t['title']}",t["id"]); state(t); print(json.dumps(t,indent=2,ensure_ascii=False))
elif cmd=="update":
    if len(args)<2: raise SystemExit("Usage: ./3some update <id> <status>")
    tid,status=args[0],args[1]
    if status not in {"pending","in_progress","blocked","done","cancelled"}: raise SystemExit("bad status")
    for t in d["tasks"]:
        if t["id"]==tid:
            t["status"]=status; t["updated_at"]=now()
            if status=="done": t["done_at"]=now()
            save(d); ev(f"updated task {tid} to {status}",tid); state(t); print(json.dumps(t,indent=2,ensure_ascii=False)); break
    else: raise SystemExit(f"task not found: {tid}")
elif cmd=="show":
    tid=args[0] if args else ""
    for t in d["tasks"]:
        if t["id"]==tid: print(json.dumps(t,indent=2,ensure_ascii=False)); break
    else: raise SystemExit(f"task not found: {tid}")
else: raise SystemExit("Usage: ./3some add|run|update|list|show")
PY
SH
chmod +x ./3some

cat > ./0ero <<'SH'
#!/usr/bin/env bash
set -euo pipefail
ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$ROOT"
CMD="${1:-check}"
case "$CMD" in
  check|"") pwd; echo "== git =="; git status --short || true; echo "== branch =="; git branch --show-current || true; echo "== docs =="; ls -la README* docs 2>/dev/null || true; ./1brain remember "0ero check completed" >/dev/null || true ;;
  docs) mkdir -p docs; ls -la docs; ./1brain remember "0ero docs check completed" >/dev/null || true ;;
  readme) [[ -f README.md ]] || printf '# %s\n\nProject README initialized by 0ero.\n' "$(basename "$ROOT")" > README.md; sed -n '1,160p' README.md ;;
  *) echo "Usage: ./0ero [check|docs|readme]" >&2; exit 2 ;;
esac
SH
chmod +x ./0ero

cat > ./2hit <<'SH'
#!/usr/bin/env bash
set -euo pipefail
ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$ROOT"
CMD="${1:-status}"; shift || true
case "$CMD" in
  status|"") git status --short; git branch --show-current; git diff --stat || true ;;
  down) [[ -z "$(git status --short)" ]] || { echo "local changes present; refusing blind pull" >&2; git status --short; exit 1; }; git pull --ff-only; ./1brain remember "2hit down completed" >/dev/null || true ;;
  up) git status --short; git branch --show-current; git log -1 --oneline || true; git push; ./1brain remember "2hit up completed" >/dev/null || true ;;
  commit) MSG="$*"; [[ -n "$MSG" ]] || { echo 'Usage: ./2hit commit "message"' >&2; exit 2; }; git status --short; git diff --stat || true; ./1brain remember "2hit commit requested: $MSG" >/dev/null || true; git add -A; git commit -m "$MSG" ;;
  *) echo "Usage: ./2hit status|down|up|commit ..." >&2; exit 2 ;;
esac
SH
chmod +x ./2hit

cat > ./4ever <<'SH'
#!/usr/bin/env bash
set -euo pipefail
cat <<'TEXT'
4ever rules:
1. Use only: 0ero, 1brain, 2hit, 3some, 4ever, 4ucker.
2. Add task before concrete work.
3. Update task status.
4. Write memory.
5. Use real visible agents for team/rat.
6. Use vote skills and vote agents for approval.
7. No vote record, no approval.
8. No fake done.
9. Save reports under docs/debat, docs/rat, docs/vote.
TEXT
./1brain remember "4ever check completed" >/dev/null 2>&1 || true
SH
chmod +x ./4ever

cat > ./4ucker <<'SH'
#!/usr/bin/env bash
set -euo pipefail
ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$ROOT"
ACTION="${1:-team}"; shift || true
mkdir -p docs/debat docs/rat docs/vote .brain/snapshots
slugify(){ python3 - "$1" <<'PY'
import re,sys
s=sys.argv[1].strip().lower()
s=re.sub(r"[^a-z0-9äöüß]+","-",s).strip("-") or "thema"
print(s[:80])
PY
}
remember(){ [[ -x ./1brain ]] && ./1brain remember "$1" >/dev/null || true; }
make_vote(){
  TYPE="$1"; shift || true; DECISION="$*"; [[ -n "$DECISION" ]] || DECISION="No vote decision provided"
  SLUG="$(slugify "$DECISION")"; STAMP="$(date +%Y%m%d-%H%M%S)"; REPORT="docs/vote/${SLUG}.${STAMP}.md"; NOW="$(date -Iseconds)"
  cat > "$REPORT" <<EOFV
# Vote: $DECISION

## Datum/Uhrzeit

$NOW

## Vote Type

$TYPE

## Vote Record

| Voter | Role | Vote | Confidence | Reason | Condition / Blocker |
|---|---|---|---|---|---|

## Vote Chair

## Vote Recorder

## Vote Auditor

## Result

## Begründung

## Bedingungen / Blocker

## Nächste Schritte
EOFV
  cat <<EOFV
Vote protocol started.

Type: $TYPE
Decision: $DECISION
Vote report: $REPORT

Required visible vote agents:
@bkg-vote-chair Determine quorum, threshold, blockers and result for: $DECISION
@bkg-vote-recorder Record visible votes for: $DECISION
@bkg-vote-auditor Audit vote validity and unresolved blockers for: $DECISION

No vote record, no approval.

Then:
  ./1brain remember "vote saved: $REPORT"
EOFV
  remember "vote started: $REPORT"
}
if [[ "$ACTION" == "vote" ]]; then TYPE="${1:-team}"; shift || true; make_vote "$TYPE" "$@"; exit 0; fi
if [[ "$ACTION" == "rat" ]]; then
  TYPE="${1:-problem}"; shift || true; TOPIC="$*"; [[ -n "$TOPIC" ]] || TOPIC="No council topic provided"
  SLUG="$(slugify "$TOPIC")"; STAMP="$(date +%Y%m%d-%H%M%S)"; RAT="docs/rat/${SLUG}.${STAMP}.md"; VOTE="docs/vote/${SLUG}.${STAMP}.md"; NOW="$(date -Iseconds)"
  cat > "$RAT" <<EOFR
# Agent Rat: $TOPIC

## Datum/Uhrzeit

$NOW

## Typ

$TYPE

## Ausgangslage

## Quellen / Recherche

## Optionen im Raum

## Agentenantworten

### @bkg-rat-architect
### @bkg-rat-builder
### @bkg-rat-reviewer
### @bkg-rat-product
### @bkg-rat-growth
### @bkg-rat-contrarian

## Konflikte

## Entscheidung

## Begründung

## Nicht gewählt, weil

## Offene Punkte

## Nächste Schritte

## Vote Report

$VOTE
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

Type: $TYPE
Topic: $TOPIC
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

Then:
  ./1brain remember "agent rat saved: $RAT"
  ./1brain remember "vote saved: $VOTE"
EOFR
  remember "agent rat started: $RAT"; remember "vote started: $VOTE"; exit 0
fi
TEXT="$*"; [[ -n "$TEXT" ]] || TEXT="No problem text provided"
case "$ACTION" in team|think|research|approve|ui) ;; *) echo "Usage: ./4ucker team|think|research|approve|ui \"problem\" | rat <type> \"topic\" | vote <type> \"decision\"" >&2; exit 2 ;; esac
SLUG="$(slugify "$TEXT")"; STAMP="$(date +%Y%m%d-%H%M%S)"; DEBAT="docs/debat/${SLUG}.${STAMP}.md"; VOTE="docs/vote/${SLUG}.${STAMP}.md"; NOW="$(date -Iseconds)"
cat > "$DEBAT" <<EOFD
# 4ucker Team Debate: $TEXT

## Datum/Uhrzeit

$NOW

## Subcommand

4ucker $ACTION

## Ausgangsproblem

## Quellen / Recherche

## Was als Lösung im Raum stand

## Real Team Calls

### @bkg-4ucker-builder
### @bkg-4ucker-reviewer
### @bkg-4ucker-product

## Approval Ergebnis

See vote report: $VOTE

## Finale Lösung

## Begründung

## Offene Punkte

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
cat <<EOFD
4ucker team debate started.

Action: $ACTION
Problem: $TEXT
Debate report: $DEBAT
Vote report: $VOTE

Required visible team agents:
@bkg-4ucker-builder
@bkg-4ucker-reviewer
@bkg-4ucker-product

Required visible vote agents:
@bkg-vote-chair
@bkg-vote-recorder
@bkg-vote-auditor

No vote record, no approval.

Then:
  ./1brain remember "4ucker team debate saved: $DEBAT"
  ./1brain remember "vote saved: $VOTE"
EOFD
remember "4ucker team debate started: $DEBAT"; remember "vote started: $VOTE"
SH
chmod +x ./4ucker

echo "Installed complete BKG project helpers:"
echo "  ./0ero ./1brain ./2hit ./3some ./4ever ./4ucker"
