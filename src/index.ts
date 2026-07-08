import { createBackgroundAgentsPlugin } from "./background-agents.js"
import { createBitshitAdapter } from "./bitshit/adapter.js"
import { createIdentityRegistry } from "./identity.js"
import { getPersonality } from "./personality.js"
import { discoverRules, validateRule, installRules, getRuleMetadata } from "./rules-loader.js"
import { createShortTermMemory } from "./memory/short-term.js"
import { readWorktreeMemory, appendWorktreeMemory, syncWorktreeMemory } from "./memory/worktree-sync.js"
import { registerRecallAdapter, getRecallAdapter, listRecallAdapters, recallFromExternal } from "./memory/recall.js"
import { createDelegation, updateDelegation, readDelegation, listDelegations } from "./subagents/delegation.js"
import { createSubtask, updateSubtask, readSubtask, listSubtasks } from "./subagents/subtasks.js"
import { captureOutput, readOutput, listOutputs } from "./subagents/output-capture.js"
import { createBlocker, updateBlocker, readBlocker, listBlockers, shouldStartRat } from "./ensemble/blockers.js"
import { createRatSession, addAgentPosition, setFourthVoice, completeRatSession, readRatSession, listRatSessions } from "./ensemble/rat.js"
import { castVote, tallyVotes, determineOutcome, listVotes } from "./ensemble/votes.js"
import { createSyncService, defaultSyncConfig, defaultSyncPaths, buildSyncManifest, getSyncStatus } from "./sync/index.js"
export type { AgentIdentity, IdentityRegistry } from "./identity.js"
export type { PersonalityPreset } from "./personality.js"
export type { BitshitControlAdapter } from "./bitshit/types.js"
export type { RuleEntry, RuleMetadata } from "./rules-loader.js"
export type { MemoryRecord, MemoryQuery, MemoryStore, ExternalRecallAdapter } from "./memory/types.js"
export type { SubDelegation } from "./subagents/delegation.js"
export type { Subtask } from "./subagents/subtasks.js"
export type { AgentRunOutput } from "./subagents/output-capture.js"
export type { BlockerRecord } from "./ensemble/blockers.js"
export type { RatSession, AgentPosition } from "./ensemble/rat.js"
export type { VoteRecord, VoteTally, VoteChoice, VoteOutcome } from "./ensemble/votes.js"
export type { SyncConfig, SyncManifest, SyncOperationResult, SyncPathSpec, SyncStatus } from "./sync/index.js"

export default createBackgroundAgentsPlugin()
export {
  createBackgroundAgentsPlugin,
  createBitshitAdapter,
  createIdentityRegistry, getPersonality,
  discoverRules, validateRule, installRules, getRuleMetadata,
  createShortTermMemory,
  readWorktreeMemory, appendWorktreeMemory, syncWorktreeMemory,
  registerRecallAdapter, getRecallAdapter, listRecallAdapters, recallFromExternal,
  createDelegation, updateDelegation, readDelegation, listDelegations,
  createSubtask, updateSubtask, readSubtask, listSubtasks,
  captureOutput, readOutput, listOutputs,
  createBlocker, updateBlocker, readBlocker, listBlockers, shouldStartRat,
  createRatSession, addAgentPosition, setFourthVoice, completeRatSession, readRatSession, listRatSessions,
  castVote, tallyVotes, determineOutcome, listVotes,
  createSyncService, defaultSyncConfig, defaultSyncPaths, buildSyncManifest, getSyncStatus,
}
