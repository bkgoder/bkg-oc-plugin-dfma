import { castVote } from "../ensemble/votes.js"
import { createShortTermMemory } from "../memory/short-term.js"
import type { ReviewSession } from "./types.js"

export async function persistReviewFeedback(session: ReviewSession): Promise<void> {
  if (!session.feedback) return
  const memory = createShortTermMemory()
  await memory.append({
    key: "review-gate-feedback",
    content: session.feedback.comment ?? `Review ${session.feedback.decision}: ${session.title}`,
    metadata: {
      reviewSessionId: session.id,
      decision: session.feedback.decision,
      blockerId: session.blockerId,
      ratSessionId: session.ratSessionId,
      edits: session.feedback.edits,
      annotations: session.annotations,
    },
  })

  if (session.ratSessionId) {
    await castVote({
      sessionId: session.id,
      ratSessionId: session.ratSessionId,
      agentId: "human-user",
      choice: session.feedback.decision === "approved" ? "approve" : "reject",
      rationale: session.feedback.comment ?? `Review gate: ${session.feedback.decision}`,
    })
  }
}
