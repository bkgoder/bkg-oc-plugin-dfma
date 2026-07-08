import * as fs from "node:fs/promises"
import * as path from "node:path"

export interface RuleEntry {
  file: string
  metadata: RuleMetadata
}

export interface RuleMetadata {
  keywords: string[]
  match: "any" | "all"
  description?: string
}

/**
 * Recursively find all .mdc files under dir, parse their frontmatter,
 * and return them as RuleEntry objects.
 */
export async function discoverRules(dir: string): Promise<RuleEntry[]> {
  const files: string[] = []

  async function walk(current: string) {
    const entries = await fs.readdir(current, { withFileTypes: true })
    for (const entry of entries) {
      const full = path.join(current, entry.name)
      if (entry.isDirectory()) {
        await walk(full)
      } else if (entry.isFile() && entry.name.endsWith(".mdc")) {
        files.push(full)
      }
    }
  }

  await walk(dir)

  const results: RuleEntry[] = []
  for (const file of files) {
    const content = await fs.readFile(file, "utf8")
    const metadata = getRuleMetadata(content)
    results.push({ file, metadata })
  }

  return results
}

/**
 * Validate a rule file's frontmatter.
 */
export function validateRule(content: string): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  const lines = content.split("\n")

  if (lines.length < 3 || lines[0].trim() !== "---") {
    return { valid: false, errors: ["Missing opening --- frontmatter delimiter"] }
  }

  const endIdx = lines.indexOf("---", 1)
  if (endIdx === -1) {
    return { valid: false, errors: ["Missing closing --- frontmatter delimiter"] }
  }

  const block = lines.slice(1, endIdx)
  const parsed: Record<string, unknown> = {}

  for (const line of block) {
    const colonIdx = line.indexOf(":")
    if (colonIdx === -1) continue
    const key = line.slice(0, colonIdx).trim()
    let value: string = line.slice(colonIdx + 1).trim()
    if (key === "keywords") {
      try {
        parsed[key] = JSON.parse(value)
      } catch {
        errors.push("keywords is not valid JSON")
        parsed[key] = []
      }
    } else {
      parsed[key] = value
    }
  }

  const kw = parsed.keywords
  if (!Array.isArray(kw) || kw.length === 0) {
    errors.push("keywords must be a non-empty array")
  }

  const match = parsed.match
  if (match !== "any" && match !== "all") {
    errors.push(`match must be "any" or "all", got "${String(match)}"`)
  }

  return { valid: errors.length === 0, errors }
}

/**
 * Copy all .mdc rule files from sourceDir to targetDir.
 */
export async function installRules(sourceDir: string, targetDir: string): Promise<void> {
  await fs.mkdir(targetDir, { recursive: true })
  const entries = await fs.readdir(sourceDir, { withFileTypes: true })
  for (const entry of entries) {
    if (entry.isFile() && entry.name.endsWith(".mdc")) {
      await fs.copyFile(path.join(sourceDir, entry.name), path.join(targetDir, entry.name))
    }
  }
}

/**
 * Parse and extract metadata from a rule file's frontmatter.
 */
export function getRuleMetadata(content: string): RuleMetadata {
  const lines = content.split("\n")

  if (lines.length < 3 || lines[0].trim() !== "---") {
    return { keywords: [], match: "any" }
  }

  const endIdx = lines.indexOf("---", 1)
  if (endIdx === -1) {
    return { keywords: [], match: "any" }
  }

  const block = lines.slice(1, endIdx)
  const parsed: Record<string, unknown> = {}

  for (const line of block) {
    const colonIdx = line.indexOf(":")
    if (colonIdx === -1) continue
    const key = line.slice(0, colonIdx).trim()
    let value: string = line.slice(colonIdx + 1).trim()
    if (key === "keywords") {
      try {
        parsed[key] = JSON.parse(value)
      } catch {
        parsed[key] = []
      }
    } else {
      parsed[key] = value
    }
  }

  const keywords = Array.isArray(parsed.keywords) ? (parsed.keywords as string[]) : []
  const match = parsed.match === "all" ? "all" : "any"
  const description = typeof parsed.description === "string" ? parsed.description : undefined

  return { keywords, match, description }
}
