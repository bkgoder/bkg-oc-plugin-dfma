export interface MemoryRecord {
  id: string
  key: string
  content: string
  worktree?: string
  metadata?: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

export interface MemoryQuery {
  key?: string
  worktree?: string
  search?: string
  limit?: number
  offset?: number
}

export interface MemoryStore {
  append(record: Omit<MemoryRecord, "id" | "createdAt" | "updatedAt">): Promise<MemoryRecord>
  read(id: string): Promise<MemoryRecord | null>
  list(query?: MemoryQuery): Promise<MemoryRecord[]>
  search(query: string, worktree?: string): Promise<MemoryRecord[]>
  remove(id: string): Promise<void>
}

export interface ExternalRecallAdapter {
  name: string
  recall(query: string, context?: Record<string, unknown>): Promise<string | null>
  store(key: string, content: string, metadata?: Record<string, unknown>): Promise<void>
}
