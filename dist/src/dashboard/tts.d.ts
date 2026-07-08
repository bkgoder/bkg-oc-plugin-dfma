export interface TtsRequest {
    text: string;
    voice?: string;
    rate?: number;
}
export interface TtsResponse {
    ok: true;
    mode: "browser-speech-synthesis" | "server-placeholder";
    text: string;
    hint: string;
}
export declare function createTtsResponse(input: TtsRequest): TtsResponse;
