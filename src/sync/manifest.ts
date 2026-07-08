import { nowIso } from "../core/types"
import { defaultSyncConfig, defaultSyncPaths } from "./config"
import type { SyncConfig, SyncManifest, SyncStatus } from "./types"

export function buildSyncManifest(config: SyncConfig = defaultSyncConfig()): SyncManifest {
  const now = nowIso()
  return {
    version: 1,
    createdAt: now,
    updatedAt: now,
    config,
    paths: defaultSyncPaths(config),
  }
}

export function getSyncStatus(config: SyncConfig = defaultSyncConfig()): SyncStatus {
  const paths = defaultSyncPaths(config)
  const warnings: string[] = []

  if (!config.repo) {
    warnings.push("No sync repo configured. Sync can build a manifest but cannot push/pull yet.")
  }

  const secretPathCount = paths.filter((p) => p.secret).length
  if (secretPathCount > 0 && !config.includeSecrets) {
    warnings.push("Secret-like paths are present while includeSecrets is disabled.")
  }

  return {
    configured: Boolean(config.repo),
    repo: config.repo,
    pathCount: paths.length,
    secretPathCount,
    warnings,
  }
}
