import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { engagementQueueTable, appSettingsTable } from "@workspace/db";
import {
  GenerateEngagementBody,
  GenerateEngagementResponse,
  GetEngagementQueueResponse,
  PostEngagementParams,
  PostEngagementResponse,
  DeleteEngagementItemParams,
  DeleteEngagementItemResponse,
  GetEngagementHistoryResponse,
  SetAutopilotBody,
  SetAutopilotResponse,
} from "@workspace/api-zod";
import { eq, ne } from "drizzle-orm";
import { callXAI } from "./agents.js";
import {
  buildOAuth1Header,
  type TwitterOAuth1Credentials,
} from "../lib/twitter-oauth.js";
import { logger } from "../lib/logger.js";

const router: IRouter = Router();

let autopilotTimer: ReturnType<typeof setInterval> | null = null;

function mapItem(r: typeof engagementQueueTable.$inferSelect) {
  return {
    id: r.id,
    tweetId: r.tweetId,
    tweetText: r.tweetText,
    tweetAuthor: r.tweetAuthor,
    action: r.action as "like" | "reply" | "like_and_reply",
    generatedReply: r.generatedReply ?? null,
    status: r.status as "pending" | "posted" | "rejected",
    createdAt: r.createdAt.toISOString(),
    postedAt: r.postedAt ? r.postedAt.toISOString() : null,
  };
}

async function getSetting(key: string): Promise<string | null> {
  const rows = await db
    .select()
    .from(appSettingsTable)
    .where(eq(appSettingsTable.key, key));
  return rows[0]?.value ?? null;
}

async function setSetting(key: string, value: string): Promise<void> {
  const existing = await db
    .select()
    .from(appSettingsTable)
    .where(eq(appSettingsTable.key, key));
  if (existing.length > 0) {
    await db
      .update(appSettingsTable)
      .set({ value })
      .where(eq(appSettingsTable.key, key));
  } else {
    await db.insert(appSettingsTable).values({ key, value });
  }
}

async function getOAuth1Credentials(): Promise<TwitterOAuth1Credentials | null> {
  const consumerKey = await getSetting("twitter_api_key");
  const consumerSecret = await getSetting("twitter_api_secret");
  const accessToken = await getSetting("twitter_access_token");
  const accessTokenSecret = await getSetting("twitter_access_secret");

  if (!consumerKey || !consumerSecret || !accessToken || !accessTokenSecret) {
    return null;
  }
  return { consumerKey, consumerSecret, accessToken, accessTokenSecret };
}

async function searchTwitter(
  keywords: string[],
  bearerToken: string,
  count: number = 10,
) {
  const query =
    keywords.map((k) => k.trim()).join(" OR ") + " -is:retweet lang:en";
  const max = Math.max(10, Math.min(count, 100));
  const url = `https://api.twitter.com/2/tweets/search/recent?query=${encodeURIComponent(query)}&max_results=${max}&tweet.fields=text,author_id&expansions=author_id&user.fields=username`;

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${bearerToken}` },
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Twitter search error ${response.status}: ${err}`);
  }

  const data = (await response.json()) as {
    data?: Array<{ id: string; text: string; author_id: string }>;
    includes?: { users?: Array<{ id: string; username: string }> };
  };

  if (!data.data) return [];

  const userMap: Record<string, string> = {};
  (data.includes?.users || []).forEach((u) => {
    userMap[u.id] = u.username;
  });

  return data.data.map((t) => ({
    tweetId: t.id,
    tweetText: t.text,
    tweetAuthor: userMap[t.author_id] || "unknown",
  }));
}

async function likeTweet(
  tweetId: string,
  userId: string,
  creds: TwitterOAuth1Credentials,
): Promise<{ ok: boolean; status: number; body: string }> {
  const url = `https://api.twitter.com/2/users/${userId}/likes`;
  const authHeader = buildOAuth1Header("POST", url, creds);
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: authHeader,
    },
    body: JSON.stringify({ tweet_id: tweetId }),
  });
  const body = await response.text();
  return { ok: response.ok, status: response.status, body };
}

async function replyToTweet(
  tweetId: string,
  replyText: string,
  creds: TwitterOAuth1Credentials,
): Promise<{ ok: boolean; status: number; body: string }> {
  const url = "https://api.twitter.com/2/tweets";
  const authHeader = buildOAuth1Header("POST", url, creds);
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: authHeader,
    },
    body: JSON.stringify({
      text: replyText.slice(0, 280),
      reply: { in_reply_to_tweet_id: tweetId },
    }),
  });
  const body = await response.text();
  return { ok: response.ok, status: response.status, body };
}

router.post("/generate", async (req, res) => {
  try {
    const { keywords, count } = GenerateEngagementBody.parse(req.body);
    const bearerToken = await getSetting("twitter_bearer_token");

    if (!bearerToken) {
      res.status(400).json({
        error:
          "Twitter Bearer Token not configured. Please add it in Settings.",
      });
      return;
    }

    const tweets = await searchTwitter(keywords, bearerToken, count ?? 10);

    if (!tweets.length) {
      res.json(GenerateEngagementResponse.parse({ generated: 0, items: [] }));
      return;
    }

    const artistName = (await getSetting("artist_name")) || "the artist";
    const genre = (await getSetting("genre")) || "music";

    const items = await Promise.all(
      tweets.map(async (tweet) => {
        const reply = await callXAI(
          [
            {
              role: "user",
              content: `Generate a genuine, engaging reply to this tweet from @${tweet.tweetAuthor}: "${tweet.tweetText}". Keep it under 200 characters. Be authentic, supportive, and relatable as a ${genre} artist named ${artistName}. Don't be salesy.`,
            },
          ],
          `You are a ${genre} artist named ${artistName}. You're engaging genuinely with fans and fellow artists on Twitter. Write short, authentic replies.`,
        );

        const [row] = await db
          .insert(engagementQueueTable)
          .values({
            tweetId: tweet.tweetId,
            tweetText: tweet.tweetText,
            tweetAuthor: tweet.tweetAuthor,
            action: "like_and_reply",
            generatedReply: reply,
            status: "pending",
          })
          .returning();

        return mapItem(row);
      }),
    );

    const data = GenerateEngagementResponse.parse({
      generated: items.length,
      items,
    });
    res.json(data);
  } catch (err) {
    req.log.error({ err }, "Generate engagement error");
    res
      .status(500)
      .json({ error: "Failed to generate engagement", detail: String(err) });
  }
});

router.get("/queue", async (req, res) => {
  try {
    const rows = await db
      .select()
      .from(engagementQueueTable)
      .where(eq(engagementQueueTable.status, "pending"))
      .orderBy(engagementQueueTable.createdAt);
    const data = GetEngagementQueueResponse.parse({
      items: rows.map(mapItem),
    });
    res.json(data);
  } catch (err) {
    req.log.error({ err }, "Get queue error");
    res.status(500).json({ error: "Failed to get queue" });
  }
});

router.post("/queue/:id/post", async (req, res) => {
  try {
    const { id } = PostEngagementParams.parse({ id: Number(req.params.id) });

    const [item] = await db
      .select()
      .from(engagementQueueTable)
      .where(eq(engagementQueueTable.id, id));
    if (!item) {
      res.status(404).json({ error: "Item not found" });
      return;
    }

    const creds = await getOAuth1Credentials();
    const userId = await getSetting("twitter_user_id");

    if (!creds || !userId) {
      res.status(400).json({
        error:
          "Twitter write access not configured. Add API Key/Secret, Access Token/Secret, and your Twitter User ID in Settings.",
      });
      return;
    }

    const errors: string[] = [];
    if (item.action === "like" || item.action === "like_and_reply") {
      const r = await likeTweet(item.tweetId, userId, creds);
      if (!r.ok) errors.push(`Like failed (${r.status}): ${r.body}`);
    }
    if (
      (item.action === "reply" || item.action === "like_and_reply") &&
      item.generatedReply
    ) {
      const r = await replyToTweet(item.tweetId, item.generatedReply, creds);
      if (!r.ok) errors.push(`Reply failed (${r.status}): ${r.body}`);
    }

    if (errors.length > 0) {
      req.log.warn({ tweetId: item.tweetId, errors }, "Twitter post errors");
      res.status(502).json({ error: errors.join(" | ") });
      return;
    }

    const [updated] = await db
      .update(engagementQueueTable)
      .set({ status: "posted", postedAt: new Date() })
      .where(eq(engagementQueueTable.id, id))
      .returning();

    const data = PostEngagementResponse.parse({
      success: true,
      item: mapItem(updated),
    });
    res.json(data);
  } catch (err) {
    req.log.error({ err }, "Post engagement error");
    res.status(500).json({ error: String(err) });
  }
});

router.delete("/queue/:id", async (req, res) => {
  try {
    const { id } = DeleteEngagementItemParams.parse({
      id: Number(req.params.id),
    });
    await db
      .update(engagementQueueTable)
      .set({ status: "rejected" })
      .where(eq(engagementQueueTable.id, id));
    const data = DeleteEngagementItemResponse.parse({ success: true });
    res.json(data);
  } catch (err) {
    req.log.error({ err }, "Delete engagement item error");
    res.status(500).json({ error: "Failed to remove item" });
  }
});

router.get("/history", async (req, res) => {
  try {
    const rows = await db
      .select()
      .from(engagementQueueTable)
      .where(ne(engagementQueueTable.status, "pending"))
      .orderBy(engagementQueueTable.createdAt);
    const data = GetEngagementHistoryResponse.parse({
      items: rows.map(mapItem),
      total: rows.length,
    });
    res.json(data);
  } catch (err) {
    req.log.error({ err }, "Get history error");
    res.status(500).json({ error: "Failed to get history" });
  }
});

router.get("/autopilot/status", async (_req, res) => {
  const enabled = (await getSetting("autopilot_enabled")) === "true";
  const keywordsRaw = await getSetting("engagement_keywords");
  const intervalRaw = await getSetting("autopilot_interval_minutes");
  res.json({
    enabled,
    keywords: keywordsRaw ? JSON.parse(keywordsRaw) : [],
    intervalMinutes: intervalRaw ? parseInt(intervalRaw, 10) : 30,
  });
});

router.post("/autopilot", async (req, res) => {
  try {
    const body = SetAutopilotBody.parse(req.body);

    await setSetting("autopilot_enabled", body.enabled ? "true" : "false");
    if (body.keywords !== undefined) {
      await setSetting("engagement_keywords", JSON.stringify(body.keywords));
    }
    if (body.intervalMinutes !== undefined) {
      await setSetting(
        "autopilot_interval_minutes",
        body.intervalMinutes.toString(),
      );
    }

    const keywordsRaw = await getSetting("engagement_keywords");
    const intervalRaw = await getSetting("autopilot_interval_minutes");
    const keywords: string[] = keywordsRaw ? JSON.parse(keywordsRaw) : [];
    const intervalMinutes = intervalRaw ? parseInt(intervalRaw, 10) : 30;

    let nextRunAt: string | null = null;
    if (body.enabled && keywords.length > 0) {
      restartAutopilotLoop(intervalMinutes);
      nextRunAt = new Date(
        Date.now() + intervalMinutes * 60 * 1000,
      ).toISOString();
    } else {
      stopAutopilotLoop();
    }

    const data = SetAutopilotResponse.parse({
      enabled: body.enabled,
      keywords,
      intervalMinutes,
      nextRunAt,
    });
    res.json(data);
  } catch (err) {
    req.log.error({ err }, "Set autopilot error");
    res.status(500).json({ error: "Failed to set autopilot" });
  }
});

function stopAutopilotLoop() {
  if (autopilotTimer) {
    clearInterval(autopilotTimer);
    autopilotTimer = null;
  }
}

async function runAutopilotOnce() {
  try {
    const bearerToken = await getSetting("twitter_bearer_token");
    if (!bearerToken) {
      logger.warn(
        "Autopilot tick skipped: twitter_bearer_token not configured",
      );
      return;
    }
    const keywordsRaw = await getSetting("engagement_keywords");
    const keywords: string[] = keywordsRaw ? JSON.parse(keywordsRaw) : [];
    if (keywords.length === 0) {
      logger.warn("Autopilot tick skipped: no keywords");
      return;
    }
    const tweets = await searchTwitter(keywords, bearerToken, 5);
    const artistName = (await getSetting("artist_name")) || "the artist";
    const genre = (await getSetting("genre")) || "music";
    for (const tweet of tweets) {
      try {
        const reply = await callXAI(
          [
            {
              role: "user",
              content: `Generate a genuine reply to: "${tweet.tweetText}". Under 200 chars, authentic ${genre} artist voice.`,
            },
          ],
          `You are ${artistName}, a ${genre} artist engaging on Twitter.`,
        );
        await db.insert(engagementQueueTable).values({
          tweetId: tweet.tweetId,
          tweetText: tweet.tweetText,
          tweetAuthor: tweet.tweetAuthor,
          action: "like_and_reply",
          generatedReply: reply,
          status: "pending",
        });
      } catch (innerErr) {
        logger.error({ err: innerErr, tweet }, "Autopilot per-tweet error");
      }
    }
  } catch (err) {
    logger.error({ err }, "Autopilot tick failed");
  }
}

function restartAutopilotLoop(intervalMinutes: number) {
  stopAutopilotLoop();
  const ms = Math.max(1, intervalMinutes) * 60 * 1000;
  autopilotTimer = setInterval(() => {
    void runAutopilotOnce();
  }, ms);
}

/** Called from server startup to resume autopilot state from the DB. */
export async function initAutopilotFromDb(): Promise<void> {
  try {
    const enabled = (await getSetting("autopilot_enabled")) === "true";
    const intervalRaw = await getSetting("autopilot_interval_minutes");
    const keywordsRaw = await getSetting("engagement_keywords");
    const intervalMinutes = intervalRaw ? parseInt(intervalRaw, 10) : 30;
    const keywords: string[] = keywordsRaw ? JSON.parse(keywordsRaw) : [];
    if (enabled && keywords.length > 0) {
      restartAutopilotLoop(intervalMinutes);
      logger.info(
        { intervalMinutes, keywordCount: keywords.length },
        "Autopilot resumed from DB state",
      );
    }
  } catch (err) {
    logger.error({ err }, "Failed to init autopilot from DB");
  }
}

export default router;
