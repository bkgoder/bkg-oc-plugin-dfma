import * as fs from "node:fs/promises"
import * as os from "node:os"
import * as path from "node:path"
import { type Plugin, tool } from "@opencode-ai/plugin"
import { createSyncService, defaultSyncConfig } from "./sync/index.js"
import { checkConfiguredPluginUpdates, defaultUpdateNotifierConfig } from "./update-notifier/index.js"
import { openReviewGate } from "./review-gate/index.js"
import {
  createDelegation,
  listDelegations,
  readDelegation,
  updateDelegation,
} from "./subagents/delegation.js"
import { createSubtask, listSubtasks } from "./subagents/subtasks.js"
import { captureOutput, listOutputs } from "./subagents/output-capture.js"
import { createLiveOutputReporter } from "./live-output/index.js"

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
const liveOutputReporter = createLiveOutputReporter()

function delegationRoot() {
  return path.join(os.homedir(), ".local", "share", "opencode", "delegations")
}

function makeId() {
  return `delegation-${crypto.randomUUID()}`
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
    event: async ({ event }) => {
      liveOutputReporter.handle(event)
    },
    tool: {
      delegate: tool({
        description: "Create a durable pending delegation and registration output.",
        args: {
          prompt: tool.schema.string().describe("Research/task prompt to delegate."),
          agent: tool.schema.string().describe("Read-only subagent name to delegate to."),
        },
        async execute(args) {
          const record = await createDelegation(args)
          const output = await captureOutput({
            agentId: args.agent,
            delegationId: record.id,
            content: `Delegation registered for ${args.agent}.\n\n${args.prompt}`,
            metadata: { kind: "registration" },
          })
          return JSON.stringify({
            id: record.id,
            status: record.status,
            title: record.title,
            description: record.description,
            outputId: output.id,
          }, null, 2)
        },
      }),
      delegation_read: tool({
        description: "Read a delegation together with linked subtasks and outputs.",
        args: {
          id: tool.schema.string().describe("Delegation id returned by delegate()."),
        },
        async execute(args) {
          const [delegation, subtasks, outputs] = await Promise.all([
            readDelegation(args.id),
            listSubtasks(args.id),
            listOutputs(undefined, args.id),
          ])
          return JSON.stringify({ delegation, subtasks, outputs }, null, 2)
        },
      }),
      delegation_list: tool({
        description: "List persisted background delegations with titles, status and artifact paths.",
        args: {},
        async execute() {
          const records = await listDelegations()
          return JSON.stringify(records.map((r) => ({
            id: r.id,
            status: r.status,
            agent: r.agent,
            title: r.title,
            description: r.description,
            subtaskCount: r.subtaskIds.length,
            updatedAt: r.updatedAt,
          })), null, 2)
        },
      }),
      delegation_update: tool({
        description: "Update delegation lifecycle status and optionally persist a result or error.",
        args: {
          id: tool.schema.string().describe("Delegation id."),
          status: tool.schema.enum(["pending", "running", "complete", "error", "timeout"]),
          result: tool.schema.string().optional(),
          error: tool.schema.string().optional(),
        },
        async execute(args) {
          const record = await updateDelegation(args.id, {
            status: args.status,
            result: args.result,
            error: args.error,
          })
          if (args.result || args.error) {
            await captureOutput({
              agentId: record.agent,
              delegationId: record.id,
              content: args.result ?? args.error ?? "",
              metadata: { kind: args.error ? "error" : "result", status: args.status },
            })
          }
          return JSON.stringify(record, null, 2)
        },
      }),
      delegation_subtask_create: tool({
        description: "Create and link a persistent subtask under a delegation.",
        args: {
          delegationId: tool.schema.string(),
          description: tool.schema.string(),
          assignedAgent: tool.schema.string().optional(),
        },
        async execute(args) {
          const delegation = await readDelegation(args.delegationId)
          const subtask = await createSubtask(args)
          await updateDelegation(delegation.id, {
            subtaskIds: [...new Set([...delegation.subtaskIds, subtask.id])],
          })
          return JSON.stringify(subtask, null, 2)
        },
      }),
      delegation_output_capture: tool({
        description: "Persist output linked to a delegation or subtask.",
        args: {
          agentId: tool.schema.string(),
          content: tool.schema.string(),
          delegationId: tool.schema.string().optional(),
          subtaskId: tool.schema.string().optional(),
        },
        async execute(args) {
          if (!args.delegationId && !args.subtaskId) {
            throw new Error("delegationId or subtaskId is required")
          }
          return JSON.stringify(await captureOutput(args), null, 2)
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
      update_check: tool({
        description: "Check pinned OpenCode plugin refs for newer versions without changing files. Returns suggested update prompts.",
        args: {},
        async execute() {
          const summary = await checkConfiguredPluginUpdates(defaultUpdateNotifierConfig())
          const prompts = summary.updates
            .filter((item) => item.updateAvailable)
            .map((item) => ({
              plugin: item.plugin.name,
              currentVersion: item.plugin.currentVersion,
              latestVersion: item.latestVersion,
              question: `Update ${item.plugin.name} from ${item.plugin.currentVersion} to ${item.latestVersion}?`,
            }))
          return JSON.stringify({ ...summary, prompts }, null, 2)
        },
      }),
      open_review_gate: tool({
        description: "Open a local, short-lived review gate for a blocker, Rat decision, or manual review.",
        args: {
          title: tool.schema.string().describe("Review title."),
          content: tool.schema.string().describe("Plan, decision, or blocker content to review."),
          trigger: tool.schema.enum(["rat", "blocker", "manual", "agent"]).describe("Reason for opening review."),
          target: tool.schema.string().optional().describe("Primary file or artifact being reviewed."),
          blockerId: tool.schema.string().optional().describe("Related blocker id."),
          ratSessionId: tool.schema.string().optional().describe("Related Rat session id."),
          workflow: tool.schema.enum(["rat-only", "blocker-only", "manual", "all-agents", "user-managed"]).optional(),
          timeoutMs: tool.schema.number().int().positive().max(3_600_000).optional(),
        },
        async execute(args, context) {
          const result = await openReviewGate({
            title: args.title,
            content: args.content,
            trigger: args.trigger,
            target: args.target,
            blockerId: args.blockerId,
            ratSessionId: args.ratSessionId,
            workflow: args.workflow,
            actorRole: context.agent,
            metadata: {
              sessionId: context.sessionID,
              worktree: context.worktree,
            },
          }, { timeoutMs: args.timeoutMs })
          return JSON.stringify(result, null, 2)
        },
      }),
    },
  })
}
