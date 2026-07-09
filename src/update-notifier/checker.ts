import { execFile } from "node:child_process"
import * as fs from "node:fs/promises"
import * as os from "node:os"
import * as path from "node:path"
import { promisify } from "node:util"
import { extractPinnedPluginsFromConfig } from "./parser.js"
import type { PinnedPluginRef, PluginUpdateInfo, UpdateNotifierConfig, UpdateNotifierSummary } from "./types.js"

const execFileAsync = promisify(execFile)

export function defaultUpdateNotifierConfig(env: NodeJS.ProcessEnv = process.env): UpdateNotifierConfig {
  const configRoot = env.OPENCODE_CONFIG_DIR ?? path.join(os.homedir(), ".config", "opencode")
  return {
    cacheTtlMs: Number(env.BKG_OC_UPDATE_CACHE_TTL_MS ?? 6 * 60 * 60 * 1000),
    cachePath: path.join(os.homedir(), ".local", "share", "bkg-oc-plugin-bkg-dfma", "update-cache.json"),
    configPaths: [
      path.join(configRoot, "opencode.json"),
      path.join(configRoot, "opencode.jsonc"),
    ],
  }
}

export async function checkConfiguredPluginUpdates(
  config: UpdateNotifierConfig = defaultUpdateNotifierConfig(),
): Promise<UpdateNotifierSummary> {
  const warnings: string[] = []
  const plugins = await readPinnedPlugins(config.configPaths, warnings)
  const updates: PluginUpdateInfo[] = []

  for (const plugin of plugins) {
    updates.push(await checkPluginUpdate(plugin))
  }

  const summary: UpdateNotifierSummary = {
    checkedAt: new Date().toISOString(),
    updates,
    updateCount: updates.filter((item) => item.updateAvailable).length,
    warnings,
  }

  if (config.cachePath) {
    await fs.mkdir(path.dirname(config.cachePath), { recursive: true })
    await fs.writeFile(config.cachePath, JSON.stringify(summary, null, 2) + "\n", "utf8")
  }

  return summary
}

async function readPinnedPlugins(configPaths: string[], warnings: string[]): Promise<PinnedPluginRef[]> {
  const byRaw = new Map<string, PinnedPluginRef>()
  for (const configPath of configPaths) {
    try {
      const raw = await fs.readFile(configPath, "utf8")
      const parsed = JSON.parse(stripJsonComments(raw))
      for (const plugin of extractPinnedPluginsFromConfig(parsed)) {
        byRaw.set(plugin.raw, plugin)
      }
    } catch (error) {
      if (isMissing(error)) continue
      warnings.push(`Could not read update config ${configPath}: ${error instanceof Error ? error.message : String(error)}`)
    }
  }
  return [...byRaw.values()]
}

async function checkPluginUpdate(plugin: PinnedPluginRef): Promise<PluginUpdateInfo> {
  const checkedAt = new Date().toISOString()
  try {
    const latestVersion = plugin.kind === "npm"
      ? await latestNpmVersion(plugin.name)
      : await latestGitHubTagVersion(plugin.source ?? plugin.name)
    return {
      plugin,
      latestVersion,
      updateAvailable: compareSemver(latestVersion, plugin.currentVersion) > 0,
      checkedAt,
    }
  } catch (error) {
    return {
      plugin,
      updateAvailable: false,
      checkedAt,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

async function latestNpmVersion(name: string): Promise<string> {
  const { stdout } = await execFileAsync("npm", ["view", name, "version", "--json"], { timeout: 20_000, maxBuffer: 1024 * 1024 })
  const parsed = JSON.parse(stdout.trim())
  if (typeof parsed !== "string") throw new Error(`npm returned no version for ${name}`)
  return parsed.replace(/^v/, "")
}

async function latestGitHubTagVersion(source: string): Promise<string> {
  const remote = source.startsWith("http") ? source : `https://github.com/${source}.git`
  const { stdout } = await execFileAsync("git", ["ls-remote", "--tags", remote], { timeout: 20_000, maxBuffer: 4 * 1024 * 1024 })
  const versions = stdout
    .split("\n")
    .map((line) => line.match(/refs\/tags\/v?(\d+\.\d+\.\d+(?:[-+][A-Za-z0-9.-]+)?)(?:\^\{\})?$/)?.[1])
    .filter((item): item is string => Boolean(item))
  versions.sort(compareSemver)
  const latest = versions.at(-1)
  if (!latest) throw new Error(`No semver tags found for ${source}`)
  return latest.replace(/^v/, "")
}

function stripJsonComments(raw: string): string {
  return raw
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|\s)\/\/.*$/gm, "$1")
}

function compareSemver(a: string, b: string): number {
  const left = parseSemver(a)
  const right = parseSemver(b)
  for (let i = 0; i < 3; i += 1) {
    if (left[i] !== right[i]) return left[i] - right[i]
  }
  return 0
}

function parseSemver(version: string): [number, number, number] {
  const match = version.replace(/^v/, "").match(/^(\d+)\.(\d+)\.(\d+)/)
  if (!match) return [0, 0, 0]
  return [Number(match[1]), Number(match[2]), Number(match[3])]
}

function isMissing(error: unknown): boolean {
  return Boolean(error && typeof error === "object" && "code" in error && error.code === "ENOENT")
}
