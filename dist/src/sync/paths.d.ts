import * as path from "node:path";
export interface SyncPlatformPaths {
    home: string;
    config: string;
    data: string;
    state: string;
}
export declare function pathForPlatform(platform: NodeJS.Platform): typeof path.posix;
export declare function resolveSyncPlatformPaths(env?: NodeJS.ProcessEnv, platform?: NodeJS.Platform): SyncPlatformPaths;
export declare function expandHome(value: string, home: string, platform?: NodeJS.Platform): string;
