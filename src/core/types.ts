export type ISODateString = string

export type DecisionState = "pending" | "approved" | "rejected" | "revise" | "blocked"

export type VoteValue = "approve" | "reject" | "revise" | "abstain" | "blocker"

export type AgentRole =
  | "orchestrator"
  | "builder"
  | "reviewer"
  | "product"
  | "architect"
  | "growth"
  | "contrarian"
  | "vote-chair"
  | "vote-recorder"
  | "vote-auditor"
  | "fourth-voice"

export interface EvidenceLink {
  kind: "file" | "command" | "test" | "url" | "note"
  label: string
  value: string
}

export interface BlockerInput {
  title: string
  summary: string
  source?: string
  severity?: "low" | "medium" | "high" | "critical"
  evidence?: EvidenceLink[]
}

export interface BlockerRecord extends BlockerInput {
  id: string
  state: DecisionState
  createdAt: ISODateString
  updatedAt: ISODateString
}

export interface VoteInput {
  sessionId: string
  voter: string
  role: AgentRole
  vote: VoteValue
  confidence?: number
  reason: string
  condition?: string
}

export interface VoteRecord extends VoteInput {
  id: string
  createdAt: ISODateString
}

export interface RatInput {
  topic: string
  reason: string
  blockerId?: string
  requestedRoles?: AgentRole[]
  evidence?: EvidenceLink[]
}

export interface RatSession {
  id: string
  topic: string
  reason: string
  blockerId?: string
  state: DecisionState
  roles: AgentRole[]
  votes: VoteRecord[]
  evidence: EvidenceLink[]
  createdAt: ISODateString
  updatedAt: ISODateString
}

export interface ApprovalInput {
  sessionId: string
  decision: Exclude<DecisionState, "pending">
  reason: string
  by: "user" | "agent" | "api"
}

export interface ApprovalDecision extends ApprovalInput {
  id: string
  createdAt: ISODateString
}

export interface MemoryInput {
  kind: "note" | "decision" | "blocker" | "evidence" | "handoff"
  summary: string
  project?: string
  worktree?: string
  evidence?: EvidenceLink[]
}

export interface MemoryRecord extends MemoryInput {
  id: string
  createdAt: ISODateString
}

export interface PluginRuntimeState {
  blockers: BlockerRecord[]
  ratSessions: RatSession[]
  approvals: ApprovalDecision[]
  memories: MemoryRecord[]
}

export function nowIso(): ISODateString {
  return new Date().toISOString()
}

export function makeId(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 10)
  return `${prefix}_${Date.now().toString(36)}_${rand}`
}
