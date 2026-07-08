export interface SyncRepoConfig {
  owner?: string
  name?: string
  branch: string
  remote?: string
}

export interface SyncConfig {
  repo?: SyncRepoConfig
  includeSecrets: boolean
  includeSessions: boolean
  includePromptStash: boolean
  includeModelFavorites: boolean
  includeOpencodeSkills: boolean
  includeAgentsDir: boolean
  includeBkgPluginState: boolean
  includeBkgAssets: boolean
  extraConfigPaths: string[]
  extraSecretPaths: string[]
}

export interface SyncPathSpec {
  id: string
  path: string
  kind: "file" | "directory"
  secret: boolean
  optional: boolean
  description: string
}

export interface SyncManifest {
  version: 1
  createdAt: string
  updatedAt: string
  config: SyncConfig
  paths: SyncPathSpec[]
}

export interface SyncStatus {
  configured: boolean
  repo?: SyncRepoConfig
  pathCount: number
  secretPathCount: number
  warnings: string[]
}
