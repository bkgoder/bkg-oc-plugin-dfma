#!/usr/bin/env bash
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$ROOT"

mkdir -p docs/debat .brain/snapshots
touch .brain/events.jsonl .brain/decisions.jsonl .brain/handoffs.jsonl

if [[ ! -f .brain/tasks.json ]]; then
  printf '%s\n' '{"tasks":[]}' > .brain/tasks.json
fi

if [[ ! -f .brain/state.json ]]; then
  cat > .brain/state.json <<'STATE_JSON'
{
  "project": "",
  "current_blocker": "",
  "current_focus": "",
  "last_verified": "",
  "active_files": [],
  "known_gates": [],
  "next_action": "",
  "updated_at": ""
}
STATE_JSON
fi

cat > ./4ucker <<'FOURUCKER_RUNTIME'
#!/usr/bin/env bash
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$ROOT"

ACTION="${1:-team}"
shift || true
TEXT="$*"
[[ -n "$TEXT" ]] || TEXT="No problem text provided"

case "$ACTION" in
  team|think|research|approve|ui) ;;
  *)
    echo "Usage: ./4ucker team|think|research|approve|ui \"problem\"" >&2
    exit 2
    ;;
esac

mkdir -p docs/debat .brain/snapshots

slugify() {
  python3 - "$1" <<'PY'
import re
import sys

s = sys.argv[1].strip().lower()
s = re.sub(r"[^a-z0-9äöüß]+", "-", s)
s = s.strip("-") or "thema"
print(s[:80])
PY
}

SLUG="$(slugify "$TEXT")"
STAMP="$(date +%Y%m%d-%H%M%S)"
REPORT="docs/debat/${SLUG}.${STAMP}.md"
NOW="$(date -Iseconds)"

cat > "$REPORT" <<REPORT_TEMPLATE
# 4ucker Team Debate: $TEXT

## Thema

$TEXT

## Datum/Uhrzeit

$NOW

## Subcommand

\`4ucker $ACTION\`

## Ausgangsproblem

Noch im sichtbaren Chat ausfüllen.

## Quellen / Recherche

Noch im sichtbaren Chat ausfüllen.

## Was als Lösung im Raum stand

Noch im sichtbaren Chat ausfüllen.

## Team-Debatte

### Agent A — Builder / Umsetzung

- Einschätzung:
- Risiko:
- Vote:

### Agent B — Reviewer / Tests / Risiko

- Einschätzung:
- Risiko:
- Vote:

### Agent C — Product / Architektur

- Einschätzung:
- Risiko:
- Vote:

## Approval Ergebnis

- Builder:
- Reviewer:
- Product:
- Result:
- Rule: 2 of 3 required.

## Finale Lösung

Noch im sichtbaren Chat ausfüllen.

## Begründung

Noch im sichtbaren Chat ausfüllen.

## Offene Punkte

Noch im sichtbaren Chat ausfüllen.

## Nächste Schritte

Noch im sichtbaren Chat ausfüllen.
REPORT_TEMPLATE

cat <<EOF_RUNTIME
4ucker team debate started.

Action:
  $ACTION

Problem:
  $TEXT

Report file:
  $REPORT

IMPORTANT:
  Skill invocation alone is not enough.
  The team debate must be visible in chat.

Required visible chat structure:

## 4ucker Team Debate

### Thema
$TEXT

### Ausgangsproblem
Explain the real problem.

### Recherchestand
Use web/docs research if current facts matter.

### Was als Lösung im Raum stand
List options.

### Team-Debatte

#### Agent A — Builder / Umsetzung
- Einschätzung:
- Risiko:
- Vote: approve/reject

#### Agent B — Reviewer / Tests / Risiko
- Einschätzung:
- Risiko:
- Vote: approve/reject

#### Agent C — Product / Architektur
- Einschätzung:
- Risiko:
- Vote: approve/reject

### Approval Ergebnis
2 of 3 required.

### Finale Lösung
State selected solution.

### Begründung
Explain why.

### Nächste Schritte
List concrete next steps.

Then save final report to:
  $REPORT

Then:
  ./1brain remember "4ucker team debate saved: $REPORT"
EOF_RUNTIME

if [[ -x ./1brain ]]; then
  ./1brain remember "4ucker team debate started: $REPORT" >/dev/null || true
fi
FOURUCKER_RUNTIME

chmod +x ./4ucker
echo "patched ./4ucker with visible team debate protocol"
