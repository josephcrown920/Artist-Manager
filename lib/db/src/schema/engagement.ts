import { pgTable, text, serial, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const engagementQueueTable = pgTable("engagement_queue", {
  id: serial("id").primaryKey(),
  tweetId: text("tweet_id").notNull(),
  tweetText: text("tweet_text").notNull(),
  tweetAuthor: text("tweet_author").notNull(),
  action: text("action").notNull().default("like_and_reply"),
  generatedReply: text("generated_reply"),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  postedAt: timestamp("posted_at"),
});

export const insertEngagementSchema = createInsertSchema(engagementQueueTable).omit({ id: true, createdAt: true });
export type InsertEngagement = z.infer<typeof insertEngagementSchema>;
export type EngagementItem = typeof engagementQueueTable.$inferSelect;
