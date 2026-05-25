import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { growthPlaybooksTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { callAI } from "../lib/ai.js";

const router: IRouter = Router();

const VALID_CATEGORIES = ["pre-save", "algorithm", "curator-outreach", "follower-engagement"];

async function getArtistContext(): Promise<string> {
  const { appSettingsTable } = await import("@workspace/db");
  const rows = await db.select().from(appSettingsTable);
  const settings: Record<string, string> = {};
  for (const r of rows) settings[r.key] = r.value;
  const artistName = settings["artist_name"] || "an independent artist";
  const genre = settings["genre"] || "various genres";
  return `Artist: ${artistName}, Genre: ${genre}`;
}

const PLAYBOOK_GENERATION_PROMPT = `You are the world's top multi-DSP growth strategist. Generate structured, step-by-step playbooks for growing artist followers across Spotify, Apple Music, YouTube Music, Audiomack, Boomplay, Tidal, Deezer, and Amazon Music.

Every playbook must lead with an EMOTIONAL HOOK — the feeling that drives the action (FOMO, belonging, identity, transformation). Steps must be tactical, specific, and reference real platforms/tools.

For each playbook, output EXACTLY this JSON format (return a JSON array of 4 objects):
[
  {
    "title": "Playbook title (specific and actionable)",
    "category": "pre-save" | "algorithm" | "curator-outreach" | "follower-engagement",
    "steps": [
      "Step 1: Specific actionable instruction with details",
      "Step 2: Next step with specifics",
      "Step 3: Continue with real tactics",
      "Step 4: More detail",
      "Step 5: Final step or measurement"
    ]
  }
]

Generate 4 playbooks, one for each category. Make them highly specific with real platform names, real tools, real numbers, and actionable steps. Each playbook should have 5-7 steps.

IMPORTANT: Return ONLY the JSON array, no markdown, no code blocks, no explanation.`;

router.get("/", async (req, res) => {
  try {
    const playbooks = await db
      .select()
      .from(growthPlaybooksTable)
      .orderBy(desc(growthPlaybooksTable.createdAt));

    const parsed = playbooks.map((p) => {
      let steps: string[] = [];
      try {
        const parsed = JSON.parse(p.steps);
        steps = Array.isArray(parsed) ? parsed.filter((s: any) => typeof s === "string") : [];
      } catch {
        steps = [];
      }
      return { ...p, steps };
    });

    res.json({ playbooks: parsed });
  } catch (err) {
    req.log.error({ err }, "Get growth playbooks error");
    res.status(500).json({ error: "Failed to get playbooks" });
  }
});

router.post("/generate", async (req, res) => {
  try {
    const artistContext = await getArtistContext();
    const userMessage = `${artistContext}. Generate 4 fresh Spotify follower growth playbooks — one for each category: pre-save campaigns, algorithm optimization, curator outreach, and follower engagement. Make them specific to the artist's genre.`;

    const reply = await callAI(
      [{ role: "user", content: userMessage }],
      PLAYBOOK_GENERATION_PROMPT,
      { maxTokens: 3000 },
    );

    let playbooks: any[];
    try {
      const cleaned = reply.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
      playbooks = JSON.parse(cleaned);
    } catch {
      req.log.error("Failed to parse AI response as JSON");
      res.status(500).json({ error: "AI returned invalid format. Please try again." });
      return;
    }

    if (!Array.isArray(playbooks)) {
      res.status(500).json({ error: "AI returned invalid format. Please try again." });
      return;
    }

    const inserted = [];
    for (const pb of playbooks) {
      if (!pb || typeof pb !== "object") continue;

      const category = typeof pb.category === "string" && VALID_CATEGORIES.includes(pb.category)
        ? pb.category : "algorithm";
      const steps = Array.isArray(pb.steps)
        ? pb.steps.filter((s: any) => typeof s === "string")
        : [];

      const [row] = await db
        .insert(growthPlaybooksTable)
        .values({
          title: typeof pb.title === "string" ? pb.title : "Untitled Playbook",
          category,
          steps: JSON.stringify(steps),
        })
        .returning();
      inserted.push({ ...row, steps });
    }

    res.json({ playbooks: inserted, generated: inserted.length });
  } catch (err: any) {
    req.log.error({ err }, "Generate playbooks error");
    res.status(500).json({ error: "Failed to generate playbooks" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid ID" });
      return;
    }
    await db.delete(growthPlaybooksTable).where(eq(growthPlaybooksTable.id, id));
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Delete playbook error");
    res.status(500).json({ error: "Failed to delete playbook" });
  }
});

export default router;
