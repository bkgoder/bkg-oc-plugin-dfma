import { createBlocker, updateBlocker } from "../ensemble/blockers.js";
import { createRatSession } from "../ensemble/rat.js";
import { castVote, tallyVotes } from "../ensemble/votes.js";
import { createShortTermMemory } from "../memory/short-term.js";
function now() {
    return new Date().toISOString();
}
function mapVoteOutcome(outcome) {
    return outcome === "pending" ? "blocked" : outcome;
}
export function createRuntimeBitshitAdapter() {
    const memory = createShortTermMemory();
    return {
        async reportBlocker(input) {
            const blocker = await createBlocker({
                description: input.description,
                context: {
                    ...input.context,
                    taskId: input.taskId,
                },
                severity: "medium",
            });
            return {
                id: blocker.id,
                taskId: input.taskId,
                description: blocker.description,
                context: blocker.context,
                status: blocker.status === "open" || blocker.status === "in_vote" ? "open" : blocker.status,
                createdAt: blocker.createdAt,
                resolvedAt: blocker.resolvedAt,
            };
        },
        async startRat(input) {
            const session = await createRatSession({
                blockerId: input.blockerId,
                topic: input.topic,
                agents: input.agents,
            });
            await updateBlocker(input.blockerId, { status: "in_vote", ratSessionId: session.id });
            return {
                id: session.id,
                blockerId: session.blockerId,
                topic: session.topic,
                agents: session.agents,
                status: session.status,
                startedAt: session.startedAt,
                completedAt: session.completedAt,
                summary: session.summary,
            };
        },
        async recordVote(input) {
            const vote = await castVote({
                sessionId: input.sessionId,
                ratSessionId: input.sessionId,
                agentId: input.agentId,
                choice: input.choice,
                rationale: input.rationale,
            });
            return {
                id: vote.id,
                sessionId: vote.sessionId,
                agentId: vote.agentId,
                choice: vote.choice,
                rationale: vote.rationale,
                castAt: vote.castAt,
            };
        },
        async requestApproval(input) {
            const tally = await tallyVotes(input.voteSessionId);
            return {
                decision: mapVoteOutcome(tally.outcome),
                voteSummary: {
                    approve: tally.approve,
                    reject: tally.reject,
                    abstain: tally.abstain,
                    total: tally.total,
                },
                decidedAt: now(),
                decidedBy: "bkg-runtime-bitshit-adapter",
            };
        },
        async remember(input) {
            await memory.append({
                key: input.key,
                content: input.content,
                worktree: input.worktree,
                metadata: input.metadata,
            });
        },
    };
}
