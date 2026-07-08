import { openReviewBrowser } from "./browser.js"
import { persistReviewFeedback } from "./feedback.js"
import { createReviewSession, waitForReviewDecision } from "./session.js"
import { startReviewGateServer } from "./server.js"
import type { ReviewGateResult, ReviewSessionInput } from "./types.js"

export * from "./types.js"
export * from "./session.js"
export * from "./server.js"
export * from "./feedback.js"
export * from "./browser.js"
export * from "./line-edits.js"

export async function openReviewGate(
  input: ReviewSessionInput,
  options: { timeoutMs?: number; openBrowser?: boolean; port?: number } = {},
): Promise<ReviewGateResult> {
  const session = await createReviewSession(input)
  const gate = await startReviewGateServer({ port: options.port })
  const url = `${gate.url}/?id=${encodeURIComponent(session.id)}`
  try {
    if (options.openBrowser !== false) await openReviewBrowser(url)
    const decided = await waitForReviewDecision(session.id, options.timeoutMs)
    await persistReviewFeedback(decided)
    return { session: decided, url }
  } finally {
    await gate.close()
  }
}
