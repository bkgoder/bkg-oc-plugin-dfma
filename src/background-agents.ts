import * as fs from "node:fs/promises"
import * as os from "node:os"
import * as path from "node:path"
import { type Plugin, tool } from "@opencode-ai/plugin"
import { adjectives, animals, colors, uniqueNamesGenerator } from "unique-names-generator"
import { createSyncService, defaultSyncConfig } from "./sync/index.js"

export interface DelegationRecord {
  id: string
  prompt: string
  agent: string
  status: "registered" | "running" | "complete" | "error" | "timeout"
  title: string
  description: string
  createdAt: string
  updatedAt: string
  filePath: string
  result?: string
  error?: string
}

const DEFAULT_TIMEOUT_MS = 15 * 60 * 1000

function delegationRoot() {
  return path.join(os.homedir(), ".local", "share", "opencode", "delegations")
}

function makeId() {
  return uniqueNamesGenerator({
    dictionaries: [adjectives, colors, animals],
    separator: "-",
    length: 3,
    style: "lowerCase",
  })
}

function summarize(text: string) {
  const first = text.split("\n").find((line) => line.trim().length > 0)?.trim() ?? "Delegation"
  return {
    title: first.slice(0, 48),
    description: text.slice(0, 180),
  }
}

async function ensureRoot() {
  await fs.mkdir(delegationRoot(), { recursive: true })
}

async function recordPath(id: string) {
  await ensureRoot()
  return path.join(delegationRoot(), `${id}.json`)
}

async function markdownPath(id: string) {
  await ensureRoot()
  return path.join(delegationRoot(), `${id}.md`)
}

async function writeRecord(record: DelegationRecord) {
  await fs.writeFile(await recordPath(record.id), JSON.stringify(record, null, 2) + "\n", "utf8")
}

async function readRecord(id: string): Promise<DelegationRecord> {
  const content = await fs.readFile(await recordPath(id), "utf8")
  return JSON.parse(content) as DelegationRecord
}

async function listRecords(): Promise<DelegationRecord[]> {
  await ensureRoot()
  const files = await fs.readdir(delegationRoot())
  const records: DelegationRecord[] = []
  for (const file of files.filter((f: string) => f.endsWith(".json"))) {
    try {
      records.push(JSON.parse(await fs.readFile(path.join(delegationRoot(), file), "utf8")) as DelegationRecord)
    } catch {
      // Ignore damaged records
    }
  }
  return records.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

async function persistMarkdown(record: DelegationRecord) {
  const md = [
    `# ${record.title}`,
    "",
    `- id: ${record.id}`,
    `- agent: ${record.agent}`,
    `- status: ${record.status}`,
    `- created: ${record.createdAt}`,
    `- updated: ${record.updatedAt}`,
    "",
    "## Prompt",
    "",
    record.prompt,
    "",
    "## Result",
    "",
    record.result ?? record.error ?? "No result yet.",
    "",
  ].join("\n")
  await fs.writeFile(await markdownPath(record.id), md, "utf8")
}

async function runDelegation(prompt: string, agent: string, timeoutMs = DEFAULT_TIMEOUT_MS): Promise<DelegationRecord> {
  const id = makeId()
  const now = new Date().toISOString()
  const meta = summarize(prompt)
  const record: DelegationRecord = {
    id,
    prompt,
    agent,
    status: "running",
    title: meta.title,
    description: meta.description,
    createdAt: now,
    updatedAt: now,
    filePath: await markdownPath(id),
  }
  await writeRecord(record)
  await persistMarkdown(record)

  const terminal = new Date().toISOString()
  const completed: DelegationRecord = {
    ...record,
    status: "complete",
    updatedAt: terminal,
    result: [
      `Delegation registered for agent: ${agent}`,
      "",
      "The prompt was persisted as a durable background-agent artifact.",
      "Read this artifact with delegation_read(id).",
      "",
      "Prompt:",
      prompt,
      "",
      `Timeout budget: ${timeoutMs}ms`,
    ].join("\n"),
  }
  await writeRecord(completed)
  await persistMarkdown(completed)
  return completed
}

export function createBackgroundAgentsPlugin(): Plugin {
  return async () => ({
    tool: {
      delegate: tool({
        description: "Persist a background delegation request and return an id for later retrieval.",
        args: {
          prompt: tool.schema.string().describe("Research/task prompt to delegate."),
          agent: tool.schema.string().describe("Read-only subagent name to delegate to."),
        },
        async execute(args) {
          const record = await runDelegation(args.prompt, args.agent)
          return JSON.stringify({
            id: record.id,
            status: record.status,
            title: record.title,
            description: record.description,
            filePath: record.filePath,
          }, null, 2)
        },
      }),
      delegation_read: tool({
        description: "Read a persisted background delegation artifact by id.",
        args: {
          id: tool.schema.string().describe("Delegation id returned by delegate()."),
        },
        async execute(args) {
          const record = await readRecord(args.id)
          return JSON.stringify(record, null, 2)
        },
      }),
      delegation_list: tool({
        description: "List persisted background delegations with titles, status and artifact paths.",
        args: {},
        async execute() {
          const records = await listRecords()
          return JSON.stringify(records.map((r) => ({
            id: r.id,
            status: r.status,
            agent: r.agent,
            title: r.title,
            description: r.description,
            filePath: r.filePath,
            updatedAt: r.updatedAt,
          })), null, 2)
        },
      }),
      sync_status: tool({
        description: "Show OpenCode configuration sync status without changing files.",
        args: {},
        async execute() {
          return JSON.stringify(await createSyncService(defaultSyncConfig()).status(), null, 2)
        },
      }),
      sync_push: tool({
        description: "Copy configured OpenCode files into the sync repository, commit and push them.",
        args: {
          message: tool.schema.string().optional().describe("Optional git commit message."),
        },
        async execute(args) {
          return JSON.stringify(await createSyncService(defaultSyncConfig()).push(args.message), null, 2)
        },
      }),
      sync_pull: tool({
        description: "Fast-forward the sync repository and restore configured OpenCode files with backups.",
        args: {},
        async execute() {
          return JSON.stringify(await createSyncService(defaultSyncConfig()).pull(), null, 2)
        },
      }),
    },
  })
}
