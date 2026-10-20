export const OLLAMA_MODELS = [
  "beam",
  "gemma4:31b",
  "gpt-oss:120b",
  "gpt-oss:20b",
  "nemotron-3-nano:30b",
  "nemotron-3-super",
  "nemotron-3-ultra",
] as const;

export const AI_PROVIDERS = {
  ollama: { label: "Ollama Cloud", defaultModel: "gpt-oss:20b", keyName: "OLLAMA_API_KEY" },
  openrouter: { label: "OpenRouter", defaultModel: "google/gemini-2.0-flash-001", keyName: "OPENROUTER_API_KEY" },
  anthropic: { label: "Anthropic", defaultModel: "claude-3-5-sonnet-latest", keyName: "ANTHROPIC_API_KEY" },
  gemini: { label: "Google Gemini", defaultModel: "gemini-2.0-flash", keyName: "GEMINI_API_KEY" },
  xai: { label: "xAI", defaultModel: "grok-3-mini", keyName: "XAI_API_KEY" },
  inference: { label: "inference.sh", defaultModel: "claude-sonnet-45", keyName: "INFERENCE_SH_API_KEY" },
} as const;

export type AIProvider = keyof typeof AI_PROVIDERS;
