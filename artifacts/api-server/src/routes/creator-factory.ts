import { Router } from "express";
import { db, appSettingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { callAI } from "../lib/ai.js";

const router = Router();

async function getSetting(key: string): Promise<string | null> {
  const rows = await db.select().from(appSettingsTable).where(eq(appSettingsTable.key, key));
  return rows[0]?.value ?? null;
}

// POST /api/creator-factory/generate
// Takes a concept + platform and returns a full video content package
router.post("/generate", async (req, res) => {
  const { concept, platform = "youtube", duration = "60", style = "entertaining" } = req.body;
  if (!concept?.trim()) {
    res.status(400).json({ error: "concept is required" });
    return;
  }

  const artistName = (await getSetting("artistName")) || "NBA Josh";
  const genre      = (await getSetting("genre"))      || "Hip-Hop";

  const platformMap: Record<string, { label: string; maxScript: number; aspect: string }> = {
    youtube:   { label: "YouTube Long-Form",  maxScript: 600, aspect: "16:9" },
    shorts:    { label: "YouTube Shorts",     maxScript: 120, aspect: "9:16" },
    tiktok:    { label: "TikTok",             maxScript: 120, aspect: "9:16" },
    instagram: { label: "Instagram Reel",     maxScript: 90,  aspect: "9:16" },
    twitter:   { label: "Twitter/X Video",    maxScript: 140, aspect: "16:9" },
  };

  const plat = platformMap[platform] || platformMap.youtube;
  const durationSec = Number(duration) || 60;

  const systemPrompt = `You are an elite video content strategist and scriptwriter for ${artistName}, a ${genre} artist building their brand on social media. You create viral, engaging video content that converts viewers into fans.`;

  const userPrompt = `Create a complete video content package for ${artistName}.

CONCEPT: ${concept}
PLATFORM: ${plat.label} (${plat.aspect})
TARGET DURATION: ${durationSec} seconds
STYLE: ${style}

Return ONLY valid JSON (no markdown fences, no extra text):
{
  "hook": {
    "text": "The exact words spoken or text shown in the first 3 seconds",
    "action": "What physically happens on screen in the first 3 seconds",
    "pattern_interrupt": "Why this stops the scroll"
  },
  "titles": [
    "Title option 1 (curiosity-driven)",
    "Title option 2 (value-driven)",
    "Title option 3 (controversy/bold)"
  ],
  "structure": [
    { "timestamp": "0:00", "section": "Hook", "content": "What happens/is said", "duration_sec": 5 },
    { "timestamp": "0:05", "section": "Problem/Setup", "content": "...", "duration_sec": 10 },
    { "timestamp": "0:15", "section": "Core Value", "content": "...", "duration_sec": 30 },
    { "timestamp": "0:45", "section": "CTA", "content": "...", "duration_sec": 15 }
  ],
  "script": "Full word-for-word script with [VISUAL: description] stage directions inline. Natural speech, not formal.",
  "captions": "3 short punchy caption lines for the post (under 150 chars total)",
  "description": "SEO-optimized video description 150-200 words. Include keywords naturally. End with 2 relevant hashtags.",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5", "tag6", "tag7", "tag8", "tag9", "tag10"],
  "thumbnail": {
    "headline": "3-5 WORD BOLD TEXT (all caps)",
    "subtext": "Supporting line under headline",
    "visual_concept": "Describe the image/background",
    "emotion": "The emotion your face/expression should show"
  },
  "music": {
    "vibe": "Energy/mood description",
    "genre": "Specific subgenre or style",
    "tempo": "bpm range e.g. 85-95 BPM",
    "references": "2-3 artist/song name references for the vibe"
  },
  "cta": "The exact call-to-action line to say at the end",
  "repurpose": ["How to repurpose this for platform 2", "How to repurpose for platform 3"]
}`;

  try {
    const raw = await callAI(
      [{ role: "user", content: userPrompt }],
      systemPrompt,
      { maxTokens: 2000, temperature: 0.88 },
    );

    const cleaned = raw.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    const data = JSON.parse(cleaned);
    res.json({ success: true, platform, concept, ...data });
  } catch (err: any) {
    req.log.error({ err }, "Creator factory generate failed");
    if (err.message?.includes("JSON")) {
      res.status(500).json({ error: "AI returned malformed JSON — try again or rephrase your concept." });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

// POST /api/creator-factory/script-only
// Faster variant that just returns an expanded script
router.post("/script-only", async (req, res) => {
  const { concept, platform = "youtube", tone = "conversational" } = req.body;
  if (!concept?.trim()) { res.status(400).json({ error: "concept required" }); return; }

  const artistName = (await getSetting("artistName")) || "NBA Josh";
  const genre      = (await getSetting("genre"))      || "Hip-Hop";

  try {
    const script = await callAI(
      [{ role: "user", content: `Write a ${tone} ${platform} video script for ${artistName} (${genre} artist) on this topic: "${concept}". Include [VISUAL: direction] stage directions. Make it feel authentic, not corporate. No intro fluff.` }],
      `You are a ${genre} content strategist and scriptwriter. Write scripts that sound like a real person talking, not a robot.`,
      { maxTokens: 1200, temperature: 0.9 },
    );
    res.json({ script });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
