import { db, appSettingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { logger } from "./logger.js";

export type AIMessage = { role: "user" | "assistant" | "system"; content: string };

export type AIProvider = "anthropic" | "inference" | "xai";

const ANTHROPIC_DEFAULT_MODEL = "claude-3-5-sonnet-latest";
const XAI_DEFAULT_MODEL = "grok-3-mini";
const INFERENCE_DEFAULT_MODEL = "claude-sonnet-45";

interface CallOptions {
  maxTokens?: number;
  temperature?: number;
}

async function getSetting(key: string): Promise<string | null> {
  const rows = await db
    .select()
    .from(appSettingsTable)
    .where(eq(appSettingsTable.key, key));
  return rows[0]?.value ?? null;
}

/**
 * Pick provider in this priority:
 * 1. Explicit `ai_provider` setting in DB
 * 2. First provider whose API key is set
 * 3. Throws — no provider available
 */
async function resolveProvider(): Promise<AIProvider> {
  const explicit = (await getSetting("ai_provider"))?.toLowerCase();
  if (explicit === "anthropic" || explicit === "inference" || explicit === "xai") {
    return explicit;
  }
  if (process.env.ANTHROPIC_API_KEY) return "anthropic";
  if (process.env.INFERENCE_SH_API_KEY) return "inference";
  if (process.env.XAI_API_KEY) return "xai";
  throw new Error(
    "No AI provider configured. Add ANTHROPIC_API_KEY (recommended), INFERENCE_SH_API_KEY, or XAI_API_KEY to secrets.",
  );
}

async function callAnthropic(
  messages: AIMessage[],
  systemPrompt: string,
  opts: CallOptions = {},
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not configured");

  // Anthropic Messages API: system is separate, only user/assistant in messages
  const filteredMessages = messages
    .filter((m) => m.role !== "system")
    .map((m) => ({ role: m.role, content: m.content }));

  const model = (await getSetting("anthropic_model")) || ANTHROPIC_DEFAULT_MODEL;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: opts.maxTokens ?? 1024,
      temperature: opts.temperature ?? 0.85,
      system: systemPrompt,
      messages: filteredMessages,
    }),
  });

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Anthropic API error ${res.status}: ${errBody}`);
  }

  const data = (await res.json()) as {
    content: Array<{ type: string; text?: string }>;
  };
  const block = data.content.find((b) => b.type === "text");
  return block?.text ?? "";
}

/**
 * inference.sh integration — best-effort. Their public surface is a chat-session
 * API at api.inference.sh, not OpenAI-compatible. Until they publish a clear
 * one-shot inference endpoint, we make a single attempt and surface a helpful
 * error if it fails. To enable, set ai_provider = "inference" in app settings.
 */
async function callInference(
  messages: AIMessage[],
  systemPrompt: string,
  opts: CallOptions = {},
): Promise<string> {
  const apiKey = process.env.INFERENCE_SH_API_KEY;
  if (!apiKey) throw new Error("INFERENCE_SH_API_KEY not configured");

  const model = (await getSetting("inference_model")) || INFERENCE_DEFAULT_MODEL;

  // Best-guess one-shot agent run endpoint discovered in their web bundle.
  // Body shape is unconfirmed — if their docs publish a stable spec, swap here.
  const res = await fetch("https://api.inference.sh/v1/apps/run", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      system: systemPrompt,
      messages,
      max_tokens: opts.maxTokens ?? 1024,
      temperature: opts.temperature ?? 0.85,
    }),
  });

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(
      `inference.sh API error ${res.status}: ${errBody}. The inference.sh provider needs verified API docs — switch ai_provider setting to "anthropic" in the meantime.`,
    );
  }

  const data = (await res.json()) as
    | { output?: string; text?: string; reply?: string; choices?: Array<{ message?: { content?: string } }> };
  const text =
    data.output ?? data.text ?? data.reply ?? data.choices?.[0]?.message?.content ?? "";
  if (!text) {
    throw new Error(
      "inference.sh returned an unrecognized response shape. Paste their docs to enable this provider properly.",
    );
  }
  return text;
}

async function callXAI(
  messages: AIMessage[],
  systemPrompt: string,
  opts: CallOptions = {},
): Promise<string> {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) throw new Error("XAI_API_KEY not configured");
  const model = process.env.XAI_MODEL || XAI_DEFAULT_MODEL;

  const res = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "system", content: systemPrompt }, ...messages],
      temperature: opts.temperature ?? 0.85,
      max_tokens: opts.maxTokens ?? 1024,
    }),
  });

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`xAI API error ${res.status}: ${errBody}`);
  }

  const data = (await res.json()) as {
    choices: Array<{ message: { content: string } }>;
  };
  return data.choices[0].message.content;
}

export async function callAI(
  messages: AIMessage[],
  systemPrompt: string,
  opts: CallOptions = {},
): Promise<string> {
  const provider = await resolveProvider();
  try {
    if (provider === "anthropic") return await callAnthropic(messages, systemPrompt, opts);
    if (provider === "inference") return await callInference(messages, systemPrompt, opts);
    return await callXAI(messages, systemPrompt, opts);
  } catch (err) {
    logger.error({ err, provider }, "AI call failed");
    // If primary fails and we have a backup configured, try that once.
    if (provider !== "anthropic" && process.env.ANTHROPIC_API_KEY) {
      logger.warn("Falling back to Anthropic");
      return await callAnthropic(messages, systemPrompt, opts);
    }
    if (provider !== "xai" && process.env.XAI_API_KEY) {
      logger.warn("Falling back to xAI");
      return await callXAI(messages, systemPrompt, opts);
    }
    throw err;
  }
}

export async function getCurrentProvider(): Promise<AIProvider | null> {
  try {
    return await resolveProvider();
  } catch {
    return null;
  }
}
