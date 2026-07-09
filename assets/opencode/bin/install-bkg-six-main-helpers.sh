#!/usr/bin/env bash
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$ROOT"

mkdir -p .brain/snapshots docs
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

cat > ./1brain <<'SH'
#!/usr/bin/env bash
set -euo pipefail
ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$ROOT"
mkdir -p .brain/snapshots
touch .brain/events.jsonl .brain/decisions.jsonl .brain/handoffs.jsonl
[[ -f .brain/tasks.json ]] || echo '{"tasks":[]}' > .brain/tasks.json
[[ -f .brain/state.json ]] || echo '{"project":"","current_blocker":"","current_focus":"","last_verified":"","active_files":[],"known_gates":[],"next_action":"","updated_at":""}' > .brain/state.json

CMD="${1:-look}"
shift || true

remember() {
  KIND="${1:-note}"
  shift || true
  TEXT="$*"
  [[ -n "$TEXT" ]] || { echo 'Usage: ./1brain remember "text"' >&2; exit 2; }
  python3 - ".brain/events.jsonl" ".brain/state.json" "$KIND" "$TEXT" <<'PY'
import json, sys
from pathlib import Path
from datetime import datetime, timezone
events=Path(sys.argv[1]); statep=Path(sys.argv[2]); kind=sys.argv[3]; text=sys.argv[4]
low=text.lower()
blocked=["sk-","password=","passwd=","cookie:","authorization:","bearer ","private key","begin openssh private key","begin rsa private key"]
if any(x in low for x in blocked):
    raise SystemExit("Refusing likely secret. Redact first.")
ts=datetime.now(timezone.utc).isoformat(); project=Path.cwd().name
entry={"ts":ts,"actor":"1brain","project":project,"kind":kind,"summary":text,"files":[],"commands":["./1brain remember"],"tests":[],"result":"","next":"","blockers":[],"refs":[]}
with events.open("a", encoding="utf-8") as f:
    f.write(json.dumps(entry,ensure_ascii=False)+"\n")
try:
    state=json.loads(statep.read_text(encoding="utf-8"))
except Exception:
    state={}
state["project"]=project
state["current_focus"]=text
state["updated_at"]=ts
if kind in {"blocker","bug","issue"}:
    state["current_blocker"]=text
if kind in {"verify","test"}:
    state["last_verified"]=text
statep.write_text(json.dumps(state,indent=2,ensure_ascii=False)+"\n", encoding="utf-8")
PY
  echo "remembered: $TEXT"
}

case "$CMD" in
  remember) remember note "$@" ;;
  blocker) remember blocker "$@" ;;
  fix) remember fix "$@" ;;
  verify) remember verify "$@" ;;
  decision)
    TEXT="$*"
    [[ -n "$TEXT" ]] || { echo 'Usage: ./1brain decision "text"' >&2; exit 2; }
    TS="$(date -Iseconds)"
    python3 - ".brain/decisions.jsonl" ".brain/events.jsonl" "$TS" "$TEXT" <<'PY'
import json, sys
from pathlib import Path
dec=Path(sys.argv[1]); ev=Path(sys.argv[2]); ts=sys.argv[3]; text=sys.argv[4]
entry={"ts":ts,"actor":"1brain","project":Path.cwd().name,"kind":"decision","summary":text,"files":[],"commands":["./1brain decision"],"tests":[],"result":"recorded","next":"","blockers":[],"refs":[]}
for p in (dec, ev):
    with p.open("a", encoding="utf-8") as f:
        f.write(json.dumps(entry,ensure_ascii=False)+"\n")
PY
    echo "decision recorded"
    ;;
  look|"")
    echo "== state =="
    cat .brain/state.json
    echo
    echo "== tasks =="
    cat .brain/tasks.json
    echo
    echo "== recent events =="
    tail -n 20 .brain/events.jsonl || true
    ;;
  show) cat .brain/state.json ;;
  events) tail -n "${1:-50}" .brain/events.jsonl || true ;;
  dump)
    SNAP=".brain/snapshots/handoff-$(date +%Y%m%d-%H%M%S).json"
    python3 - "$SNAP" <<'PY'
import json, subprocess, sys
from pathlib import Path
from datetime import datetime, timezone
snap=Path(sys.argv[1])
def sh(cmd):
    try:
        return subprocess.check_output(cmd, shell=True, text=True, stderr=subprocess.STDOUT).splitlines()
    except Exception as e:
        return [str(e)]
state=json.loads(Path(".brain/state.json").read_text(encoding="utf-8"))
tasks=json.loads(Path(".brain/tasks.json").read_text(encoding="utf-8"))
entry={"ts":datetime.now(timezone.utc).isoformat(),"actor":"1brain","project":Path.cwd().name,"kind":"handoff","summary":"handoff snapshot","state":state,"tasks":tasks,"git":{"branch":sh("git branch --show-current"),"head":sh("git rev-parse HEAD"),"status":sh("git status --short")}}
snap.write_text(json.dumps(entry,indent=2,ensure_ascii=False)+"\n", encoding="utf-8")
for p in [Path(".brain/handoffs.jsonl"),Path(".brain/events.jsonl")]:
    with p.open("a", encoding="utf-8") as f:
        f.write(json.dumps(entry,ensure_ascii=False)+"\n")
PY
    echo "wrote $SNAP"
    ;;
  validate)
    python3 - <<'PY'
import json
from pathlib import Path
ok=True
for p in [Path(".brain/state.json"),Path(".brain/tasks.json"),Path(".brain/index.json")]:
    try:
        json.loads(p.read_text(encoding="utf-8"))
    except Exception as e:
        ok=False
        print("bad json", p, e)
for p in [Path(".brain/events.jsonl"),Path(".brain/decisions.jsonl"),Path(".brain/handoffs.jsonl")]:
    for i,l in enumerate(p.read_text(encoding="utf-8").splitlines(),1):
        if l.strip():
            try:
                json.loads(l)
            except Exception as e:
                ok=False
                print("bad jsonl", p, i, e)
print("ok" if ok else "bad")
raise SystemExit(0 if ok else 1)
PY
    ;;
  *)
    echo "Usage: ./1brain remember|look|show|events|dump|decision|blocker|fix|verify|validate ..." >&2
    exit 2
    ;;
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

CMD="${1:-list}"
shift || true

python3 - ".brain/tasks.json" ".brain/events.jsonl" ".brain/state.json" "$CMD" "$@" <<'PY'
import json, sys, time
from pathlib import Path
from datetime import datetime, timezone
tp=Path(sys.argv[1]); ep=Path(sys.argv[2]); sp=Path(sys.argv[3]); cmd=sys.argv[4]; args=sys.argv[5:]
def now(): return datetime.now(timezone.utc).isoformat()
def load():
    try:
        d=json.loads(tp.read_text(encoding="utf-8"))
    except Exception:
        d={"tasks":[]}
    if not isinstance(d,dict) or not isinstance(d.get("tasks"),list):
        d={"tasks":[]}
    return d
def save(d): tp.write_text(json.dumps(d,indent=2,ensure_ascii=False)+"\n", encoding="utf-8")
def ev(summary, tid=""):
    e={"ts":now(),"actor":"3some","project":Path.cwd().name,"kind":"task","summary":summary,"task_id":tid,"files":[".brain/tasks.json"],"commands":["./3some "+cmd],"tests":[],"result":"","next":"","blockers":[],"refs":[]}
    with ep.open("a", encoding="utf-8") as f:
        f.write(json.dumps(e,ensure_ascii=False)+"\n")
def state(task):
    try:
        s=json.loads(sp.read_text(encoding="utf-8"))
    except Exception:
        s={}
    s["project"]=Path.cwd().name
    s["updated_at"]=now()
    if task:
        s["current_focus"]=task["title"]
        s["next_action"]=f"task {task['id']} is {task['status']}"
        if task["status"]=="blocked":
            s["current_blocker"]=task["title"]
    sp.write_text(json.dumps(s,indent=2,ensure_ascii=False)+"\n", encoding="utf-8")
d=load()
if cmd=="add":
    title=" ".join(args).strip()
    if not title:
        raise SystemExit('Usage: ./3some add "task title"')
    tid=str(int(time.time()*1000)); ts=now()
    t={"id":tid,"title":title,"status":"pending","created_at":ts,"updated_at":ts,"started_at":"","done_at":"","notes":[],"evidence":{"commands":[],"files":[],"tests":[],"result":""}}
    d["tasks"].append(t); save(d); ev(f"added task: {title}",tid); state(t); print(tid)
elif cmd=="list":
    for t in d["tasks"]:
        print(f"{t['id']} [{t['status']}] {t['title']}")
elif cmd=="run":
    t=next((x for x in d["tasks"] if x.get("status")=="pending"), None)
    if not t:
        print("no pending task")
        raise SystemExit(0)
    t["status"]="in_progress"; t["started_at"]=t.get("started_at") or now(); t["updated_at"]=now()
    save(d); ev(f"started task: {t['title']}",t["id"]); state(t)
    print(json.dumps(t,indent=2,ensure_ascii=False))
elif cmd=="update":
    if len(args)<2:
        raise SystemExit("Usage: ./3some update <id> <status>")
    tid,status=args[0],args[1]
    if status not in {"pending","in_progress","blocked","done","cancelled"}:
        raise SystemExit("bad status")
    for t in d["tasks"]:
        if t["id"]==tid:
            t["status"]=status; t["updated_at"]=now()
            if status=="done":
                t["done_at"]=now()
            save(d); ev(f"updated task {tid} to {status}",tid); state(t)
            print(json.dumps(t,indent=2,ensure_ascii=False))
            break
    else:
        raise SystemExit(f"task not found: {tid}")
elif cmd=="show":
    tid=args[0] if args else ""
    for t in d["tasks"]:
        if t["id"]==tid:
            print(json.dumps(t,indent=2,ensure_ascii=False))
            break
    else:
        raise SystemExit(f"task not found: {tid}")
else:
    raise SystemExit("Usage: ./3some add|run|update|list|show")
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
  check|"")
    echo "== project =="
    pwd
    echo
    echo "== git =="
    git status --short || true
    echo
    echo "== branch =="
    git branch --show-current || true
    echo
    echo "== docs =="
    ls -la README* docs 2>/dev/null || true
    ./1brain remember "0ero project check completed" >/dev/null || true
    ;;
  docs)
    mkdir -p docs
    ls -la docs || true
    ./1brain remember "0ero docs check completed" >/dev/null || true
    ;;
  readme)
    if [[ ! -f README.md ]]; then
      cat > README.md <<MD
# $(basename "$ROOT")

Project README initialized by 0ero.

## Status

Describe current blocker, setup, commands and gates here.
MD
      echo "created README.md"
      ./1brain remember "0ero created README.md" >/dev/null || true
    else
      sed -n '1,160p' README.md
    fi
    ;;
  *)
    echo "Usage: ./0ero [check|docs|readme]" >&2
    exit 2
    ;;
esac
SH
chmod +x ./0ero

cat > ./2hit <<'SH'
#!/usr/bin/env bash
set -euo pipefail
ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$ROOT"
CMD="${1:-status}"
shift || true
case "$CMD" in
  status|"")
    git status --short
    git branch --show-current
    git diff --stat || true
    ;;
  down)
    if [[ -n "$(git status --short)" ]]; then
      echo "local changes present; refusing blind pull" >&2
      git status --short
      exit 1
    fi
    git pull --ff-only
    ./1brain remember "2hit down completed git pull --ff-only" >/dev/null || true
    ;;
  up)
    git status --short
    git branch --show-current
    git log -1 --oneline || true
    git push
    ./1brain remember "2hit up completed git push" >/dev/null || true
    ;;
  commit)
    MSG="$*"
    [[ -n "$MSG" ]] || { echo 'Usage: ./2hit commit "message"' >&2; exit 2; }
    git status --short
    git diff --stat || true
    ./1brain remember "2hit commit requested: $MSG" >/dev/null || true
    git add -A
    git commit -m "$MSG"
    ;;
  *)
    echo "Usage: ./2hit status|down|up|commit ..." >&2
    exit 2
    ;;
esac
SH
chmod +x ./2hit

cat > ./4ever <<'SH'
#!/usr/bin/env bash
set -euo pipefail
cat <<'TEXT'
4ever rules:

1. Read project state first.
2. Use only: 0ero, 1brain, 2hit, 3some, 4ever, 4ucker.
3. Add task before concrete work.
4. Update task status.
5. Write memory.
6. Run gates or say exactly why not.
7. No fake done.
8. No alias commands.
9. No drifting into architecture while P0 blocker exists.
TEXT
./1brain remember "4ever rules reminder checked" >/dev/null 2>&1 || true
SH
chmod +x ./4ever

cat > ./4ucker <<'SH'
#!/usr/bin/env bash
set -euo pipefail
ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$ROOT"
ACTION="${1:-think}"
shift || true
TEXT="$*"
[[ -n "$TEXT" ]] || TEXT="No problem text provided"

case "$ACTION" in
  think|research|approve|ui)
    cat <<EOF2
4ucker $ACTION

Problem:
$TEXT

Required process for OpenCode agent:

1. Use web research if current docs/facts matter.
2. Run three viewpoints:
   - Builder / implementation
   - Reviewer / tests / risk
   - Product / architecture
3. At least 2 of 3 must approve.
4. If not approved, update task to blocked.
5. Write result with:
   ./1brain remember "4ucker $ACTION result: ..."
EOF2
    ./1brain remember "4ucker $ACTION requested: $TEXT" >/dev/null || true
    ;;
  *)
    echo "Usage: ./4ucker think|research|approve|ui ..." >&2
    exit 2
    ;;
esac
SH
chmod +x ./4ucker

echo "Installed six main shell commands:"
echo "  ./0ero ./1brain ./2hit ./3some ./4ever ./4ucker"
