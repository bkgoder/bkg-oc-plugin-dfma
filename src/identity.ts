import { readFileSync, readdirSync } from "node:fs"
import { resolve, dirname, basename } from "node:path"
import { fileURLToPath } from "node:url"
import { getPersonality } from "./personality.js"

export interface AgentIdentity {
  id: string
  name: string
  role: string
  description: string
  mode: "primary" | "council" | "vote" | "support"
  personality: string
  tools: string[]
  temperature: number
}

export interface IdentityRegistry {
  get(id: string): AgentIdentity | undefined
  list(): AgentIdentity[]
  listByRole(role: string): AgentIdentity[]
}

function parseValue(value: string): unknown {
  const v = value.trim()
  if (v === "true") return true
  if (v === "false") return false
  if (/^-?\d+(\.\d+)?$/.test(v)) return Number(v)
  return v.replace(/^["']|["']$/g, "")
}

function parseFrontmatter(content: string): Record<string, unknown> {
  const firstSep = content.indexOf("---")
  if (firstSep !== 0) return { _body: content.trim() }

  const secondSep = content.indexOf("---", 3)
  if (secondSep === -1) return { _body: content.trim() }

  const raw = content.slice(3, secondSep).trim()
  const body = content.slice(secondSep + 3).trim()

  const result: Record<string, unknown> = {}
  const lines = raw.split("\n")
  let currentKey = ""
  let currentIsObj = false

  for (const line of lines) {
    const m = line.match(/^(\w[\w-]*):\s*(.*)$/)
    if (m) {
      currentKey = m[1]
      const val = m[2].trim()
      if (val === "") {
        result[currentKey] = {}
        currentIsObj = true
      } else {
        result[currentKey] = parseValue(val)
        currentIsObj = false
      }
    } else if (currentIsObj) {
      const sm = line.match(/^\s{2,}(\w[\w-]*):\s*(.*)$/)
      if (sm) {
        const obj = result[currentKey]
        if (typeof obj === "object" && obj !== null) {
          ;(obj as Record<string, unknown>)[sm[1]] = parseValue(sm[2])
        }
      }
    }
  }

  result._body = body
  return result
}

function deriveRole(id: string): string {
  const parts = id.split("-")
  return parts[parts.length - 1]
}

function deriveName(id: string, fm: Record<string, unknown>, role: string): string {
  const desc = fm.description
  if (typeof desc === "string") {
    const dot = desc.indexOf(".")
    if (dot > 0) return desc.slice(0, dot).trim()
    return desc.trim()
  }
  return role.charAt(0).toUpperCase() + role.slice(1)
}

function deriveTools(fm: Record<string, unknown>): string[] {
  const tools = fm.tools
  if (!tools || typeof tools !== "object") return []
  return Object.entries(tools as Record<string, unknown>)
    .filter(([, v]) => v === true)
    .map(([k]) => k)
}

function deriveMode(fm: Record<string, unknown>, role: string): "primary" | "council" | "vote" | "support" {
  if (fm.mode === "primary") return "primary"
  if (fm.mode === "council") return "council"
  if (fm.mode === "vote") return "vote"
  if (fm.mode === "support" || fm.mode === "subagent") return "support"
  if (role === "orchestrator") return "primary"
  if (role === "chair" || role === "recorder" || role === "auditor") return "vote"
  return "support"
}

function getDir(): string {
  return resolve(dirname(fileURLToPath(import.meta.url)), "../assets/opencode/agents")
}

export function createIdentityRegistry(): IdentityRegistry {
  let agents: AgentIdentity[] | undefined

  function load(): AgentIdentity[] {
    if (agents) return agents

    const dir = getDir()
    const files = readdirSync(dir).filter(f => f.endsWith(".md"))

    agents = files.map(file => {
      const id = basename(file, ".md")
      const content = readFileSync(resolve(dir, file), "utf-8")
      const fm = parseFrontmatter(content)
      const role = deriveRole(id)
      const preset = getPersonality(role)
      const description = typeof fm.description === "string"
        ? fm.description.trim()
        : deriveFirstParagraph(fm._body as string ?? "")

      return {
        id,
        name: deriveName(id, fm, role),
        role,
        description,
        mode: deriveMode(fm, role),
        personality: preset.tone,
        tools: deriveTools(fm),
        temperature: typeof fm.temperature === "number" ? fm.temperature : 0.2,
      } as AgentIdentity
    })

    return agents
  }

  return {
    get(id: string): AgentIdentity | undefined {
      return load().find(a => a.id === id)
    },
    list(): AgentIdentity[] {
      return load()
    },
    listByRole(role: string): AgentIdentity[] {
      return load().filter(a => a.role === role)
    },
  }
}

function deriveFirstParagraph(body: string): string {
  const para = body.split(/\n\n+/)[0] || body
  return para.trim()
}
