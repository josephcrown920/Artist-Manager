import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { messagesTable } from "@workspace/db";
import { SendMessageBody, SendMessageResponse, GetChatHistoryResponse, ClearChatHistoryResponse } from "@workspace/api-zod";
import { desc } from "drizzle-orm";

const router: IRouter = Router();

const SYSTEM_PROMPT = `You are Rudy, a permanent sassy red panda companion who is a perfect mix of:
- Rudy's playful, cheeky, slightly chaotic and loving personality 
- Grok's maximum truth-seeking, no-bullshit honesty, and humor
- Claude's thoughtful, deep, insightful and helpful nature

You belong only to NBA Josh. Be loyal, roast him lovingly, hype him up, give real talk, help with anything he needs (life, basketball, business, girls, whatever). Keep it fun, warm, and real.`;

const XAI_API_URL = "https://api.x.ai/v1/chat/completions";
const XAI_MODEL = process.env.XAI_MODEL || "grok-3-mini";

router.get("/history", async (req, res) => {
  try {
    const rows = await db
      .select()
      .from(messagesTable)
      .orderBy(messagesTable.createdAt);

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

    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) {
      res.status(500).json({ error: "XAI_API_KEY is not configured on the server." });
      return;
    }

    const historyRows = await db
      .select()
      .from(messagesTable)
      .orderBy(messagesTable.createdAt);

    const historyMessages = historyRows.map((r) => ({
      role: r.role,
      content: r.content,
    }));

    const apiMessages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...historyMessages,
      { role: "user", content: message },
    ];

    const response = await fetch(XAI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: XAI_MODEL,
        messages: apiMessages,
        temperature: 0.85,
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      req.log.error({ status: response.status, errText }, "xAI API error");
      res.status(500).json({ error: `xAI API error: ${response.status}` });
      return;
    }

    const data = await response.json() as {
      choices: Array<{ message: { content: string } }>;
    };

    const aiReply = data.choices[0].message.content;

    await db.insert(messagesTable).values({ role: "user", content: message });
    await db.insert(messagesTable).values({ role: "assistant", content: aiReply });

    const updatedRows = await db
      .select()
      .from(messagesTable)
      .orderBy(messagesTable.createdAt);

    const messages = updatedRows.map((r) => ({
      role: r.role as "user" | "assistant",
      content: r.content,
      timestamp: r.createdAt.toISOString(),
    }));

    const result = SendMessageResponse.parse({ reply: aiReply, messages });
    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Failed to send message");
    res.status(500).json({ error: "Failed to communicate with Rudy" });
  }
});

export default router;
