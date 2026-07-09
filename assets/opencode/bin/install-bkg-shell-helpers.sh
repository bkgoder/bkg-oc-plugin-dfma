#!/usr/bin/env bash
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$ROOT"

mkdir -p .brain/snapshots
touch .brain/events.jsonl .brain/decisions.jsonl .brain/handoffs.jsonl
[[ -f .brain/tasks.json ]] || echo '{"tasks":[]}' > .brain/tasks.json
[[ -f .brain/state.json ]] || cat > .brain/state.json <<JSON
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
JSON
[[ -f .brain/index.json ]] || echo '{"version":1,"files":["state.json","events.jsonl","decisions.jsonl","handoffs.jsonl","tasks.json"]}' > .brain/index.json

cat > ./brain-init <<'SH'
#!/usr/bin/env bash
set -euo pipefail
ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$ROOT"
mkdir -p .brain/snapshots
touch .brain/events.jsonl .brain/decisions.jsonl .brain/handoffs.jsonl
[[ -f .brain/tasks.json ]] || echo '{"tasks":[]}' > .brain/tasks.json
[[ -f .brain/state.json ]] || echo '{"project":"","current_blocker":"","current_focus":"","last_verified":"","active_files":[],"known_gates":[],"next_action":"","updated_at":""}' > .brain/state.json
echo "brain initialized"
SH
chmod +x ./brain-init

cat > ./remember <<'SH'
#!/usr/bin/env bash
set -euo pipefail
ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$ROOT"
KIND="note"
if [[ "${1:-}" == "--kind" ]]; then KIND="${2:-note}"; shift 2 || true; fi
SUMMARY="$*"
[[ -n "$SUMMARY" ]] || { echo 'Usage: ./remember [--kind kind] "text"' >&2; exit 2; }
./brain-init >/dev/null
python3 - ".brain/events.jsonl" ".brain/state.json" "$KIND" "$SUMMARY" <<'PY'
import json, sys
from pathlib import Path
from datetime import datetime, timezone
events=Path(sys.argv[1]); statep=Path(sys.argv[2]); kind=sys.argv[3]; summary=sys.argv[4]
low=summary.lower()
blocked=["sk-","password=","passwd=","cookie:","authorization:","bearer ","private key","begin openssh private key","begin rsa private key"]
if any(x in low for x in blocked):
    raise SystemExit("Refusing to store likely secret. Redact it first.")
ts=datetime.now(timezone.utc).isoformat(); project=Path.cwd().name
entry={"ts":ts,"actor":"manual","project":project,"kind":kind,"summary":summary,"files":[],"commands":["./remember"],"tests":[],"result":"","next":"","blockers":[],"refs":[]}
with events.open("a",encoding="utf-8") as f: f.write(json.dumps(entry,ensure_ascii=False)+"\n")
try: state=json.loads(statep.read_text(encoding="utf-8"))
except Exception: state={}
state["project"]=project; state["current_focus"]=summary; state["updated_at"]=ts
if kind in {"blocker","bug","issue"}: state["current_blocker"]=summary
if kind in {"verify","test"}: state["last_verified"]=summary
statep.write_text(json.dumps(state,indent=2,ensure_ascii=False)+"\n",encoding="utf-8")
PY
echo "remembered: $SUMMARY"
SH
chmod +x ./remember

cat > ./brain <<'SH'
#!/usr/bin/env bash
set -euo pipefail
ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$ROOT"
CMD="${1:-show}"; shift || true
./brain-init >/dev/null
case "$CMD" in
  show|"") echo "== state =="; cat .brain/state.json; echo; echo "== tasks =="; cat .brain/tasks.json; echo; echo "== recent events =="; tail -n 25 .brain/events.jsonl ;;
  state) cat .brain/state.json ;;
  tasks) cat .brain/tasks.json ;;
  events) tail -n "${1:-50}" .brain/events.jsonl ;;
  decisions) tail -n "${1:-50}" .brain/decisions.jsonl ;;
  handoffs) tail -n "${1:-50}" .brain/handoffs.jsonl ;;
  event) KIND="${1:-note}"; shift || true; ./remember --kind "$KIND" "$*" ;;
  search) grep -Rin -- "$*" .brain || true ;;
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
  dump) ./brain-dump ;;
  *) echo "unknown brain command: $CMD" >&2; exit 2 ;;
esac
SH
chmod +x ./brain

cat > ./brain-dump <<'SH'
#!/usr/bin/env bash
set -euo pipefail
ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$ROOT"
./brain-init >/dev/null
SNAP=".brain/snapshots/handoff-$(date +%Y%m%d-%H%M%S).json"
python3 - "$SNAP" <<'PY'
import json, subprocess, sys
from pathlib import Path
from datetime import datetime, timezone
snap=Path(sys.argv[1]); ts=datetime.now(timezone.utc).isoformat()
def sh(cmd):
    try: return subprocess.check_output(cmd, shell=True, text=True, stderr=subprocess.STDOUT).splitlines()
    except Exception as e: return [str(e)]
state=json.loads(Path(".brain/state.json").read_text())
tasks=json.loads(Path(".brain/tasks.json").read_text())
entry={"ts":ts,"actor":"brain-dump","project":Path.cwd().name,"kind":"handoff","summary":"Project handoff snapshot","state":state,"tasks":tasks,"git":{"branch":sh("git branch --show-current"),"head":sh("git rev-parse HEAD"),"status":sh("git status --short")},"result":"snapshot_written"}
snap.write_text(json.dumps(entry,indent=2,ensure_ascii=False)+"\n")
for p in [Path(".brain/handoffs.jsonl"),Path(".brain/events.jsonl")]:
    with p.open("a") as f: f.write(json.dumps(entry,ensure_ascii=False)+"\n")
PY
echo "wrote $SNAP"
SH
chmod +x ./brain-dump

cat > ./slave4ever <<'SH'
#!/usr/bin/env bash
set -euo pipefail
ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$ROOT"
./brain-init >/dev/null
CMD="${1:-list}"; shift || true
python3 - ".brain/tasks.json" ".brain/events.jsonl" ".brain/state.json" "$CMD" "$@" <<'PY'
import json, sys, time
from pathlib import Path
from datetime import datetime, timezone
tasks_p=Path(sys.argv[1]); events_p=Path(sys.argv[2]); state_p=Path(sys.argv[3]); cmd=sys.argv[4]; args=sys.argv[5:]
def now(): return datetime.now(timezone.utc).isoformat()
def load():
    try: d=json.loads(tasks_p.read_text())
    except Exception: d={"tasks":[]}
    if not isinstance(d,dict) or not isinstance(d.get("tasks"),list): d={"tasks":[]}
    return d
def save(d): tasks_p.write_text(json.dumps(d,indent=2,ensure_ascii=False)+"\n")
def ev(kind, summary, tid=""):
    e={"ts":now(),"actor":"slave4ever","project":Path.cwd().name,"kind":kind,"summary":summary,"task_id":tid,"files":[".brain/tasks.json"],"commands":["./slave4ever "+cmd],"tests":[],"result":"","next":"","blockers":[],"refs":[]}
    with events_p.open("a") as f: f.write(json.dumps(e,ensure_ascii=False)+"\n")
def state(task):
    try: s=json.loads(state_p.read_text())
    except Exception: s={}
    s["project"]=Path.cwd().name; s["updated_at"]=now()
    if task: s["current_focus"]=task["title"]; s["next_action"]=f"task {task['id']} is {task['status']}"
    state_p.write_text(json.dumps(s,indent=2,ensure_ascii=False)+"\n")
d=load()
if cmd=="add":
    title=" ".join(args).strip()
    if not title: raise SystemExit('Usage: ./slave4ever add "task"')
    tid=str(int(time.time()*1000)); ts=now()
    t={"id":tid,"title":title,"status":"pending","created_at":ts,"updated_at":ts,"started_at":"","done_at":"","notes":[],"evidence":{"commands":[],"files":[],"tests":[],"result":""}}
    d["tasks"].append(t); save(d); ev("task",f"added task: {title}",tid); state(t); print(tid)
elif cmd=="list":
    for t in d["tasks"]: print(f"{t['id']} [{t['status']}] {t['title']}")
elif cmd=="run":
    t=next((x for x in d["tasks"] if x.get("status")=="pending"), None)
    if not t: print("no pending task"); raise SystemExit(0)
    t["status"]="in_progress"; t["started_at"]=t.get("started_at") or now(); t["updated_at"]=now(); save(d); ev("task",f"started task: {t['title']}",t["id"]); state(t); print(json.dumps(t,indent=2,ensure_ascii=False))
elif cmd=="update":
    if len(args)<2: raise SystemExit("Usage: ./slave4ever update <id> <status>")
    tid,status=args[0],args[1]
    if status not in {"pending","in_progress","blocked","done","cancelled"}: raise SystemExit("bad status")
    for t in d["tasks"]:
        if t["id"]==tid:
            t["status"]=status; t["updated_at"]=now()
            if status=="done": t["done_at"]=now()
            save(d); ev("task",f"updated task {tid} to {status}",tid); state(t); print(json.dumps(t,indent=2,ensure_ascii=False)); break
    else: raise SystemExit(f"task not found: {tid}")
elif cmd=="show":
    tid=args[0] if args else ""
    for t in d["tasks"]:
        if t["id"]==tid: print(json.dumps(t,indent=2,ensure_ascii=False)); break
    else: raise SystemExit(f"task not found: {tid}")
else:
    raise SystemExit("Usage: ./slave4ever add|run|update|list|show")
PY
SH
chmod +x ./slave4ever

for alias in 4everslave slave2hit hit2slave; do
  cat > "./$alias" <<'SH'
#!/usr/bin/env bash
exec ./slave4ever "$@"
SH
  chmod +x "./$alias"
done

cat > ./4uckerthink <<'SH'
#!/usr/bin/env bash
set -euo pipefail
ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$ROOT"
PROMPT="$*"
[[ -n "$PROMPT" ]] || { echo 'Usage: ./4uckerthink "prompt"' >&2; exit 2; }
./brain-init >/dev/null
./remember --kind discussion_gate "$PROMPT" >/dev/null
cat <<EOF2
4uckerthink gate started:
$PROMPT

Required by OpenCode agent:
- deep research if current docs/facts matter
- Agent A builder approval/reject
- Agent B reviewer approval/reject
- Agent C product/architecture approval/reject
- at least 2 of 3 approve
- write result to .brain/events.jsonl
EOF2
SH
chmod +x ./4uckerthink

cat > ./think4ucker <<'SH'
#!/usr/bin/env bash
exec ./4uckerthink "$@"
SH
chmod +x ./think4ucker

echo "Installed BKG shell helpers in $ROOT"
