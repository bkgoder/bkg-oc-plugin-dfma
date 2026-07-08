import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as os from "node:os";
function subtasksDir() {
    return process.env.BKG_OC_SUBTASKS_DIR ??
        path.join(os.homedir(), ".local", "share", "opencode", "subtasks");
}
function makeId() {
    return `st-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
async function ensureDir() {
    await fs.mkdir(subtasksDir(), { recursive: true });
}
function recordPath(id) {
    if (!/^[a-zA-Z0-9_-]+$/.test(id))
        throw new Error("Invalid subtask id.");
    return path.join(subtasksDir(), `${id}.json`);
}
export async function createSubtask(input) {
    await ensureDir();
    const now = new Date().toISOString();
    const subtask = {
        id: makeId(),
        delegationId: input.delegationId,
        description: input.description,
        status: "pending",
        assignedAgent: input.assignedAgent,
        createdAt: now,
        updatedAt: now,
    };
    await fs.writeFile(recordPath(subtask.id), JSON.stringify(subtask, null, 2) + "\n", "utf8");
    return subtask;
}
export async function updateSubtask(id, update) {
    const subtask = await readSubtask(id);
    const { id: _id, createdAt: _createdAt, delegationId: _delegationId, ...mutable } = update;
    Object.assign(subtask, mutable, { updatedAt: new Date().toISOString() });
    await fs.writeFile(recordPath(id), JSON.stringify(subtask, null, 2) + "\n", "utf8");
    return subtask;
}
export async function readSubtask(id) {
    const raw = await fs.readFile(recordPath(id), "utf8");
    return JSON.parse(raw);
}
export async function listSubtasks(delegationId) {
    await ensureDir();
    const files = await fs.readdir(subtasksDir());
    const subtasks = [];
    for (const file of files.filter((f) => f.endsWith(".json"))) {
        try {
            const s = JSON.parse(await fs.readFile(path.join(subtasksDir(), file), "utf8"));
            if (!delegationId || s.delegationId === delegationId) {
                subtasks.push(s);
            }
        }
        catch {
            // skip damaged records
        }
    }
    return subtasks.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
