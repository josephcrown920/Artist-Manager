import { Router } from "express";
import { db, appSettingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { AI_PROVIDERS, OLLAMA_MODELS } from "../lib/ai-config.js";
import { getCurrentProvider } from "../lib/ai.js";

export const aiSettingsBody = z.object({
  provider: z.enum(["ollama", "openrouter", "anthropic", "gemini", "xai", "inference"]),
  model: z.string().trim().min(1).max(200),
}).strict().refine(body => body.provider !== "ollama" || OLLAMA_MODELS.some(model => model === body.model), {
  message: "Select one of the supported Ollama Cloud models.", path: ["model"],
});

const router = Router();

router.get("/", async (req, res) => {
  try {
    const provider = (await getCurrentProvider()) || "openrouter";
    const rows = await db.select().from(appSettingsTable).where(eq(appSettingsTable.key, `${provider}_model`));
    res.json({
      provider,
      model: rows[0]?.value || AI_PROVIDERS[provider].defaultModel,
      providers: Object.entries(AI_PROVIDERS).map(([id, config]) => ({
        id, label: config.label, defaultModel: config.defaultModel,
        configured: !!process.env[config.keyName],
        models: id === "ollama" ? OLLAMA_MODELS : [],
      })),
    });
  } catch (err) {
    req.log.error({ err }, "Read AI settings failed");
    res.status(500).json({ error: "Could not load AI model settings." });
  }
});

router.post("/", async (req, res) => {
  const parsed = aiSettingsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message || "Invalid AI settings." });
    return;
  }
  try {
    const { provider, model } = parsed.data;
    await db.transaction(async tx => {
      for (const [key, value] of [["ai_provider", provider], [`${provider}_model`, model]]) {
        await tx.insert(appSettingsTable).values({ key: key!, value: value! })
          .onConflictDoUpdate({ target: appSettingsTable.key, set: { value: value! } });
      }
    });
    res.json({ provider, model });
  } catch (err) {
    req.log.error({ err }, "Save AI settings failed");
    res.status(500).json({ error: "Could not save AI model settings." });
  }
});

export default router;
