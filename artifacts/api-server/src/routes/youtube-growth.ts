import { Router } from "express";
import { callAI } from "../lib/ai.js";

const router = Router();

router.post("/generate", async (req, res) => {
  const { videoDesc, seriesDay = "1" } = req.body as { videoDesc?: string; seriesDay?: string };

  if (!videoDesc || !videoDesc.trim()) {
    res.status(400).json({ error: "videoDesc is required" });
    return;
  }

  const prompt = `VIDEO: ${videoDesc}
SERIES DAY: Day ${seriesDay} (this is a series — use the day number for stakes)
CHANNEL NICHE: Rap / Hip-hop challenge / beef / freestyle content
TARGET: 5K-10K views minimum

ALGORITHM RULES YOU MUST FOLLOW:
1. Title must trigger a PHYSICAL reaction in the first 3 words (shock, curiosity, laugh, identity)
2. Never complete the thought — leave an open loop the brain must close
3. Under 60 characters (YouTube truncates on mobile)
4. Emojis: max 2, must add meaning
5. No generic phrases: "check out", "amazing", "incredible"
6. Tap into the SERIES narrative — the day number creates stakes and urgency

ALSO GENERATE:
- A loop hook: how to end the video so it loops back to the start seamlessly
- A comment bait CTA: one question that triggers tribal debate
- 3 caption hashtag combos optimized for discovery

Return ONLY valid JSON, no markdown fences:
{
  "titles": [
    {"text": "title", "trigger": "what emotion/reflex this fires", "score": 92, "why": "one sentence on the psychology"},
    {"text": "title", "trigger": "emotion", "score": 87, "why": "psychology"},
    {"text": "title", "trigger": "emotion", "score": 81, "why": "psychology"}
  ],
  "loop_hook": "Exact instruction for how to film/edit the ending to create a seamless loop",
  "comment_bait": "The exact question to pin in comments to start a debate",
  "hashtag_sets": [
    "#tag1 #tag2 #tag3 #tag4 #tag5",
    "#tag1 #tag2 #tag3 #tag4 #tag5",
    "#tag1 #tag2 #tag3 #tag4 #tag5"
  ],
  "post_time": "Best day and time to post this specific video",
  "projected_range": "Realistic view range if executed well (e.g. 2K-8K)"
}`;

  const systemPrompt = `You are the world's best YouTube Shorts title writer and growth strategist. Your titles consistently hit 5K-50K views for small rap/music channels. You understand the 2026 YouTube algorithm deeply: hook rate in the first 1.5s matters most, loop rate multiplies views (every loop = a new view since March 2025), and comment velocity signals social channel status. You always respond with valid JSON only — no markdown, no preamble.`;

  try {
    const raw = await callAI(
      [{ role: "user", content: prompt }],
      systemPrompt,
      { maxTokens: 1400, temperature: 0.9 },
    );

    const cleaned = raw.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned);
    res.json(parsed);
  } catch (err: any) {
    req.log.error({ err }, "youtube-growth generate failed");
    if (err.message?.includes("No AI provider")) {
      res.status(503).json({ error: "No AI provider configured — add ANTHROPIC_API_KEY or XAI_API_KEY in Secrets." });
      return;
    }
    if (err instanceof SyntaxError) {
      res.status(500).json({ error: "AI returned malformed JSON — try again." });
      return;
    }
    res.status(500).json({ error: err.message ?? "Generation failed" });
  }
});

export default router;
