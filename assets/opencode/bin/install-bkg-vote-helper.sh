#!/usr/bin/env bash
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$ROOT"

mkdir -p docs/debat docs/rat docs/vote .brain/snapshots
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

# Patch only if ./4ucker exists; otherwise leave creation to previous installers.
if [[ -f ./4ucker ]]; then
  cp ./4ucker ".brain/snapshots/4ucker-before-vote-$(date +%Y%m%d-%H%M%S).sh" 2>/dev/null || true
fi

cat > ./4ucker <<'FOURUCKER_RUNTIME'
#!/usr/bin/env bash
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$ROOT"

ACTION="${1:-team}"
shift || true

mkdir -p docs/debat docs/rat docs/vote .brain/snapshots

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

remember() {
  if [[ -x ./1brain ]]; then
    ./1brain remember "$1" >/dev/null || true
  fi
}

make_vote() {
  TYPE="$1"
  shift || true
  DECISION="$*"
  [[ -n "$DECISION" ]] || DECISION="No vote decision provided"

  SLUG="$(slugify "$DECISION")"
  STAMP="$(date +%Y%m%d-%H%M%S)"
  REPORT="docs/vote/${SLUG}.${STAMP}.md"
  NOW="$(date -Iseconds)"

  cat > "$REPORT" <<REPORT_TEMPLATE
# Vote: $DECISION

## Thema / Entscheidung

$DECISION

## Datum/Uhrzeit

$NOW

## Vote Type

$TYPE

## Optionen

Noch im sichtbaren Chat ausfüllen.

## Vote Record

| Voter | Role | Vote | Confidence | Reason | Condition / Blocker |
|---|---|---|---|---|---|
|  |  |  |  |  |  |

## Vote Chair

Noch aus sichtbarer Agentenantwort einfügen.

## Vote Recorder

Noch aus sichtbarer Agentenantwort einfügen.

## Vote Auditor

Noch aus sichtbarer Agentenantwort einfügen.

## Result

Noch im sichtbaren Chat ausfüllen.

## Begründung

Noch im sichtbaren Chat ausfüllen.

## Bedingungen / Blocker

Noch im sichtbaren Chat ausfüllen.

## Nächste Schritte

Noch im sichtbaren Chat ausfüllen.
REPORT_TEMPLATE

  cat <<EOF_RUNTIME
Vote protocol started.

Type:
  $TYPE

Decision:
  $DECISION

Vote report:
  $REPORT

IMPORTANT:
  No vote record, no approval.
  Blocker votes block approval until resolved.
  Abstain requires reason.

Required visible vote agents:

@bkg-vote-chair Determine quorum, threshold, blockers and result for:
$DECISION

@bkg-vote-recorder Record visible votes for:
$DECISION

@bkg-vote-auditor Audit vote validity and unresolved blockers for:
$DECISION

Required visible structure:

## Vote Record

| Voter | Role | Vote | Confidence | Reason | Condition / Blocker |
|---|---|---|---|---|---|

## Vote Result

- Quorum:
- Approvals:
- Rejections:
- Revisions:
- Abstentions:
- Blockers:
- Result:
- Why:

Then save final report to:
  $REPORT

Then:
  ./1brain remember "vote saved: $REPORT"
EOF_RUNTIME

  remember "vote started: $REPORT"
}

if [[ "$ACTION" == "vote" ]]; then
  TYPE="${1:-team}"
  shift || true
  make_vote "$TYPE" "$@"
  exit 0
fi

if [[ "$ACTION" == "rat" ]]; then
  TYPE="${1:-problem}"
  shift || true
  TOPIC="$*"
  [[ -n "$TOPIC" ]] || TOPIC="No council topic provided"

  SLUG="$(slugify "$TOPIC")"
  STAMP="$(date +%Y%m%d-%H%M%S)"
  RAT_REPORT="docs/rat/${SLUG}.${STAMP}.md"
  VOTE_REPORT="docs/vote/${SLUG}.${STAMP}.md"
  NOW="$(date -Iseconds)"

  cat > "$RAT_REPORT" <<REPORT_TEMPLATE
# Agent Rat: $TOPIC

## Thema

$TOPIC

## Datum/Uhrzeit

$NOW

## Typ

$TYPE

## Ausgangslage

Noch im sichtbaren Chat ausfüllen.

## Quellen / Recherche

Noch im sichtbaren Chat ausfüllen.

## Optionen im Raum

Noch im sichtbaren Chat ausfüllen.

## Agentenantworten

Noch im sichtbaren Chat ausfüllen.

## Konflikte

Noch im sichtbaren Chat ausfüllen.

## Entscheidung

Noch im sichtbaren Chat ausfüllen.

## Begründung

Noch im sichtbaren Chat ausfüllen.

## Nicht gewählt, weil

Noch im sichtbaren Chat ausfüllen.

## Offene Punkte

Noch im sichtbaren Chat ausfüllen.

## Nächste Schritte

Noch im sichtbaren Chat ausfüllen.

## Vote Report

$VOTE_REPORT
REPORT_TEMPLATE

  cat > "$VOTE_REPORT" <<REPORT_TEMPLATE
# Vote: Agent Rat - $TOPIC

## Thema / Entscheidung

$TOPIC

## Datum/Uhrzeit

$NOW

## Vote Type

council/$TYPE

## Vote Record

| Voter | Role | Vote | Confidence | Reason | Condition / Blocker |
|---|---|---|---|---|---|

## Result

Noch im sichtbaren Chat ausfüllen.
REPORT_TEMPLATE

  cat <<EOF_RUNTIME
Agent Rat started.

Type:
  $TYPE

Topic:
  $TOPIC

Rat report:
  $RAT_REPORT

Vote report:
  $VOTE_REPORT

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

No vote record, no approval.

Then:
  ./1brain remember "agent rat saved: $RAT_REPORT"
  ./1brain remember "vote saved: $VOTE_REPORT"
EOF_RUNTIME

  remember "agent rat started: $RAT_REPORT"
  remember "vote started: $VOTE_REPORT"
  exit 0
fi

TEXT="$*"
[[ -n "$TEXT" ]] || TEXT="No problem text provided"

case "$ACTION" in
  team|think|research|approve|ui) ;;
  *)
    echo "Usage: ./4ucker team|think|research|approve|ui \"problem\"" >&2
    echo "       ./4ucker rat plan|problem|feature|post|decide \"topic\"" >&2
    echo "       ./4ucker vote team|council|release|post|feature \"decision\"" >&2
    exit 2
    ;;
esac

SLUG="$(slugify "$TEXT")"
STAMP="$(date +%Y%m%d-%H%M%S)"
DEBAT_REPORT="docs/debat/${SLUG}.${STAMP}.md"
VOTE_REPORT="docs/vote/${SLUG}.${STAMP}.md"
NOW="$(date -Iseconds)"

cat > "$DEBAT_REPORT" <<REPORT_TEMPLATE
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

## Real Team Calls

Noch im sichtbaren Chat ausfüllen.

## Approval Ergebnis

See vote report: $VOTE_REPORT

## Finale Lösung

Noch im sichtbaren Chat ausfüllen.

## Begründung

Noch im sichtbaren Chat ausfüllen.

## Offene Punkte

Noch im sichtbaren Chat ausfüllen.

## Nächste Schritte

Noch im sichtbaren Chat ausfüllen.
REPORT_TEMPLATE

cat > "$VOTE_REPORT" <<REPORT_TEMPLATE
# Vote: 4ucker Team - $TEXT

## Thema / Entscheidung

$TEXT

## Datum/Uhrzeit

$NOW

## Vote Type

team/$ACTION

## Vote Record

| Voter | Role | Vote | Confidence | Reason | Condition / Blocker |
|---|---|---|---|---|---|

## Result

Noch im sichtbaren Chat ausfüllen.
REPORT_TEMPLATE

cat <<EOF_RUNTIME
4ucker team debate started.

Action:
  $ACTION

Problem:
  $TEXT

Debate report:
  $DEBAT_REPORT

Vote report:
  $VOTE_REPORT

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
  ./1brain remember "4ucker team debate saved: $DEBAT_REPORT"
  ./1brain remember "vote saved: $VOTE_REPORT"
EOF_RUNTIME

remember "4ucker team debate started: $DEBAT_REPORT"
remember "vote started: $VOTE_REPORT"
FOURUCKER_RUNTIME

chmod +x ./4ucker
echo "patched ./4ucker with vote skills protocol"
