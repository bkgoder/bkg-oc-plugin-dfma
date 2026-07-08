import { createBlocker, updateBlocker } from "../ensemble/blockers.js"
import { createRatSession } from "../ensemble/rat.js"
import { castVote, tallyVotes } from "../ensemble/votes.js"
import { createShortTermMemory } from "../memory/short-term.js"
import type {
  ApprovalDecision,
  ApprovalInput,
  BitshitControlAdapter,
  BlockerInput,
  BlockerRecord,
  MemoryInput,
  RatInput,
  RatSession,
  VoteDecision,
  VoteInput,
  VoteRecord,
} from "./types.js"

function now(): string {
  return new Date().toISOString()
}

function mapVoteOutcome(outcome: "approved" | "rejected" | "revise" | "blocked" | "pending"): VoteDecision {
  return outcome === "pending" ? "blocked" : outcome
}

export function createRuntimeBitshitAdapter(): BitshitControlAdapter {
  const memory = createShortTermMemory()

  return {
    async reportBlocker(input: BlockerInput): Promise<BlockerRecord> {
      const blocker = await createBlocker({
        description: input.description,
        context: {
          ...input.context,
          taskId: input.taskId,
        },
        severity: "medium",
      })

      return {
        id: blocker.id,
        taskId: input.taskId,
        description: blocker.description,
        context: blocker.context,
        status: blocker.status === "open" || blocker.status === "in_vote" ? "open" : blocker.status,
        createdAt: blocker.createdAt,
        resolvedAt: blocker.resolvedAt,
      }
    },

    async startRat(input: RatInput): Promise<RatSession> {
      const session = await createRatSession({
        blockerId: input.blockerId,
        topic: input.topic,
        agents: input.agents,
      })
      await updateBlocker(input.blockerId, { status: "in_vote", ratSessionId: session.id })

      return {
        id: session.id,
        blockerId: session.blockerId,
        topic: session.topic,
        agents: session.agents,
        status: session.status,
        startedAt: session.startedAt,
        completedAt: session.completedAt,
        summary: session.summary,
      }
    },

    async recordVote(input: VoteInput): Promise<VoteRecord> {
      const vote = await castVote({
        sessionId: input.sessionId,
        ratSessionId: input.sessionId,
        agentId: input.agentId,
        choice: input.choice,
        rationale: input.rationale,
      })

      return {
        id: vote.id,
        sessionId: vote.sessionId,
        agentId: vote.agentId,
        choice: vote.choice,
        rationale: vote.rationale,
        castAt: vote.castAt,
      }
    },

    async requestApproval(input: ApprovalInput): Promise<ApprovalDecision> {
      const tally = await tallyVotes(input.voteSessionId)
      return {
        decision: mapVoteOutcome(tally.outcome),
        voteSummary: {
          approve: tally.approve,
          reject: tally.reject,
          abstain: tally.abstain,
          total: tally.total,
        },
        decidedAt: now(),
        decidedBy: "bkg-runtime-bitshit-adapter",
      }
    },

    async remember(input: MemoryInput): Promise<void> {
      await memory.append({
        key: input.key,
        content: input.content,
        worktree: input.worktree,
        metadata: input.metadata,
      })
    },
  }
}
