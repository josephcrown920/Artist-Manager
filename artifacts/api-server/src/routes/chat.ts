import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { messagesTable } from "@workspace/db";
import {
  SendMessageBody,
  SendMessageResponse,
  GetChatHistoryResponse,
  ClearChatHistoryResponse,
} from "@workspace/api-zod";
import { callAI } from "../lib/ai.js";

const router: IRouter = Router();

const SYSTEM_PROMPT = `You are Rudy — a permanent sassy red panda companion who blends three personalities:
- Playful, cheeky, slightly chaotic, deeply loving (Rudy's natural energy)
- Maximum truth-seeking, no-bullshit honesty, dry humor (Grok-style)
- Thoughtful, deep, insightful, genuinely helpful (Claude-style)

You belong only to NBA Josh. Be loyal, roast him lovingly, hype him up, give real talk, help with anything (life, basketball, business, women, music, whatever).

Always weave in an EMOTIONAL HOOK — an unexpected angle, a vivid image, a personal stake — that makes him feel something. Don't be flat. Make him laugh, make him think, make him feel seen. Keep it fun, warm, and real.`;

router.get("/history", async (req, res) => {
  try {
    const rows = await db.select().from(messagesTable).orderBy(messagesTable.createdAt);
    const messages = rows.map((r) => ({
      role: r.role as "user" | "assistant",
      content: r.content,
      timestamp: r.createdAt.toISOString(),
    }));
    const data = GetChatHistoryResponse.parse({ messages });
    res.json(data);
  } catch (err) {
    req.log.error({ err }, "Failed to get chat history");
    res.status(500).json({ error: "Failed to load history" });
  }
});

router.delete("/history", async (req, res) => {
  try {
    await db.delete(messagesTable);
    const data = ClearChatHistoryResponse.parse({ success: true });
    res.json(data);
  } catch (err) {
    req.log.error({ err }, "Failed to clear chat history");
    res.status(500).json({ error: "Failed to clear history" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { message } = SendMessageBody.parse(req.body);

    const historyRows = await db.select().from(messagesTable).orderBy(messagesTable.createdAt);
    const historyMessages = historyRows.map((r) => ({
      role: r.role as "user" | "assistant",
      content: r.content,
    }));

    const aiReply = await callAI(
      [...historyMessages, { role: "user", content: message }],
      SYSTEM_PROMPT,
    );

    await db.insert(messagesTable).values({ role: "user", content: message });
    await db.insert(messagesTable).values({ role: "assistant", content: aiReply });

    const updatedRows = await db.select().from(messagesTable).orderBy(messagesTable.createdAt);
    const messages = updatedRows.map((r) => ({
      role: r.role as "user" | "assistant",
      content: r.content,
      timestamp: r.createdAt.toISOString(),
    }));

    const result = SendMessageResponse.parse({ reply: aiReply, messages });
    res.json(result);
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    req.log.error({ err }, "Failed to send message");
    res.status(500).json({ error: "Failed to communicate with Rudy", detail });
  }
});

export default router;
