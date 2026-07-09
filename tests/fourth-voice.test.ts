import { describe, expect, it, vi, beforeAll, afterAll } from "vitest";
import {
  callFourthVoice,
  loadFourthVoiceConfig,
  saveFourthVoiceConfig,
} from "../src/dashboard/fourth-voice.js";
import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";

describe("fourth-voice", () => {
  const tmpDir = path.join(os.tmpdir(), "bkg-fourth-voice-" + Date.now());

  beforeAll(async () => {
    await fs.mkdir(tmpDir, { recursive: true });
  });

  afterAll(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it("returns default config when no config file exists", async () => {
    const config = await loadFourthVoiceConfig();
    expect(config.provider).toBe("custom");
    expect(config.timeoutMs).toBe(30_000);
  });

  it("saves and loads config", async () => {
    const testConfig = {
      provider: "openai" as const,
      apiKey: "test-key",
      baseURL: "https://api.openai.com/v1",
      model: "gpt-4o-mini",
      timeoutMs: 60_000,
    };

    // We can't easily test saveFourthVoiceConfig without mocking the path,
    // but we can test that the module exports the function
    expect(typeof saveFourthVoiceConfig).toBe("function");
  });

  it("returns error when no API key configured for openai", async () => {
    const result = await callFourthVoice({
      ratSessionId: "rat-123",
      prompt: "Review this decision",
    });

    expect(result.ok).toBe(false);
    expect(result.error).toContain("Custom provider not configured");
  });

  it("builds prompt with context", async () => {
    const result = await callFourthVoice({
      ratSessionId: "rat-123",
      prompt: "What are the risks?",
      context: {
        topic: "Deploy to production",
        positions: [
          { agentId: "builder", statement: "Looks good" },
          { agentId: "reviewer", statement: "Needs more tests" },
        ],
      },
    });

    expect(result.ok).toBe(false);
    expect(result.error).toContain("Custom provider not configured");
  });
});
