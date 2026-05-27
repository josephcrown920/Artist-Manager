import { db, appSettingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { logger } from "./logger.js";

export type AIMessage = { role: "user" | "assistant" | "system"; content: string };

export type AIProvider = "anthropic" | "inference" | "xai" | "gemini" | "openrouter";

const ANTHROPIC_DEFAULT_MODEL  = "claude-3-5-sonnet-latest";
const XAI_DEFAULT_MODEL        = "grok-3-mini";
const INFERENCE_DEFAULT_MODEL  = "claude-sonnet-45";
const GEMINI_DEFAULT_MODEL     = "gemini-2.0-flash";
const OPENROUTER_DEFAULT_MODEL = "google/gemini-2.0-flash-001";

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
 * 2. First provider whose API key is present:
 *    anthropic → gemini → openrouter → xai → inference
 * 3. Throws — no provider available
 */
async function resolveProvider(): Promise<AIProvider> {
  const explicit = (await getSetting("ai_provider"))?.toLowerCase();
  if (
    explicit === "anthropic" ||
    explicit === "gemini" ||
    explicit === "openrouter" ||
    explicit === "xai" ||
    explicit === "inference"
  ) {
    return explicit as AIProvider;
  }
  if (process.env.ANTHROPIC_API_KEY)  return "anthropic";
  if (process.env.GEMINI_API_KEY)     return "gemini";
  if (process.env.OPENROUTER_API_KEY) return "openrouter";
  if (process.env.XAI_API_KEY)        return "xai";
  if (process.env.INFERENCE_SH_API_KEY) return "inference";
  throw new Error(
    "No AI provider configured. Add ANTHROPIC_API_KEY, GEMINI_API_KEY, OPENROUTER_API_KEY, or XAI_API_KEY to secrets.",
  );
}

// ── Anthropic ────────────────────────────────────────────────────────────────
async function callAnthropic(
  messages: AIMessage[],
  systemPrompt: string,
  opts: CallOptions = {},
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not configured");

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
  const text = block?.text ?? "";
  if (!text.trim()) throw new Error("Anthropic returned an empty response.");
  return text;
}

// ── Gemini ───────────────────────────────────────────────────────────────────
async function callGemini(
  messages: AIMessage[],
  systemPrompt: string,
  opts: CallOptions = {},
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not configured");

  const model = (await getSetting("gemini_model")) || GEMINI_DEFAULT_MODEL;

  // Gemini uses an OpenAI-compatible endpoint (v1beta)
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/openai/chat/completions`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          ...messages.filter((m) => m.role !== "system"),
        ],
        max_tokens: opts.maxTokens ?? 1024,
        temperature: opts.temperature ?? 0.85,
      }),
    },
  );

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Gemini API error ${res.status}: ${errBody}`);
  }

  const data = (await res.json()) as {
    choices: Array<{ message: { content: string } }>;
  };
  const text = data.choices?.[0]?.message?.content ?? "";
  if (!text.trim()) throw new Error("Gemini returned an empty response.");
  return text;
}

// ── OpenRouter ───────────────────────────────────────────────────────────────
async function callOpenRouter(
  messages: AIMessage[],
  systemPrompt: string,
  opts: CallOptions = {},
): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY not configured");

  const model = (await getSetting("openrouter_model")) || OPENROUTER_DEFAULT_MODEL;

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": "https://autopilot.replit.app",
      "X-Title": "Artist Manager Autopilot",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        ...messages.filter((m) => m.role !== "system"),
      ],
      max_tokens: opts.maxTokens ?? 1024,
      temperature: opts.temperature ?? 0.85,
    }),
  });

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`OpenRouter API error ${res.status}: ${errBody}`);
  }

  const data = (await res.json()) as {
    choices: Array<{ message: { content: string } }>;
  };
  const text = data.choices?.[0]?.message?.content ?? "";
  if (!text.trim()) throw new Error("OpenRouter returned an empty response.");
  return text;
}

// ── xAI ─────────────────────────────────────────────────────────────────────
async function callXAI(
  messages: AIMessage[],
  systemPrompt: string,
  opts: CallOptions = {},
): Promise<string> {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) throw new Error("XAI_API_KEY not configured");
  const model = (await getSetting("xai_model")) || XAI_DEFAULT_MODEL;

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

// ── inference.sh ─────────────────────────────────────────────────────────────
async function callInference(
  messages: AIMessage[],
  systemPrompt: string,
  opts: CallOptions = {},
): Promise<string> {
  const apiKey = process.env.INFERENCE_SH_API_KEY;
  if (!apiKey) throw new Error("INFERENCE_SH_API_KEY not configured");

  const model = (await getSetting("inference_model")) || INFERENCE_DEFAULT_MODEL;

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
      `inference.sh API error ${res.status}: ${errBody}. Switch ai_provider to "gemini" or "openrouter" for a reliable alternative.`,
    );
  }

  const data = (await res.json()) as
    | { output?: string; text?: string; reply?: string; choices?: Array<{ message?: { content?: string } }> };
  const text =
    data.output ?? data.text ?? data.reply ?? data.choices?.[0]?.message?.content ?? "";
  if (!text) throw new Error("inference.sh returned an unrecognized response shape.");
  return text;
}

// ── Public callAI ─────────────────────────────────────────────────────────────
export async function callAI(
  messages: AIMessage[],
  systemPrompt: string,
  opts: CallOptions = {},
): Promise<string> {
  const provider = await resolveProvider();

  const dispatch = async (p: AIProvider) => {
    if (p === "anthropic")  return callAnthropic(messages, systemPrompt, opts);
    if (p === "gemini")     return callGemini(messages, systemPrompt, opts);
    if (p === "openrouter") return callOpenRouter(messages, systemPrompt, opts);
    if (p === "xai")        return callXAI(messages, systemPrompt, opts);
    return callInference(messages, systemPrompt, opts);
  };

  try {
    return await dispatch(provider);
  } catch (err) {
    logger.error({ err, provider }, "AI call failed — trying fallbacks");

    // Ordered fallback chain (skip the one that already failed)
    const fallbacks: AIProvider[] = ["anthropic", "gemini", "openrouter", "xai", "inference"];
    for (const fb of fallbacks) {
      if (fb === provider) continue;
      const hasKey =
        (fb === "anthropic"  && process.env.ANTHROPIC_API_KEY)  ||
        (fb === "gemini"     && process.env.GEMINI_API_KEY)      ||
        (fb === "openrouter" && process.env.OPENROUTER_API_KEY)  ||
        (fb === "xai"        && process.env.XAI_API_KEY)         ||
        (fb === "inference"  && process.env.INFERENCE_SH_API_KEY);
      if (!hasKey) continue;
      try {
        logger.warn({ fb }, "Falling back to provider");
        return await dispatch(fb);
      } catch (fbErr) {
        logger.error({ fbErr, fb }, "Fallback provider also failed");
      }
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
