import { createBackgroundAgentsPlugin } from "./background-agents.js";
import { createBitshitAdapter } from "./bitshit/adapter.js";
import { createIdentityRegistry } from "./identity.js";
import { getPersonality } from "./personality.js";
import {
  discoverRules,
  validateRule,
  installRules,
  getRuleMetadata,
} from "./rules-loader.js";
import {
  createShortTermMemory,
  exportShortTermMemory,
  importShortTermMemory,
} from "./memory/short-term.js";
import {
  readWorktreeMemory,
  appendWorktreeMemory,
  syncWorktreeMemory,
} from "./memory/worktree-sync.js";
import {
  registerRecallAdapter,
  getRecallAdapter,
  listRecallAdapters,
  recallFromExternal,
} from "./memory/recall.js";
import {
  createDelegation,
  updateDelegation,
  readDelegation,
  listDelegations,
} from "./subagents/delegation.js";
import {
  createSubtask,
  updateSubtask,
  readSubtask,
  listSubtasks,
} from "./subagents/subtasks.js";
import {
  captureOutput,
  readOutput,
  listOutputs,
} from "./subagents/output-capture.js";
import {
  createBlocker,
  updateBlocker,
  readBlocker,
  listBlockers,
  shouldStartRat,
  autoStartRatForBlocker,
} from "./ensemble/blockers.js";
import {
  createRatSession,
  addAgentPosition,
  setFourthVoice,
  completeRatSession,
  readRatSession,
  listRatSessions,
} from "./ensemble/rat.js";
import {
  castVote,
  tallyVotes,
  determineOutcome,
  listVotes,
  recordUserApproval,
  readUserApproval,
  listUserApprovals,
} from "./ensemble/votes.js";
import {
  createSyncService,
  defaultSyncConfig,
  defaultSyncPaths,
  buildSyncManifest,
  getSyncStatus,
} from "./sync/index.js";
import {
  checkConfiguredPluginUpdates,
  defaultUpdateNotifierConfig,
  extractPinnedPluginsFromConfig,
  parsePinnedPlugin,
} from "./update-notifier/index.js";
import { openReviewGate } from "./review-gate/index.js";
import {
  createLiveOutputReporter,
  getLiveOutputSnapshot,
  resetLiveOutput,
} from "./live-output/index.js";
import {
  loadAcpCompatibilityConfig,
  reviewGateTimeoutMs,
} from "./acp/index.js";
import {
  callFourthVoice,
  loadFourthVoiceConfig,
  saveFourthVoiceConfig,
} from "./dashboard/fourth-voice.js";
export type { AgentIdentity, IdentityRegistry } from "./identity.js";
export type { PersonalityPreset } from "./personality.js";
export type { BitshitControlAdapter } from "./bitshit/types.js";
export type { RuleEntry, RuleMetadata } from "./rules-loader.js";
export type {
  MemoryRecord,
  MemoryQuery,
  MemoryStore,
  ExternalRecallAdapter,
} from "./memory/types.js";
export type { SubDelegation } from "./subagents/delegation.js";
export type { Subtask } from "./subagents/subtasks.js";
export type { AgentRunOutput } from "./subagents/output-capture.js";
export type { BlockerRecord } from "./ensemble/blockers.js";
export type { RatSession, AgentPosition } from "./ensemble/rat.js";
export type {
  VoteRecord,
  VoteTally,
  VoteChoice,
  VoteOutcome,
} from "./ensemble/votes.js";
export type {
  SyncConfig,
  SyncManifest,
  SyncOperationResult,
  SyncPathSpec,
  SyncStatus,
} from "./sync/index.js";
export type {
  PinnedPluginRef,
  PluginUpdateInfo,
  UpdateNotifierConfig,
  UpdateNotifierSummary,
} from "./update-notifier/index.js";
export type {
  ReviewAnnotation,
  ReviewDecision,
  ReviewFeedback,
  ReviewGateResult,
  ReviewLineEdit,
  ReviewSession,
  ReviewSessionInput,
  ReviewTrigger,
  ReviewWorkflow,
} from "./review-gate/index.js";
export type {
  LiveAgentState,
  LiveOutputEvent,
  LiveOutputKind,
  LiveOutputSnapshot,
} from "./live-output/index.js";
export type { AcpCompatibilityConfig, AcpReviewGateMode } from "./acp/index.js";

export default createBackgroundAgentsPlugin();
export {
  createBackgroundAgentsPlugin,
  createBitshitAdapter,
  createIdentityRegistry,
  getPersonality,
  discoverRules,
  validateRule,
  installRules,
  getRuleMetadata,
  createShortTermMemory,
  exportShortTermMemory,
  importShortTermMemory,
  readWorktreeMemory,
  appendWorktreeMemory,
  syncWorktreeMemory,
  registerRecallAdapter,
  getRecallAdapter,
  listRecallAdapters,
  recallFromExternal,
  createDelegation,
  updateDelegation,
  readDelegation,
  listDelegations,
  createSubtask,
  updateSubtask,
  readSubtask,
  listSubtasks,
  captureOutput,
  readOutput,
  listOutputs,
  createBlocker,
  updateBlocker,
  readBlocker,
  listBlockers,
  shouldStartRat,
  autoStartRatForBlocker,
  createRatSession,
  addAgentPosition,
  setFourthVoice,
  completeRatSession,
  readRatSession,
  listRatSessions,
  castVote,
  tallyVotes,
  determineOutcome,
  listVotes,
  recordUserApproval,
  readUserApproval,
  listUserApprovals,
  createSyncService,
  defaultSyncConfig,
  defaultSyncPaths,
  buildSyncManifest,
  getSyncStatus,
  checkConfiguredPluginUpdates,
  defaultUpdateNotifierConfig,
  extractPinnedPluginsFromConfig,
  parsePinnedPlugin,
  openReviewGate,
  createLiveOutputReporter,
  getLiveOutputSnapshot,
  resetLiveOutput,
  loadAcpCompatibilityConfig,
  reviewGateTimeoutMs,
  callFourthVoice,
  loadFourthVoiceConfig,
  saveFourthVoiceConfig,
};
