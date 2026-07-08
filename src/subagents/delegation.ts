import * as fs from "node:fs/promises"
import * as path from "node:path"
import * as os from "node:os"
import { adjectives, animals, colors, uniqueNamesGenerator } from "unique-names-generator"

export interface SubDelegation {
  id: string
  parentId?: string
  prompt: string
  agent: string
  status: "pending" | "running" | "complete" | "error" | "timeout"
  title: string
  description: string
  createdAt: string
  updatedAt: string
  result?: string
  error?: string
  subtaskIds: string[]
}

const DELEGATIONS_DIR = path.join(os.homedir(), ".local", "share", "opencode", "delegations")

function makeId(): string {
  return uniqueNamesGenerator({
    dictionaries: [adjectives, colors, animals],
    separator: "-",
    length: 3,
    style: "lowerCase",
  })
}

async function ensureDir(): Promise<void> {
  await fs.mkdir(DELEGATIONS_DIR, { recursive: true })
}

function recordPath(id: string): string {
  return path.join(DELEGATIONS_DIR, `${id}.json`)
}

export async function createDelegation(input: {
  prompt: string
  agent: string
  parentId?: string
}): Promise<SubDelegation> {
  await ensureDir()
  const id = makeId()
  const now = new Date().toISOString()
  const title = input.prompt.split("\n").find((l) => l.trim().length > 0)?.trim().slice(0, 48) ?? "Delegation"
  const record: SubDelegation = {
    id,
    parentId: input.parentId,
    prompt: input.prompt,
    agent: input.agent,
    status: "pending",
    title,
    description: input.prompt.slice(0, 180),
    createdAt: now,
    updatedAt: now,
    subtaskIds: [],
  }
  await fs.writeFile(recordPath(id), JSON.stringify(record, null, 2) + "\n", "utf8")
  return record
}

export async function updateDelegation(id: string, update: Partial<SubDelegation>): Promise<SubDelegation> {
  const record = await readDelegation(id)
  Object.assign(record, update, { updatedAt: new Date().toISOString() })
  await fs.writeFile(recordPath(id), JSON.stringify(record, null, 2) + "\n", "utf8")
  return record
}

export async function readDelegation(id: string): Promise<SubDelegation> {
  const raw = await fs.readFile(recordPath(id), "utf8")
  return JSON.parse(raw) as SubDelegation
}

export async function listDelegations(parentId?: string): Promise<SubDelegation[]> {
  await ensureDir()
  const files = await fs.readdir(DELEGATIONS_DIR)
  const records: SubDelegation[] = []
  for (const file of files.filter((f: string) => f.endsWith(".json"))) {
    try {
      const r = JSON.parse(await fs.readFile(path.join(DELEGATIONS_DIR, file), "utf8")) as SubDelegation
      if (!parentId || r.parentId === parentId) {
        records.push(r)
      }
    } catch {
      // skip damaged records
    }
  }
  return records.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}
