import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";

export const creatorsTable = pgTable("creators", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  platform: text("platform").notNull(),
  handle: text("handle"),
  niche: text("niche").notNull(),
  followers: integer("followers"),
  contactMethod: text("contact_method"),
  contactValue: text("contact_value"),
  status: text("status").notNull().default("discovered"),
  pitchDraft: text("pitch_draft"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
