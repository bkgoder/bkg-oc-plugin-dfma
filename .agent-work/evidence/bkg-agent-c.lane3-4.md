# Evidence: Memory Core and Subagent Delegation

## Agent

bkg-agent-c

## Lane

Lane 3 — Memory Core
Lane 4 — Background Delegation + Subtasks

## Summary

Implemented the full memory core (types, short-term store, worktree sync, external recall adapter placeholder) and the subagent delegation system (delegation records, subtasks, output capture). All modules are type-safe, use JSON file persistence under `~/.local/share/opencode/`, and are exported from the package index.

## Files changed

- src/memory/types.ts — MemoryRecord, MemoryQuery, MemoryStore, ExternalRecallAdapter interfaces
- src/memory/short-term.ts — createShortTermMemory() with append/read/list/search/remove
- src/memory/worktree-sync.ts — readWorktreeMemory, appendWorktreeMemory, syncWorktreeMemory
- src/memory/recall.ts — registerRecallAdapter, getRecallAdapter, listRecallAdapters, recallFromExternal
- src/subagents/delegation.ts — createDelegation, updateDelegation, readDelegation, listDelegations
- src/subagents/subtasks.ts — createSubtask, updateSubtask, readSubtask, listSubtasks
- src/subagents/output-capture.ts — captureOutput, readOutput, listOutputs
- src/index.ts — exports all new modules

## Commands run

```bash
npm run typecheck
npm run build
```

## Test result

pass (typecheck + build)

## Remaining risks

- External recall adapters need actual implementations to be useful
- No in-memory caching layer beyond simple load-once

## Handoff

Lane 5 (Ensemble/Rat/Vote/Blocker) should build on the delegation and memory types.
