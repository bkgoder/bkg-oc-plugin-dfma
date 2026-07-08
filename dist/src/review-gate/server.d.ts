import * as http from "node:http";
export interface ReviewGateServer {
    server: http.Server;
    url: string;
    close(): Promise<void>;
}
export declare function startReviewGateServer(options?: {
    host?: string;
    port?: number;
}): Promise<ReviewGateServer>;
