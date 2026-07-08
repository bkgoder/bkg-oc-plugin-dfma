import * as fs from "node:fs/promises"
import * as path from "node:path"
import * as os from "node:os"

export interface AgentRunOutput {
  id: string
  agentId: string
  delegationId?: string
  subtaskId?: string
  content: string
  metadata?: Record<string, unknown>
  createdAt: string
}

const OUTPUT_DIR = path.join(os.homedir(), ".local", "share", "opencode", "outputs")

function makeId(): string {
  return `out-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

async function ensureDir(): Promise<void> {
  await fs.mkdir(OUTPUT_DIR, { recursive: true })
}

export async function captureOutput(input: {
  agentId: string
  delegationId?: string
  subtaskId?: string
  content: string
  metadata?: Record<string, unknown>
}): Promise<AgentRunOutput> {
  await ensureDir()
  const output: AgentRunOutput = {
    id: makeId(),
    agentId: input.agentId,
    delegationId: input.delegationId,
    subtaskId: input.subtaskId,
    content: input.content,
    metadata: input.metadata,
    createdAt: new Date().toISOString(),
  }
  await fs.writeFile(
    path.join(OUTPUT_DIR, `${output.id}.json`),
    JSON.stringify(output, null, 2) + "\n",
    "utf8",
  )
  return output
}

export async function readOutput(id: string): Promise<AgentRunOutput | null> {
  try {
    const raw = await fs.readFile(path.join(OUTPUT_DIR, `${id}.json`), "utf8")
    return JSON.parse(raw) as AgentRunOutput
  } catch {
    return null
  }
}

export async function listOutputs(agentId?: string, delegationId?: string): Promise<AgentRunOutput[]> {
  await ensureDir()
  const files = await fs.readdir(OUTPUT_DIR)
  const outputs: AgentRunOutput[] = []
  for (const file of files.filter((f: string) => f.endsWith(".json"))) {
    try {
      const o = JSON.parse(await fs.readFile(path.join(OUTPUT_DIR, file), "utf8")) as AgentRunOutput
      if (agentId && o.agentId !== agentId) continue
      if (delegationId && o.delegationId !== delegationId) continue
      outputs.push(o)
    } catch {
      // skip damaged records
    }
  }
  return outputs.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}
