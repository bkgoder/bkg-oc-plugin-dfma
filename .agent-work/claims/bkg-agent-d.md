# Claim: bkg-agent-d

## Agent

Agent D — Ensemble/Rat/Vote/Blocker

## Lane

Lane 5 — Ensemble / Agent Rat / Votes

## Task

Build Agent Rat session logic, vote engine with four outcomes, blocker auto-start, fourth voice slot.

## Files claimed

- src/ensemble/rat.ts
- src/ensemble/votes.ts
- src/ensemble/blockers.ts
- src/index.ts (amend exports)
- .agent-work/status/bkg-agent-d.md
- .agent-work/evidence/bkg-agent-d.lane5.md

## Files read-only

- src/memory/types.ts
- src/subagents/delegation.ts
- docs/tasks.md
- docs/agent-work-contract.md

## Start time

2026-07-08T18:25:00Z

## Expected output

- Rat session: create/read/list/complete with agent positions and summary
- Vote engine: cast votes, tally, determine outcome (approved/rejected/revise/blocked)
- Blockers: create, resolve, auto-start Rat when threshold exceeded
- Fourth voice slot: external API reviewer can submit position
- All exported from src/index.ts

## Not doing

- Dashboard server or UI
- TTS
- Memory implementation changes
