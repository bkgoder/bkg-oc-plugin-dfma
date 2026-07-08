import type { ReviewAnnotation, ReviewDecision, ReviewLineEdit, ReviewSession, ReviewSessionInput, ReviewWorkflow } from "./types.js";
export declare function resolveReviewWorkflow(value?: string): ReviewWorkflow;
export declare function canOpenReview(input: ReviewSessionInput): boolean;
export declare function createReviewSession(input: ReviewSessionInput): Promise<ReviewSession>;
export declare function readReviewSession(id: string): Promise<ReviewSession>;
export declare function addReviewAnnotation(id: string, input: Omit<ReviewAnnotation, "id" | "createdAt">): Promise<ReviewSession>;
export declare function decideReviewSession(id: string, decision: ReviewDecision, input?: {
    comment?: string;
    edits?: ReviewLineEdit[];
}): Promise<ReviewSession>;
export declare function waitForReviewDecision(id: string, timeoutMs?: number): Promise<ReviewSession>;
