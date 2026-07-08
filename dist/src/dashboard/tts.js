export function createTtsResponse(input) {
    return {
        ok: true,
        mode: "browser-speech-synthesis",
        text: input.text,
        hint: "The dashboard client should read this text with window.speechSynthesis. Server audio backend can be added later.",
    };
}
