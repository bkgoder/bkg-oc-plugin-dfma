import * as fs from "node:fs/promises"
import * as path from "node:path"
import * as os from "node:os"

export interface AgentPosition {
  agentId: string
  role: string
  statement: string
  submittedAt: string
}

export interface RatSession {
  id: string
  blockerId: string
  topic: string
  agents: string[]
  status: "pending" | "active" | "complete"
  startedAt: string
  completedAt?: string
  summary?: string
  positions: AgentPosition[]
  fourthVoice?: {
    source: string
    statement: string
    submittedAt: string
  }
}

const RAT_DIR = path.join(os.homedir(), ".local", "share", "opencode", "rat-sessions")

function makeId(): string {
  return `rat-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function now(): string {
  return new Date().toISOString()
}

async function ensureDir(): Promise<void> {
  await fs.mkdir(RAT_DIR, { recursive: true })
}

function recordPath(id: string): string {
  return path.join(RAT_DIR, `${id}.json`)
}

export async function createRatSession(input: {
  blockerId: string
  topic: string
  agents: string[]
}): Promise<RatSession> {
  await ensureDir()
  const session: RatSession = {
    id: makeId(),
    blockerId: input.blockerId,
    topic: input.topic,
    agents: input.agents,
    status: "active",
    startedAt: now(),
    positions: [],
  }
  await fs.writeFile(recordPath(session.id), JSON.stringify(session, null, 2) + "\n", "utf8")
  return session
}

export async function addAgentPosition(sessionId: string, position: Omit<AgentPosition, "submittedAt">): Promise<RatSession> {
  const session = await readRatSession(sessionId)
  session.positions.push({ ...position, submittedAt: now() })
  await fs.writeFile(recordPath(sessionId), JSON.stringify(session, null, 2) + "\n", "utf8")
  return session
}

export async function setFourthVoice(sessionId: string, input: { source: string; statement: string }): Promise<RatSession> {
  const session = await readRatSession(sessionId)
  session.fourthVoice = { ...input, submittedAt: now() }
  await fs.writeFile(recordPath(sessionId), JSON.stringify(session, null, 2) + "\n", "utf8")
  return session
}

export async function completeRatSession(sessionId: string, summary: string): Promise<RatSession> {
  const session = await readRatSession(sessionId)
  session.status = "complete"
  session.completedAt = now()
  session.summary = summary
  await fs.writeFile(recordPath(sessionId), JSON.stringify(session, null, 2) + "\n", "utf8")
  return session
}

export async function readRatSession(id: string): Promise<RatSession> {
  const raw = await fs.readFile(recordPath(id), "utf8")
  return JSON.parse(raw) as RatSession
}

export async function listRatSessions(blockerId?: string): Promise<RatSession[]> {
  await ensureDir()
  const files = await fs.readdir(RAT_DIR)
  const sessions: RatSession[] = []
  for (const file of files.filter((f: string) => f.endsWith(".json"))) {
    try {
      const s = JSON.parse(await fs.readFile(path.join(RAT_DIR, file), "utf8")) as RatSession
      if (!blockerId || s.blockerId === blockerId) sessions.push(s)
    } catch {
      // skip damaged records
    }
  }
  return sessions.sort((a, b) => b.startedAt.localeCompare(a.startedAt))
}
