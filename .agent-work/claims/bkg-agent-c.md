# Claim: bkg-agent-c

## Agent

Agent C — Memory/Delegation

## Lane

Lane 3 — Memory Core
Lane 4 — Background Delegation + Subtasks

## Task

Build local short-term memory, worktree memory sync, external recall adapter placeholder, and subtask delegation system.

## Files claimed

- src/memory/types.ts
- src/memory/short-term.ts
- src/memory/worktree-sync.ts
- src/memory/recall.ts
- src/subagents/delegation.ts
- src/subagents/subtasks.ts
- src/subagents/output-capture.ts
- src/index.ts (amend exports)
- .agent-work/status/bkg-agent-c.md
- .agent-work/evidence/bkg-agent-c.lane3-4.md

## Files read-only

- src/background-agents.ts
- docs/tasks.md
- docs/plugin-ready-plan.md
- docs/agent-work-contract.md

## Start time

2026-07-08T18:30:00Z

## Expected output

- Memory types: record schema, append/read/list/search operations
- Short-term memory: session-scoped in-memory store with persistence
- Worktree sync: memory scoped per worktree directory
- Recall: external adapter placeholder interface
- Subtask schema and delegation: subtask creation, listing, status tracking
- Output capture: per-agent run output storage
- All exports from src/index.ts

## Not doing

- Anything outside Lane 3 and Lane 4
- Dashboard code
- Rules loader changes
- Ensemble/Rat/Vote logic
