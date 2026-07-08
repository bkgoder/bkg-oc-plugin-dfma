import * as http from "node:http";
export interface DashboardServerOptions {
    host?: string;
    port?: number;
}
export declare function startDashboardServer(options?: DashboardServerOptions): http.Server;
