import { createBlocker, updateBlocker } from "../ensemble/blockers.js";
import { createRatSession } from "../ensemble/rat.js";
import { castVote, tallyVotes } from "../ensemble/votes.js";
import { createShortTermMemory } from "../memory/short-term.js";
import { getDashboardState, summarizeDashboardState } from "./state.js";
import { createTtsResponse } from "./tts.js";
async function readJson(request) {
    const text = await request.text();
    return (text ? JSON.parse(text) : {});
}
function json(data, status = 200) {
    return {
        status,
        headers: { "content-type": "application/json; charset=utf-8" },
        body: JSON.stringify(data, null, 2),
    };
}
export async function handleDashboardApi(request) {
    const url = new URL(request.url);
    const path = url.pathname;
    if (request.method === "GET" && path === "/api/state") {
        return json(await getDashboardState());
    }
    if (request.method === "GET" && path === "/api/summary") {
        const state = await getDashboardState();
        return json({ summary: summarizeDashboardState(state), state });
    }
    if (request.method === "POST" && path === "/api/blocker") {
        const input = await readJson(request);
        if (!input.description)
            return json({ error: "description is required" }, 400);
        return json(await createBlocker(input), 201);
    }
    if (request.method === "POST" && path === "/api/rat/start") {
        const input = await readJson(request);
        if (!input.blockerId || !input.topic)
            return json({ error: "blockerId and topic are required" }, 400);
        const session = await createRatSession({
            blockerId: input.blockerId,
            topic: input.topic,
            agents: input.agents ?? ["architect", "builder", "reviewer", "product", "contrarian"],
        });
        await updateBlocker(input.blockerId, { status: "in_vote", ratSessionId: session.id });
        return json(session, 201);
    }
    if (request.method === "POST" && path === "/api/vote") {
        const input = await readJson(request);
        if (!input.sessionId || !input.agentId || !input.choice)
            return json({ error: "sessionId, agentId and choice are required" }, 400);
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
        const input = await readJson(request);
        if (!input.ratSessionId)
            return json({ error: "ratSessionId is required" }, 400);
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
        const input = await readJson(request);
        if (!input.ratSessionId)
            return json({ error: "ratSessionId is required" }, 400);
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
        const input = await readJson(request);
        if (!input.ratSessionId)
            return json({ error: "ratSessionId is required" }, 400);
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
        if (!ratSessionId)
            return json({ error: "ratSessionId query parameter is required" }, 400);
        return json(await tallyVotes(ratSessionId));
    }
    if (request.method === "POST" && path === "/api/tts/read") {
        const input = await readJson(request);
        const text = input.text ?? summarizeDashboardState(await getDashboardState());
        return json(createTtsResponse({ text }));
    }
    if (request.method === "POST" && path === "/api/fourth-voice/request") {
        const input = await readJson(request);
        if (!input.ratSessionId || !input.prompt)
            return json({ error: "ratSessionId and prompt are required" }, 400);
        const memory = createShortTermMemory();
        const record = await memory.append({
            key: "fourth-voice-request",
            content: input.prompt,
            metadata: { ratSessionId: input.ratSessionId, target: "chatgpt-or-external-reviewer" },
        });
        return json({ queued: true, record }, 202);
    }
    return null;
}
