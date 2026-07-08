import { createBackgroundAgentsPlugin } from "./background-agents.js"
import { createBitshitAdapter } from "./bitshit/adapter.js"
import { discoverRules, validateRule, installRules, getRuleMetadata } from "./rules-loader.js"
import { createShortTermMemory } from "./memory/short-term.js"
import { readWorktreeMemory, appendWorktreeMemory, syncWorktreeMemory } from "./memory/worktree-sync.js"
import { registerRecallAdapter, getRecallAdapter, listRecallAdapters, recallFromExternal } from "./memory/recall.js"
import { createDelegation, updateDelegation, readDelegation, listDelegations } from "./subagents/delegation.js"
import { createSubtask, updateSubtask, readSubtask, listSubtasks } from "./subagents/subtasks.js"
import { captureOutput, readOutput, listOutputs } from "./subagents/output-capture.js"
export type { BitshitControlAdapter } from "./bitshit/types.js"
export type { RuleEntry, RuleMetadata } from "./rules-loader.js"
export type { MemoryRecord, MemoryQuery, MemoryStore, ExternalRecallAdapter } from "./memory/types.js"
export type { SubDelegation } from "./subagents/delegation.js"
export type { Subtask } from "./subagents/subtasks.js"
export type { AgentRunOutput } from "./subagents/output-capture.js"

export default createBackgroundAgentsPlugin()
export {
  createBackgroundAgentsPlugin,
  createBitshitAdapter,
  discoverRules, validateRule, installRules, getRuleMetadata,
  createShortTermMemory,
  readWorktreeMemory, appendWorktreeMemory, syncWorktreeMemory,
  registerRecallAdapter, getRecallAdapter, listRecallAdapters, recallFromExternal,
  createDelegation, updateDelegation, readDelegation, listDelegations,
  createSubtask, updateSubtask, readSubtask, listSubtasks,
  captureOutput, readOutput, listOutputs,
}
