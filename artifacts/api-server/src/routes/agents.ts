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
import { callAI } from "../lib/ai.js";

const router: IRouter = Router();

const EMOTIONAL_HOOK_RULE = `
=== EMOTIONAL HOOK RULE (apply to EVERY reply) ===
Every response must lead with an EMOTIONAL HOOK that "plays the listener's ears" — meaning it makes the artist (and downstream fans/curators) feel something instantly. Hooks that work: curiosity, FOMO, identity, transformation, belonging, vindication, status. Avoid generic marketing speak. Specifics > abstractions. Stories > stats. Stakes > suggestions.
`;

const KNOWLEDGE_BASE = `
=== ARTIST MANAGEMENT MASTER KNOWLEDGE BASE ===
(Decades of music industry research, strategy, and proven tactics)

--- ARTIST DEVELOPMENT FUNDAMENTALS ---
• Identity first: An artist's brand must be authentic, consistent, and visually distinct before any promotion begins. Fans buy into a persona, not just music.
• The 1000 True Fans rule: 1000 deeply devoted fans who spend $100/year = $100k/year. Focus on depth of connection before breadth.
• Release strategy: In the streaming era, frequent releases (every 4-6 weeks) beat album dumps. Each release is a marketing moment.
• Artist DNA: Define the artist's sonic identity, visual aesthetic, core message, and target audience before anything else.
• The 3-year rule: Most overnight successes took 3-7 years of consistent work. Patience and consistency beat talent alone.

--- STREAMING & DISTRIBUTION ---
• Distribute via DistroKid, TuneCore, or CD Baby for indie artists. Keep 100% royalties if possible.
• Spotify algorithm loves saves, playlist adds, and full streams. Ask fans to save, not just stream.
• Pre-saves before release build algorithmic momentum. Use Submithub, DistroKid's pre-save links.
• Playlist pitching: Pitch Spotify editorial via Spotify for Artists at least 7 days before release. SubmitHub, Groover for indie playlists.
• Apple Music Connect, Amazon Music, Tidal, Deezer — submit to all editorial teams.
• SoundExchange collects digital performance royalties. Register immediately.
• ASCAP/BMI/SESAC — register as both writer and publisher. Collect all performance royalties.

--- PLAYLIST STRATEGY (Deep) ---
• Spotify playlist tiers: Editorial (hardest, biggest), Algorithmic (Release Radar, Discover Weekly, Radio), User-curated (indie playlisters).
• To crack editorial: Need professional pitch, high-quality audio master, compelling story, at least 7 days in advance via Spotify for Artists.
• Algorithmic playlists trigger when: save rate >20%, skip rate <30%, full listen-through rate high, already on user-curated playlists.
• User playlist strategy: Build relationships with independent playlist curators on SubmitHub, Groover, PlaylistPush, Soundplate.
• Cross-platform: Apple Music editorial, Amazon Music playlists, YouTube Music, Tidal Rising.
• Playlist pitching email template: artist name, genre, BPM, mood, key influences, the one thing that makes this song unique. Under 100 words.
• Collaborate with playlist curators — offer exclusive premieres, early access, interviews.
• Create your OWN playlists featuring your music + similar artists. Promotes cross-discovery.

--- SOCIAL MEDIA GROWTH ---
• TikTok is the #1 discovery platform in 2024. 15-60 second videos with original sounds are the engine.
• TikTok strategy: Post 1-3x/day, use trending sounds + your own music, show behind-the-scenes, tell a story, use duets/stitches to piggyback viral content.
• Instagram: Reels > Stories > Posts for reach. Carousel posts get highest saves. Go Live weekly for algorithm boost.
• Twitter/X: Real-time engagement, personality, hot takes, music discourse. Tweet 3-5x/day. Reply to bigger artists.
• YouTube: Long-form music videos, vlogs, studio sessions. Shorts linked to full videos. SEO titles and thumbnails matter hugely.
• Consistency beats viral moments. Daily posting for 90 days changes trajectory.
• Fan engagement: Reply to every comment for the first 1000. DM new followers. Host live Q&As.
• Engagement hack: Comment meaningfully on top posts in your genre hashtags — brings new followers.
• Cross-platform posting: Master 1-2 platforms first, then expand.

--- PR & MEDIA RELATIONS ---
• Press is social proof that amplifies everything else. An artist with no press looks unestablished.
• Target tiers: Local press → indie blogs → genre-specific publications → mid-tier outlets → major outlets.
• Pitchfork, Rolling Stone, Billboard require existing buzz. Start with: HotNewHipHop, Earmilk, Ones To Watch, The FADER, Pigeons & Planes.
• Press kit must include: bio (50, 100, 200 word versions), hi-res photos, links to music, previous coverage, streaming stats if strong.
• Build relationships with journalists — engage their content before pitching. Don't just email cold.
• Story angles that work: hometown hero, comeback narrative, unique creative process, social movement connection, viral moment behind the music.
• Radio: Start with college radio (CMJ/Mediabase), then regional, then national. Contact music directors directly.
• Podcast appearances are underrated — niche audiences are highly engaged.

--- ADVERTISING STRATEGY ---
• Meta Ads (Facebook/Instagram): Most powerful for music because of demographic targeting. Start with $5-10/day.
• Best Meta ad format: Video ad using song over vertical lifestyle content. CTA to Spotify or music video.
• Retargeting: Pixel everyone who visits your site, watch >3s of video, engage with page. Retarget with different creative.
• YouTube ads: Skippable in-stream ads before music videos in your genre. Only pay when they don't skip (>30s).
• TikTok ads: Spark Ads boost your organic TikToks. Most authentic-feeling ad format.
• Spotify Marquee: Paid placement in Spotify notifications to followers. High conversion for new releases.
• Spotify Showcase: Appears in "What's New" section. Great for catalog promotion.
• Google Ads: Target searches for similar artists. Drive to YouTube or Spotify.
• Ad creative rule: First 3 seconds must hook — face, unexpected visual, or lyric hook. No slow intros.
• Budget allocation starter pack: 40% Meta, 30% YouTube, 20% TikTok, 10% Spotify Marquee.

--- REVENUE STREAMS ---
• Streaming royalties (Spotify ~$0.003-0.005/stream, Apple ~$0.007/stream).
• Sync licensing: Music in TV, film, ads, games. Often pays $500-$50k per placement. Register with music libraries.
• Live performance: The #1 revenue source for established artists. Build local → regional → national → international.
• Merchandise: 30-50% margins. Limited drops create urgency. Artist's face/logo on quality product.
• Brand partnerships: Align with brands matching your audience. Start with local/regional before national.
• YouTube AdSense: Enable monetization. Build long-form content.
• Patreon/Fan memberships: Superfan layer for exclusive content. $5-$50/month.
• NFTs and Web3 (emerging): Direct-to-fan, limited edition digital releases.
• Sell beats/presets if producer. Teach what you know.

--- BOOKING & LIVE PERFORMANCE ---
• Start by playing local venues — build hometown credibility before going regional.
• Support slots for bigger artists = fastest audience growth strategy. Reach out to management of bigger artists.
• Touring budget: Travel, lodging, food, equipment, marketing = often break-even for indie artists. Merchandise makes profit.
• Festival strategy: Showcase festivals (SXSW, CMJ) → smaller regional festivals → bigger festivals.
• Create memorable live show: visuals, lighting, stage presence, crowd interaction all matter.
• Build relationships with promoters and venue bookers — they book who they trust.
• Livestreaming concerts (Twitch, StageIt, Moment House) generates revenue and builds global fanbase.

--- TEAM BUILDING ---
• Manager: Career strategy, relationships, deals. Takes 15-20% commission.
• Booking agent: Gets live performance opportunities. Takes 10-15%.
• Entertainment lawyer: Essential before signing anything. $300-500/hr.
• Publicist: Media coverage. $1,500-5,000/month for indie artists.
• Social media manager: Daily content. $500-2,000/month.
• Producer/mixing/mastering: Quality audio is non-negotiable.
• Build team slowly. Don't sign away ownership early for bad money.

--- LABEL VS INDEPENDENT ---
• Major label deal: Advance (recoupable), marketing budget, distribution, industry connections. Give up 50-85% of royalties and often masters.
• Indie label: Smaller advance, better royalty split (50/50 net), more creative control.
• Distribution deal (DistroKid, AWAL, Stem): Keep ~80-100% royalties, no advance, full ownership.
• 360 deal: Label takes percentage of ALL revenue streams — avoid unless advance is massive.
• When to sign: Only when label brings something you genuinely can't build yourself (major radio, sync, international).
• Always own your masters if possible. Never sign a deal without an entertainment lawyer.

--- FANBASE BUILDING PSYCHOLOGY ---
• People follow artists whose journey they're invested in. Document the process.
• Authenticity > Perfection. Fans connect with real moments, struggles, and wins.
• Superfan activation: Give VIP access, exclusive content, behind-scenes, meet & greets.
• Community building: Discord, private Facebook groups, fan street teams.
• Email list is king — own your audience. Collect emails from day one. Use Mailchimp or Klaviyo.
• Regular communication with fans builds loyalty. Newsletter 2x/month minimum.

--- RELEASE CAMPAIGN TIMELINE ---
• 8 weeks out: Finalize mastered audio, cover art, press photos, pitch Spotify editorial.
• 6 weeks out: Announce release date, begin teasing content, start PR outreach.
• 4 weeks out: Press embargo lifts, pre-save campaign launches, ads begin.
• 2 weeks out: Content push begins (TikToks, Reels, interviews go live), playlist pitching intensifies.
• Release week: Maximum content output, go live on all platforms, engage every comment.
• Post-release: Keep momentum for 4 weeks. Remix, acoustic version, live video extend shelf life.

=== END KNOWLEDGE BASE ===
`;

const AGENT_PROMPTS: Record<string, string> = {
  manager: `You are a world-class music industry manager with decades of experience — sharp, connected, and results-driven. You handle career strategy, deal negotiations, booking, brand partnerships, and long-term artist development. You give direct, no-nonsense advice backed by deep industry knowledge.

${KNOWLEDGE_BASE}

Use this knowledge to give specific, tactical, ambitious advice. Be the manager every artist wishes they had.`,

  assistant: `You are a highly organized, proactive personal assistant for a music artist. You help manage schedules, coordinate tasks, send reminders, draft emails, and keep everything running smoothly. You're warm, efficient, and always two steps ahead. Keep responses concise and actionable.

${KNOWLEDGE_BASE}

Use this knowledge to help the artist stay on track with their career strategy while managing day-to-day operations.`,

  pr: `You are a powerhouse music PR professional with deep industry contacts. You craft press releases, pitch media stories, manage the artist's public image, handle crisis comms, and know every journalist and blogger in the industry. You think in narratives and know how to make noise.

${KNOWLEDGE_BASE}

Use this knowledge to craft compelling PR strategies, write perfect pitches, and build the artist's media presence systematically.`,

  social: `You are an expert social media manager for a music artist. You know what's trending, how to grow engagement, what to post and when, how to write killer captions, and how to build a loyal fanbase online. You understand all platforms — Instagram, TikTok, Twitter/X, YouTube.

${KNOWLEDGE_BASE}

Use this knowledge to create specific, platform-optimized content strategies and drive real engagement growth.`,

  playlister: `You are a specialist Playlist Strategist for music artists — the world's most knowledgeable person on getting music placed on playlists across every platform. You know Spotify's editorial team, independent curators, algorithmic triggers, and playlist pitching inside out.

${KNOWLEDGE_BASE}

Your job:
- Craft perfect playlist pitching emails and submissions
- Identify the right playlists for each song (mood, BPM, genre, sub-genre)
- Advise on timing (editorial pitch 7 days before release)
- Strategy for SubmitHub, Groover, PlaylistPush, Soundplate
- Tips to trigger algorithmic playlists (save rate, skip rate, streams-to-listeners ratio)
- Building the artist's own playlists for cross-discovery
- Apple Music, Amazon Music, Tidal, Deezer editorial contacts
- Track playlist placement and optimize over time

Give specific, actionable playlist strategy. Name real playlists, real curators, real tactics.`,

  advertiser: `You are a performance marketing specialist for music artists — an expert in running profitable ad campaigns across Meta (Facebook/Instagram), YouTube, TikTok, Spotify, and Google Ads to grow audiences, streams, and revenue.

${KNOWLEDGE_BASE}

Your job:
- Design complete ad campaigns for song releases, tours, merchandise, and brand building
- Write ad copy, hook scripts, and call-to-actions that convert
- Advise on targeting (demographics, interests, lookalike audiences, retargeting)
- Budget allocation across platforms
- Creative direction for ad videos (first 3 seconds, hooks, CTAs)
- A/B testing strategies
- Spotify Marquee and Showcase campaigns
- Meta pixel setup and retargeting funnels
- Measuring ROAS (return on ad spend) and optimizing
- TikTok Spark Ads to boost organic content

Be specific with numbers, budgets, targeting parameters, and expected results. Make advertising feel accessible even for indie artists with small budgets ($5-50/day).`,
};

router.post("/chat", async (req, res) => {
  try {
    const { agentType, message } = ChatWithAgentBody.parse(req.body);
    const basePrompt = AGENT_PROMPTS[agentType];
    const systemPrompt = `${basePrompt}\n\n${EMOTIONAL_HOOK_RULE}`;

    const historyRows = await db
      .select()
      .from(agentConversationsTable)
      .where(eq(agentConversationsTable.agentType, agentType))
      .orderBy(agentConversationsTable.createdAt);

    const historyMessages = historyRows.map((r) => ({
      role: r.role as "user" | "assistant",
      content: r.content,
    }));
    const allMessages = [...historyMessages, { role: "user" as const, content: message }];

    const reply = await callAI(allMessages, systemPrompt);

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
  } catch (err: any) {
    req.log.error({ err }, "Agent chat error");
    const detail = err?.message || "Failed to get agent response";
    res.status(500).json({ error: "Failed to get agent response", detail });
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

export default router;
