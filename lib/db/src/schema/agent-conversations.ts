import { pgTable, text, serial, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const agentConversationsTable = pgTable("agent_conversations", {
  id: serial("id").primaryKey(),
  agentType: text("agent_type").notNull(),
  role: text("role").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertAgentConversationSchema = createInsertSchema(agentConversationsTable).omit({ id: true, createdAt: true });
export type InsertAgentConversation = z.infer<typeof insertAgentConversationSchema>;
export type AgentConversation = typeof agentConversationsTable.$inferSelect;
