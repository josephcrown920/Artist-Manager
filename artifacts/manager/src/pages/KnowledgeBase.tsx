import { useState } from "react";
import { BookOpen, ChevronDown, ChevronUp, Search, Star } from "lucide-react";

interface Chapter {
  id: string; emoji: string; title: string; subtitle: string;
  sections: { heading: string; points: string[] }[];
}

const CHAPTERS: Chapter[] = [
  {
    id: "fundamentals", emoji: "🧱", title: "Artist Development Fundamentals", subtitle: "Build the foundation before you build the fanbase",
    sections: [
      {
        heading: "Identity & Brand",
        points: [
          "An artist's brand must be authentic, consistent, and visually distinct before any promotion begins. Fans buy into a persona, not just music.",
          "Define your Artist DNA: sonic identity, visual aesthetic, core message, and target audience — before spending a dollar on promo.",
          "Your name, logo, color palette, and photo style should work together to tell one story across every platform.",
          "Study 3 artists you admire. Map out what makes each one visually and emotionally distinct. Find what's missing in the market that YOU can fill.",
          "Authenticity beats polish. A raw but real artist connects deeper than a perfect but hollow one.",
        ]
      },
      {
        heading: "The Long Game",
        points: [
          "The 1000 True Fans rule: 1000 deeply devoted fans who spend $100/year = $100,000/year. Focus on depth of connection before breadth.",
          "The 3-year rule: Most 'overnight successes' took 3-7 years of consistent work. Patience and consistency beat talent alone.",
          "Release strategy: In the streaming era, frequent releases (every 4-6 weeks) beat album dumps. Each release is a marketing moment.",
          "Treat your music career like a startup. Set 90-day goals. Review weekly. Adjust quarterly.",
          "Document everything from day one — your journey IS your content.",
        ]
      },
    ]
  },
  {
    id: "streaming", emoji: "🎵", title: "Streaming & Distribution Strategy", subtitle: "Own your royalties and master the algorithm",
    sections: [
      {
        heading: "Distribution",
        points: [
          "Distribute via DistroKid (~$22/year, unlimited releases, keep 100%), TuneCore, or CD Baby for indie artists.",
          "ALWAYS keep your masters if you can. Never sign a deal that takes your masters for a small advance.",
          "Register with ASCAP or BMI as BOTH the songwriter AND publisher. This is free money most artists miss.",
          "SoundExchange collects digital performance royalties (when your song plays on Pandora, SiriusXM, etc.) — register immediately, it's free.",
          "Distrokid Hypeddit, Show.co, and Feature.fm are great for pre-save campaigns before release.",
        ]
      },
      {
        heading: "Spotify Algorithm Secrets",
        points: [
          "Save rate is the #1 signal. When fans SAVE your track (heart button), the algorithm sees real demand. Ask fans to save, not just stream.",
          "Target a >20% save rate for best algorithmic performance. 15% is decent, below 10% is weak.",
          "Skip rate matters: if >40% of listeners skip your track before 30 seconds, the algorithm buries it. Hook in the first 15 seconds.",
          "Streams-to-listeners ratio: aim for 2+ streams per listener. This means repeat listening, which triggers Radio playlists.",
          "Playlist adds from real user playlists signal to Spotify that people actively want your music — algorithmic placement follows.",
          "Release Radar (5M+ subscribers) triggers for followers when you release. Discover Weekly triggers based on listening patterns.",
        ]
      },
      {
        heading: "Release Timeline",
        points: [
          "8 weeks out: Finalize mastered audio, cover art, press photos. Pitch Spotify editorial (7-day minimum before release).",
          "6 weeks out: Announce release date. Begin teasing content. Start PR outreach to blogs.",
          "4 weeks out: Press embargo lifts. Pre-save campaign launches. Begin paid ads.",
          "2 weeks out: Full content push. TikToks, Reels, interviews go live. Playlist pitching intensifies.",
          "Release week: Maximum output. Go live on all platforms. Engage every comment. Post 2-3x/day.",
          "Post-release (4 weeks): Keep momentum. Remix, acoustic version, live performance video all extend shelf life.",
        ]
      },
    ]
  },
  {
    id: "playlists", emoji: "📋", title: "Playlist Mastery", subtitle: "The fastest path to streams and new fans",
    sections: [
      {
        heading: "Playlist Tiers",
        points: [
          "Tier 1 — Spotify Editorial: Curated by Spotify's team. Millions of followers. Requires a pitch via Spotify for Artists 7 days before release.",
          "Tier 2 — Algorithmic: Release Radar, Discover Weekly, Daily Mixes, Radio. Triggered by your engagement metrics — no pitch needed.",
          "Tier 3 — User-curated: Independent playlist curators. Reachable via SubmitHub, Groover, PlaylistPush, Soundplate.",
          "Tier 4 — Your own playlists: Create playlists mixing your music + similar artists. Builds cross-discovery.",
        ]
      },
      {
        heading: "Spotify Editorial Pitch Formula",
        points: [
          "Submit in Spotify for Artists → Music tab → upcoming release → Pitch to Editors.",
          "The perfect pitch: Artist name, genre, exact BPM, mood, key influences, ONE sentence on what makes this song unique.",
          "Tell a story: 'Written after my grandmother passed away' outperforms 'This is my best track ever.'",
          "Pitch categories and sub-genres accurately — curators search by mood and activity (workout, focus, chill).",
          "Strong catalog and existing editorial placement increase pitch success dramatically.",
        ]
      },
      {
        heading: "Independent Curator Strategy",
        points: [
          "SubmitHub: Most structured platform. Curators must listen before rejecting. $1-3/submission. 10-25% acceptance rates on strong songs.",
          "Groover: European-focused but globally effective. €2-3/submission. High response rate.",
          "PlaylistPush: Premium service, better for artists with existing momentum. ~$200-600 per campaign.",
          "Soundplate: Free and paid options. Good for emerging artists.",
          "Always personalize submissions — reference the specific playlist and why your song fits. Generic pitches are ignored.",
          "Build relationships with curators over time. Comment on their posts. Thank them when you get placed.",
        ]
      },
      {
        heading: "Cross-Platform Playlists",
        points: [
          "Apple Music Editorial: Submit via Apple Music for Artists → Add an Upcoming Release. Pitch at least 1 week before.",
          "Amazon Music: Submit via Amazon Music for Artists. Emerging artists get good playlist support here.",
          "Tidal Rising: Tidal's emerging artist program gives editorial support, exclusive features, and playlist placement.",
          "Deezer Editors: Less reach but high engagement. Submit via Deezer for Creators.",
          "YouTube Music: Upload official audio/video. Enable auto-add to relevant YouTube Music playlists.",
        ]
      },
    ]
  },
  {
    id: "social", emoji: "📱", title: "Social Media & Content Strategy", subtitle: "Build an army of fans, one post at a time",
    sections: [
      {
        heading: "Platform Strategy",
        points: [
          "TikTok is the #1 music discovery platform. A 15-60 second video with your original sound can reach millions. Post 1-3x per day.",
          "Instagram: Reels > Stories > Posts for reach. Carousel posts get the most saves. Go Live weekly for algorithm boost.",
          "Twitter/X: Real-time personality, hot takes, music discourse. Tweet 3-5x/day. Reply to bigger artists to get seen.",
          "YouTube: Long-form content (music videos, vlogs, studio sessions). Shorts linked to full videos. SEO titles and thumbnails are critical.",
          "Master 1-2 platforms FIRST before spreading across all of them. Depth before breadth.",
        ]
      },
      {
        heading: "Content Pillars",
        points: [
          "Pillar 1 — Music content: new releases, lyric reveals, studio sessions, reaction videos to feedback.",
          "Pillar 2 — Behind the scenes: day-in-the-life, songwriting process, studio conversations, gear tours.",
          "Pillar 3 — Personality: humor, takes on music culture, real moments, challenges, storytelling.",
          "Pillar 4 — Fan engagement: responses, duets, stitches, fan showcases, Q&As.",
          "Mix the pillars: 40% music, 30% BTS, 20% personality, 10% fan engagement.",
        ]
      },
      {
        heading: "Growth Tactics",
        points: [
          "Reply to EVERY comment for your first 1000 followers. Fans who get a reply become superfans.",
          "DM new followers a genuine welcome message (not spammy). Personal connection at scale.",
          "Comment meaningfully on top posts in your genre hashtags — brings new followers to you organically.",
          "Consistency beats viral moments. Post daily for 90 days and watch your trajectory change.",
          "Collaborate on content with similar-level artists. Cross-pollination grows both audiences.",
          "Use trending sounds on TikTok AND add your own music — dual algorithm benefit.",
          "Hook rule: First 3 seconds of every video must grab attention — face, unexpected visual, or lyric hook.",
        ]
      },
    ]
  },
  {
    id: "pr", emoji: "📣", title: "PR & Media Relations", subtitle: "Build the press story that makes you undeniable",
    sections: [
      {
        heading: "Press Fundamentals",
        points: [
          "Press = social proof. An artist with no press looks unestablished. Even small blogs matter early.",
          "Press kit must include: bio (50, 100, 200 word versions), hi-res photos (3000px+), music links, streaming stats if strong, previous coverage.",
          "Target tiers: local press → indie blogs → genre-specific publications → mid-tier outlets → major outlets.",
          "Build relationships with journalists BEFORE pitching — engage their content, comment thoughtfully, exist in their world.",
          "Don't just email cold. A warm intro from a mutual contact converts at 5x the rate of cold outreach.",
        ]
      },
      {
        heading: "Target Publications by Genre",
        points: [
          "Hip-Hop/Rap: HotNewHipHop, Pigeons & Planes, 2DopeBoyz, Lyrical Lemonade, DJBooth.",
          "Indie/Alternative: Pitchfork, The FADER, Consequence of Sound, Stereogum, DIY Magazine.",
          "Pop: Ones To Watch, Idolator, PopCrush, We Are The Guard.",
          "R&B: Rated R&B, Soul In Stereo, BlackVoices.",
          "General/Breaking: Earmilk, Ones To Watch, Complex, NYLON, Refinery29.",
          "Always start small. A placement in an indie blog helps secure mid-tier coverage, which helps secure major coverage.",
        ]
      },
      {
        heading: "Angles That Work",
        points: [
          "Hometown hero: 'From [city], this artist is putting [place] on the map' — local press loves this.",
          "Comeback narrative: Adversity → persistence → breakthrough. Humans are wired for this story.",
          "Unique creative process: 'How I made a platinum hit on an iPhone' gets clicks every time.",
          "Social movement tie-in: When your music connects to a cultural moment or movement.",
          "Viral origin story: 'The TikTok comment that inspired my biggest song' — behind the virality.",
          "Collab story: Major artist co-signs, features, or mentors you — this is news.",
        ]
      },
      {
        heading: "Radio Strategy",
        points: [
          "Start with college radio (CMJ, Mediabase). Contact Music Directors directly with a personal email.",
          "College radio placement helps build streaming data that mid-level stations look at.",
          "Regional radio: Identify your regional market, research PDs (Program Directors) and MDs (Music Directors).",
          "Satellite radio (SiriusXM, Apple Music Radio) — pitch directly or through a radio promoter.",
          "Podcast appearances are underrated — niche audiences are highly engaged and trust the host's recommendations.",
        ]
      },
    ]
  },
  {
    id: "advertising", emoji: "📢", title: "Music Advertising & Paid Campaigns", subtitle: "Turn $5/day into fans, streams, and sales",
    sections: [
      {
        heading: "Platform Overview",
        points: [
          "Meta Ads (Facebook + Instagram): Most powerful for music. Unmatched demographic/interest targeting. Start at $5-10/day.",
          "YouTube Ads: In-stream (skippable) ads before music videos in your genre. You only pay when viewer watches >30 seconds.",
          "TikTok Spark Ads: Boost your organic TikTok posts as ads. Feels native, performs strongly for music.",
          "Spotify Marquee: Notification-style ad to your followers announcing new releases. High conversion on warm audience.",
          "Spotify Showcase: Appears in the 'What's New' section. Best for catalog promotion.",
          "Google Ads: Target searches for similar artists and redirect to your YouTube or Spotify.",
        ]
      },
      {
        heading: "Meta Ads Strategy",
        points: [
          "Best format: Vertical video (9:16) of your song over lifestyle content. Clear CTA to Spotify or YouTube.",
          "Targeting: Start with interest targeting (fans of 3-5 similar artists, age 18-34, US + UK + AU).",
          "Lookalike audiences: Once you have 1000+ Instagram followers or website visitors, build lookalikes of your best fans.",
          "Retargeting: Pixel your website, target anyone who watched >3s of your video ad with a follow-up creative.",
          "Budget: $5-10/day for test phase (7-14 days). Scale winning ads to $30-50/day. Kill losing ads after 3 days.",
          "Test 3-5 creative variations. Different hooks, different visuals. Let data decide what wins.",
          "Hook rule: First 3 seconds must stop the scroll. Face looking directly at camera, unexpected visual, or strong lyric.",
        ]
      },
      {
        heading: "Campaign Types",
        points: [
          "Release campaign: 2 weeks before + 4 weeks after release. Drive streams, saves, and follows.",
          "Catalog campaign: Promote older music to new audiences. Great ROI on already-mastered assets.",
          "Merch campaign: Target existing fans. Retarget email list. Seasonal drops work best.",
          "Tour/Event campaign: Geotargeted to the cities on your tour. Run 4-6 weeks before show dates.",
          "Brand awareness campaign: Build recognition in your market before a big push. Reach objective, not conversions.",
        ]
      },
      {
        heading: "Budget Allocation",
        points: [
          "Starter ($5-15/day): 60% Meta, 40% YouTube. Focus on one platform, one campaign.",
          "Growth ($15-50/day): 40% Meta, 30% YouTube, 20% TikTok Spark, 10% Spotify Marquee.",
          "Scaling ($50-200/day): 35% Meta, 25% YouTube, 20% TikTok, 15% Spotify, 5% Google.",
          "Always track Spotify monthly listener growth, follower growth, and link clicks as KPIs.",
          "ROAS for music ads is different than e-commerce — you're buying lifetime fan value, not immediate purchase.",
        ]
      },
    ]
  },
  {
    id: "revenue", emoji: "💰", title: "Revenue Streams & Business", subtitle: "Build multiple income sources from your music",
    sections: [
      {
        heading: "Streaming Revenue",
        points: [
          "Spotify: ~$0.003-0.005 per stream. Need ~200,000-330,000 streams/month for $1,000/month.",
          "Apple Music: ~$0.007-0.01 per stream. More valuable per stream than Spotify.",
          "Amazon Music, Tidal, Deezer, YouTube Music: Collect all of them via your distributor.",
          "YouTube AdSense: Enable monetization on your channel. $1-5 per 1000 views on average.",
          "Streaming is passive income that scales. Build catalog, not just singles.",
        ]
      },
      {
        heading: "Sync Licensing",
        points: [
          "Sync = your music in TV, film, ads, video games, trailers. Pays $500 to $100,000+ per placement.",
          "Register with sync licensing libraries: Musicbed, Artlist, Epidemic Sound, Pond5, Songtradr.",
          "Pitch directly to music supervisors for shows, movies, and ads in your genre.",
          "Instrumental versions are more sync-friendly — always create instrumentals of every release.",
          "Once you have one sync credit, it's much easier to get more. Build your sync portfolio.",
        ]
      },
      {
        heading: "Live Performance",
        points: [
          "Live is the #1 revenue source for established artists. Streaming rarely pays artists' bills — live shows do.",
          "Start local → build hometown prestige → go regional → national → international.",
          "Support slots for bigger artists = fastest audience growth strategy. Reach out to management of bigger acts.",
          "Merchandise is where the real money is at live shows. Physical product converts fans into walking billboards.",
          "Livestreaming (Twitch, StageIt, Moment House, YouTube Live): Earn from global fans without touring cost.",
          "Pricing: Charge what your draw merits. Undersell early to pack venues (energy matters). Scale ticket prices with demand.",
        ]
      },
      {
        heading: "Merch & Direct-to-Fan",
        points: [
          "Merch margins: 30-50% on standard items (tees, hoodies). Higher on limited/premium drops.",
          "Limited drops create urgency. Announce a 72-hour window, sell out, build mystique.",
          "Printful, Printify (print-on-demand) = zero inventory risk. Shopify for your own store.",
          "Patreon/Fan membership: $5-50/month tiers for exclusive content, early access, BTS videos, Discord access.",
          "Email list is your most owned asset. Collect emails from day one via landing pages at shows, links in bio.",
          "Regular newsletters (2x/month minimum) with exclusive content keep your superfan layer engaged.",
        ]
      },
    ]
  },
  {
    id: "team", emoji: "🤝", title: "Team Building & Industry Deals", subtitle: "Know who you need, and what they should cost",
    sections: [
      {
        heading: "Core Team Roles",
        points: [
          "Manager: Career strategy, relationships, deals, day-to-day business. Takes 15-20% commission on gross earnings.",
          "Booking Agent: Gets live performance bookings. Takes 10-15% of show fees. Only needed when you're ready to tour.",
          "Entertainment Lawyer: Essential BEFORE signing anything. $300-500/hr. Some work on retainer. Non-negotiable.",
          "Publicist: Media coverage, press releases, interviews, crisis management. $1,500-5,000/month for indie artists.",
          "Social Media Manager: Daily content strategy and posting. $500-2,000/month.",
          "Producer, mixer, mastering engineer: Quality audio is non-negotiable. Budget appropriately.",
        ]
      },
      {
        heading: "Deal Structures",
        points: [
          "Major label deal: Advance (recoupable), marketing budget, distribution access, industry connections. Give up 50-85% of royalties + often masters.",
          "Indie label: Smaller advance, better royalty split (often 50/50 net), more creative control.",
          "Distribution deal (DistroKid, AWAL, Stem): Keep 80-100% royalties, no advance, full ownership. Best for most indie artists.",
          "360 deal: Label takes percentage of ALL revenue (live, merch, sync, endorsements). Avoid unless advance is massive.",
          "Joint venture: Artist and label split ownership and revenue more evenly. Rare but ideal structure.",
        ]
      },
      {
        heading: "Negotiation Principles",
        points: [
          "NEVER sign without an entertainment lawyer reviewing the contract. Never.",
          "Ownership of masters is more valuable long-term than any advance. Hold firm on this.",
          "Creative control clauses protect your art — ensure you have approval over releases.",
          "Recoupment: Labels recoup advances from YOUR royalties before you see any. Calculate this carefully.",
          "Short contract terms (1-2 albums) give you leverage if the label underperforms.",
          "When in doubt, wait. Better deals come to artists with leverage. Leverage comes from momentum.",
        ]
      },
    ]
  },
];

export default function KnowledgeBase() {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const [openSection, setOpenSection] = useState<string | null>(null);

  const filtered = CHAPTERS.filter(c =>
    !search || c.title.toLowerCase().includes(search.toLowerCase()) ||
    c.sections.some(s => s.heading.toLowerCase().includes(search.toLowerCase()) ||
      s.points.some(p => p.toLowerCase().includes(search.toLowerCase())))
  );

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "hsl(18 75% 48% / 0.15)" }}>
            <BookOpen size={20} style={{ color: "hsl(18 75% 58%)" }} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Artist Management Playbook</h1>
            <div className="flex items-center gap-1.5 text-xs mt-0.5" style={{ color: "hsl(38 92% 60%)" }}>
              <Star size={11} fill="currentColor" /> Decades of music industry research & proven tactics
            </div>
          </div>
        </div>
        <p className="text-sm" style={{ color: "hsl(30 5% 55%)" }}>
          Everything you need to take an artist from unknown to unstoppable — strategy, tactics, and industry secrets across {CHAPTERS.length} chapters.
        </p>
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <Search size={15} className="absolute left-3 top-2.5" style={{ color: "hsl(30 5% 50%)" }} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search the playbook..."
          className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none"
          style={{ background: "hsl(30 9% 8%)", border: "1px solid hsl(30 8% 18%)", color: "hsl(0 0% 90%)" }} />
      </div>

      {/* Chapters */}
      <div className="space-y-3">
        {filtered.map(chapter => (
          <div key={chapter.id} className="rounded-xl border overflow-hidden transition-all"
            style={{ background: "hsl(30 9% 8%)", borderColor: open === chapter.id ? "hsl(18 75% 48% / 0.4)" : "hsl(30 8% 18%)" }}>
            {/* Chapter header */}
            <button className="w-full flex items-center justify-between px-5 py-4 text-left"
              onClick={() => setOpen(open === chapter.id ? null : chapter.id)}>
              <div className="flex items-center gap-3">
                <span className="text-2xl">{chapter.emoji}</span>
                <div>
                  <div className="text-sm font-semibold text-white">{chapter.title}</div>
                  <div className="text-xs mt-0.5" style={{ color: "hsl(30 5% 50%)" }}>{chapter.subtitle}</div>
                </div>
              </div>
              <div style={{ color: "hsl(30 5% 50%)", flexShrink: 0 }}>
                {open === chapter.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </div>
            </button>

            {/* Chapter content */}
            {open === chapter.id && (
              <div className="px-5 pb-5 border-t space-y-4" style={{ borderColor: "hsl(30 8% 15%)" }}>
                {chapter.sections.map((section, si) => {
                  const key = `${chapter.id}-${si}`;
                  return (
                    <div key={si} className="pt-4">
                      <button className="flex items-center justify-between w-full mb-3 text-left"
                        onClick={() => setOpenSection(openSection === key ? null : key)}>
                        <div className="text-xs font-bold uppercase tracking-widest" style={{ color: "hsl(18 75% 58%)" }}>
                          {section.heading}
                        </div>
                        <div style={{ color: "hsl(30 5% 48%)" }}>
                          {openSection === key ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                        </div>
                      </button>
                      {(openSection === key || search) && (
                        <ul className="space-y-2.5">
                          {section.points.filter(p => !search || p.toLowerCase().includes(search.toLowerCase())).map((point, pi) => (
                            <li key={pi} className="flex gap-2.5 text-sm" style={{ color: "hsl(0 0% 82%)", lineHeight: 1.6 }}>
                              <span className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "hsl(18 75% 48%)" }} />
                              {point}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16" style={{ color: "hsl(30 5% 48%)" }}>
          <Search size={32} className="mx-auto mb-3 opacity-30" />
          <div className="text-sm">No results for "{search}"</div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-8 rounded-xl border p-5 text-center" style={{ background: "hsl(18 75% 48% / 0.06)", borderColor: "hsl(18 75% 48% / 0.2)" }}>
        <div className="text-sm font-semibold text-white mb-1">Ready to apply this knowledge?</div>
        <div className="text-xs" style={{ color: "hsl(30 5% 55%)" }}>
          Ask your AI agents above — they've been trained on this entire playbook and will give you specific, actionable advice for your situation.
        </div>
      </div>
    </div>
  );
}
