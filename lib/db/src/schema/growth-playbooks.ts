import { pgTable, text, serial, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const growthPlaybooksTable = pgTable("growth_playbooks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  category: text("category").notNull(),
  steps: text("steps").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertGrowthPlaybookSchema = createInsertSchema(growthPlaybooksTable).omit({ id: true, createdAt: true });
export type InsertGrowthPlaybook = z.infer<typeof insertGrowthPlaybookSchema>;
export type GrowthPlaybook = typeof growthPlaybooksTable.$inferSelect;
