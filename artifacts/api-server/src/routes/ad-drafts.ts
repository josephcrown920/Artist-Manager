import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { adDraftsTable, appSettingsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { callXAI } from "./agents.js";

const router: IRouter = Router();

async function getSetting(key: string): Promise<string | null> {
  const rows = await db.select().from(appSettingsTable).where(eq(appSettingsTable.key, key));
  return rows[0]?.value ?? null;
}

const PLATFORMS = [
  {
    id: "meta",
    name: "Meta (Facebook + Instagram)",
    specs: "Vertical video 9:16, image 1080x1080 or 1080x1350. Headline max 40 chars, primary text 125 chars. Placements: Feed, Stories, Reels, Explore, Audience Network.",
    cpmRange: "$3-12",
    cpcRange: "$0.20-1.50",
  },
  {
    id: "tiktok",
    name: "TikTok Ads",
    specs: "Vertical video 9:16, 9-60 seconds. Spark Ads boost organic posts. In-Feed, TopView, Branded Hashtag. Text overlay on video.",
    cpmRange: "$2-10",
    cpcRange: "$0.10-1.00",
  },
  {
    id: "google",
    name: "Google Ads (YouTube + Search)",
    specs: "YouTube: skippable in-stream (15-60s), bumper (6s), Shorts. Search: headline 30 chars x3, description 90 chars x2. Display: 300x250, 728x90, 160x600.",
    cpmRange: "$4-15",
    cpcRange: "$0.30-2.00",
  },
  {
    id: "spotify",
    name: "Spotify Ad Studio",
    specs: "Audio ads: 15-30 second audio clip + companion image 640x640. Marquee: full-screen notification to followers. Showcase: appears in browse section.",
    cpmRange: "$15-25",
    cpcRange: "$0.25-0.65",
  },
  {
    id: "audiomack",
    name: "Audiomack Promote",
    specs: "In-app promotion, playlist placement boost. Audio interstitials 15-30 seconds. Banner ads 320x50. Self-serve platform.",
    cpmRange: "$5-15",
    cpcRange: "$0.15-0.80",
  },
];

const AD_GENERATION_PROMPT = `You are an elite performance marketing strategist for music artists. You create ad campaigns optimized for MAXIMUM REACH with the LOWEST possible CPM and CPC.

KEY OPTIMIZATION PRINCIPLES:
- Broad targeting first, then narrow with lookalikes — broad audiences = lower CPM
- Video content gets 2-5x lower CPM than static images on every platform
- Engagement objective campaigns have lower CPM than conversion campaigns for music
- Retargeting warm audiences (video viewers, page engagers) drops CPC by 40-60%
- Testing 3-5 creatives and killing losers after 48 hours maximizes ROAS
- Scheduling ads during peak engagement hours (6-10pm local) improves CTR 20-30%
- Interest stacking: combine genre + mood + activity interests for laser targeting
- Lookalike audiences of Spotify followers convert at 3-5x cold traffic
- Hook in first 3 seconds or lose the scroll — face, motion, text hook
- UGC-style content outperforms polished ads by 2-3x on TikTok and Reels

BUDGET ALLOCATION FOR MAXIMUM REACH:
- Phase 1 (Testing): $5-10/day per ad set, 3-5 creatives, broad targeting, 48-72 hour test
- Phase 2 (Scaling): Move 80% budget to winning creative, scale 20%/day max
- Phase 3 (Retargeting): 20% of total budget to retarget video viewers + page engagers

Return your response as a valid JSON array of campaign objects. Each object must have these exact fields:
- "platform": string (the platform name)
- "campaignName": string (creative campaign name)
- "objective": string (campaign objective and goal)
- "targetAudience": string (detailed targeting description)
- "adCopy": string (the actual ad copy/text)
- "creativeSpecs": string (exact creative requirements - dimensions, duration, format)
- "placement": string (where the ad will appear)
- "estimatedBudget": string (daily and total budget recommendation)
- "estimatedCpm": string (expected CPM range)
- "estimatedCpc": string (expected CPC range)
- "estimatedReach": string (expected reach/impressions)
- "tips": string (specific optimization tips for this campaign)

IMPORTANT: Return ONLY the JSON array, no markdown, no code blocks, just the raw JSON.`;

router.get("/", async (req, res) => {
  try {
    const rows = await db.select().from(adDraftsTable).orderBy(desc(adDraftsTable.createdAt)).limit(50);
    res.json({ drafts: rows });
  } catch (err) {
    req.log.error({ err }, "Get ad drafts error");
    res.status(500).json({ error: "Failed to get ad drafts" });
  }
});

router.post("/generate", async (req, res) => {
  try {
    const artistName = (await getSetting("artistName")) || "the artist";
    const genre = (await getSetting("genre")) || "music";

    const today = new Date().toISOString().split("T")[0];

    const userMessage = `Generate 6 ad campaign drafts for ${artistName} (genre: ${genre}) for today (${today}).

Create campaigns across these platforms: Meta (Facebook+Instagram), TikTok, Google/YouTube, Spotify, and one cross-platform retargeting campaign.

Each campaign should be optimized for MAXIMUM REACH with the LOWEST possible CPM and CPC. The artist only needs to add their creative assets (video/image) — everything else should be ready to copy-paste into the ad platform.

Include specific targeting parameters, exact budget recommendations starting from $5/day, and realistic reach estimates for each budget level. Make each campaign distinct — different objectives, audiences, and strategies.

Focus on campaigns that a hip-hop/rap artist would use to:
1. Promote a new single/release
2. Grow Spotify/Apple Music streams
3. Build Instagram/TikTok following
4. Drive Shopify merch sales
5. Build email list for superfans
6. Retarget warm audiences who already engaged`;

    const reply = await callXAI(
      [{ role: "user", content: userMessage }],
      AD_GENERATION_PROMPT
    );

    let campaigns: any[];
    try {
      const cleaned = reply.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      campaigns = JSON.parse(cleaned);
    } catch {
      req.log.error("Failed to parse AI response as JSON");
      res.status(500).json({ error: "AI generated invalid format — try again" });
      return;
    }

    const inserted = [];
    for (const c of campaigns) {
      const [row] = await db.insert(adDraftsTable).values({
        platform: c.platform || "Unknown",
        campaignName: c.campaignName || "Untitled Campaign",
        objective: c.objective || "",
        targetAudience: c.targetAudience || "",
        adCopy: c.adCopy || "",
        creativeSpecs: c.creativeSpecs || "",
        placement: c.placement || "",
        estimatedBudget: c.estimatedBudget || "",
        estimatedCpm: c.estimatedCpm || "",
        estimatedCpc: c.estimatedCpc || "",
        estimatedReach: c.estimatedReach || "",
        tips: c.tips || "",
        status: "draft",
        generatedDate: today,
      }).returning();
      inserted.push(row);
    }

    res.json({ message: `Generated ${inserted.length} ad campaign drafts`, drafts: inserted });
  } catch (err: any) {
    req.log.error({ err }, "Generate ad drafts error");
    res.status(500).json({ error: "Failed to generate ad drafts", detail: err?.message });
  }
});

router.patch("/:id/status", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { status } = req.body;
    if (!["draft", "ready", "launched", "paused", "completed"].includes(status)) {
      res.status(400).json({ error: "Invalid status" });
      return;
    }
    const [row] = await db.update(adDraftsTable).set({ status }).where(eq(adDraftsTable.id, id)).returning();
    res.json(row);
  } catch (err) {
    req.log.error({ err }, "Update ad draft status error");
    res.status(500).json({ error: "Failed to update draft" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(adDraftsTable).where(eq(adDraftsTable.id, id));
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Delete ad draft error");
    res.status(500).json({ error: "Failed to delete draft" });
  }
});

export default router;
