import { execFile } from "node:child_process"
import * as fs from "node:fs/promises"
import * as path from "node:path"
import { promisify } from "node:util"
import { runtimeRoot } from "../core/store"
import { defaultSyncConfig, defaultSyncPaths } from "./config"
import { buildSyncManifest, getSyncStatus } from "./manifest"
import { expandHome, resolveSyncPlatformPaths } from "./paths"
import type { SyncConfig, SyncManifest, SyncOperationResult, SyncPathSpec, SyncStatus } from "./types"

const execFileAsync = promisify(execFile)

export interface SyncService {
  status(): Promise<SyncStatus>
  push(message?: string): Promise<SyncOperationResult>
  pull(): Promise<SyncOperationResult>
}

export function createSyncService(config: SyncConfig = defaultSyncConfig()): SyncService {
  return {
    async status() {
      const status = getSyncStatus(config)
      if (config.repo) {
        const repoPath = resolveLocalRepoPath(config)
        try {
          await fs.access(path.join(repoPath, ".git"))
        } catch {
          status.warnings.push(`Sync repository is not cloned at ${repoPath}.`)
        }
      }
      return status
    },
    async push(message = `Sync OpenCode config (${new Date().toISOString().slice(0, 10)})`) {
      const repoPath = await ensureRepository(config)
      await git(repoPath, ["pull", "--ff-only"])
      const specs = defaultSyncPaths(config)
      const files: string[] = []
      for (const spec of specs) {
        if (spec.secret && !config.includeSecrets) continue
        if (await copyToRepo(repoPath, spec)) files.push(spec.id)
      }
      await fs.writeFile(
        path.join(repoPath, "sync-manifest.json"),
        JSON.stringify(buildSyncManifest(config), null, 2) + "\n",
        "utf8",
      )
      await git(repoPath, ["add", "--all"])
      const changed = (await git(repoPath, ["status", "--porcelain"])).trim().length > 0
      let commit: string | undefined
      if (changed) {
        await git(repoPath, ["commit", "-m", message])
        commit = (await git(repoPath, ["rev-parse", "HEAD"])).trim()
        await git(repoPath, ["push", "origin", config.repo?.branch ?? "main"])
      }
      return { action: "push", repoPath, changed, files, commit }
    },
    async pull() {
      const repoPath = await ensureRepository(config)
      await git(repoPath, ["pull", "--ff-only"])
      const manifest = JSON.parse(
        await fs.readFile(path.join(repoPath, "sync-manifest.json"), "utf8"),
      ) as SyncManifest
      const backupPath = path.join(runtimeRoot(), "sync", "backups", safeTimestamp())
      const files: string[] = []
      const localSpecs = new Map(defaultSyncPaths(config).map((spec) => [spec.id, spec]))
      for (const remoteSpec of manifest.paths) {
        const localSpec = localSpecs.get(remoteSpec.id)
        if (!localSpec || (remoteSpec.secret && !config.includeSecrets)) continue
        if (await copyFromRepo(repoPath, localSpec, backupPath)) files.push(localSpec.id)
      }
      return { action: "pull", repoPath, changed: files.length > 0, files, backupPath }
    },
  }
}

function resolveLocalRepoPath(config: SyncConfig): string {
  if (!config.repo) throw new Error("Sync repository is not configured.")
  const roots = resolveSyncPlatformPaths()
  const configured = config.repo.localPath
  if (configured) return path.resolve(expandHome(configured, roots.home))
  const slug = config.repo.name ?? "opencode-sync"
  return path.join(runtimeRoot(), "sync", slug)
}

async function ensureRepository(config: SyncConfig): Promise<string> {
  if (!config.repo) throw new Error("Sync repository is not configured.")
  const repoPath = resolveLocalRepoPath(config)
  try {
    await fs.access(path.join(repoPath, ".git"))
    return repoPath
  } catch {
    const remote = config.repo.remote ??
      (config.repo.owner && config.repo.name
        ? `https://github.com/${config.repo.owner}/${config.repo.name}.git`
        : undefined)
    if (!remote) throw new Error("Sync repo needs remote or owner/name.")
    await fs.mkdir(path.dirname(repoPath), { recursive: true })
    await execFileAsync("git", ["clone", "--branch", config.repo.branch, remote, repoPath])
    return repoPath
  }
}

async function git(cwd: string, args: string[]): Promise<string> {
  try {
    const result = await execFileAsync("git", ["-C", cwd, ...args], { maxBuffer: 4 * 1024 * 1024 })
    return result.stdout
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error)
    throw new Error(`Git sync failed (${args.join(" ")}): ${detail}`)
  }
}

function repoItemPath(repoPath: string, spec: SyncPathSpec): string {
  return path.join(repoPath, "files", spec.id)
}

async function copyToRepo(repoPath: string, spec: SyncPathSpec): Promise<boolean> {
  const destination = repoItemPath(repoPath, spec)
  try {
    const stat = await fs.stat(spec.path)
    await fs.rm(destination, { recursive: true, force: true })
    await fs.mkdir(path.dirname(destination), { recursive: true })
    if (stat.isDirectory()) await fs.cp(spec.path, destination, { recursive: true })
    else await fs.copyFile(spec.path, destination)
    return true
  } catch (error) {
    if (spec.optional && isMissing(error)) return false
    throw error
  }
}

async function copyFromRepo(repoPath: string, spec: SyncPathSpec, backupPath: string): Promise<boolean> {
  const source = repoItemPath(repoPath, spec)
  try {
    const sourceStat = await fs.stat(source)
    try {
      const currentStat = await fs.stat(spec.path)
      const backup = path.join(backupPath, spec.id)
      await fs.mkdir(path.dirname(backup), { recursive: true })
      if (currentStat.isDirectory()) await fs.cp(spec.path, backup, { recursive: true })
      else await fs.copyFile(spec.path, backup)
    } catch (error) {
      if (!isMissing(error)) throw error
    }
    await fs.rm(spec.path, { recursive: true, force: true })
    await fs.mkdir(path.dirname(spec.path), { recursive: true })
    if (sourceStat.isDirectory()) await fs.cp(source, spec.path, { recursive: true })
    else await fs.copyFile(source, spec.path)
    return true
  } catch (error) {
    if (spec.optional && isMissing(error)) return false
    throw error
  }
}

function isMissing(error: unknown): boolean {
  return Boolean(error && typeof error === "object" && "code" in error && error.code === "ENOENT")
}

function safeTimestamp(): string {
  return new Date().toISOString().replace(/[:.]/g, "-")
}
