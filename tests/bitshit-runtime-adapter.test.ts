import { mkdtemp } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { beforeEach, describe, expect, it } from "vitest"
import { createRuntimeBitshitAdapter } from "../src/bitshit/runtime-adapter.js"

beforeEach(async () => {
  process.env.BKG_OC_PLUGIN_STATE_DIR = await mkdtemp(join(tmpdir(), "bkg-oc-plugin-test-"))
})

describe("createRuntimeBitshitAdapter", () => {
  it("persists blocker, rat vote tally and memory through runtime modules", async () => {
    const adapter = createRuntimeBitshitAdapter()
    const blocker = await adapter.reportBlocker({
      taskId: "lane-8",
      description: "Need a real decision",
      context: { file: "src/bitshit/runtime-adapter.ts" },
    })

    expect(blocker.id).toBeTruthy()
    expect(blocker.status).toBe("open")

    const rat = await adapter.startRat({
      blockerId: blocker.id,
      topic: "Runtime adapter smoke test",
      agents: ["architect", "reviewer"],
    })

    await adapter.recordVote({
      sessionId: rat.id,
      agentId: "architect",
      choice: "approve",
      rationale: "Runtime path works.",
    })

    const decision = await adapter.requestApproval({
      voteSessionId: rat.id,
      context: {},
    })

    expect(decision.decidedBy).toBe("bkg-runtime-bitshit-adapter")
    expect(decision.voteSummary.approve).toBe(1)

    await adapter.remember({
      key: "test-memory",
      content: "Runtime adapter wrote memory.",
    })
  })
})
