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
  VoteDecision,
} from "./types.js"

function makeId(): string {
  return crypto.randomUUID()
}

function now(): string {
  return new Date().toISOString()
}

export function createBitshitAdapter(): BitshitControlAdapter {
  return {
    async reportBlocker(input: BlockerInput): Promise<BlockerRecord> {
      return {
        id: makeId(),
        taskId: input.taskId,
        description: input.description,
        context: input.context,
        status: "open",
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

    async requestApproval(input: ApprovalInput): Promise<ApprovalDecision> {
      const decisions: VoteDecision[] = ["approved", "rejected", "revise", "blocked"]
      return {
        decision: decisions[Math.floor(Math.random() * decisions.length)],
        voteSummary: { approve: 0, reject: 0, abstain: 0 },
        decidedAt: now(),
        decidedBy: "bitshit-adapter-stub",
      }
    },

    async remember(_input: MemoryInput): Promise<void> {
      return
    },
  }
}
