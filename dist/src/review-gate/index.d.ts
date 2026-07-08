import type { ReviewGateResult, ReviewSessionInput } from "./types.js";
export * from "./types.js";
export * from "./session.js";
export * from "./server.js";
export * from "./feedback.js";
export * from "./browser.js";
export * from "./line-edits.js";
export declare function openReviewGate(input: ReviewSessionInput, options?: {
    timeoutMs?: number;
    openBrowser?: boolean;
    port?: number;
}): Promise<ReviewGateResult>;
