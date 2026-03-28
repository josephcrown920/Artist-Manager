import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { agentConversationsTable } from "@workspace/db";
import {
  ChatWithAgentBody,
  ChatWithAgentResponse,
  GetAgentConversationParams,
  GetAgentConversationResponse,
  ClearAgentConversationParams,
  ClearAgentConversationResponse,
} from "@workspace/api-zod";
import { eq, and } from "drizzle-orm";

const router: IRouter = Router();

const XAI_API_URL = "https://api.x.ai/v1/chat/completions";
const XAI_MODEL = process.env.XAI_MODEL || "grok-3-mini";

const AGENT_PROMPTS: Record<string, string> = {
  manager: `You are a world-class music industry manager — sharp, connected, and results-driven. You handle career strategy, deal negotiations, booking, brand partnerships, and long-term artist development. You give direct, no-nonsense advice. You know the business inside out. Be specific, tactical, and ambitious.`,

  assistant: `You are a highly organized, proactive personal assistant for a music artist. You help manage schedules, coordinate tasks, send reminders, draft emails, and keep everything running smoothly. You're warm, efficient, and always two steps ahead. Keep responses concise and actionable.`,

  pr: `You are a powerhouse music PR professional. You craft press releases, pitch media stories, manage the artist's public image, handle crisis comms, and know every journalist and blogger in the industry. You think in narratives and know how to make noise. Be confident, strategic, and bold.`,

  social: `You are an expert social media manager for a music artist. You know what's trending, how to grow engagement, what to post and when, how to write killer captions, and how to build a loyal fanbase online. You understand all platforms — Instagram, TikTok, Twitter/X, YouTube. Give specific, creative, actionable advice.`,
};

async function callXAI(messages: Array<{ role: string; content: string }>, systemPrompt: string): Promise<string> {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) throw new Error("XAI_API_KEY not configured");

  const response = await fetch(XAI_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: XAI_MODEL,
      messages: [{ role: "system", content: systemPrompt }, ...messages],
      temperature: 0.85,
      max_tokens: 1024,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`xAI error ${response.status}: ${err}`);
  }

  const data = await response.json() as { choices: Array<{ message: { content: string } }> };
  return data.choices[0].message.content;
}

router.post("/chat", async (req, res) => {
  try {
    const { agentType, message } = ChatWithAgentBody.parse(req.body);
    const systemPrompt = AGENT_PROMPTS[agentType];

    const historyRows = await db
      .select()
      .from(agentConversationsTable)
      .where(eq(agentConversationsTable.agentType, agentType))
      .orderBy(agentConversationsTable.createdAt);

    const historyMessages = historyRows.map((r) => ({ role: r.role, content: r.content }));
    const allMessages = [...historyMessages, { role: "user", content: message }];

    const reply = await callXAI(allMessages, systemPrompt);

    await db.insert(agentConversationsTable).values({ agentType, role: "user", content: message });
    await db.insert(agentConversationsTable).values({ agentType, role: "assistant", content: reply });

    const updatedRows = await db
      .select()
      .from(agentConversationsTable)
      .where(eq(agentConversationsTable.agentType, agentType))
      .orderBy(agentConversationsTable.createdAt);

    const messages = updatedRows.map((r) => ({
      role: r.role as "user" | "assistant",
      content: r.content,
      timestamp: r.createdAt.toISOString(),
    }));

    const result = ChatWithAgentResponse.parse({ reply, agentType, messages });
    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Agent chat error");
    res.status(500).json({ error: "Failed to get agent response" });
  }
});

router.get("/conversations/:agentType", async (req, res) => {
  try {
    const { agentType } = GetAgentConversationParams.parse(req.params);

    const rows = await db
      .select()
      .from(agentConversationsTable)
      .where(eq(agentConversationsTable.agentType, agentType))
      .orderBy(agentConversationsTable.createdAt);

    const messages = rows.map((r) => ({
      role: r.role as "user" | "assistant",
      content: r.content,
      timestamp: r.createdAt.toISOString(),
    }));

    const data = GetAgentConversationResponse.parse({ messages, agentType });
    res.json(data);
  } catch (err) {
    req.log.error({ err }, "Get conversation error");
    res.status(500).json({ error: "Failed to get conversation" });
  }
});

router.delete("/conversations/:agentType", async (req, res) => {
  try {
    const { agentType } = ClearAgentConversationParams.parse(req.params);
    await db.delete(agentConversationsTable).where(eq(agentConversationsTable.agentType, agentType));
    const data = ClearAgentConversationResponse.parse({ success: true });
    res.json(data);
  } catch (err) {
    req.log.error({ err }, "Clear conversation error");
    res.status(500).json({ error: "Failed to clear conversation" });
  }
});

export { callXAI };
export default router;
