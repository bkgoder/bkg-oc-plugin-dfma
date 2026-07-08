import * as fs from "node:fs/promises"
import * as path from "node:path"
import * as os from "node:os"
import type { MemoryRecord } from "./types.js"

function worktreeDir(worktree: string): string {
  const safe = worktree.replace(/[^a-zA-Z0-9_-]/g, "_")
  return path.join(os.homedir(), ".local", "share", "opencode", "memory", "worktrees", safe)
}

export async function readWorktreeMemory(worktree: string): Promise<MemoryRecord[]> {
  const dir = worktreeDir(worktree)
  try {
    const raw = await fs.readFile(path.join(dir, "memory.json"), "utf8")
    return JSON.parse(raw) as MemoryRecord[]
  } catch {
    return []
  }
}

export async function appendWorktreeMemory(worktree: string, record: Omit<MemoryRecord, "id" | "createdAt" | "updatedAt">): Promise<MemoryRecord> {
  const dir = worktreeDir(worktree)
  await fs.mkdir(dir, { recursive: true })
  const records = await readWorktreeMemory(worktree)
  const entry: MemoryRecord = {
    id: crypto.randomUUID(),
    ...record,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  records.push(entry)
  await fs.writeFile(path.join(dir, "memory.json"), JSON.stringify(records, null, 2) + "\n", "utf8")
  return entry
}

export async function syncWorktreeMemory(worktree: string, targetDir: string): Promise<void> {
  const records = await readWorktreeMemory(worktree)
  await fs.mkdir(targetDir, { recursive: true })
  await fs.writeFile(path.join(targetDir, `worktree-${worktree.replace(/[^a-zA-Z0-9_-]/g, "_")}-memory.json`), JSON.stringify(records, null, 2) + "\n", "utf8")
}
