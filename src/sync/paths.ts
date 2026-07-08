import * as os from "node:os"
import * as path from "node:path"

export interface SyncPlatformPaths {
  home: string
  config: string
  data: string
  state: string
}

export function pathForPlatform(platform: NodeJS.Platform): typeof path.posix {
  return platform === "win32" ? path.win32 : path.posix
}

export function resolveSyncPlatformPaths(
  env: NodeJS.ProcessEnv = process.env,
  platform: NodeJS.Platform = process.platform,
): SyncPlatformPaths {
  const pathApi = pathForPlatform(platform)
  const home = platform === "win32"
    ? env.USERPROFILE ?? env.HOME ?? os.homedir()
    : env.HOME ?? os.homedir()

  if (platform === "win32") {
    const data = env.LOCALAPPDATA ?? pathApi.join(home, "AppData", "Local")
    return {
      home,
      config: env.APPDATA ?? pathApi.join(home, "AppData", "Roaming"),
      data,
      state: data,
    }
  }

  return {
    home,
    config: env.XDG_CONFIG_HOME ?? pathApi.join(home, ".config"),
    data: env.XDG_DATA_HOME ?? pathApi.join(home, ".local", "share"),
    state: env.XDG_STATE_HOME ?? pathApi.join(home, ".local", "state"),
  }
}

export function expandHome(
  value: string,
  home: string,
  platform: NodeJS.Platform = process.platform,
): string {
  if (value === "~") return home
  if (value.startsWith("~/") || value.startsWith("~\\")) {
    return pathForPlatform(platform).join(home, value.slice(2))
  }
  return value
}
