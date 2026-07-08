export interface DashboardState {
    generatedAt: string;
    blockers: unknown[];
    ratSessions: unknown[];
    votes: unknown[];
    memories: unknown[];
    sync: unknown;
}
export declare function getDashboardState(): Promise<DashboardState>;
export declare function summarizeDashboardState(state: DashboardState): string;
