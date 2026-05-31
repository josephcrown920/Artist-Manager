import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Youtube, Sparkles, Copy, Check, Loader2, Calendar, MessageSquare, TrendingUp, Video } from "lucide-react";

const CONTENT_PILLARS = [
  { id: "challenge", label: "Challenge / Beef", emoji: "🎤", color: "hsl(0 72% 65%)", desc: "High-engagement response content" },
  { id: "freestyle", label: "Freestyle / Bars", emoji: "🔥", color: "hsl(320 100% 65%)", desc: "Showcase your raw skill" },
  { id: "tutorial", label: "Teach / Tutorial", emoji: "🎓", color: "hsl(270 100% 72%)", desc: "Build authority & shares" },
  { id: "reaction", label: "Reaction / Review", emoji: "⭐", color: "hsl(43 100% 65%)", desc: "High comment & share rate" },
  { id: "vlog", label: "Studio / Day in Life", emoji: "🎬", color: "hsl(199 89% 60%)", desc: "Build personal connection" },
  { id: "series", label: "Running Series", emoji: "📺", color: "hsl(142 71% 55%)", desc: "Compound algorithm growth" },
];

interface ContentIdea {
  title: string;
  hook: string;
  structure: string;
  cta: string;
  pillar: string;
  estimatedViews: string;
}

interface UploadSlot { day: string; time: string; format: "Short" | "Long"; pillar: string; title?: string }

function ContentCard({ idea, index }: { idea: ContentIdea; index: number }) {
  const [copied, setCopied] = useState<string | null>(null);
  const meta = CONTENT_PILLARS.find(p => p.id === idea.pillar) || CONTENT_PILLARS[0];
  const copy = (text: string, k: string) => { navigator.clipboard.writeText(text); setCopied(k); setTimeout(() => setCopied(null), 2000); };

  return (
    <div className="rounded-2xl border glass" style={{ borderColor: "hsl(280 60% 28% / 0.4)" }}>
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm flex-shrink-0"
            style={{ background: `${meta.color.replace(")", " / 0.18)")}` }}>
            {meta.emoji}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-xs px-2 py-0.5 rounded-full font-bold"
                style={{ background: `${meta.color.replace(")", " / 0.15)")}`, color: meta.color }}>
                {meta.label}
              </span>
              <span className="text-xs font-bold" style={{ color: "hsl(142 71% 60%)" }}>{idea.estimatedViews}</span>
            </div>
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-semibold leading-snug" style={{ color: "hsl(280 20% 95%)" }}>{idea.title}</p>
              <button onClick={() => copy(idea.title, `t${index}`)} className="flex-shrink-0"
                style={{ color: copied === `t${index}` ? "hsl(142 71% 60%)" : "hsl(280 15% 50%)" }}>
                {copied === `t${index}` ? <Check size={13} /> : <Copy size={13} />}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-1 gap-2">
          <div className="rounded-xl p-2.5" style={{ background: "hsl(0 72% 51% / 0.07)", border: "1px solid hsl(0 72% 51% / 0.2)" }}>
            <div className="text-[10px] font-bold tracking-widest mb-1" style={{ color: "hsl(0 72% 65%)" }}>OPENING HOOK</div>
            <p className="text-xs" style={{ color: "hsl(280 15% 80%)" }}>{idea.hook}</p>
          </div>
          <div className="rounded-xl p-2.5" style={{ background: "hsl(280 40% 10%)", border: "1px solid hsl(280 50% 22% / 0.4)" }}>
            <div className="text-[10px] font-bold tracking-widest mb-1" style={{ color: "hsl(199 89% 60%)" }}>VIDEO STRUCTURE</div>
            <p className="text-xs" style={{ color: "hsl(280 15% 75%)" }}>{idea.structure}</p>
          </div>
          <div className="flex items-center justify-between">
            <div className="text-xs" style={{ color: "hsl(280 15% 55%)" }}>CTA: <span style={{ color: "hsl(142 71% 60%)" }}>{idea.cta}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}

const DEFAULT_CALENDAR: UploadSlot[] = [
  { day: "Monday",    time: "4:00 PM", format: "Short",  pillar: "challenge" },
  { day: "Wednesday", time: "4:00 PM", format: "Short",  pillar: "freestyle" },
  { day: "Friday",    time: "6:00 PM", format: "Short",  pillar: "series"    },
  { day: "Saturday",  time: "2:00 PM", format: "Long",   pillar: "tutorial"  },
];

export default function YouTubeStudio() {
  const [activeTab, setActiveTab] = useState<"ideas" | "calendar" | "analytics" | "seo">("ideas");
  const [selectedPillar, setSelectedPillar] = useState("all");
  const [seriesDay, setSeriesDay]           = useState("7");
  const [ideas, setIdeas]                   = useState<ContentIdea[]>([]);
  const [seoInput, setSeoInput]             = useState("");
  const [seoResult, setSeoResult]           = useState<any>(null);

  const generateMut = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/youtube-growth/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoDesc: `${selectedPillar === "all" ? "mix of hip-hop" : selectedPillar} content for NBA Josh, a rap artist growing on YouTube`,
          seriesDay,
        }),
      });
      return res.json();
    },
    onSuccess: (data) => {
      if (data.titles) {
        const newIdeas: ContentIdea[] = data.titles.map((t: any, i: number) => ({
          title: t.text,
          hook: t.why || "Start mid-action with no intro",
          structure: data.loop_hook || "Hook → Verse → Tag → Loop back",
          cta: data.comment_bait || "Comment below",
          pillar: selectedPillar === "all" ? CONTENT_PILLARS[i % CONTENT_PILLARS.length].id : selectedPillar,
          estimatedViews: data.projected_range || "2K–8K",
        }));
        setIdeas(newIdeas);
      }
    },
  });

  const seoMut = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/agents/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId: "assistant",
          message: `Generate YouTube SEO optimization for this video: "${seoInput}". Return JSON with: description (200-300 words, keyword-rich), tags (15 tags, comma separated), chapters (array of {time, label}), community_post (short post to share the video), and thumbnail_text (bold 3-4 word text for thumbnail).`,
        }),
      });
      const d = await res.json();
      try { return JSON.parse(d.reply?.replace(/```json|```/g, "").trim() || "{}"); } catch { return { description: d.reply }; }
    },
    onSuccess: (data) => setSeoResult(data),
  });

  return (
    <div className="p-6 md:p-10 max-w-3xl mx-auto">
      {/* Y2K header */}
      <div className="pb-6 mb-6">
        <div className="eyebrow mb-3" style={{ color: "hsl(180 80% 65%)" }}>▸ YOUTUBE STUDIO · CONTENT OPS</div>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-4xl md:text-5xl aurora-text" style={{ lineHeight: 1 }}>YT STUDIO</h1>
            <p className="text-sm mt-3" style={{ color: "hsl(280 20% 70%)" }}>
              Content ideas, upload calendar, SEO optimization — AI-powered growth for your channel.
            </p>
          </div>
          <a href="https://studio.youtube.com" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-semibold transition-all hover:scale-[1.03] flex-shrink-0"
            style={{ background: "hsl(0 72% 51% / 0.15)", border: "1px solid hsl(0 72% 51% / 0.4)", color: "hsl(0 72% 70%)", textDecoration: "none" }}>
            <Youtube size={15} /> Open YouTube Studio
          </a>
        </div>
        <div className="rule mt-4" />
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-4 gap-1 p-1 rounded-2xl mb-6" style={{ background: "hsl(280 40% 8%)", border: "1px solid hsl(280 50% 20% / 0.4)" }}>
        {[["ideas", "💡 Ideas"], ["calendar", "📅 Calendar"], ["analytics", "📊 Tips"], ["seo", "🔍 SEO"]].map(([key, label]) => (
          <button key={key} onClick={() => setActiveTab(key as any)}
            className="py-2.5 rounded-xl text-xs font-semibold transition-all"
            style={activeTab === key
              ? { background: "linear-gradient(135deg, hsl(0 72% 51% / 0.22) 0%, hsl(320 100% 62% / 0.16) 100%)", color: "hsl(0 72% 75%)", border: "1px solid hsl(0 72% 51% / 0.4)" }
              : { color: "hsl(280 15% 55%)", border: "1px solid transparent" }}>
            {label}
          </button>
        ))}
      </div>

      {/* Ideas */}
      {activeTab === "ideas" && (
        <div className="space-y-5">
          {/* Pillar selector */}
          <div className="grid grid-cols-3 gap-2">
            <button onClick={() => setSelectedPillar("all")}
              className="rounded-xl py-2 px-3 text-xs font-semibold transition-all"
              style={selectedPillar === "all"
                ? { background: "hsl(280 40% 15%)", color: "hsl(280 20% 95%)", border: "1px solid hsl(280 50% 35% / 0.6)" }
                : { background: "hsl(280 40% 9%)", color: "hsl(280 15% 60%)", border: "1px solid hsl(280 50% 20% / 0.4)" }}>
              🎯 All Pillars
            </button>
            {CONTENT_PILLARS.map(p => (
              <button key={p.id} onClick={() => setSelectedPillar(p.id)}
                className="rounded-xl py-2 px-3 text-xs font-semibold transition-all text-left"
                style={selectedPillar === p.id
                  ? { background: `${p.color.replace(")", " / 0.18)")}`, color: p.color, border: `1px solid ${p.color.replace(")", " / 0.45)")}` }
                  : { background: "hsl(280 40% 9%)", color: "hsl(280 15% 60%)", border: "1px solid hsl(280 50% 20% / 0.4)" }}>
                {p.emoji} {p.label}
              </button>
            ))}
          </div>

          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="text-[10px] font-bold tracking-widest block mb-2" style={{ color: "hsl(280 15% 50%)" }}>SERIES DAY #</label>
              <input value={seriesDay} onChange={e => setSeriesDay(e.target.value)}
                className="w-full rounded-2xl px-4 py-2.5 text-xl font-black outline-none"
                style={{ background: "hsl(280 40% 9%)", border: "1px solid hsl(280 50% 22% / 0.5)", color: "hsl(280 20% 95%)" }} />
            </div>
            <button onClick={() => generateMut.mutate()} disabled={generateMut.isPending}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-semibold text-white flex-shrink-0 disabled:opacity-50 transition-all hover:scale-[1.02] glow-pink"
              style={{ background: "linear-gradient(135deg, hsl(0 72% 55%) 0%, hsl(320 100% 60%) 50%, hsl(270 100% 65%) 100%)", border: "1px solid hsl(320 100% 80% / 0.3)" }}>
              {generateMut.isPending ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
              Generate Ideas
            </button>
          </div>

          {ideas.length > 0 ? (
            <div className="space-y-3">
              {ideas.map((idea, i) => <ContentCard key={i} idea={idea} index={i} />)}
            </div>
          ) : (
            <div className="text-center py-12" style={{ color: "hsl(280 15% 50%)" }}>
              <Video size={32} className="mx-auto mb-3 opacity-30" />
              <div className="text-sm">Select a pillar and hit Generate — AI creates 3 tailored video ideas</div>
            </div>
          )}
        </div>
      )}

      {/* Calendar */}
      {activeTab === "calendar" && (
        <div className="space-y-3">
          <p className="text-sm mb-4" style={{ color: "hsl(280 15% 60%)" }}>
            Optimal upload schedule based on your audience (25–34 male, US). Minimum 3–4 videos/week to build algorithm momentum.
          </p>
          {DEFAULT_CALENDAR.map((slot, i) => {
            const meta = CONTENT_PILLARS.find(p => p.id === slot.pillar)!;
            return (
              <div key={i} className="rounded-2xl border p-4 glass flex items-center gap-4" style={{ borderColor: "hsl(280 60% 28% / 0.4)" }}>
                <div className="text-center w-24 flex-shrink-0">
                  <div className="text-sm font-bold" style={{ color: "hsl(280 20% 95%)" }}>{slot.day}</div>
                  <div className="text-xs mt-0.5" style={{ color: "hsl(199 89% 60%)" }}>{slot.time}</div>
                </div>
                <div className="w-px h-10 flex-shrink-0" style={{ background: "hsl(280 50% 22% / 0.4)" }} />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs px-2 py-0.5 rounded-full font-bold"
                      style={{ background: `${meta.color.replace(")", " / 0.15)")}`, color: meta.color, border: `1px solid ${meta.color.replace(")", " / 0.3)")}` }}>
                      {meta.emoji} {meta.label}
                    </span>
                    <span className="text-xs rounded-full px-2 py-0.5 font-bold"
                      style={{ background: slot.format === "Short" ? "hsl(0 72% 51% / 0.12)" : "hsl(199 89% 55% / 0.12)", color: slot.format === "Short" ? "hsl(0 72% 65%)" : "hsl(199 89% 65%)", border: `1px solid ${slot.format === "Short" ? "hsl(0 72% 51% / 0.3)" : "hsl(199 89% 55% / 0.3)"}` }}>
                      {slot.format}
                    </span>
                  </div>
                  <p className="text-xs" style={{ color: "hsl(280 15% 60%)" }}>{meta.desc}</p>
                </div>
              </div>
            );
          })}

          <div className="rounded-2xl border p-4 glass" style={{ borderColor: "hsl(43 100% 55% / 0.25)" }}>
            <div className="text-sm font-bold mb-3" style={{ color: "hsl(43 100% 65%)" }}>⚡ Algorithm Rules</div>
            {[
              ["Post within 1 hour of target time", "YouTube's algorithm evaluates the first hour velocity"],
              ["Reply to every comment in the first 2 hours", "Triggers 'social channel' status — more distribution"],
              ["Post a YouTube Community update same day", "Drives notification clicks before video goes cold"],
              ["Pin a comment with the series link", "Keeps viewers in your series loop"],
            ].map(([rule, why], i) => (
              <div key={i} className="flex gap-2.5 mb-2 last:mb-0">
                <div className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0" style={{ background: "hsl(43 100% 65%)" }} />
                <div className="text-xs leading-relaxed">
                  <span className="font-semibold" style={{ color: "hsl(280 20% 88%)" }}>{rule} — </span>
                  <span style={{ color: "hsl(280 15% 58%)" }}>{why}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Analytics Tips */}
      {activeTab === "analytics" && (
        <div className="space-y-3">
          <p className="text-sm mb-2" style={{ color: "hsl(280 15% 60%)" }}>
            What to watch in YouTube Studio Analytics and how to act on each metric.
          </p>
          {[
            { metric: "Click-Through Rate (CTR)", target: "4–7%", icon: "🎯", color: "hsl(0 72% 65%)", action: "Under 4%? Your thumbnail or title is the problem. A/B test both immediately." },
            { metric: "Average View Duration", target: ">50% for Shorts", icon: "⏱️", color: "hsl(199 89% 60%)", action: "Under 50%? Viewers leave early. Move your best moment to the first 1.5 seconds." },
            { metric: "Impressions", target: "Growing week-over-week", icon: "📡", color: "hsl(270 100% 72%)", action: "Flat impressions = the algorithm stopped testing you. Post 3–4x/week to reset." },
            { metric: "Shares", target: ">2% of views", icon: "🔁", color: "hsl(142 71% 55%)", action: "Low shares? The video doesn't make viewers feel something worth sharing. Add more stakes." },
            { metric: "Subscribers gained", target: ">0.5% of views", icon: "👥", color: "hsl(320 100% 65%)", action: "Low subs? Add a direct 'Subscribe for Day X' CTA mid-video — not at the end." },
            { metric: "Revenue per 1K views (RPM)", target: "$1–4 for music", icon: "💰", color: "hsl(43 100% 65%)", action: "Enable monetization early even at low views. Every 1K views pays your next beat." },
          ].map((item, i) => (
            <div key={i} className="rounded-2xl border p-4 glass" style={{ borderColor: "hsl(280 60% 28% / 0.4)" }}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{item.icon}</span>
                  <span className="text-sm font-semibold" style={{ color: "hsl(280 20% 92%)" }}>{item.metric}</span>
                </div>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{ background: `${item.color.replace(")", " / 0.15)")}`, color: item.color }}>
                  Target: {item.target}
                </span>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: "hsl(280 15% 72%)" }}>{item.action}</p>
            </div>
          ))}
        </div>
      )}

      {/* SEO */}
      {activeTab === "seo" && (
        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-bold tracking-widest block mb-2" style={{ color: "hsl(280 15% 50%)" }}>YOUR VIDEO TITLE OR DESCRIPTION</label>
            <textarea value={seoInput} onChange={e => setSeoInput(e.target.value)}
              placeholder="e.g. Day 7 of rapping until NBA Josh responds — I studied his entire flow and called him out"
              rows={3}
              className="w-full rounded-2xl px-4 py-3 text-sm outline-none resize-none leading-relaxed"
              style={{ background: "hsl(280 40% 9%)", border: "1px solid hsl(280 50% 22% / 0.5)", color: "hsl(280 20% 90%)" }} />
          </div>
          <button onClick={() => seoMut.mutate()} disabled={!seoInput.trim() || seoMut.isPending}
            className="w-full py-3 rounded-2xl text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-40 transition-all hover:scale-[1.01]"
            style={{ background: "linear-gradient(135deg, hsl(0 72% 55%) 0%, hsl(320 100% 60%) 100%)", border: "1px solid hsl(320 100% 80% / 0.3)" }}>
            {seoMut.isPending ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
            Generate Full SEO Package
          </button>

          {seoResult && (
            <div className="space-y-3">
              {seoResult.description && (
                <div className="rounded-2xl border p-4 glass" style={{ borderColor: "hsl(280 60% 28% / 0.4)" }}>
                  <div className="text-[10px] font-bold tracking-widest mb-2" style={{ color: "hsl(199 89% 60%)" }}>📝 DESCRIPTION</div>
                  <p className="text-xs leading-relaxed whitespace-pre-wrap" style={{ color: "hsl(280 15% 80%)" }}>{seoResult.description}</p>
                </div>
              )}
              {seoResult.tags && (
                <div className="rounded-2xl border p-4 glass" style={{ borderColor: "hsl(280 60% 28% / 0.4)" }}>
                  <div className="text-[10px] font-bold tracking-widest mb-2" style={{ color: "hsl(270 100% 72%)" }}>🏷️ TAGS</div>
                  <p className="text-xs font-mono" style={{ color: "hsl(270 80% 80%)" }}>{seoResult.tags}</p>
                </div>
              )}
              {seoResult.thumbnail_text && (
                <div className="rounded-2xl border p-4 glass" style={{ borderColor: "hsl(280 60% 28% / 0.4)" }}>
                  <div className="text-[10px] font-bold tracking-widest mb-2" style={{ color: "hsl(0 72% 65%)" }}>🖼️ THUMBNAIL TEXT</div>
                  <p className="text-2xl font-black" style={{ color: "hsl(0 72% 70%)" }}>{seoResult.thumbnail_text}</p>
                </div>
              )}
              {seoResult.community_post && (
                <div className="rounded-2xl border p-4 glass" style={{ borderColor: "hsl(280 60% 28% / 0.4)" }}>
                  <div className="text-[10px] font-bold tracking-widest mb-2" style={{ color: "hsl(142 71% 60%)" }}>📣 COMMUNITY POST</div>
                  <p className="text-xs leading-relaxed" style={{ color: "hsl(280 15% 80%)" }}>{seoResult.community_post}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
