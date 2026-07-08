import * as fs from "node:fs/promises"
import * as path from "node:path"
import * as os from "node:os"

export type VoteChoice = "approve" | "reject" | "abstain"
export type VoteOutcome = "approved" | "rejected" | "revise" | "blocked"

export interface VoteRecord {
  id: string
  sessionId: string
  ratSessionId: string
  agentId: string
  choice: VoteChoice
  rationale?: string
  castAt: string
}

export interface VoteTally {
  approve: number
  reject: number
  abstain: number
  total: number
  outcome: VoteOutcome | "pending"
}

const VOTES_DIR = path.join(os.homedir(), ".local", "share", "opencode", "votes")

function makeId(): string {
  return `vote-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function now(): string {
  return new Date().toISOString()
}

async function ensureDir(): Promise<void> {
  await fs.mkdir(VOTES_DIR, { recursive: true })
}

export async function castVote(input: {
  sessionId: string
  ratSessionId: string
  agentId: string
  choice: VoteChoice
  rationale?: string
}): Promise<VoteRecord> {
  await ensureDir()
  const vote: VoteRecord = {
    id: makeId(),
    sessionId: input.sessionId,
    ratSessionId: input.ratSessionId,
    agentId: input.agentId,
    choice: input.choice,
    rationale: input.rationale,
    castAt: now(),
  }
  await fs.writeFile(path.join(VOTES_DIR, `${vote.id}.json`), JSON.stringify(vote, null, 2) + "\n", "utf8")
  return vote
}

export async function tallyVotes(ratSessionId: string): Promise<VoteTally> {
  await ensureDir()
  const files = await fs.readdir(VOTES_DIR)
  let approve = 0; let reject = 0; let abstain = 0
  for (const file of files.filter((f: string) => f.endsWith(".json"))) {
    try {
      const v = JSON.parse(await fs.readFile(path.join(VOTES_DIR, file), "utf8")) as VoteRecord
      if (v.ratSessionId !== ratSessionId) continue
      if (v.choice === "approve") approve++
      else if (v.choice === "reject") reject++
      else if (v.choice === "abstain") abstain++
    } catch {
      // skip damaged records
    }
  }
  const total = approve + reject + abstain
  return {
    approve,
    reject,
    abstain,
    total,
    outcome: determineOutcome(approve, reject, total),
  }
}

export function determineOutcome(approve: number, reject: number, total: number): VoteOutcome | "pending" {
  if (total === 0) return "pending"
  const nonAbstain = approve + reject
  if (nonAbstain === 0) return "pending"
  const approveRatio = approve / nonAbstain
  if (approveRatio > 0.5) return "approved"
  if (reject > approve && reject >= Math.ceil(nonAbstain / 2)) return "rejected"
  if (reject > 0 && approve > 0) return "revise"
  return "blocked"
}

export async function listVotes(ratSessionId?: string): Promise<VoteRecord[]> {
  await ensureDir()
  const files = await fs.readdir(VOTES_DIR)
  const votes: VoteRecord[] = []
  for (const file of files.filter((f: string) => f.endsWith(".json"))) {
    try {
      const v = JSON.parse(await fs.readFile(path.join(VOTES_DIR, file), "utf8")) as VoteRecord
      if (!ratSessionId || v.ratSessionId === ratSessionId) votes.push(v)
    } catch {
      // skip damaged records
    }
  }
  return votes.sort((a, b) => b.castAt.localeCompare(a.castAt))
}
