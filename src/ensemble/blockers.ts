import * as fs from "node:fs/promises"
import * as path from "node:path"
import * as os from "node:os"

export interface BlockerRecord {
  id: string
  description: string
  context: Record<string, unknown>
  status: "open" | "in_vote" | "resolved" | "escalated"
  severity: "low" | "medium" | "high" | "critical"
  createdAt: string
  resolvedAt?: string
  ratSessionId?: string
}

const BLOCKERS_DIR = path.join(os.homedir(), ".local", "share", "opencode", "blockers")

function makeId(): string {
  return `blk-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function now(): string {
  return new Date().toISOString()
}

async function ensureDir(): Promise<void> {
  await fs.mkdir(BLOCKERS_DIR, { recursive: true })
}

function recordPath(id: string): string {
  return path.join(BLOCKERS_DIR, `${id}.json`)
}

export async function createBlocker(input: {
  description: string
  context?: Record<string, unknown>
  severity?: "low" | "medium" | "high" | "critical"
}): Promise<BlockerRecord> {
  await ensureDir()
  const blocker: BlockerRecord = {
    id: makeId(),
    description: input.description,
    context: input.context ?? {},
    status: "open",
    severity: input.severity ?? "medium",
    createdAt: now(),
  }
  await fs.writeFile(recordPath(blocker.id), JSON.stringify(blocker, null, 2) + "\n", "utf8")
  return blocker
}

export async function updateBlocker(id: string, update: Partial<BlockerRecord>): Promise<BlockerRecord> {
  const blocker = await readBlocker(id)
  Object.assign(blocker, update, { updatedAt: now() })
  await fs.writeFile(recordPath(id), JSON.stringify(blocker, null, 2) + "\n", "utf8")
  return blocker
}

export async function readBlocker(id: string): Promise<BlockerRecord> {
  const raw = await fs.readFile(recordPath(id), "utf8")
  return JSON.parse(raw) as BlockerRecord
}

export async function listBlockers(status?: BlockerRecord["status"]): Promise<BlockerRecord[]> {
  await ensureDir()
  const files = await fs.readdir(BLOCKERS_DIR)
  const blockers: BlockerRecord[] = []
  for (const file of files.filter((f: string) => f.endsWith(".json"))) {
    try {
      const b = JSON.parse(await fs.readFile(path.join(BLOCKERS_DIR, file), "utf8")) as BlockerRecord
      if (!status || b.status === status) blockers.push(b)
    } catch {
      // skip damaged records
    }
  }
  return blockers.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export function shouldStartRat(blocker: BlockerRecord): boolean {
  return blocker.status === "open" && blocker.severity !== "low"
}
