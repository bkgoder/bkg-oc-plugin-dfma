# Evidence: Ensemble / Rat / Vote / Blocker

## Agent

bkg-agent-d

## Lane

Lane 5 — Ensemble / Agent Rat / Votes

## Summary

Implemented the full ensemble system: blocker detection with auto-start logic, Rat council sessions with agent positions and fourth voice slot, and a vote engine with four outcomes (approved, rejected, revise, blocked) and majority-based tallying.

## Files changed

- src/ensemble/blockers.ts — BlockerRecord, CRUD, shouldStartRat()
- src/ensemble/rat.ts — RatSession, AgentPosition, create/addPosition/setFourthVoice/complete/list
- src/ensemble/votes.ts — VoteRecord, VoteTally, VoteChoice, VoteOutcome, castVote/tally/determineOutcome/list
- src/index.ts — exports all ensemble functions and types

## Commands run

```bash
npm run typecheck
```

## Test result

pass (typecheck)

## Remaining risks

- No vote expiry or timeout logic yet
- Fourth voice requires external API integration to be useful

## Handoff

Lane 6+7 (Dashboard + TTS) can consume these types for the UI.
