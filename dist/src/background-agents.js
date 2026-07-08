import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import { tool } from "@opencode-ai/plugin";
import { adjectives, animals, colors, uniqueNamesGenerator } from "unique-names-generator";
import { createSyncService, defaultSyncConfig } from "./sync/index.js";
import { openReviewGate } from "./review-gate/index.js";
const DEFAULT_TIMEOUT_MS = 15 * 60 * 1000;
function delegationRoot() {
    return path.join(os.homedir(), ".local", "share", "opencode", "delegations");
}
function makeId() {
    return uniqueNamesGenerator({
        dictionaries: [adjectives, colors, animals],
        separator: "-",
        length: 3,
        style: "lowerCase",
    });
}
function summarize(text) {
    const first = text.split("\n").find((line) => line.trim().length > 0)?.trim() ?? "Delegation";
    return {
        title: first.slice(0, 48),
        description: text.slice(0, 180),
    };
}
async function ensureRoot() {
    await fs.mkdir(delegationRoot(), { recursive: true });
}
async function recordPath(id) {
    await ensureRoot();
    return path.join(delegationRoot(), `${id}.json`);
}
async function markdownPath(id) {
    await ensureRoot();
    return path.join(delegationRoot(), `${id}.md`);
}
async function writeRecord(record) {
    await fs.writeFile(await recordPath(record.id), JSON.stringify(record, null, 2) + "\n", "utf8");
}
async function readRecord(id) {
    const content = await fs.readFile(await recordPath(id), "utf8");
    return JSON.parse(content);
}
async function listRecords() {
    await ensureRoot();
    const files = await fs.readdir(delegationRoot());
    const records = [];
    for (const file of files.filter((f) => f.endsWith(".json"))) {
        try {
            records.push(JSON.parse(await fs.readFile(path.join(delegationRoot(), file), "utf8")));
        }
        catch {
            // Ignore damaged records
        }
    }
    return records.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
async function persistMarkdown(record) {
    const md = [
        `# ${record.title}`,
        "",
        `- id: ${record.id}`,
        `- agent: ${record.agent}`,
        `- status: ${record.status}`,
        `- created: ${record.createdAt}`,
        `- updated: ${record.updatedAt}`,
        "",
        "## Prompt",
        "",
        record.prompt,
        "",
        "## Result",
        "",
        record.result ?? record.error ?? "No result yet.",
        "",
    ].join("\n");
    await fs.writeFile(await markdownPath(record.id), md, "utf8");
}
async function runDelegation(prompt, agent, timeoutMs = DEFAULT_TIMEOUT_MS) {
    const id = makeId();
    const now = new Date().toISOString();
    const meta = summarize(prompt);
    const record = {
        id,
        prompt,
        agent,
        status: "running",
        title: meta.title,
        description: meta.description,
        createdAt: now,
        updatedAt: now,
        filePath: await markdownPath(id),
    };
    await writeRecord(record);
    await persistMarkdown(record);
    const terminal = new Date().toISOString();
    const completed = {
        ...record,
        status: "complete",
        updatedAt: terminal,
        result: [
            `Delegation registered for agent: ${agent}`,
            "",
            "The prompt was persisted as a durable background-agent artifact.",
            "Read this artifact with delegation_read(id).",
            "",
            "Prompt:",
            prompt,
            "",
            `Timeout budget: ${timeoutMs}ms`,
        ].join("\n"),
    };
    await writeRecord(completed);
    await persistMarkdown(completed);
    return completed;
}
export function createBackgroundAgentsPlugin() {
    return async () => ({
        tool: {
            delegate: tool({
                description: "Persist a background delegation request and return an id for later retrieval.",
                args: {
                    prompt: tool.schema.string().describe("Research/task prompt to delegate."),
                    agent: tool.schema.string().describe("Read-only subagent name to delegate to."),
                },
                async execute(args) {
                    const record = await runDelegation(args.prompt, args.agent);
                    return JSON.stringify({
                        id: record.id,
                        status: record.status,
                        title: record.title,
                        description: record.description,
                        filePath: record.filePath,
                    }, null, 2);
                },
            }),
            delegation_read: tool({
                description: "Read a persisted background delegation artifact by id.",
                args: {
                    id: tool.schema.string().describe("Delegation id returned by delegate()."),
                },
                async execute(args) {
                    const record = await readRecord(args.id);
                    return JSON.stringify(record, null, 2);
                },
            }),
            delegation_list: tool({
                description: "List persisted background delegations with titles, status and artifact paths.",
                args: {},
                async execute() {
                    const records = await listRecords();
                    return JSON.stringify(records.map((r) => ({
                        id: r.id,
                        status: r.status,
                        agent: r.agent,
                        title: r.title,
                        description: r.description,
                        filePath: r.filePath,
                        updatedAt: r.updatedAt,
                    })), null, 2);
                },
            }),
            sync_status: tool({
                description: "Show OpenCode configuration sync status without changing files.",
                args: {},
                async execute() {
                    return JSON.stringify(await createSyncService(defaultSyncConfig()).status(), null, 2);
                },
            }),
            sync_push: tool({
                description: "Copy configured OpenCode files into the sync repository, commit and push them.",
                args: {
                    message: tool.schema.string().optional().describe("Optional git commit message."),
                },
                async execute(args) {
                    return JSON.stringify(await createSyncService(defaultSyncConfig()).push(args.message), null, 2);
                },
            }),
            sync_pull: tool({
                description: "Fast-forward the sync repository and restore configured OpenCode files with backups.",
                args: {},
                async execute() {
                    return JSON.stringify(await createSyncService(defaultSyncConfig()).pull(), null, 2);
                },
            }),
            open_review_gate: tool({
                description: "Open a local, short-lived review gate for a blocker, Rat decision, or manual review.",
                args: {
                    title: tool.schema.string().describe("Review title."),
                    content: tool.schema.string().describe("Plan, decision, or blocker content to review."),
                    trigger: tool.schema.enum(["rat", "blocker", "manual", "agent"]).describe("Reason for opening review."),
                    target: tool.schema.string().optional().describe("Primary file or artifact being reviewed."),
                    blockerId: tool.schema.string().optional().describe("Related blocker id."),
                    ratSessionId: tool.schema.string().optional().describe("Related Rat session id."),
                    workflow: tool.schema.enum(["rat-only", "blocker-only", "manual", "all-agents", "user-managed"]).optional(),
                    timeoutMs: tool.schema.number().int().positive().max(3_600_000).optional(),
                },
                async execute(args, context) {
                    const result = await openReviewGate({
                        title: args.title,
                        content: args.content,
                        trigger: args.trigger,
                        target: args.target,
                        blockerId: args.blockerId,
                        ratSessionId: args.ratSessionId,
                        workflow: args.workflow,
                        actorRole: context.agent,
                        metadata: {
                            sessionId: context.sessionID,
                            worktree: context.worktree,
                        },
                    }, { timeoutMs: args.timeoutMs });
                    return JSON.stringify(result, null, 2);
                },
            }),
        },
    });
}
