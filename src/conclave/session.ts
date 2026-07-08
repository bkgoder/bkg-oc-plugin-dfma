import { makeId, nowIso } from "../core/types.js"
import { defaultConclaveAgents, defaultConclaveCaptain } from "./profiles.js"
import type { ConclaveAgentResponse, ConclaveCritique, ConclaveSession } from "./types.js"

export function createConclaveSession(input: {
  query: string
  maxRounds?: number
  consensusThreshold?: number
}): ConclaveSession {
  const now = nowIso()
  return {
    id: makeId("conclave"),
    query: input.query,
    maxRounds: input.maxRounds ?? 3,
    consensusThreshold: input.consensusThreshold ?? 0.83,
    agents: defaultConclaveAgents,
    captain: defaultConclaveCaptain,
    rounds: [],
    status: "active",
    createdAt: now,
    updatedAt: now,
  }
}

export function addConclaveRound(session: ConclaveSession, responses: ConclaveAgentResponse[], critique?: ConclaveCritique): ConclaveSession {
  const round = session.rounds.length + 1
  const next: ConclaveSession = {
    ...session,
    rounds: [...session.rounds, { round, responses, critique }],
    updatedAt: nowIso(),
  }

  if (critique?.stop || round >= session.maxRounds) {
    next.status = critique?.reason === "blocked" ? "blocked" : "complete"
  }

  return next
}

export function shouldStopConclave(session: ConclaveSession): boolean {
  const last = session.rounds.at(-1)
  if (!last) return false
  if (last.critique?.stop) return true
  if ((last.critique?.consensus ?? 0) >= session.consensusThreshold) return true
  return session.rounds.length >= session.maxRounds
}

export function synthesizeConclaveSummary(session: ConclaveSession): string {
  const last = session.rounds.at(-1)
  if (!last) return `No conclave rounds completed for: ${session.query}`
  const answers = last.responses.map((r) => `${r.agentName}: ${r.answer}`).join("\n")
  const critique = last.critique ? `Consensus ${last.critique.consensus}. Open issues: ${last.critique.openIssues.join(", ") || "none"}.` : "No critique yet."
  return [`Query: ${session.query}`, critique, answers].join("\n\n")
}
