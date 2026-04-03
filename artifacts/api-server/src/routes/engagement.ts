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

const router: IRouter = Router();

let autopilotTimer: ReturnType<typeof setInterval> | null = null;
let autopilotConfig = { enabled: false, keywords: [] as string[], intervalMinutes: 30 };

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
  const rows = await db.select().from(appSettingsTable).where(eq(appSettingsTable.key, key));
  return rows[0]?.value ?? null;
}

async function searchTwitter(keywords: string[], bearerToken: string, count: number = 10) {
  const query = keywords.map((k) => k.trim()).join(" OR ") + " -is:retweet lang:en";
  const url = `https://api.twitter.com/2/tweets/search/recent?query=${encodeURIComponent(query)}&max_results=${Math.min(count, 10)}&tweet.fields=text,author_id&expansions=author_id&user.fields=username`;

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${bearerToken}` },
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Twitter search error ${response.status}: ${err}`);
  }

  const data = await response.json() as {
    data?: Array<{ id: string; text: string; author_id: string }>;
    includes?: { users?: Array<{ id: string; username: string }> };
  };

  if (!data.data) return [];

  const userMap: Record<string, string> = {};
  (data.includes?.users || []).forEach((u) => { userMap[u.id] = u.username; });

  return data.data.map((t) => ({
    tweetId: t.id,
    tweetText: t.text,
    tweetAuthor: userMap[t.author_id] || "unknown",
  }));
}

async function likeTweet(tweetId: string, userId: string, accessToken: string) {
  const response = await fetch(`https://api.twitter.com/2/users/${userId}/likes`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ tweet_id: tweetId }),
  });
  return response.ok;
}

async function replyToTweet(tweetId: string, replyText: string, accessToken: string) {
  const response = await fetch("https://api.twitter.com/2/tweets", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ text: replyText, reply: { in_reply_to_tweet_id: tweetId } }),
  });
  return response.ok;
}

router.post("/generate", async (req, res) => {
  try {
    const { keywords, count } = GenerateEngagementBody.parse(req.body);
    const bearerToken = await getSetting("twitter_bearer_token");

    if (!bearerToken) {
      res.status(400).json({ error: "Twitter Bearer Token not configured. Please add it in Settings." });
      return;
    }

    const tweets = await searchTwitter(keywords, bearerToken, count ?? 10);

    if (!tweets.length) {
      res.json(GenerateEngagementResponse.parse({ generated: 0, items: [] }));
      return;
    }

    const artistName = await getSetting("artist_name") || "the artist";
    const genre = await getSetting("genre") || "music";

    const items = await Promise.all(
      tweets.map(async (tweet) => {
        const reply = await callXAI(
          [{ role: "user", content: `Generate a genuine, engaging reply to this tweet from @${tweet.tweetAuthor}: "${tweet.tweetText}". Keep it under 200 characters. Be authentic, supportive, and relatable as a ${genre} artist named ${artistName}. Don't be salesy.` }],
          `You are a ${genre} artist named ${artistName}. You're engaging genuinely with fans and fellow artists on Twitter. Write short, authentic replies.`
        );

        const [row] = await db.insert(engagementQueueTable).values({
          tweetId: tweet.tweetId,
          tweetText: tweet.tweetText,
          tweetAuthor: tweet.tweetAuthor,
          action: "like_and_reply",
          generatedReply: reply,
          status: "pending",
        }).returning();

        return mapItem(row);
      })
    );

    const data = GenerateEngagementResponse.parse({ generated: items.length, items });
    res.json(data);
  } catch (err) {
    req.log.error({ err }, "Generate engagement error");
    res.status(500).json({ error: String(err) });
  }
});

router.get("/queue", async (req, res) => {
  try {
    const rows = await db.select().from(engagementQueueTable)
      .where(eq(engagementQueueTable.status, "pending"))
      .orderBy(engagementQueueTable.createdAt);
    const data = GetEngagementQueueResponse.parse({ items: rows.map(mapItem) });
    res.json(data);
  } catch (err) {
    req.log.error({ err }, "Get queue error");
    res.status(500).json({ error: "Failed to get queue" });
  }
});

router.post("/queue/:id/post", async (req, res) => {
  try {
    const { id } = PostEngagementParams.parse({ id: Number(req.params.id) });

    const [item] = await db.select().from(engagementQueueTable).where(eq(engagementQueueTable.id, id));
    if (!item) {
      res.status(404).json({ error: "Item not found" });
      return;
    }

    const accessToken = await getSetting("twitter_access_token");
    const userId = await getSetting("twitter_user_id");
    let posted = false;

    if (accessToken && userId) {
      if (item.action === "like" || item.action === "like_and_reply") {
        await likeTweet(item.tweetId, userId, accessToken);
      }
      if ((item.action === "reply" || item.action === "like_and_reply") && item.generatedReply) {
        await replyToTweet(item.tweetId, item.generatedReply, accessToken);
      }
      posted = true;
    }

    const [updated] = await db.update(engagementQueueTable)
      .set({ status: "posted", postedAt: new Date() })
      .where(eq(engagementQueueTable.id, id))
      .returning();

    const data = PostEngagementResponse.parse({ success: posted, item: mapItem(updated) });
    res.json(data);
  } catch (err) {
    req.log.error({ err }, "Post engagement error");
    res.status(500).json({ error: String(err) });
  }
});

router.delete("/queue/:id", async (req, res) => {
  try {
    const { id } = DeleteEngagementItemParams.parse({ id: Number(req.params.id) });
    await db.update(engagementQueueTable).set({ status: "rejected" }).where(eq(engagementQueueTable.id, id));
    const data = DeleteEngagementItemResponse.parse({ success: true });
    res.json(data);
  } catch (err) {
    req.log.error({ err }, "Delete engagement item error");
    res.status(500).json({ error: "Failed to remove item" });
  }
});

router.get("/history", async (req, res) => {
  try {
    const rows = await db.select().from(engagementQueueTable)
      .where(ne(engagementQueueTable.status, "pending"))
      .orderBy(engagementQueueTable.createdAt);
    const data = GetEngagementHistoryResponse.parse({ items: rows.map(mapItem), total: rows.length });
    res.json(data);
  } catch (err) {
    req.log.error({ err }, "Get history error");
    res.status(500).json({ error: "Failed to get history" });
  }
});

router.get("/autopilot/status", (_req, res) => {
  res.json({
    enabled: autopilotConfig.enabled,
    keywords: autopilotConfig.keywords,
    intervalMinutes: autopilotConfig.intervalMinutes,
  });
});

router.post("/autopilot", async (req, res) => {
  try {
    const body = SetAutopilotBody.parse(req.body);
    autopilotConfig = {
      enabled: body.enabled,
      keywords: body.keywords ?? autopilotConfig.keywords,
      intervalMinutes: body.intervalMinutes ?? autopilotConfig.intervalMinutes,
    };

    if (autopilotTimer) {
      clearInterval(autopilotTimer);
      autopilotTimer = null;
    }

    let nextRunAt: string | null = null;

    if (body.enabled && autopilotConfig.keywords.length > 0) {
      const ms = autopilotConfig.intervalMinutes * 60 * 1000;
      nextRunAt = new Date(Date.now() + ms).toISOString();

      autopilotTimer = setInterval(async () => {
        try {
          const bearerToken = await getSetting("twitter_bearer_token");
          if (!bearerToken) return;
          const tweets = await searchTwitter(autopilotConfig.keywords, bearerToken, 5);
          const artistName = await getSetting("artist_name") || "the artist";
          const genre = await getSetting("genre") || "music";
          for (const tweet of tweets) {
            const reply = await callXAI(
              [{ role: "user", content: `Generate a genuine reply to: "${tweet.tweetText}". Under 200 chars, authentic ${genre} artist voice.` }],
              `You are ${artistName}, a ${genre} artist engaging on Twitter.`
            );
            await db.insert(engagementQueueTable).values({
              tweetId: tweet.tweetId,
              tweetText: tweet.tweetText,
              tweetAuthor: tweet.tweetAuthor,
              action: "like_and_reply",
              generatedReply: reply,
              status: "pending",
            });
          }
        } catch (e) { /* silent — will retry next interval */ }
      }, ms);
    }

    const data = SetAutopilotResponse.parse({
      enabled: autopilotConfig.enabled,
      keywords: autopilotConfig.keywords,
      intervalMinutes: autopilotConfig.intervalMinutes,
      nextRunAt,
    });
    res.json(data);
  } catch (err) {
    req.log.error({ err }, "Set autopilot error");
    res.status(500).json({ error: "Failed to set autopilot" });
  }
});

export default router;
