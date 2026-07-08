import type {
  BitshitControlAdapter,
  BlockerInput,
  BlockerRecord,
  RatInput,
  RatSession,
  VoteInput,
  VoteRecord,
  ApprovalInput,
  ApprovalDecision,
  MemoryInput,
} from "./types.js"

function makeId(): string {
  return crypto.randomUUID()
}

function now(): string {
  return new Date().toISOString()
}

/**
 * Compatibility-only adapter.
 *
 * Use createRuntimeBitshitAdapter() from ./runtime-adapter.js for real persisted
 * blocker, Rat, vote and memory behavior. This adapter intentionally avoids
 * random decisions and marks approval output as a stub so callers cannot mistake
 * it for production state.
 */
export function createBitshitAdapter(): BitshitControlAdapter {
  return {
    async reportBlocker(input: BlockerInput): Promise<BlockerRecord> {
      return {
        id: makeId(),
        taskId: input.taskId,
        description: input.description,
        context: input.context,
        status: "open",
        severity: input.severity,
        createdAt: now(),
      }
    },

    async startRat(input: RatInput): Promise<RatSession> {
      return {
        id: makeId(),
        blockerId: input.blockerId,
        topic: input.topic,
        agents: input.agents,
        status: "active",
        startedAt: now(),
      }
    },

    async recordVote(input: VoteInput): Promise<VoteRecord> {
      return {
        id: makeId(),
        sessionId: input.sessionId,
        agentId: input.agentId,
        choice: input.choice,
        rationale: input.rationale,
        castAt: now(),
      }
    },

    async requestApproval(_input: ApprovalInput): Promise<ApprovalDecision> {
      return {
        decision: "blocked",
        voteSummary: { approve: 0, reject: 0, abstain: 0, total: 0 },
        decidedAt: now(),
        decidedBy: "bitshit-adapter-stub",
        isStub: true,
      }
    },

    async remember(_input: MemoryInput): Promise<void> {
      return
    },
  }
}
