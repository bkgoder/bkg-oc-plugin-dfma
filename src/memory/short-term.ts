import * as fs from "node:fs/promises"
import * as path from "node:path"
import * as os from "node:os"
import type { MemoryRecord, MemoryQuery, MemoryStore } from "./types.js"

function makeId(): string {
  return crypto.randomUUID()
}

function now(): string {
  return new Date().toISOString()
}

function storePath(): string {
  return path.join(os.homedir(), ".local", "share", "opencode", "memory", "short-term.json")
}

export function createShortTermMemory(): MemoryStore {
  let cache: MemoryRecord[] | null = null

  async function load(): Promise<MemoryRecord[]> {
    if (cache) return cache
    try {
      const raw = await fs.readFile(storePath(), "utf8")
      cache = JSON.parse(raw) as MemoryRecord[]
      return cache
    } catch {
      cache = []
      return cache
    }
  }

  async function save(): Promise<void> {
    if (!cache) return
    await fs.mkdir(path.dirname(storePath()), { recursive: true })
    await fs.writeFile(storePath(), JSON.stringify(cache, null, 2) + "\n", "utf8")
  }

  const store: MemoryStore = {
    async append(record) {
      const records = await load()
      const entry: MemoryRecord = {
        id: makeId(),
        key: record.key,
        content: record.content,
        worktree: record.worktree,
        metadata: record.metadata,
        createdAt: now(),
        updatedAt: now(),
      }
      records.push(entry)
      cache = records
      await save()
      return entry
    },

    async read(id: string) {
      const records = await load()
      return records.find((r) => r.id === id) ?? null
    },

    async list(query?: MemoryQuery) {
      let records = await load()
      if (query?.key) {
        records = records.filter((r) => r.key === query.key)
      }
      if (query?.worktree) {
        records = records.filter((r) => r.worktree === query.worktree)
      }
      if (query?.search) {
        const q = query.search.toLowerCase()
        records = records.filter((r) => r.content.toLowerCase().includes(q) || r.key.toLowerCase().includes(q))
      }
      const offset = query?.offset ?? 0
      const limit = query?.limit ?? 50
      return records.slice(offset, offset + limit)
    },

    async search(query: string, worktree?: string) {
      return store.list({ search: query, worktree })
    },

    async remove(id: string) {
      const records = await load()
      cache = records.filter((r) => r.id !== id)
      await save()
    },
  }

  return store
}
