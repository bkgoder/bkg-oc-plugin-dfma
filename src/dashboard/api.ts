import { createBlocker, updateBlocker } from "../ensemble/blockers.js";
import { createRatSession } from "../ensemble/rat.js";
import { castVote, tallyVotes } from "../ensemble/votes.js";
import { createShortTermMemory } from "../memory/short-term.js";
import { getDashboardState, summarizeDashboardState } from "./state.js";
import { createTtsResponse } from "./tts.js";
import { getLiveOutputSnapshot } from "../live-output/index.js";
import { callFourthVoice, loadFourthVoiceConfig } from "./fourth-voice.js";

export interface ApiResponse {
  status: number;
  headers?: Record<string, string>;
  body: string;
}

async function readJson<T>(request: Request): Promise<T> {
  const text = await request.text();
  return (text ? JSON.parse(text) : {}) as T;
}

function json(data: unknown, status = 200): ApiResponse {
  return {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
    body: JSON.stringify(data, null, 2),
  };
}

export async function handleDashboardApi(request: Request): Promise<ApiResponse | null> {
  const url = new URL(request.url);
  const path = url.pathname;

  if (request.method === "GET" && path === "/api/state") {
    return json(await getDashboardState());
  }

  if (request.method === "GET" && path === "/api/live-output") {
    const after = Number(url.searchParams.get("after") ?? "0");
    return json(getLiveOutputSnapshot(Number.isFinite(after) ? after : 0));
  }

  if (request.method === "GET" && path === "/api/summary") {
    const state = await getDashboardState();
    return json({ summary: summarizeDashboardState(state), state });
  }

  if (request.method === "POST" && path === "/api/blocker") {
    const input = await readJson<{ description: string; context?: Record<string, unknown>; severity?: "low" | "medium" | "high" | "critical" }>(request);
    if (!input.description) return json({ error: "description is required" }, 400);
    return json(await createBlocker(input), 201);
  }

  if (request.method === "POST" && path === "/api/rat/start") {
    const input = await readJson<{ blockerId: string; topic: string; agents?: string[] }>(request);
    if (!input.blockerId || !input.topic) return json({ error: "blockerId and topic are required" }, 400);
    const session = await createRatSession({
      blockerId: input.blockerId,
      topic: input.topic,
      agents: input.agents ?? ["architect", "builder", "reviewer", "product", "contrarian"],
    });
    await updateBlocker(input.blockerId, { status: "in_vote", ratSessionId: session.id });
    return json(session, 201);
  }

  if (request.method === "POST" && path === "/api/vote") {
    const input = await readJson<{ sessionId: string; ratSessionId?: string; agentId: string; choice: "approve" | "reject" | "abstain"; rationale?: string }>(request);
    if (!input.sessionId || !input.agentId || !input.choice) return json({ error: "sessionId, agentId and choice are required" }, 400);
    const vote = await castVote({
      sessionId: input.sessionId,
      ratSessionId: input.ratSessionId ?? input.sessionId,
      agentId: input.agentId,
      choice: input.choice,
      rationale: input.rationale,
    });
    return json(vote, 201);
  }

  if (request.method === "POST" && path === "/api/user/approve") {
    const input = await readJson<{ ratSessionId: string; reason?: string }>(request);
    if (!input.ratSessionId) return json({ error: "ratSessionId is required" }, 400);
    const vote = await castVote({
      sessionId: input.ratSessionId,
      ratSessionId: input.ratSessionId,
      agentId: "human-user",
      choice: "approve",
      rationale: input.reason ?? "Approved by user from dashboard.",
    });
    return json({ decision: "approved", vote }, 201);
  }

  if (request.method === "POST" && path === "/api/user/reject") {
    const input = await readJson<{ ratSessionId: string; reason?: string }>(request);
    if (!input.ratSessionId) return json({ error: "ratSessionId is required" }, 400);
    const vote = await castVote({
      sessionId: input.ratSessionId,
      ratSessionId: input.ratSessionId,
      agentId: "human-user",
      choice: "reject",
      rationale: input.reason ?? "Rejected by user from dashboard.",
    });
    return json({ decision: "rejected", vote }, 201);
  }

  if (request.method === "POST" && path === "/api/user/revise") {
    const input = await readJson<{ ratSessionId: string; reason?: string }>(request);
    if (!input.ratSessionId) return json({ error: "ratSessionId is required" }, 400);
    const memory = createShortTermMemory();
    await memory.append({
      key: "user-revision-request",
      content: input.reason ?? "User requested revision from dashboard.",
      metadata: { ratSessionId: input.ratSessionId },
    });
    return json({ decision: "revise", ratSessionId: input.ratSessionId }, 201);
  }

  if (request.method === "GET" && path === "/api/vote/tally") {
    const ratSessionId = url.searchParams.get("ratSessionId");
    if (!ratSessionId) return json({ error: "ratSessionId query parameter is required" }, 400);
    return json(await tallyVotes(ratSessionId));
  }

  if (request.method === "POST" && path === "/api/tts/read") {
    const input = await readJson<{ text?: string }>(request);
    const text = input.text ?? summarizeDashboardState(await getDashboardState());
    return json(createTtsResponse({ text }));
  }

  if (request.method === "POST" && path === "/api/fourth-voice/request") {
    const input = await readJson<{ ratSessionId: string; prompt: string }>(request);
    if (!input.ratSessionId || !input.prompt) return json({ error: "ratSessionId and prompt are required" }, 400);

    const memory = createShortTermMemory();
    const config = await loadFourthVoiceConfig();

    let positions: Array<{ agentId: string; statement: string }> = [];
    try {
      const { readRatSession } = await import("../ensemble/rat.js");
      const session = await readRatSession(input.ratSessionId);
      positions = session.positions.map((p) => ({ agentId: p.agentId, statement: p.statement }));
    } catch {
      // session may not exist yet
    }

    const result = await callFourthVoice({
      ratSessionId: input.ratSessionId,
      prompt: input.prompt,
      context: {
        topic: input.prompt,
        positions,
      },
    });

    const record = await memory.append({
      key: "fourth-voice-request",
      content: result.ok ? result.statement : `Error: ${result.error}`,
      metadata: {
        ratSessionId: input.ratSessionId,
        target: config.provider,
        model: result.model,
        ok: result.ok,
        source: result.source,
      },
    });

    try {
      const { setFourthVoice } = await import("../ensemble/rat.js");
      await setFourthVoice(input.ratSessionId, {
        source: result.source,
        statement: result.ok ? result.statement : `Error: ${result.error}`,
      });
    } catch {
      // session may not exist yet
    }

    return json({ queued: true, result, record }, result.ok ? 201 : 202);
  }

  return null;
}
