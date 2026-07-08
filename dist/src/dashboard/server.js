import * as fs from "node:fs/promises";
import * as http from "node:http";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { handleDashboardApi } from "./api.js";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const STATIC_DIR = path.join(__dirname, "static");
function contentType(filePath) {
    if (filePath.endsWith(".html"))
        return "text/html; charset=utf-8";
    if (filePath.endsWith(".js"))
        return "text/javascript; charset=utf-8";
    if (filePath.endsWith(".css"))
        return "text/css; charset=utf-8";
    if (filePath.endsWith(".json"))
        return "application/json; charset=utf-8";
    return "application/octet-stream";
}
async function serveStatic(urlPath) {
    const safePath = urlPath === "/" ? "/index.html" : urlPath;
    const target = path.normalize(path.join(STATIC_DIR, safePath));
    if (!target.startsWith(STATIC_DIR)) {
        return { status: 403, headers: { "content-type": "text/plain" }, body: "Forbidden" };
    }
    try {
        const body = await fs.readFile(target);
        return { status: 200, headers: { "content-type": contentType(target) }, body };
    }
    catch {
        return { status: 404, headers: { "content-type": "text/plain" }, body: "Not found" };
    }
}
export function startDashboardServer(options = {}) {
    const host = options.host ?? "127.0.0.1";
    const port = options.port ?? 4774;
    const server = http.createServer(async (req, res) => {
        try {
            const request = new Request(`http://${req.headers.host ?? `${host}:${port}`}${req.url ?? "/"}`, {
                method: req.method,
                headers: req.headers,
                body: req.method === "GET" || req.method === "HEAD" ? undefined : req,
                duplex: "half",
            });
            const apiResponse = await handleDashboardApi(request);
            if (apiResponse) {
                res.writeHead(apiResponse.status, apiResponse.headers);
                res.end(apiResponse.body);
                return;
            }
            const file = await serveStatic(new URL(request.url).pathname);
            res.writeHead(file.status, file.headers);
            res.end(file.body);
        }
        catch (error) {
            res.writeHead(500, { "content-type": "application/json; charset=utf-8" });
            res.end(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }, null, 2));
        }
    });
    server.listen(port, host);
    return server;
}
if (import.meta.url === `file://${process.argv[1]}`) {
    const port = Number(process.env.BKG_OC_DASHBOARD_PORT ?? "4774");
    const host = process.env.BKG_OC_DASHBOARD_HOST ?? "127.0.0.1";
    startDashboardServer({ host, port });
    console.log(`BKG OpenCode dashboard listening on http://${host}:${port}`);
}
