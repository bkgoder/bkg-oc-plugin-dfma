import * as path from "node:path";
import { runtimeRoot } from "../core/store";
import { resolveSyncPlatformPaths } from "./paths";
export function defaultSyncConfig() {
    const remote = process.env.BKG_OPENCODE_SYNC_REPO;
    const repo = remote
        ? {
            remote,
            branch: process.env.BKG_OPENCODE_SYNC_BRANCH ?? "main",
            localPath: process.env.BKG_OPENCODE_SYNC_LOCAL_PATH,
        }
        : undefined;
    return {
        repo,
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
    };
}
export function defaultSyncPaths(config = defaultSyncConfig(), env = process.env, platform = process.platform) {
    const roots = resolveSyncPlatformPaths(env, platform);
    const pathApi = platform === "win32" ? path.win32 : path.posix;
    const configRoot = pathApi.join(roots.config, "opencode");
    const dataRoot = pathApi.join(roots.data, "opencode");
    const stateRoot = pathApi.join(roots.state, "opencode");
    const specs = [
        {
            id: "opencode-json",
            path: pathApi.join(configRoot, "opencode.json"),
            kind: "file",
            secret: false,
            optional: true,
            description: "OpenCode JSON config",
        },
        {
            id: "opencode-jsonc",
            path: pathApi.join(configRoot, "opencode.jsonc"),
            kind: "file",
            secret: false,
            optional: true,
            description: "OpenCode JSONC config",
        },
        {
            id: "opencode-agents-md",
            path: pathApi.join(configRoot, "AGENTS.md"),
            kind: "file",
            secret: false,
            optional: true,
            description: "Global OpenCode agent guidance",
        },
    ];
    if (config.includeOpencodeSkills) {
        specs.push({
            id: "opencode-skills",
            path: pathApi.join(configRoot, "skills"),
            kind: "directory",
            secret: false,
            optional: true,
            description: "OpenCode skills directory",
        });
    }
    if (config.includeAgentsDir) {
        specs.push({
            id: "agents-dir",
            path: pathApi.join(roots.home, ".agents"),
            kind: "directory",
            secret: false,
            optional: true,
            description: "Shared agents directory",
        });
    }
    if (config.includeModelFavorites) {
        specs.push({
            id: "model-favorites",
            path: pathApi.join(stateRoot, "model.json"),
            kind: "file",
            secret: false,
            optional: true,
            description: "OpenCode model favorites",
        });
    }
    if (config.includePromptStash) {
        specs.push({
            id: "prompt-stash",
            path: pathApi.join(stateRoot, "prompt-stash.jsonl"),
            kind: "file",
            secret: true,
            optional: true,
            description: "Prompt stash history",
        }, {
            id: "prompt-history",
            path: pathApi.join(stateRoot, "prompt-history.jsonl"),
            kind: "file",
            secret: true,
            optional: true,
            description: "Prompt history",
        });
    }
    if (config.includeBkgPluginState) {
        specs.push({
            id: "bkg-plugin-state",
            path: runtimeRoot(),
            kind: "directory",
            secret: false,
            optional: true,
            description: "BKG plugin runtime state",
        });
    }
    for (const [index, extraPath] of config.extraConfigPaths.entries()) {
        specs.push({
            id: `extra-config-${index + 1}`,
            path: extraPath,
            kind: "file",
            secret: false,
            optional: true,
            description: "Extra user configured sync path",
        });
    }
    if (config.includeSecrets) {
        specs.push({
            id: "opencode-auth",
            path: pathApi.join(dataRoot, "auth.json"),
            kind: "file",
            secret: true,
            optional: true,
            description: "OpenCode auth file",
        }, {
            id: "opencode-mcp-auth",
            path: pathApi.join(dataRoot, "mcp-auth.json"),
            kind: "file",
            secret: true,
            optional: true,
            description: "OpenCode MCP auth file",
        });
        for (const [index, extraPath] of config.extraSecretPaths.entries()) {
            specs.push({
                id: `extra-secret-${index + 1}`,
                path: extraPath,
                kind: "file",
                secret: true,
                optional: true,
                description: "Extra user configured secret sync path",
            });
        }
    }
    return specs;
}
