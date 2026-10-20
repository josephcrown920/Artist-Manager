import { OLLAMA_MODELS } from "./ai-config.js";

type Message = { role: "user" | "assistant" | "system"; content: string };

/** Ollama's direct cloud API uses catalog names without a local :cloud suffix. */
export async function callOllama(
  model: string,
  messages: Message[],
  systemPrompt: string,
  opts: { maxTokens?: number; temperature?: number } = {},
): Promise<string> {
  const apiKey = process.env.OLLAMA_API_KEY;
  if (!apiKey) throw new Error("Add OLLAMA_API_KEY in secure server environment settings to use Ollama Cloud.");
  if (!OLLAMA_MODELS.some(allowed => allowed === model)) throw new Error("Select a supported Ollama Cloud model in Settings.");

  const response = await fetch("https://ollama.com/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    signal: AbortSignal.timeout(120_000),
    body: JSON.stringify({
      model,
      messages: [{ role: "system", content: systemPrompt }, ...messages.filter(m => m.role !== "system")],
      stream: false,
      options: { num_predict: opts.maxTokens ?? 1024, temperature: opts.temperature ?? 0.85 },
    }),
  });
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) throw new Error("Ollama Cloud authentication failed. Check OLLAMA_API_KEY and account access.");
    if (response.status === 429) throw new Error("Ollama Cloud usage limit reached. Check your credits or try again later.");
    throw new Error(`Ollama Cloud request failed (HTTP ${response.status}). Check model availability in your account.`);
  }
  const data = await response.json() as { message?: { content?: unknown }; error?: unknown };
  const text = data.message?.content;
  if (data.error || typeof text !== "string" || !text.trim()) throw new Error("Ollama Cloud returned no answer. Try another model or increase the output limit.");
  return text;
}
