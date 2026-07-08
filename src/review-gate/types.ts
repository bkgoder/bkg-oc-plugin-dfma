export type ReviewWorkflow =
  | "rat-only"
  | "blocker-only"
  | "manual"
  | "all-agents"
  | "user-managed"

export type ReviewDecision = "approved" | "rejected" | "revise"
export type ReviewTrigger = "rat" | "blocker" | "manual" | "agent"

export interface ReviewLineEdit {
  target: string
  start?: number
  end?: number
  replacement?: string
  comment: string
}

export interface ReviewAnnotation {
  id: string
  target?: string
  start?: number
  end?: number
  comment: string
  createdAt: string
}

export interface ReviewFeedback {
  decision: ReviewDecision
  comment?: string
  edits: ReviewLineEdit[]
  decidedAt: string
}

export interface ReviewSessionInput {
  title: string
  content: string
  target?: string
  trigger: ReviewTrigger
  workflow?: ReviewWorkflow
  actorRole?: string
  blockerId?: string
  ratSessionId?: string
  metadata?: Record<string, unknown>
}

export interface ReviewSession extends ReviewSessionInput {
  id: string
  workflow: ReviewWorkflow
  status: "pending" | ReviewDecision
  annotations: ReviewAnnotation[]
  feedback?: ReviewFeedback
  createdAt: string
  updatedAt: string
}

export interface ReviewGateResult {
  session: ReviewSession
  url: string
}
