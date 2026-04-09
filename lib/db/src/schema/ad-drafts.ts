import { pgTable, text, serial, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const adDraftsTable = pgTable("ad_drafts", {
  id: serial("id").primaryKey(),
  platform: text("platform").notNull(),
  campaignName: text("campaign_name").notNull(),
  objective: text("objective").notNull(),
  targetAudience: text("target_audience").notNull(),
  adCopy: text("ad_copy").notNull(),
  creativeSpecs: text("creative_specs").notNull(),
  placement: text("placement").notNull(),
  estimatedBudget: text("estimated_budget").notNull(),
  estimatedCpm: text("estimated_cpm").notNull(),
  estimatedCpc: text("estimated_cpc").notNull(),
  estimatedReach: text("estimated_reach").notNull(),
  tips: text("tips").notNull(),
  status: text("status").notNull().default("draft"),
  generatedDate: text("generated_date").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertAdDraftSchema = createInsertSchema(adDraftsTable).omit({ id: true, createdAt: true });
export type InsertAdDraft = z.infer<typeof insertAdDraftSchema>;
export type AdDraft = typeof adDraftsTable.$inferSelect;
