import { listBlockers } from "../ensemble/blockers.js"
import { listRatSessions } from "../ensemble/rat.js"
import { listVotes } from "../ensemble/votes.js"
import { createShortTermMemory } from "../memory/short-term.js"
import { getSyncStatus } from "../sync/index.js"

export interface DashboardState {
  generatedAt: string
  blockers: unknown[]
  ratSessions: unknown[]
  votes: unknown[]
  memories: unknown[]
  sync: unknown
}

export async function getDashboardState(): Promise<DashboardState> {
  const memory = createShortTermMemory()
  const [blockers, ratSessions, votes, memories] = await Promise.all([
    listBlockers(),
    listRatSessions(),
    listVotes(),
    memory.list({ limit: 25 }),
  ])

  return {
    generatedAt: new Date().toISOString(),
    blockers,
    ratSessions,
    votes,
    memories,
    sync: getSyncStatus(),
  }
}

export function summarizeDashboardState(state: DashboardState): string {
  const openBlockers = state.blockers.filter((b) => typeof b === "object" && b !== null && (b as { status?: string }).status !== "resolved")
  return [
    `BKG plugin dashboard at ${state.generatedAt}`,
    `Open blockers: ${openBlockers.length}`,
    `Rat sessions: ${state.ratSessions.length}`,
    `Votes: ${state.votes.length}`,
    `Memory records: ${state.memories.length}`,
  ].join(". ")
}
