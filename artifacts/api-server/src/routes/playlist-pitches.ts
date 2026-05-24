import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  playlistCuratorsTable,
  pitchDraftsTable,
  appSettingsTable,
} from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { callAI } from "../lib/ai.js";

const router: IRouter = Router();

const VALID_PLATFORMS = [
  "spotify",
  "apple_music",
  "youtube_music",
  "audiomack",
  "boomplay",
  "tidal",
  "deezer",
  "amazon_music",
  "submithub",
  "groover",
  "soundplate",
  "playlistpush",
  "indie",
];

async function getArtistContext(): Promise<{ artistName: string; genre: string }> {
  const rows = await db.select().from(appSettingsTable);
  const settings: Record<string, string> = {};
  for (const r of rows) settings[r.key] = r.value;
  return {
    artistName: settings["artist_name"] || "an independent artist",
    genre: settings["genre"] || "music",
  };
}

const CURATOR_DISCOVERY_SYSTEM = `You are the world's deepest expert on playlist curator outreach across EVERY DSP and submission service. You know editorial teams, indie tastemakers, blog playlist owners, Discord communities, TikTok playlist accounts, and paid submission services.

For each curator you list, provide REAL, verifiable contact patterns commonly used in the industry. If you don't know a specific curator's exact email, list the standard outreach channel (e.g. submission form URL, public Instagram, known submission email format).

Always lead with the EMOTIONAL HOOK — what makes this curator's audience tick, what stories they champion, what feelings their playlists evoke.

Output STRICTLY this JSON shape — return ONLY the JSON array, no markdown, no commentary:

[
  {
    "name": "Curator or company name",
    "platform": "spotify" | "apple_music" | "youtube_music" | "audiomack" | "boomplay" | "tidal" | "deezer" | "amazon_music" | "submithub" | "groover" | "soundplate" | "playlistpush" | "indie",
    "playlistName": "Playlist name (or null for editorial teams)",
    "niche": "What this curator champions emotionally (e.g. 'late-night underground hip-hop heartbreak')",
    "contactMethod": "email" | "instagram" | "twitter" | "discord" | "submission_form",
    "contactValue": "actual contact (email, @handle, URL)",
    "followers": estimated_number_or_null,
    "notes": "Why this is a strong fit for the artist + the emotional angle that wins them over"
  }
]

Generate 12 curators spanning multiple DSPs. Mix EDITORIAL (Spotify for Artists pitch form, Apple Music editorial, Amazon For Artists, Tidal Rising, YouTube Music partnerships), PAID SUBMISSION SERVICES (SubmitHub, Groover, PlaylistPush, Soundplate), and INDIE TASTEMAKERS (real blog/Discord/Instagram playlist accounts).`;

const PITCH_VARIATIONS_SYSTEM = `You are a master music pitch writer who has placed indie artists on major editorial playlists. You understand that curators reject 95% of pitches in <30 seconds — only EMOTIONAL HOOKS that play the listener's ears (the curator IS a listener first) cut through.

Generate EXACTLY 3 pitch variations. Each variation must use a DIFFERENT emotional hook angle:
1. STORY HOOK — open with a vivid moment from the artist's life that connects to the song
2. SONIC HOOK — describe the sound in synesthetic, sensory language (texture, color, weather) that makes the curator press play
3. CULTURE HOOK — tie the song to a movement, scene, or zeitgeist the curator's audience already cares about

Output STRICTLY this JSON shape — return ONLY the JSON array, no markdown:

[
  {
    "hook": "story" | "sonic" | "culture",
    "subject": "Email subject line — under 60 chars, must trigger a click",
    "body": "Full pitch body — under 150 words, conversational, NO marketing clichés ('blends', 'fuses', 'unique sound'), specific details only, ends with the actual streaming/download link placeholder [LINK]"
  }
]`;

router.get("/curators", async (_req, res) => {
  try {
    const rows = await db
      .select()
      .from(playlistCuratorsTable)
      .orderBy(desc(playlistCuratorsTable.createdAt));
    res.json({ curators: rows });
  } catch (err) {
    res.status(500).json({ error: "Failed to load curators", detail: String(err) });
  }
});

router.post("/discover", async (req, res) => {
  try {
    const { artistName, genre } = await getArtistContext();
    const userPrompt = `Artist: ${artistName} (genre: ${genre}). Find 12 high-value playlist curators across all DSPs and submission services. Spread across editorial teams, paid services, and indie tastemakers. Return ONLY the JSON array.`;

    const reply = await callAI(
      [{ role: "user", content: userPrompt }],
      CURATOR_DISCOVERY_SYSTEM,
      { maxTokens: 4096 },
    );

    const cleaned = reply.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    let parsed: unknown;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      req.log.error({ reply }, "Curator discovery: invalid JSON");
      res.status(502).json({ error: "AI returned invalid JSON. Try again." });
      return;
    }
    if (!Array.isArray(parsed)) {
      res.status(502).json({ error: "AI returned non-array. Try again." });
      return;
    }

    const inserted: Array<typeof playlistCuratorsTable.$inferSelect> = [];
    for (const c of parsed) {
      if (!c || typeof c !== "object") continue;
      const obj = c as Record<string, unknown>;
      const platform =
        typeof obj.platform === "string" && VALID_PLATFORMS.includes(obj.platform)
          ? obj.platform
          : "indie";

      const [row] = await db
        .insert(playlistCuratorsTable)
        .values({
          name: String(obj.name ?? "Unknown curator").slice(0, 200),
          platform,
          playlistName: typeof obj.playlistName === "string" ? obj.playlistName : null,
          niche: String(obj.niche ?? "various").slice(0, 200),
          contactMethod: String(obj.contactMethod ?? "email").slice(0, 50),
          contactValue: String(obj.contactValue ?? "").slice(0, 300),
          followers: typeof obj.followers === "number" ? obj.followers : null,
          notes: typeof obj.notes === "string" ? obj.notes : null,
        })
        .returning();
      inserted.push(row);
    }

    res.json({ discovered: inserted.length, curators: inserted });
  } catch (err) {
    req.log.error({ err }, "Discover curators error");
    res
      .status(500)
      .json({ error: "Failed to discover curators", detail: err instanceof Error ? err.message : String(err) });
  }
});

router.delete("/curators/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      res.status(400).json({ error: "Invalid ID" });
      return;
    }
    await db.delete(playlistCuratorsTable).where(eq(playlistCuratorsTable.id, id));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete curator" });
  }
});

router.get("/drafts", async (_req, res) => {
  try {
    const rows = await db
      .select()
      .from(pitchDraftsTable)
      .orderBy(desc(pitchDraftsTable.createdAt));
    const drafts = rows.map((r) => {
      let variations: unknown = [];
      try {
        variations = JSON.parse(r.variations);
      } catch {
        variations = [];
      }
      return {
        ...r,
        variations,
        sentAt: r.sentAt ? r.sentAt.toISOString() : null,
        createdAt: r.createdAt.toISOString(),
      };
    });
    res.json({ drafts });
  } catch (err) {
    res.status(500).json({ error: "Failed to load drafts" });
  }
});

router.post("/drafts/generate", async (req, res) => {
  try {
    const body = req.body as { curatorId?: number; songTitle?: string };
    const curatorId = Number(body?.curatorId);
    const songTitle = String(body?.songTitle ?? "").trim();
    if (!curatorId || !songTitle) {
      res.status(400).json({ error: "curatorId and songTitle are required" });
      return;
    }

    const [curator] = await db
      .select()
      .from(playlistCuratorsTable)
      .where(eq(playlistCuratorsTable.id, curatorId));
    if (!curator) {
      res.status(404).json({ error: "Curator not found" });
      return;
    }

    const { artistName, genre } = await getArtistContext();
    const userPrompt = `Artist: ${artistName} (${genre}). Pitching song: "${songTitle}".
Curator: ${curator.name} on ${curator.platform}${curator.playlistName ? ` (playlist: "${curator.playlistName}")` : ""}.
Niche: ${curator.niche}.
Notes: ${curator.notes ?? "none"}.

Write 3 pitch variations using STORY, SONIC, and CULTURE emotional hooks. Each must feel hand-written and audience-aware. Return ONLY the JSON array.`;

    const reply = await callAI(
      [{ role: "user", content: userPrompt }],
      PITCH_VARIATIONS_SYSTEM,
      { maxTokens: 2048 },
    );
    const cleaned = reply.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    let variations: unknown;
    try {
      variations = JSON.parse(cleaned);
    } catch {
      res.status(502).json({ error: "AI returned invalid JSON. Try again." });
      return;
    }
    if (!Array.isArray(variations) || variations.length === 0) {
      res.status(502).json({ error: "AI returned no variations. Try again." });
      return;
    }

    const [draft] = await db
      .insert(pitchDraftsTable)
      .values({
        curatorId,
        songTitle,
        variations: JSON.stringify(variations),
        selectedVariationIdx: 0,
        status: "draft",
      })
      .returning();

    res.json({
      draft: {
        ...draft,
        variations,
        sentAt: draft.sentAt ? draft.sentAt.toISOString() : null,
        createdAt: draft.createdAt.toISOString(),
      },
    });
  } catch (err) {
    req.log.error({ err }, "Generate pitch error");
    res
      .status(500)
      .json({ error: "Failed to generate pitch", detail: err instanceof Error ? err.message : String(err) });
  }
});

router.post("/drafts/:id/select", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const idx = Number((req.body as { variationIdx?: number })?.variationIdx ?? 0);
    if (Number.isNaN(id)) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }
    await db
      .update(pitchDraftsTable)
      .set({ selectedVariationIdx: idx })
      .where(eq(pitchDraftsTable.id, id));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to select variation" });
  }
});

router.post("/drafts/:id/status", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const status = String((req.body as { status?: string })?.status ?? "").trim();
    if (!["draft", "sent", "accepted", "rejected"].includes(status)) {
      res.status(400).json({ error: "Invalid status" });
      return;
    }
    const update: { status: string; sentAt?: Date } = { status };
    if (status === "sent") update.sentAt = new Date();
    await db.update(pitchDraftsTable).set(update).where(eq(pitchDraftsTable.id, id));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to update status" });
  }
});

router.delete("/drafts/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    await db.delete(pitchDraftsTable).where(eq(pitchDraftsTable.id, id));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete draft" });
  }
});

export default router;
