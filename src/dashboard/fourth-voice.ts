import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";

export interface FourthVoiceConfig {
  provider: "openai" | "anthropic" | "custom";
  apiKey?: string;
  baseURL?: string;
  model?: string;
  timeoutMs?: number;
}

export interface FourthVoiceRequest {
  ratSessionId: string;
  prompt: string;
  context?: {
    topic?: string;
    positions?: Array<{ agentId: string; statement: string }>;
  };
}

export interface FourthVoiceResult {
  ok: boolean;
  source: string;
  statement: string;
  model?: string;
  error?: string;
}

const CONFIG_PATH = path.join(
  os.homedir(),
  ".local",
  "share",
  "opencode",
  "fourth-voice.json",
);

export async function loadFourthVoiceConfig(): Promise<FourthVoiceConfig> {
  try {
    const raw = await fs.readFile(CONFIG_PATH, "utf8");
    return JSON.parse(raw) as FourthVoiceConfig;
  } catch {
    return {
      provider: "custom",
      timeoutMs: 30_000,
    };
  }
}

export async function saveFourthVoiceConfig(
  config: FourthVoiceConfig,
): Promise<void> {
  await fs.mkdir(path.dirname(CONFIG_PATH), { recursive: true });
  await fs.writeFile(
    CONFIG_PATH,
    JSON.stringify(config, null, 2) + "\n",
    "utf8",
  );
}

export async function callFourthVoice(
  request: FourthVoiceRequest,
): Promise<FourthVoiceResult> {
  const config = await loadFourthVoiceConfig();

  if (!config.apiKey && config.provider !== "custom") {
    return {
      ok: false,
      source: config.provider,
      statement: "",
      error: "No API key configured. Set up fourth-voice config first.",
    };
  }

  try {
    switch (config.provider) {
      case "openai":
        return callOpenAI(request, config);
      case "anthropic":
        return callAnthropic(request, config);
      case "custom":
      default:
        return callCustom(request, config);
    }
  } catch (error) {
    return {
      ok: false,
      source: config.provider,
      statement: "",
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function callOpenAI(
  request: FourthVoiceRequest,
  config: FourthVoiceConfig,
): Promise<FourthVoiceResult> {
  const baseURL = config.baseURL ?? "https://api.openai.com/v1";
  const model = config.model ?? "gpt-4o-mini";

  const response = await fetch(`${baseURL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "system",
          content:
            "You are a critical reviewer in a multi-agent Rat council. Provide a concise, structured assessment of the topic and existing agent positions. Focus on risks, missing perspectives, and actionable recommendations.",
        },
        {
          role: "user",
          content: buildPrompt(request),
        },
      ],
      max_tokens: 1024,
      temperature: 0.2,
    }),
    signal: AbortSignal.timeout(config.timeoutMs ?? 30_000),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OpenAI API error ${response.status}: ${text}`);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const statement = data.choices?.[0]?.message?.content ?? "";

  return {
    ok: true,
    source: "openai",
    statement,
    model,
  };
}

async function callAnthropic(
  request: FourthVoiceRequest,
  config: FourthVoiceConfig,
): Promise<FourthVoiceResult> {
  const baseURL = config.baseURL ?? "https://api.anthropic.com/v1";
  const model = config.model ?? "claude-3-5-haiku-20241022";

  const response = await fetch(`${baseURL}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": config.apiKey ?? "",
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: 1024,
      temperature: 0.2,
      system:
        "You are a critical reviewer in a multi-agent Rat council. Provide a concise, structured assessment of the topic and existing agent positions. Focus on risks, missing perspectives, and actionable recommendations.",
      messages: [
        {
          role: "user",
          content: buildPrompt(request),
        },
      ],
    }),
    signal: AbortSignal.timeout(config.timeoutMs ?? 30_000),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Anthropic API error ${response.status}: ${text}`);
  }

  const data = (await response.json()) as {
    content?: Array<{ text?: string }>;
  };
  const statement = data.content?.[0]?.text ?? "";

  return {
    ok: true,
    source: "anthropic",
    statement,
    model,
  };
}

async function callCustom(
  request: FourthVoiceRequest,
  _config: FourthVoiceConfig,
): Promise<FourthVoiceResult> {
  return {
    ok: false,
    source: "custom",
    statement: "",
    error:
      "Custom provider not configured. Set provider, apiKey and baseURL in fourth-voice config.",
  };
}

function buildPrompt(request: FourthVoiceRequest): string {
  const lines = [
    `Topic: ${request.context?.topic ?? request.prompt}`,
    "",
    "Existing agent positions:",
  ];

  if (request.context?.positions?.length) {
    for (const pos of request.context.positions) {
      lines.push(`- ${pos.agentId}: ${pos.statement}`);
    }
  } else {
    lines.push("(no positions yet)");
  }

  lines.push("");
  lines.push("Additional instruction:");
  lines.push(request.prompt);

  return lines.join("\n");
}
