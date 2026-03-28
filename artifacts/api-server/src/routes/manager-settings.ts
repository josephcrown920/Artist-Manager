import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { appSettingsTable } from "@workspace/db";
import {
  GetSettingsResponse,
  SaveSettingsBody,
  SaveSettingsResponse,
} from "@workspace/api-zod";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

async function getSetting(key: string): Promise<string | null> {
  const rows = await db.select().from(appSettingsTable).where(eq(appSettingsTable.key, key));
  return rows[0]?.value ?? null;
}

async function setSetting(key: string, value: string): Promise<void> {
  const existing = await db.select().from(appSettingsTable).where(eq(appSettingsTable.key, key));
  if (existing.length > 0) {
    await db.update(appSettingsTable).set({ value }).where(eq(appSettingsTable.key, key));
  } else {
    await db.insert(appSettingsTable).values({ key, value });
  }
}

router.get("/", async (req, res) => {
  try {
    const artistName = await getSetting("artist_name") || "";
    const genre = await getSetting("genre") || "";
    const twitterBearerToken = await getSetting("twitter_bearer_token");
    const keywordsRaw = await getSetting("engagement_keywords");
    const autopilotRaw = await getSetting("autopilot_enabled");

    const data = GetSettingsResponse.parse({
      artistName,
      genre,
      twitterConnected: !!twitterBearerToken,
      engagementKeywords: keywordsRaw ? JSON.parse(keywordsRaw) : [],
      autopilotEnabled: autopilotRaw === "true",
    });
    res.json(data);
  } catch (err) {
    req.log.error({ err }, "Get settings error");
    res.status(500).json({ error: "Failed to get settings" });
  }
});

router.post("/", async (req, res) => {
  try {
    const body = SaveSettingsBody.parse(req.body);

    if (body.artistName !== undefined) await setSetting("artist_name", body.artistName);
    if (body.genre !== undefined) await setSetting("genre", body.genre);
    if (body.twitterBearerToken) await setSetting("twitter_bearer_token", body.twitterBearerToken);
    if (body.twitterApiKey) await setSetting("twitter_api_key", body.twitterApiKey);
    if (body.twitterApiSecret) await setSetting("twitter_api_secret", body.twitterApiSecret);
    if (body.twitterAccessToken) await setSetting("twitter_access_token", body.twitterAccessToken);
    if (body.twitterAccessSecret) await setSetting("twitter_access_secret", body.twitterAccessSecret);
    if (body.engagementKeywords) await setSetting("engagement_keywords", JSON.stringify(body.engagementKeywords));

    const artistName = await getSetting("artist_name") || "";
    const genre = await getSetting("genre") || "";
    const twitterBearerToken = await getSetting("twitter_bearer_token");
    const keywordsRaw = await getSetting("engagement_keywords");
    const autopilotRaw = await getSetting("autopilot_enabled");

    const data = SaveSettingsResponse.parse({
      artistName,
      genre,
      twitterConnected: !!twitterBearerToken,
      engagementKeywords: keywordsRaw ? JSON.parse(keywordsRaw) : [],
      autopilotEnabled: autopilotRaw === "true",
    });
    res.json(data);
  } catch (err) {
    req.log.error({ err }, "Save settings error");
    res.status(500).json({ error: "Failed to save settings" });
  }
});

export default router;
