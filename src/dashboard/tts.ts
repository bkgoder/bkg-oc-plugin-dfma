export interface TtsRequest {
  text: string
  voice?: string
  rate?: number
}

export interface TtsResponse {
  ok: true
  mode: "browser-speech-synthesis" | "server-placeholder"
  text: string
  hint: string
}

export function createTtsResponse(input: TtsRequest): TtsResponse {
  return {
    ok: true,
    mode: "browser-speech-synthesis",
    text: input.text,
    hint: "The dashboard client should read this text with window.speechSynthesis. Server audio backend can be added later.",
  }
}
