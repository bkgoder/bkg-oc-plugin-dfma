import * as http from "node:http"
import {
  addReviewAnnotation,
  createReviewSession,
  decideReviewSession,
  readReviewSession,
} from "./session.js"
import type { ReviewDecision, ReviewLineEdit, ReviewSessionInput } from "./types.js"

export interface ReviewGateServer {
  server: http.Server
  url: string
  close(): Promise<void>
}

export async function startReviewGateServer(options: {
  host?: string
  port?: number
} = {}): Promise<ReviewGateServer> {
  const remote = process.env.BKG_OC_REVIEW_REMOTE === "1" ||
    process.env.BKG_OC_DASHBOARD_REMOTE === "1"
  const host = options.host ?? (remote ? "0.0.0.0" : "127.0.0.1")
  const port = options.port ??
    Number(process.env.BKG_OC_REVIEW_PORT ?? process.env.BKG_OC_DASHBOARD_PORT ?? (remote ? "4774" : "0"))

  const server = http.createServer(async (request, response) => {
    try {
      await route(request, response)
    } catch (error) {
      sendJson(response, 400, { error: error instanceof Error ? error.message : String(error) })
    }
  })
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject)
    server.listen(port, host, resolve)
  })
  const address = server.address()
  const actualPort = typeof address === "object" && address ? address.port : port
  const publicHost = host === "0.0.0.0" ? "127.0.0.1" : host
  return {
    server,
    url: `http://${publicHost}:${actualPort}`,
    close: async () => await new Promise<void>((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve())
    }),
  }
}

async function route(request: http.IncomingMessage, response: http.ServerResponse): Promise<void> {
  const url = new URL(request.url ?? "/", "http://localhost")
  const parts = url.pathname.split("/").filter(Boolean)

  if (request.method === "GET" && parts.length === 0) {
    response.writeHead(200, { "content-type": "text/html; charset=utf-8" })
    response.end(reviewHtml())
    return
  }
  if (request.method === "POST" && url.pathname === "/api/review/open") {
    sendJson(response, 201, await createReviewSession(await readJson<ReviewSessionInput>(request)))
    return
  }
  if (parts[0] !== "api" || parts[1] !== "review" || !parts[2]) {
    sendJson(response, 404, { error: "Not found" })
    return
  }

  const id = parts[2]
  if (request.method === "GET" && parts.length === 3) {
    sendJson(response, 200, await readReviewSession(id))
    return
  }
  if (request.method === "POST" && parts[3] === "annotation") {
    const body = await readJson<{ target?: string; start?: number; end?: number; comment: string }>(request)
    sendJson(response, 201, await addReviewAnnotation(id, body))
    return
  }
  if (request.method === "POST" && ["approve", "reject", "revise"].includes(parts[3])) {
    const map: Record<string, ReviewDecision> = {
      approve: "approved",
      reject: "rejected",
      revise: "revise",
    }
    const body = await readJson<{ comment?: string; edits?: ReviewLineEdit[] }>(request)
    sendJson(response, 200, await decideReviewSession(id, map[parts[3]], body))
    return
  }
  sendJson(response, 404, { error: "Not found" })
}

async function readJson<T>(request: http.IncomingMessage): Promise<T> {
  const chunks: Buffer[] = []
  for await (const chunk of request) chunks.push(Buffer.from(chunk))
  const text = Buffer.concat(chunks).toString("utf8")
  return (text ? JSON.parse(text) : {}) as T
}

function sendJson(response: http.ServerResponse, status: number, body: unknown): void {
  response.writeHead(status, { "content-type": "application/json; charset=utf-8" })
  response.end(JSON.stringify(body, null, 2))
}

function reviewHtml(): string {
  return `<!doctype html>
<html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width">
<title>BKG Review Gate</title>
<style>
body{font:16px system-ui;max-width:980px;margin:40px auto;padding:0 20px;background:#111;color:#eee}
textarea,input{box-sizing:border-box;width:100%;margin:8px 0;padding:10px;background:#1d1d1d;color:#eee;border:1px solid #555}
pre{white-space:pre-wrap;background:#181818;padding:18px;border-radius:8px}button{padding:10px 16px;margin:8px 8px 8px 0}
.approve{background:#287a43;color:white}.reject{background:#8b2f38;color:white}.revise{background:#8a691e;color:white}
</style>
<h1>BKG Review Gate</h1><div id="app">Add <code>?id=review_id</code> to this URL.</div>
<script>
const id=new URLSearchParams(location.search).get("id"), app=document.querySelector("#app");
async function load(){if(!id)return;const s=await fetch("/api/review/"+id).then(r=>r.json());
app.innerHTML="<h2></h2><pre></pre><label>Feedback<textarea id=comment></textarea></label>"+
"<label>Structured line edits (JSON array)<textarea id=edits>[]</textarea></label>"+
"<button class=approve>Approve</button><button class=reject>Reject</button><button class=revise>Revise</button>";
app.querySelector("h2").textContent=s.title;app.querySelector("pre").textContent=s.content.split(/\\r?\\n/).map((line,i)=>String(i+1).padStart(4," ")+" | "+line).join("\\n");
for(const action of ["approve","reject","revise"])app.querySelector("."+action).onclick=()=>decide(action)}
async function decide(action){const comment=document.querySelector("#comment").value;
let edits;try{edits=JSON.parse(document.querySelector("#edits").value)}catch{return alert("Invalid edits JSON")}
const r=await fetch("/api/review/"+id+"/"+action,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({comment,edits})});
const result=await r.json();if(!r.ok)return alert(result.error);app.innerHTML="<h2>Decision recorded: "+result.status+"</h2>"}
load();
</script></html>`
}
