import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

/** A discovered playlist curator across any DSP or community. */
export const playlistCuratorsTable = pgTable("playlist_curators", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  platform: text("platform").notNull(), // spotify, apple_music, youtube_music, audiomack, boomplay, tidal, deezer, amazon_music, submithub, groover, soundplate, playlistpush, indie
  playlistName: text("playlist_name"),
  niche: text("niche").notNull(), // e.g. "hip-hop discovery", "lofi study", "indie rap"
  contactMethod: text("contact_method").notNull(), // email, instagram, twitter, discord, submission_form
  contactValue: text("contact_value").notNull(),
  followers: integer("followers"), // estimated audience size
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertPlaylistCuratorSchema = createInsertSchema(playlistCuratorsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertPlaylistCurator = z.infer<typeof insertPlaylistCuratorSchema>;
export type PlaylistCurator = typeof playlistCuratorsTable.$inferSelect;

/** A pitch draft (with 3 emotional-hook variations) targeted at a curator. */
export const pitchDraftsTable = pgTable("pitch_drafts", {
  id: serial("id").primaryKey(),
  curatorId: integer("curator_id")
    .notNull()
    .references(() => playlistCuratorsTable.id, { onDelete: "cascade" }),
  songTitle: text("song_title").notNull(),
  variations: text("variations").notNull(), // JSON array of { hook, subject, body }
  selectedVariationIdx: integer("selected_variation_idx").default(0).notNull(),
  status: text("status").default("draft").notNull(), // draft, sent, accepted, rejected
  sentAt: timestamp("sent_at"),
  responseNotes: text("response_notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertPitchDraftSchema = createInsertSchema(pitchDraftsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertPitchDraft = z.infer<typeof insertPitchDraftSchema>;
export type PitchDraft = typeof pitchDraftsTable.$inferSelect;
