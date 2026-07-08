import * as fs from "node:fs/promises"
import * as path from "node:path"
import { makeId, nowIso } from "../core/types.js"
import { runtimeRoot } from "../core/store.js"
import { validateLineEdits } from "./line-edits.js"
import type {
  ReviewAnnotation,
  ReviewDecision,
  ReviewFeedback,
  ReviewLineEdit,
  ReviewSession,
  ReviewSessionInput,
  ReviewWorkflow,
} from "./types.js"

const waiters = new Map<string, Set<(session: ReviewSession) => void>>()

function sessionsRoot(): string {
  return path.join(runtimeRoot(), "review-gate", "sessions")
}

function sessionPath(id: string): string {
  if (!/^[a-zA-Z0-9_-]+$/.test(id)) throw new Error("Invalid review session id.")
  return path.join(sessionsRoot(), `${id}.json`)
}

export function resolveReviewWorkflow(value?: string): ReviewWorkflow {
  const workflow = value ?? process.env.BKG_OC_REVIEW_WORKFLOW ?? "blocker-only"
  if (["rat-only", "blocker-only", "manual", "all-agents", "user-managed"].includes(workflow)) {
    return workflow as ReviewWorkflow
  }
  throw new Error(`Unsupported review workflow: ${workflow}`)
}

export function canOpenReview(input: ReviewSessionInput): boolean {
  const workflow = resolveReviewWorkflow(input.workflow)
  if (workflow === "all-agents") return true
  if (workflow === "user-managed") return input.trigger === "manual" && !input.actorRole
  if (workflow === "manual") return input.trigger === "manual"
  if (workflow === "rat-only") {
    return input.trigger === "rat" &&
      (!input.actorRole || /rat|orchestrator|architect|vote-chair/i.test(input.actorRole))
  }
  return input.trigger === "blocker" || input.trigger === "rat"
}

export async function createReviewSession(input: ReviewSessionInput): Promise<ReviewSession> {
  const workflow = resolveReviewWorkflow(input.workflow)
  if (!canOpenReview({ ...input, workflow })) {
    throw new Error(`Review trigger "${input.trigger}" is not allowed in "${workflow}" mode.`)
  }
  const now = nowIso()
  const session: ReviewSession = {
    ...input,
    id: makeId("review"),
    workflow,
    status: "pending",
    annotations: [],
    createdAt: now,
    updatedAt: now,
  }
  await writeReviewSession(session)
  return session
}

export async function readReviewSession(id: string): Promise<ReviewSession> {
  return JSON.parse(await fs.readFile(sessionPath(id), "utf8")) as ReviewSession
}

export async function addReviewAnnotation(
  id: string,
  input: Omit<ReviewAnnotation, "id" | "createdAt">,
): Promise<ReviewSession> {
  if (!input.comment.trim()) throw new Error("Annotation comment is required.")
  const session = await readReviewSession(id)
  ensurePending(session)
  session.annotations.push({ ...input, id: makeId("annotation"), createdAt: nowIso() })
  session.updatedAt = nowIso()
  await writeReviewSession(session)
  return session
}

export async function decideReviewSession(
  id: string,
  decision: ReviewDecision,
  input: { comment?: string; edits?: ReviewLineEdit[] } = {},
): Promise<ReviewSession> {
  const session = await readReviewSession(id)
  ensurePending(session)
  const feedback: ReviewFeedback = {
    decision,
    comment: input.comment,
    edits: validateLineEdits(input.edits ?? []),
    decidedAt: nowIso(),
  }
  session.status = decision
  session.feedback = feedback
  session.updatedAt = feedback.decidedAt
  await writeReviewSession(session)
  for (const resolve of waiters.get(id) ?? []) resolve(session)
  waiters.delete(id)
  return session
}

export async function waitForReviewDecision(
  id: string,
  timeoutMs = 30 * 60 * 1000,
): Promise<ReviewSession> {
  const current = await readReviewSession(id)
  if (current.status !== "pending") return current
  return await new Promise<ReviewSession>((resolve, reject) => {
    const listeners = waiters.get(id) ?? new Set()
    let timer: ReturnType<typeof setTimeout>
    const finish = (session: ReviewSession) => {
      clearTimeout(timer)
      resolve(session)
    }
    listeners.add(finish)
    waiters.set(id, listeners)
    timer = setTimeout(() => {
      listeners.delete(finish)
      reject(new Error(`Review session ${id} timed out.`))
    }, timeoutMs)
    timer.unref?.()
  })
}

async function writeReviewSession(session: ReviewSession): Promise<void> {
  await fs.mkdir(sessionsRoot(), { recursive: true })
  await fs.writeFile(sessionPath(session.id), JSON.stringify(session, null, 2) + "\n", "utf8")
}

function ensurePending(session: ReviewSession): void {
  if (session.status !== "pending") throw new Error(`Review session ${session.id} is already decided.`)
}
