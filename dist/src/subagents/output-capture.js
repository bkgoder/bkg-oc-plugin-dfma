import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as os from "node:os";
function outputDir() {
    return process.env.BKG_OC_OUTPUTS_DIR ??
        path.join(os.homedir(), ".local", "share", "opencode", "outputs");
}
function makeId() {
    return `out-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
async function ensureDir() {
    await fs.mkdir(outputDir(), { recursive: true });
}
export async function captureOutput(input) {
    await ensureDir();
    const output = {
        id: makeId(),
        agentId: input.agentId,
        delegationId: input.delegationId,
        subtaskId: input.subtaskId,
        content: input.content,
        metadata: input.metadata,
        createdAt: new Date().toISOString(),
    };
    await fs.writeFile(path.join(outputDir(), `${output.id}.json`), JSON.stringify(output, null, 2) + "\n", "utf8");
    return output;
}
export async function readOutput(id) {
    if (!/^[a-zA-Z0-9_-]+$/.test(id))
        return null;
    try {
        const raw = await fs.readFile(path.join(outputDir(), `${id}.json`), "utf8");
        return JSON.parse(raw);
    }
    catch {
        return null;
    }
}
export async function listOutputs(agentId, delegationId) {
    await ensureDir();
    const files = await fs.readdir(outputDir());
    const outputs = [];
    for (const file of files.filter((f) => f.endsWith(".json"))) {
        try {
            const o = JSON.parse(await fs.readFile(path.join(outputDir(), file), "utf8"));
            if (agentId && o.agentId !== agentId)
                continue;
            if (delegationId && o.delegationId !== delegationId)
                continue;
            outputs.push(o);
        }
        catch {
            // skip damaged records
        }
    }
    return outputs.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
