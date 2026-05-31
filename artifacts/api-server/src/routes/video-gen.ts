import { Router } from "express";
import { createHmac } from "crypto";
import { db, appSettingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

async function getSetting(key: string): Promise<string | null> {
  const rows = await db.select().from(appSettingsTable).where(eq(appSettingsTable.key, key));
  return rows[0]?.value ?? null;
}

// ── Kling JWT ─────────────────────────────────────────────────────────────────
function klingJWT(apiKey: string, apiSecret: string): string {
  const now = Math.floor(Date.now() / 1000);
  const hdr = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const pay = Buffer.from(JSON.stringify({ iss: apiKey, exp: now + 1800, nbf: now - 5 })).toString("base64url");
  const sig = createHmac("sha256", apiSecret).update(`${hdr}.${pay}`).digest("base64url");
  return `${hdr}.${pay}.${sig}`;
}

// ── Kling text-to-video ───────────────────────────────────────────────────────
async function klingGenerate(opts: {
  apiKey: string; apiSecret: string; prompt: string;
  negativePrompt?: string; aspectRatio?: string; duration?: string; mode?: string;
}) {
  const token = klingJWT(opts.apiKey, opts.apiSecret);
  const res = await fetch("https://api.klingai.com/v1/videos/text2video", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      model_name: "kling-v1-6",
      prompt: opts.prompt,
      negative_prompt: opts.negativePrompt || "blurry, low quality, distorted, watermark",
      cfg_scale: 0.5,
      mode: opts.mode || "std",
      aspect_ratio: opts.aspectRatio || "9:16",
      duration: opts.duration || "5",
    }),
  });
  const data = (await res.json()) as any;
  if (!res.ok || data.code !== 0) {
    throw new Error(`Kling error ${res.status}: ${data.message || JSON.stringify(data)}`);
  }
  return { taskId: data.data?.task_id as string, provider: "kling" };
}

async function klingStatus(apiKey: string, apiSecret: string, taskId: string) {
  const token = klingJWT(apiKey, apiSecret);
  const res = await fetch(`https://api.klingai.com/v1/videos/text2video/${taskId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = (await res.json()) as any;
  if (!res.ok || data.code !== 0) throw new Error(`Kling status error: ${data.message}`);
  const task = data.data;
  const status = task.task_status; // submitted | processing | succeed | failed
  const videoUrl = task.task_result?.videos?.[0]?.url ?? null;
  const coverUrl = task.task_result?.videos?.[0]?.cover_image_url ?? null;
  return { status: status === "succeed" ? "completed" : status === "failed" ? "failed" : "processing", videoUrl, coverUrl };
}

// ── Seedance via fal.ai ───────────────────────────────────────────────────────
async function seedanceGenerate(opts: {
  falKey: string; prompt: string; aspectRatio?: string; duration?: number;
}) {
  // fal.ai queue endpoint for Seedance 1 Lite
  const res = await fetch("https://queue.fal.run/fal-ai/seedance-1-lite", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Key ${opts.falKey}`,
    },
    body: JSON.stringify({
      prompt: opts.prompt,
      duration: opts.duration || 5,
      resolution: "720p",
      aspect_ratio: opts.aspectRatio || "9:16",
    }),
  });
  const data = (await res.json()) as any;
  if (!res.ok) throw new Error(`Seedance error ${res.status}: ${JSON.stringify(data)}`);
  // fal returns { request_id, response_url, status_url }
  return { taskId: data.request_id as string, statusUrl: data.status_url as string, provider: "seedance" };
}

async function seedanceStatus(falKey: string, statusUrl: string) {
  const res = await fetch(statusUrl, {
    headers: { Authorization: `Key ${falKey}` },
  });
  const data = (await res.json()) as any;
  if (!res.ok) throw new Error(`Seedance status error: ${JSON.stringify(data)}`);
  // fal status: IN_QUEUE | IN_PROGRESS | COMPLETED | FAILED
  if (data.status === "COMPLETED") {
    const videoUrl = data.output?.video?.url ?? data.output?.video_url ?? null;
    return { status: "completed", videoUrl };
  }
  if (data.status === "FAILED") return { status: "failed", videoUrl: null };
  return { status: "processing", videoUrl: null };
}

// ── Routes ─────────────────────────────────────────────────────────────────────

// POST /api/video-gen/generate
router.post("/generate", async (req, res) => {
  const { prompt, provider = "kling", aspectRatio = "9:16", duration = "5", mode = "std" } = req.body;
  if (!prompt?.trim()) { res.status(400).json({ error: "prompt is required" }); return; }

  const klingKey    = process.env.KLING_API_KEY    || await getSetting("klingApiKey");
  const klingSecret = process.env.KLING_API_SECRET || await getSetting("klingApiSecret");
  const falKey      = process.env.FAL_API_KEY       || await getSetting("falApiKey");

  try {
    if (provider === "kling") {
      if (!klingKey || !klingSecret) {
        res.status(400).json({ error: "Kling API Key + Secret not configured. Add them in Settings → Video Generation." });
        return;
      }
      const result = await klingGenerate({ apiKey: klingKey, apiSecret: klingSecret, prompt, aspectRatio, duration, mode });
      res.json(result);
    } else if (provider === "seedance") {
      if (!falKey) {
        res.status(400).json({ error: "fal.ai API Key not configured. Add it in Settings → Video Generation." });
        return;
      }
      const result = await seedanceGenerate({ falKey, prompt, aspectRatio, duration: Number(duration) });
      res.json(result);
    } else {
      res.status(400).json({ error: `Unknown provider: ${provider}` });
    }
  } catch (err: any) {
    req.log.error({ err }, "Video gen failed");
    res.status(502).json({ error: err.message });
  }
});

// GET /api/video-gen/status/:provider/:taskId
router.get("/status/:provider/:taskId", async (req, res) => {
  const { provider, taskId } = req.params;
  const statusUrl = req.query.statusUrl as string | undefined;

  const klingKey    = process.env.KLING_API_KEY    || await getSetting("klingApiKey");
  const klingSecret = process.env.KLING_API_SECRET || await getSetting("klingApiSecret");
  const falKey      = process.env.FAL_API_KEY       || await getSetting("falApiKey");

  try {
    if (provider === "kling") {
      if (!klingKey || !klingSecret) { res.status(400).json({ error: "Kling not configured" }); return; }
      const result = await klingStatus(klingKey, klingSecret, taskId);
      res.json(result);
    } else if (provider === "seedance") {
      if (!falKey || !statusUrl) { res.status(400).json({ error: "fal.ai not configured or no statusUrl" }); return; }
      const result = await seedanceStatus(falKey, statusUrl);
      res.json(result);
    } else {
      res.status(400).json({ error: "Unknown provider" });
    }
  } catch (err: any) {
    req.log.error({ err }, "Video status check failed");
    res.status(502).json({ error: err.message });
  }
});

// GET /api/video-gen/providers  — which providers are configured
router.get("/providers", async (_req, res) => {
  const klingKey    = process.env.KLING_API_KEY    || await getSetting("klingApiKey");
  const klingSecret = process.env.KLING_API_SECRET || await getSetting("klingApiSecret");
  const falKey      = process.env.FAL_API_KEY       || await getSetting("falApiKey");
  res.json({
    kling:    !!(klingKey && klingSecret),
    seedance: !!falKey,
  });
});

export default router;
