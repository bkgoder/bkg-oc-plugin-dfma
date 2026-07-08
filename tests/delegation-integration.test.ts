import * as fs from "node:fs/promises"
import * as os from "node:os"
import * as path from "node:path"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import {
  createDelegation,
  readDelegation,
  updateDelegation,
} from "../src/subagents/delegation.js"
import { createSubtask, listSubtasks } from "../src/subagents/subtasks.js"
import { captureOutput, listOutputs, readOutput } from "../src/subagents/output-capture.js"

let root = ""

beforeEach(async () => {
  root = await fs.mkdtemp(path.join(os.tmpdir(), "bkg-delegation-"))
  process.env.BKG_OC_DELEGATIONS_DIR = path.join(root, "delegations")
  process.env.BKG_OC_SUBTASKS_DIR = path.join(root, "subtasks")
  process.env.BKG_OC_OUTPUTS_DIR = path.join(root, "outputs")
})

afterEach(async () => {
  delete process.env.BKG_OC_DELEGATIONS_DIR
  delete process.env.BKG_OC_SUBTASKS_DIR
  delete process.env.BKG_OC_OUTPUTS_DIR
  await fs.rm(root, { recursive: true, force: true })
})

describe("delegation persistence", () => {
  it("links subtasks and captured output without mutating identity", async () => {
    const delegation = await createDelegation({ prompt: "Inspect the result", agent: "reviewer" })
    const subtask = await createSubtask({
      delegationId: delegation.id,
      description: "Check evidence",
      assignedAgent: "reviewer",
    })
    const updated = await updateDelegation(delegation.id, {
      id: "replaced",
      createdAt: "replaced",
      status: "running",
      subtaskIds: [subtask.id],
    })
    const output = await captureOutput({
      agentId: "reviewer",
      delegationId: delegation.id,
      subtaskId: subtask.id,
      content: "Evidence checked.",
    })

    expect(updated.id).toBe(delegation.id)
    expect(updated.createdAt).toBe(delegation.createdAt)
    expect(await listSubtasks(delegation.id)).toHaveLength(1)
    expect(await listOutputs(undefined, delegation.id)).toHaveLength(1)
    expect((await readOutput(output.id))?.content).toBe("Evidence checked.")
    await expect(readDelegation("../escape")).rejects.toThrow("Invalid delegation id")
  })

  it("migrates legacy delegation records with no subtaskIds", async () => {
    const dir = process.env.BKG_OC_DELEGATIONS_DIR!
    await fs.mkdir(dir, { recursive: true })
    await fs.writeFile(path.join(dir, "legacy.json"), JSON.stringify({
      id: "legacy",
      prompt: "Old artifact",
      agent: "builder",
      status: "complete",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    }))

    expect((await readDelegation("legacy")).subtaskIds).toEqual([])
  })
})
