import { Router } from "express";
import { db, creatorsTable, appSettingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { callAI } from "../lib/ai.js";

const router = Router();

async function getSetting(key: string): Promise<string | null> {
  const rows = await db.select().from(appSettingsTable).where(eq(appSettingsTable.key, key));
  return rows[0]?.value ?? null;
}

// GET /api/creators
router.get("/", async (_req, res) => {
  const rows = await db.select().from(creatorsTable).orderBy(creatorsTable.createdAt);
  res.json({ creators: rows });
});

// POST /api/creators
router.post("/", async (req, res) => {
  const { name, platform, handle, niche, followers, contactMethod, contactValue, status, notes } = req.body;
  if (!name || !platform || !niche) {
    res.status(400).json({ error: "name, platform, and niche are required" });
    return;
  }
  const [row] = await db.insert(creatorsTable).values({
    name, platform, handle, niche,
    followers: followers ? Number(followers) : null,
    contactMethod, contactValue,
    status: status || "discovered",
    notes,
  }).returning();
  res.json(row);
});

// PATCH /api/creators/:id
router.patch("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const updates: Record<string, unknown> = {};
  const allowed = ["name","platform","handle","niche","followers","contactMethod","contactValue","status","pitchDraft","notes"];
  for (const k of allowed) {
    if (req.body[k] !== undefined) updates[k] = req.body[k];
  }
  const [row] = await db.update(creatorsTable).set(updates).where(eq(creatorsTable.id, id)).returning();
  res.json(row);
});

// DELETE /api/creators/:id
router.delete("/:id", async (req, res) => {
  await db.delete(creatorsTable).where(eq(creatorsTable.id, Number(req.params.id)));
  res.json({ success: true });
});

// POST /api/creators/discover  — AI generates a list of creator profiles to target
router.post("/discover", async (req, res) => {
  const { niche = "hip-hop", platform = "all", count = 5 } = req.body;
  const artistName = (await getSetting("artistName")) || "NBA Josh";
  const genre      = (await getSetting("genre"))      || "Hip-Hop";

  const prompt = `You are a music marketing strategist for ${artistName} (${genre}). Generate ${count} realistic creator profiles to target for collaboration / cross-promotion.

Platform focus: ${platform === "all" ? "mix of Instagram, TikTok, YouTube, Twitter" : platform}
Niche: ${niche}

Return ONLY valid JSON (no markdown):
{
  "creators": [
    {
      "name": "Creator Name",
      "platform": "instagram|tiktok|youtube|twitter",
      "handle": "@handle",
      "niche": "specific niche",
      "followers": 45000,
      "contactMethod": "email|dm|manager",
      "contactValue": "email@example.com or @dm_handle",
      "notes": "why this creator is a great fit"
    }
  ]
}`;

  try {
    const raw = await callAI(
      [{ role: "user", content: prompt }],
      "You are a music marketing AI. Return only valid JSON with no markdown fences.",
      { maxTokens: 1200, temperature: 0.9 },
    );
    const data = JSON.parse(raw.replace(/```json|```/g, "").trim());
    res.json(data);
  } catch (err: any) {
    req.log.error({ err }, "Creator discover failed");
    res.status(500).json({ error: err.message });
  }
});

// POST /api/creators/:id/pitch  — AI generates a personalised pitch for the creator
router.post("/:id/pitch", async (req, res) => {
  const id = Number(req.params.id);
  const rows = await db.select().from(creatorsTable).where(eq(creatorsTable.id, id));
  if (!rows.length) { res.status(404).json({ error: "Creator not found" }); return; }
  const creator = rows[0];
  const artistName = (await getSetting("artistName")) || "NBA Josh";
  const genre      = (await getSetting("genre"))      || "Hip-Hop";

  const prompt = `Write a short, authentic outreach message from ${artistName} (${genre} artist) to ${creator.name} (@${creator.handle}) on ${creator.platform}.

Creator niche: ${creator.niche}
Followers: ${creator.followers?.toLocaleString() ?? "unknown"}
Contact via: ${creator.contactMethod}

The message should:
- Feel personal and genuine, not copy-paste spam
- Reference something specific about their content niche
- Pitch a simple collab idea (feature, freestyle challenge, shoutout swap)
- Be under 150 words
- End with a clear call to action

Return ONLY the message text, no subject line, no markdown.`;

  try {
    const pitch = await callAI(
      [{ role: "user", content: prompt }],
      "You are a music industry outreach specialist who writes short, authentic DMs that actually get replies.",
      { maxTokens: 400, temperature: 0.9 },
    );

    await db.update(creatorsTable).set({ pitchDraft: pitch.trim(), status: "contacted" }).where(eq(creatorsTable.id, id));
    res.json({ pitchDraft: pitch.trim() });
  } catch (err: any) {
    req.log.error({ err }, "Pitch generation failed");
    res.status(500).json({ error: err.message });
  }
});

export default router;
