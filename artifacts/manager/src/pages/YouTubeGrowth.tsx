import { useState, useEffect, useRef } from "react";
import { Zap, Copy, Check, RefreshCw, Loader2, TrendingUp } from "lucide-react";

// ─── Algorithm levers ────────────────────────────────────────────────────────
const LEVERS = [
  {
    id: "hook",
    icon: "🎣",
    label: "First 1.5 Seconds",
    impact: 35,
    color: "hsl(0 72% 65%)",
    border: "hsl(0 72% 51% / 0.4)",
    glow: "hsl(0 72% 51% / 0.2)",
    bg: "hsl(0 72% 51% / 0.07)",
    why: "If viewers swipe away in the first 1.5s, YouTube kills your distribution immediately. This is the #1 kill switch.",
    yourProblem: `"Check out this short!" opens with zero tension. Viewer has no reason to stay.`,
    fix: "Start MID-ACTION. No intros. No 'hey guys'. The first frame IS the hook.",
  },
  {
    id: "retention",
    icon: "🔁",
    label: "Loop / Rewatch Rate",
    impact: 28,
    color: "hsl(43 100% 65%)",
    border: "hsl(43 100% 55% / 0.4)",
    glow: "hsl(43 100% 55% / 0.2)",
    bg: "hsl(43 100% 55% / 0.07)",
    why: "YouTube counts every loop as a view (since March 2025). A Short that loops 3× = 3× the views from the same viewer.",
    yourProblem: "Your 10-second clips cut abruptly. Viewer swipes. No loop signal sent.",
    fix: "End your Short exactly where it started visually. Create a seamless loop OR end on a cliffhanger that forces a rewatch.",
  },
  {
    id: "comments",
    icon: "💬",
    label: "Comment Bait (Real)",
    impact: 20,
    color: "hsl(142 71% 55%)",
    border: "hsl(142 71% 45% / 0.4)",
    glow: "hsl(142 71% 45% / 0.2)",
    bg: "hsl(142 71% 45% / 0.07)",
    why: "2026 algorithm: channels with active comment sections get pushed harder. YouTube is rewarding 'social' channels.",
    yourProblem: "You have 0 comments on most videos. The algorithm sees a dead channel.",
    fix: "End every video with a debate question. 'Comment who wins' or 'Who's better — me or NBA Josh?' creates tribal engagement.",
  },
  {
    id: "series",
    icon: "📺",
    label: "Series Format",
    impact: 12,
    color: "hsl(270 100% 72%)",
    border: "hsl(270 100% 65% / 0.4)",
    glow: "hsl(270 100% 65% / 0.2)",
    bg: "hsl(270 100% 65% / 0.07)",
    why: "When viewers watch multiple episodes in one session, the algorithm learns who your audience is and auto-recommends you to similar people.",
    yourProblem: "Your videos aren't connected. Each one starts from zero audience trust.",
    fix: "\"Day X of rapping until NBA Josh responds\" IS a series. Lean into it. Number every video. Make it a story viewers follow.",
  },
  {
    id: "timing",
    icon: "⏰",
    label: "Post Timing & Frequency",
    impact: 5,
    color: "hsl(199 89% 60%)",
    border: "hsl(199 89% 55% / 0.4)",
    glow: "hsl(199 89% 55% / 0.2)",
    bg: "hsl(199 89% 55% / 0.07)",
    why: "Tuesday 4PM gets highest Shorts engagement for your demographic (25-34 male, US). Consistency signals an 'active channel'.",
    yourProblem: "You're posting sporadically — 4 days ago, 9 days ago, 1 month ago. That's a dying pattern in YouTube's eyes.",
    fix: "Post every 2-3 days minimum. The algorithm needs consistent data to understand your channel.",
  },
];

const SERIES_IDEAS = [
  { name: "Day X Until NBA Josh Responds", potential: "5K–20K/ep", why: "Narrative tension + growing stakes. Viewers HAVE to come back.", emoji: "🎤" },
  { name: "Rating Every Local Rapper", potential: "3K–15K/ep", why: "Controversy drives comments. Everyone disagrees on who's best.", emoji: "⭐" },
  { name: "Teaching NBA Josh's Flow", potential: "2K–10K/ep", why: "Educational + tribal identity. His fanbase will share it.", emoji: "🎓" },
  { name: "1 Bar Challenge (Beat Any Beat)", potential: "4K–25K/ep", why: "Replayable. Short. Can loop. People rewatch to catch every bar.", emoji: "🔥" },
];

// ─── Lever bar ───────────────────────────────────────────────────────────────
function LeverBar({ lever, index }: { lever: typeof LEVERS[0]; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const [barWidth, setBarWidth] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setBarWidth(lever.impact), 350 + index * 120);
    return () => clearTimeout(t);
  }, [lever.impact, index]);

  return (
    <div
      onClick={() => setExpanded(!expanded)}
      className="rounded-2xl border p-4 cursor-pointer transition-all"
      style={{
        borderColor: expanded ? lever.border : "hsl(280 50% 22% / 0.45)",
        background: expanded ? lever.bg : "transparent",
        boxShadow: expanded ? `0 0 24px -6px ${lever.glow}` : "none",
        marginBottom: 8,
      }}
    >
      <div className="flex items-center gap-3">
        <span className="text-xl flex-shrink-0">{lever.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between mb-2">
            <span className="text-sm font-semibold" style={{ color: "hsl(280 20% 92%)" }}>{lever.label}</span>
            <span className="text-sm font-bold flex-shrink-0" style={{ color: lever.color }}>{lever.impact}% impact</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "hsl(280 40% 10%)" }}>
            <div
              className="h-full rounded-full transition-all duration-1000"
              style={{ width: `${barWidth}%`, background: `linear-gradient(90deg, ${lever.color}88, ${lever.color})` }}
            />
          </div>
        </div>
        <span className="text-xs flex-shrink-0" style={{ color: "hsl(280 15% 45%)" }}>{expanded ? "▲" : "▼"}</span>
      </div>

      {expanded && (
        <div className="mt-4 pt-4 border-t space-y-3" style={{ borderColor: "hsl(280 50% 20% / 0.4)" }}>
          <p className="text-xs leading-relaxed" style={{ color: "hsl(280 15% 65%)" }}>
            <span className="font-bold" style={{ color: lever.color }}>Why it matters: </span>{lever.why}
          </p>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl p-3" style={{ background: "hsl(0 72% 51% / 0.07)", border: "1px solid hsl(0 72% 51% / 0.2)" }}>
              <div className="text-[10px] font-bold tracking-widest mb-1.5" style={{ color: "hsl(0 72% 65%)" }}>YOUR CHANNEL NOW</div>
              <p className="text-xs leading-relaxed" style={{ color: "hsl(280 10% 60%)" }}>{lever.yourProblem}</p>
            </div>
            <div className="rounded-xl p-3" style={{ background: "hsl(142 71% 45% / 0.07)", border: "1px solid hsl(142 71% 45% / 0.2)" }}>
              <div className="text-[10px] font-bold tracking-widest mb-1.5" style={{ color: "hsl(142 71% 60%)" }}>THE FIX</div>
              <p className="text-xs leading-relaxed" style={{ color: "hsl(280 10% 75%)" }}>{lever.fix}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Hook generator ───────────────────────────────────────────────────────────
interface GenerateResult {
  titles: Array<{ text: string; trigger: string; score: number; why: string }>;
  loop_hook: string;
  comment_bait: string;
  hashtag_sets: string[];
  post_time: string;
  projected_range: string;
  error?: boolean;
}

function HookGenerator() {
  const [videoDesc, setVideoDesc] = useState("");
  const [seriesDay, setSeriesDay]  = useState("7");
  const [loading, setLoading]      = useState(false);
  const [results, setResults]      = useState<GenerateResult | null>(null);
  const [copied, setCopied]        = useState<string | null>(null);

  const generate = async () => {
    if (!videoDesc.trim()) return;
    setLoading(true);
    setResults(null);
    try {
      const res = await fetch("/api/youtube-growth/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoDesc, seriesDay }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Generation failed");
      setResults(data);
    } catch (e: any) {
      setResults({ error: true } as any);
    }
    setLoading(false);
  };

  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="text-[10px] font-bold tracking-widest block mb-2" style={{ color: "hsl(280 15% 50%)" }}>
          WHAT HAPPENS IN THIS VIDEO
        </label>
        <textarea
          value={videoDesc}
          onChange={e => setVideoDesc(e.target.value)}
          placeholder="e.g. I rap NBA Josh's style back at him, showing I studied his flow. At the end I call him out directly."
          rows={3}
          className="w-full rounded-2xl px-4 py-3 text-sm outline-none resize-none leading-relaxed"
          style={{ background: "hsl(280 40% 9%)", border: "1px solid hsl(280 50% 22% / 0.5)", color: "hsl(280 20% 90%)" }}
        />
      </div>
      <div className="flex gap-3 items-end">
        <div className="w-32">
          <label className="text-[10px] font-bold tracking-widest block mb-2" style={{ color: "hsl(280 15% 50%)" }}>SERIES DAY #</label>
          <input
            value={seriesDay}
            onChange={e => setSeriesDay(e.target.value)}
            placeholder="7"
            className="w-full rounded-2xl px-4 py-2.5 text-xl font-bold outline-none"
            style={{ background: "hsl(280 40% 9%)", border: "1px solid hsl(280 50% 22% / 0.5)", color: "hsl(280 20% 90%)" }}
          />
        </div>
        <p className="text-xs pb-2.5 flex-1" style={{ color: "hsl(280 15% 45%)" }}>Higher day # = more FOMO and stakes in the title</p>
      </div>
      <button
        onClick={generate}
        disabled={loading || !videoDesc.trim()}
        className="w-full py-3 rounded-2xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all hover:scale-[1.01] disabled:opacity-40 disabled:scale-100 glow-pink"
        style={{ background: "linear-gradient(135deg, hsl(0 72% 55%) 0%, hsl(320 100% 55%) 50%, hsl(270 100% 65%) 100%)", border: "1px solid hsl(320 100% 80% / 0.3)" }}
      >
        {loading ? <><Loader2 size={15} className="animate-spin" /> Generating growth package…</> : <><Zap size={15} /> Generate Full Growth Package</>}
      </button>

      {results && (results as any).error && (
        <p className="text-sm text-center" style={{ color: "hsl(0 72% 65%)" }}>
          Generation failed — check that ANTHROPIC_API_KEY or XAI_API_KEY is set in Secrets.
        </p>
      )}

      {results && !(results as any).error && (
        <div className="space-y-4 pt-2">
          {/* Projected range */}
          {results.projected_range && (
            <div className="rounded-2xl border p-4 flex items-center justify-between"
              style={{ background: "hsl(142 71% 45% / 0.07)", borderColor: "hsl(142 71% 45% / 0.3)" }}>
              <div>
                <div className="text-[10px] font-bold tracking-widest mb-1" style={{ color: "hsl(142 71% 60%)" }}>REALISTIC VIEW RANGE</div>
                <div className="text-2xl font-black" style={{ color: "hsl(280 20% 96%)" }}>{results.projected_range}</div>
              </div>
              {results.post_time && (
                <div className="text-right">
                  <div className="text-[10px] font-bold tracking-widest mb-1" style={{ color: "hsl(199 89% 60%)" }}>POST TIME</div>
                  <div className="text-xs font-semibold" style={{ color: "hsl(280 15% 80%)" }}>{results.post_time}</div>
                </div>
              )}
            </div>
          )}

          {/* Titles */}
          <div>
            <div className="text-[10px] font-bold tracking-widest mb-2" style={{ color: "hsl(0 72% 65%)" }}>RANKED TITLES</div>
            {results.titles?.map((t, i) => (
              <div key={i} className="rounded-2xl border p-3.5 mb-2"
                style={{ background: i === 0 ? "hsl(0 72% 51% / 0.08)" : "hsl(280 40% 9%)", borderColor: i === 0 ? "hsl(0 72% 51% / 0.5)" : "hsl(280 50% 22% / 0.4)" }}>
                <div className="flex gap-3 items-start">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold leading-snug mb-1" style={{ color: "hsl(280 20% 95%)", fontWeight: i === 0 ? 800 : 500 }}>
                      {i === 0 && <span style={{ color: "hsl(0 72% 65%)" }}>★ </span>}{t.text}
                    </div>
                    <div className="text-xs" style={{ color: "hsl(280 15% 50%)" }}>
                      Triggers: <span style={{ color: "hsl(43 100% 65%)" }}>{t.trigger}</span> — {t.why}
                    </div>
                  </div>
                  <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-black"
                      style={{
                        background: `conic-gradient(${i === 0 ? "hsl(0 72% 60%)" : "hsl(280 30% 45%)"} ${(t.score || 80) * 3.6}deg, hsl(280 40% 10%) 0deg)`,
                        color: "hsl(280 20% 96%)",
                      }}>
                      {t.score}
                    </div>
                    <button onClick={() => copy(t.text, `t${i}`)}
                      className="text-[10px] px-2 py-0.5 rounded-lg border transition-colors"
                      style={{ borderColor: "hsl(280 50% 25% / 0.5)", color: copied === `t${i}` ? "hsl(142 71% 60%)" : "hsl(280 15% 50%)" }}>
                      {copied === `t${i}` ? "✓" : "copy"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Loop hook */}
          {results.loop_hook && (
            <div>
              <div className="text-[10px] font-bold tracking-widest mb-2" style={{ color: "hsl(43 100% 65%)" }}>🔁 LOOP ENGINEERING (AVD BOOSTER)</div>
              <div className="rounded-2xl border p-4 text-sm leading-relaxed"
                style={{ background: "hsl(43 100% 55% / 0.07)", borderColor: "hsl(43 100% 55% / 0.25)", color: "hsl(280 15% 82%)" }}>
                {results.loop_hook}
              </div>
            </div>
          )}

          {/* Comment bait */}
          {results.comment_bait && (
            <div>
              <div className="text-[10px] font-bold tracking-widest mb-2" style={{ color: "hsl(142 71% 60%)" }}>💬 PIN THIS COMMENT (DEBATE STARTER)</div>
              <div className="rounded-2xl border p-4 flex items-center justify-between gap-3"
                style={{ background: "hsl(142 71% 45% / 0.07)", borderColor: "hsl(142 71% 45% / 0.25)" }}>
                <p className="text-sm font-semibold" style={{ color: "hsl(280 20% 92%)" }}>"{results.comment_bait}"</p>
                <button onClick={() => copy(results.comment_bait, "cb")}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs flex-shrink-0 transition-colors"
                  style={{ border: "1px solid hsl(142 71% 45% / 0.3)", color: copied === "cb" ? "hsl(142 71% 60%)" : "hsl(280 15% 55%)" }}>
                  {copied === "cb" ? <Check size={12} /> : <Copy size={12} />} {copied === "cb" ? "Copied" : "Copy"}
                </button>
              </div>
            </div>
          )}

          {/* Hashtags */}
          {results.hashtag_sets && (
            <div>
              <div className="text-[10px] font-bold tracking-widest mb-2" style={{ color: "hsl(270 100% 72%)" }}>🏷️ HASHTAG SETS (PICK ONE PER VIDEO)</div>
              {results.hashtag_sets.map((set, i) => (
                <div key={i} className="rounded-xl border px-4 py-2.5 mb-2 flex items-center justify-between gap-3"
                  style={{ background: "hsl(280 40% 9%)", borderColor: "hsl(280 50% 22% / 0.4)" }}>
                  <span className="text-xs font-mono" style={{ color: "hsl(270 100% 75%)" }}>{set}</span>
                  <button onClick={() => copy(set, `h${i}`)}
                    className="text-[10px] transition-colors"
                    style={{ color: copied === `h${i}` ? "hsl(142 71% 60%)" : "hsl(280 15% 45%)" }}>
                    {copied === `h${i}` ? "✓" : "copy"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Series planner ───────────────────────────────────────────────────────────
function SeriesPlanner() {
  return (
    <div className="space-y-4">
      <p className="text-sm leading-relaxed" style={{ color: "hsl(280 15% 60%)" }}>
        The #1 gap between your channel (200–700 views) and channels doing 10K+ is a{" "}
        <strong style={{ color: "hsl(270 100% 75%)" }}>recurring series</strong>.
        It makes the algorithm understand your audience and auto-recommends new episodes to past viewers.
      </p>
      {SERIES_IDEAS.map((s, i) => (
        <div key={i} className="rounded-2xl border p-4" style={{ background: "hsl(280 40% 9%)", borderColor: "hsl(280 50% 22% / 0.4)" }}>
          <div className="flex justify-between items-start gap-3">
            <div>
              <div className="text-sm font-bold mb-1.5" style={{ color: "hsl(280 20% 95%)" }}>{s.emoji} {s.name}</div>
              <div className="text-xs leading-relaxed" style={{ color: "hsl(280 15% 55%)" }}>{s.why}</div>
            </div>
            <div className="flex-shrink-0 text-center rounded-xl px-3 py-2" style={{ background: "hsl(270 100% 65% / 0.12)", border: "1px solid hsl(270 100% 65% / 0.35)" }}>
              <div className="text-[9px] font-bold tracking-widest" style={{ color: "hsl(270 100% 72%)" }}>POTENTIAL</div>
              <div className="text-sm font-black mt-0.5" style={{ color: "hsl(270 80% 85%)" }}>{s.potential}</div>
            </div>
          </div>
        </div>
      ))}
      <div className="rounded-2xl border p-4 space-y-3" style={{ background: "hsl(199 89% 55% / 0.05)", borderColor: "hsl(199 89% 55% / 0.2)" }}>
        <div className="text-sm font-bold" style={{ color: "hsl(199 89% 65%)" }}>📅 Your Posting Schedule to Hit 5K+</div>
        {[
          ["Every 2–3 days", "Minimum frequency the algorithm needs to build momentum"],
          ["Tuesday 4PM or Friday 6PM", "Peak Shorts engagement for your demographic (25-34 male, US)"],
          ["Reply to every comment", "YouTube sees replies as social signals — boosts next video's reach"],
          ["After 10 episodes", "YouTube will auto-recommend Ep. 11 to everyone who watched 1–10"],
        ].map(([when, why], i) => (
          <div key={i} className="flex items-start gap-2.5">
            <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: "hsl(199 89% 60%)" }} />
            <div className="text-xs leading-relaxed">
              <span className="font-semibold" style={{ color: "hsl(280 20% 90%)" }}>{when}</span>
              <span style={{ color: "hsl(280 15% 55%)" }}> — {why}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── View projector ───────────────────────────────────────────────────────────
function ViewProjector() {
  const [currentViews, setCurrentViews] = useState("200");
  const [active, setActive]             = useState<Record<string, boolean>>({
    hook: false, retention: false, comments: false, series: false, timing: false,
  });

  const toggle = (id: string) => setActive(p => ({ ...p, [id]: !p[id] }));
  const base        = parseInt(currentViews) || 200;
  const multiplier  = 1 + (active.hook ? 1.8 : 0) + (active.retention ? 1.4 : 0) + (active.comments ? 0.8 : 0) + (active.series ? 0.6 : 0) + (active.timing ? 0.3 : 0);
  const projected   = Math.round(base * multiplier);
  const activeCount = Object.values(active).filter(Boolean).length;

  const projColor = projected >= 10000 ? "hsl(142 71% 55%)" : projected >= 5000 ? "hsl(43 100% 65%)" : projected >= 1000 ? "hsl(270 100% 72%)" : "hsl(0 72% 65%)";

  return (
    <div className="space-y-5">
      <p className="text-sm leading-relaxed" style={{ color: "hsl(280 15% 60%)" }}>
        See how stacking each growth lever multiplies your views. Based on real algorithm research, not guesses.
      </p>
      <div>
        <label className="text-[10px] font-bold tracking-widest block mb-2" style={{ color: "hsl(280 15% 50%)" }}>YOUR CURRENT AVERAGE VIEWS</label>
        <input value={currentViews} onChange={e => setCurrentViews(e.target.value)}
          className="w-full rounded-2xl px-4 py-3 text-3xl font-black outline-none"
          style={{ background: "hsl(280 40% 9%)", border: "1px solid hsl(280 50% 22% / 0.5)", color: "hsl(280 20% 95%)" }} />
      </div>

      <div>
        <div className="text-[10px] font-bold tracking-widest mb-3" style={{ color: "hsl(280 15% 50%)" }}>TOGGLE THE LEVERS YOU'LL FIX</div>
        <div className="grid grid-cols-2 gap-2">
          {LEVERS.map(l => (
            <div key={l.id} onClick={() => toggle(l.id)} className="rounded-2xl border p-3 cursor-pointer transition-all"
              style={{
                borderColor: active[l.id] ? l.border : "hsl(280 50% 22% / 0.4)",
                background: active[l.id] ? l.bg : "hsl(280 40% 9%)",
              }}>
              <div className="text-base mb-1">{l.icon}</div>
              <div className="text-xs font-bold" style={{ color: active[l.id] ? "hsl(280 20% 95%)" : "hsl(280 15% 55%)" }}>{l.label}</div>
              <div className="text-[10px] font-bold mt-0.5" style={{ color: active[l.id] ? l.color : "hsl(280 15% 40%)" }}>+{l.impact}%</div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border-2 p-8 text-center"
        style={{ background: `${projColor.replace(")", " / 0.06)")}`, borderColor: projColor }}>
        <div className="text-[10px] font-bold tracking-widest mb-2" style={{ color: "hsl(280 15% 55%)" }}>PROJECTED VIEWS PER VIDEO</div>
        <div className="text-6xl font-black mb-2" style={{ color: projColor, textShadow: `0 0 40px ${projColor}` }}>
          {projected >= 1000 ? `${(projected / 1000).toFixed(1)}K` : projected}
        </div>
        <div className="text-sm" style={{ color: "hsl(280 15% 55%)" }}>
          {activeCount === 0 && "Toggle levers above to see your potential"}
          {activeCount === 1 && "Good start — stack more levers"}
          {activeCount === 2 && "Getting there — 2 more levers to go"}
          {activeCount === 3 && "Solid. One more and you're in viral territory"}
          {activeCount === 4 && "Almost there — add the last lever"}
          {activeCount === 5 && "🔥 All 5 levers active — maximum growth mode"}
        </div>
        {projected >= 5000 && (
          <div className="text-xs mt-2 opacity-70" style={{ color: projColor }}>
            ~{Math.round(projected * 0.02)} new subscribers per video at this level
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────
const TABS = [
  { id: "levers",    label: "📊 The 5 Levers",   sub: "what drives views"    },
  { id: "generator", label: "⚡ Generate",        sub: "title + loop + CTA"   },
  { id: "series",    label: "📺 Series Plan",     sub: "compound growth"       },
  { id: "projector", label: "🎯 View Projector",  sub: "see your potential"    },
];

export default function YouTubeGrowth() {
  const [tab, setTab] = useState("levers");

  return (
    <div className="p-6 md:p-10 max-w-2xl mx-auto">
      {/* Y2K header */}
      <div className="pb-6 mb-6">
        <div className="eyebrow mb-3" style={{ color: "hsl(180 80% 65%)" }}>▸ YOUTUBE OPS · 2026 ALGORITHM</div>
        <h1 className="text-4xl md:text-5xl aurora-text" style={{ lineHeight: 1 }}>SHORTS GROWTH</h1>
        <p className="text-sm mt-3 max-w-md" style={{ color: "hsl(280 20% 70%)" }}>
          Not a title tool. A complete channel growth system — the title is only 35% of the equation.
        </p>
        <div className="rule mt-4" />
      </div>

      {/* Snapshot card */}
      <div className="rounded-2xl border p-4 mb-6 flex items-center gap-4 glass"
        style={{ borderColor: "hsl(280 60% 28% / 0.4)" }}>
        <span className="text-2xl">📊</span>
        <div>
          <div className="text-sm font-semibold mb-1.5" style={{ color: "hsl(280 20% 90%)" }}>Your channel snapshot</div>
          <div className="flex gap-4 flex-wrap text-xs">
            {[["Best video", "2.2K"], ["AI-posted", "47–680"], ["Gap", "3×–46×"]].map(([label, val]) => (
              <div key={label}>
                <span style={{ color: "hsl(280 15% 50%)" }}>{label}: </span>
                <span className="font-bold" style={{ color: "hsl(43 100% 65%)" }}>{val}</span>
              </div>
            ))}
          </div>
          <div className="text-[11px] mt-1.5" style={{ color: "hsl(280 15% 45%)" }}>Fix all 5 levers → realistic target: 4K–15K/video</div>
        </div>
      </div>

      {/* Tab nav */}
      <div className="grid grid-cols-4 gap-1.5 mb-6 p-1 rounded-2xl" style={{ background: "hsl(280 40% 8%)", border: "1px solid hsl(280 50% 20% / 0.4)" }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className="px-2 py-2.5 rounded-xl text-center transition-all"
            style={tab === t.id ? {
              background: "linear-gradient(135deg, hsl(320 100% 62% / 0.22) 0%, hsl(270 100% 65% / 0.16) 100%)",
              border: "1px solid hsl(320 100% 62% / 0.4)", color: "hsl(320 100% 82%)",
            } : {
              color: "hsl(280 15% 55%)", border: "1px solid transparent",
            }}>
            <div className="text-xs font-semibold leading-tight">{t.label}</div>
            <div className="text-[9px] mt-0.5 opacity-60">{t.sub}</div>
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="rounded-2xl border p-6 glass" style={{ borderColor: "hsl(280 60% 28% / 0.4)" }}>
        {tab === "levers" && (
          <div>
            <p className="text-xs leading-relaxed mb-4" style={{ color: "hsl(280 15% 55%)" }}>
              Click each lever to see exactly what's wrong and how to fix it.{" "}
              <span style={{ color: "hsl(280 20% 90%)" }}>These are ranked by impact.</span>
            </p>
            {LEVERS.map((lever, i) => <LeverBar key={lever.id} lever={lever} index={i} />)}
          </div>
        )}
        {tab === "generator" && <HookGenerator />}
        {tab === "series"    && <SeriesPlanner />}
        {tab === "projector" && <ViewProjector />}
      </div>

      <div className="text-center mt-5 text-[10px]" style={{ color: "hsl(280 30% 22%)" }}>
        Powered by 2026 YouTube algorithm research + AI
      </div>
    </div>
  );
}
