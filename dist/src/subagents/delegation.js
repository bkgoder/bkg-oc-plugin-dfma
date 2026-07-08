import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as os from "node:os";
function delegationsDir() {
    return process.env.BKG_OC_DELEGATIONS_DIR ??
        path.join(os.homedir(), ".local", "share", "opencode", "delegations");
}
function makeId() {
    return `delegation-${crypto.randomUUID()}`;
}
async function ensureDir() {
    await fs.mkdir(delegationsDir(), { recursive: true });
}
function recordPath(id) {
    if (!/^[a-zA-Z0-9_-]+$/.test(id))
        throw new Error("Invalid delegation id.");
    return path.join(delegationsDir(), `${id}.json`);
}
export async function createDelegation(input) {
    await ensureDir();
    const id = makeId();
    const now = new Date().toISOString();
    const title = input.prompt.split("\n").find((l) => l.trim().length > 0)?.trim().slice(0, 48) ?? "Delegation";
    const record = {
        id,
        parentId: input.parentId,
        prompt: input.prompt,
        agent: input.agent,
        status: "pending",
        title,
        description: input.prompt.slice(0, 180),
        createdAt: now,
        updatedAt: now,
        subtaskIds: [],
    };
    await fs.writeFile(recordPath(id), JSON.stringify(record, null, 2) + "\n", "utf8");
    return record;
}
export async function updateDelegation(id, update) {
    const record = await readDelegation(id);
    const { id: _id, createdAt: _createdAt, ...mutable } = update;
    Object.assign(record, mutable, { updatedAt: new Date().toISOString() });
    await fs.writeFile(recordPath(id), JSON.stringify(record, null, 2) + "\n", "utf8");
    return record;
}
export async function readDelegation(id) {
    const raw = await fs.readFile(recordPath(id), "utf8");
    return normalizeDelegation(JSON.parse(raw));
}
export async function listDelegations(parentId) {
    await ensureDir();
    const files = await fs.readdir(delegationsDir());
    const records = [];
    for (const file of files.filter((f) => f.endsWith(".json"))) {
        try {
            const r = normalizeDelegation(JSON.parse(await fs.readFile(path.join(delegationsDir(), file), "utf8")));
            if (!parentId || r.parentId === parentId) {
                records.push(r);
            }
        }
        catch {
            // skip damaged records
        }
    }
    return records.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
function normalizeDelegation(value) {
    if (!value.id || !value.prompt || !value.agent)
        throw new Error("Invalid delegation record.");
    const now = new Date().toISOString();
    return {
        id: value.id,
        parentId: value.parentId,
        prompt: value.prompt,
        agent: value.agent,
        status: value.status ?? "pending",
        title: value.title ?? value.prompt.slice(0, 48),
        description: value.description ?? value.prompt.slice(0, 180),
        createdAt: value.createdAt ?? now,
        updatedAt: value.updatedAt ?? value.createdAt ?? now,
        result: value.result,
        error: value.error,
        subtaskIds: Array.isArray(value.subtaskIds) ? value.subtaskIds : [],
    };
}
