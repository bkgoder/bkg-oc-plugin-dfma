import * as os from "node:os"
import * as path from "node:path"
import { runtimeRoot } from "../core/store"
import type { SyncConfig, SyncPathSpec } from "./types"

const home = os.homedir()

export function defaultSyncConfig(): SyncConfig {
  return {
    repo: undefined,
    includeSecrets: false,
    includeSessions: false,
    includePromptStash: false,
    includeModelFavorites: true,
    includeOpencodeSkills: true,
    includeAgentsDir: true,
    includeBkgPluginState: true,
    includeBkgAssets: true,
    extraConfigPaths: [],
    extraSecretPaths: [],
  }
}

export function defaultSyncPaths(config: SyncConfig = defaultSyncConfig()): SyncPathSpec[] {
  const specs: SyncPathSpec[] = [
    {
      id: "opencode-json",
      path: path.join(home, ".config", "opencode", "opencode.json"),
      kind: "file",
      secret: false,
      optional: true,
      description: "OpenCode JSON config",
    },
    {
      id: "opencode-jsonc",
      path: path.join(home, ".config", "opencode", "opencode.jsonc"),
      kind: "file",
      secret: false,
      optional: true,
      description: "OpenCode JSONC config",
    },
    {
      id: "opencode-agents-md",
      path: path.join(home, ".config", "opencode", "AGENTS.md"),
      kind: "file",
      secret: false,
      optional: true,
      description: "Global OpenCode agent guidance",
    },
  ]

  if (config.includeOpencodeSkills) {
    specs.push({
      id: "opencode-skills",
      path: path.join(home, ".config", "opencode", "skills"),
      kind: "directory",
      secret: false,
      optional: true,
      description: "OpenCode skills directory",
    })
  }

  if (config.includeAgentsDir) {
    specs.push({
      id: "agents-dir",
      path: path.join(home, ".agents"),
      kind: "directory",
      secret: false,
      optional: true,
      description: "Shared agents directory",
    })
  }

  if (config.includeModelFavorites) {
    specs.push({
      id: "model-favorites",
      path: path.join(home, ".local", "state", "opencode", "model.json"),
      kind: "file",
      secret: false,
      optional: true,
      description: "OpenCode model favorites",
    })
  }

  if (config.includePromptStash) {
    specs.push(
      {
        id: "prompt-stash",
        path: path.join(home, ".local", "state", "opencode", "prompt-stash.jsonl"),
        kind: "file",
        secret: true,
        optional: true,
        description: "Prompt stash history",
      },
      {
        id: "prompt-history",
        path: path.join(home, ".local", "state", "opencode", "prompt-history.jsonl"),
        kind: "file",
        secret: true,
        optional: true,
        description: "Prompt history",
      },
    )
  }

  if (config.includeBkgPluginState) {
    specs.push({
      id: "bkg-plugin-state",
      path: runtimeRoot(),
      kind: "directory",
      secret: false,
      optional: true,
      description: "BKG plugin runtime state",
    })
  }

  for (const [index, extraPath] of config.extraConfigPaths.entries()) {
    specs.push({
      id: `extra-config-${index + 1}`,
      path: extraPath,
      kind: "file",
      secret: false,
      optional: true,
      description: "Extra user configured sync path",
    })
  }

  if (config.includeSecrets) {
    specs.push(
      {
        id: "opencode-auth",
        path: path.join(home, ".local", "share", "opencode", "auth.json"),
        kind: "file",
        secret: true,
        optional: true,
        description: "OpenCode auth file",
      },
      {
        id: "opencode-mcp-auth",
        path: path.join(home, ".local", "share", "opencode", "mcp-auth.json"),
        kind: "file",
        secret: true,
        optional: true,
        description: "OpenCode MCP auth file",
      },
    )

    for (const [index, extraPath] of config.extraSecretPaths.entries()) {
      specs.push({
        id: `extra-secret-${index + 1}`,
        path: extraPath,
        kind: "file",
        secret: true,
        optional: true,
        description: "Extra user configured secret sync path",
      })
    }
  }

  return specs
}
