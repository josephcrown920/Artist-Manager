import { useState, useRef, useEffect } from "react";
import { Sparkles, Copy, Check, Loader2, Film, Music, Tag, FileText, Layers, Image, RefreshCw, ChevronDown, ChevronUp, Zap, RotateCcw } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface StructureItem { timestamp: string; section: string; content: string; duration_sec: number }
interface ContentPackage {
  platform: string; concept: string;
  hook: { text: string; action: string; pattern_interrupt: string };
  titles: string[];
  structure: StructureItem[];
  script: string;
  captions: string;
  description: string;
  tags: string[];
  thumbnail: { headline: string; subtext: string; visual_concept: string; emotion: string };
  music: { vibe: string; genre: string; tempo: string; references: string };
  cta: string;
  repurpose: string[];
}

// ─── Saved projects (localStorage) ───────────────────────────────────────────
const STORAGE_KEY = "cf_projects";
function loadProjects(): { id: string; concept: string; platform: string; created: number; data: ContentPackage }[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch { return []; }
}
function saveProject(p: ContentPackage) {
  const projects = loadProjects();
  const entry = { id: Date.now().toString(), concept: p.concept, platform: p.platform, created: Date.now(), data: p };
  projects.unshift(entry);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects.slice(0, 12)));
}

// ─── Copy button ──────────────────────────────────────────────────────────────
function CopyBtn({ text, small }: { text: string; small?: boolean }) {
  const [done, setDone] = useState(false);
  const copy = () => { navigator.clipboard.writeText(text); setDone(true); setTimeout(() => setDone(false), 2000); };
  return (
    <button onClick={copy}
      className={`flex items-center gap-1 rounded-lg font-medium transition-all flex-shrink-0 ${small ? "px-2 py-1 text-[10px]" : "px-2.5 py-1.5 text-xs"}`}
      style={{ background: done ? "hsl(142 71% 45% / 0.15)" : "hsl(280 50% 20% / 0.5)", border: `1px solid ${done ? "hsl(142 71% 45% / 0.4)" : "hsl(280 50% 30% / 0.4)"}`, color: done ? "hsl(142 71% 65%)" : "hsl(280 15% 60%)" }}>
      {done ? <Check size={10} /> : <Copy size={10} />}
      {done ? "Copied" : "Copy"}
    </button>
  );
}

// ─── Section card ─────────────────────────────────────────────────────────────
function Section({ icon: Icon, label, color, children, copyText, defaultOpen = true }: {
  icon: React.ElementType; label: string; color: string; children: React.ReactNode; copyText?: string; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-2xl border overflow-hidden" style={{ borderColor: `${color.replace(")", " / 0.3)")}` }}>
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3"
        style={{ background: `${color.replace(")", " / 0.08)")}` }}>
        <div className="flex items-center gap-2.5">
          <Icon size={14} style={{ color }} />
          <span className="text-xs font-bold tracking-widest uppercase" style={{ color }}>{label}</span>
        </div>
        <div className="flex items-center gap-2">
          {copyText && open && <CopyBtn text={copyText} small />}
          {open ? <ChevronUp size={13} style={{ color: "hsl(280 15% 50%)" }} /> : <ChevronDown size={13} style={{ color: "hsl(280 15% 50%)" }} />}
        </div>
      </button>
      {open && <div className="px-4 pb-4 pt-3">{children}</div>}
    </div>
  );
}

// ─── Platform config ───────────────────────────────────────────────────────────
const PLATFORMS = [
  { id: "youtube",   label: "YouTube",    emoji: "▶️",  color: "hsl(0 72% 60%)",    maxDur: 600 },
  { id: "shorts",    label: "Shorts",     emoji: "📱",  color: "hsl(0 72% 60%)",    maxDur: 60  },
  { id: "tiktok",    label: "TikTok",     emoji: "🎵",  color: "hsl(180 100% 60%)", maxDur: 60  },
  { id: "instagram", label: "Reel",       emoji: "📸",  color: "hsl(320 100% 65%)", maxDur: 90  },
  { id: "twitter",   label: "Twitter/X",  emoji: "🐦",  color: "hsl(199 89% 60%)",  maxDur: 140 },
];
const STYLES = ["entertaining", "educational", "emotional", "controversial", "behind-the-scenes", "tutorial", "storytelling"];
const DURATIONS: Record<string, string[]> = {
  youtube:   ["60", "180", "300", "600"],
  shorts:    ["15", "30", "60"],
  tiktok:    ["15", "30", "60"],
  instagram: ["15", "30", "60", "90"],
  twitter:   ["30", "60", "140"],
};

// ─── Main component ────────────────────────────────────────────────────────────
export default function CreatorFactory() {
  const [concept, setConcept]         = useState("");
  const [platform, setPlatform]       = useState("tiktok");
  const [duration, setDuration]       = useState("60");
  const [style, setStyle]             = useState("entertaining");
  const [result, setResult]           = useState<ContentPackage | null>(null);
  const [loading, setLoading]         = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError]             = useState("");
  const [projects, setProjects]       = useState(loadProjects);
  const [showHistory, setShowHistory] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);

  const loadingSteps = [
    "Analyzing your concept…",
    "Crafting the perfect hook…",
    "Writing the script…",
    "Generating SEO package…",
    "Building your content package…",
  ];

  useEffect(() => {
    if (!loading) return;
    const id = setInterval(() => setLoadingStep(s => (s + 1) % loadingSteps.length), 1800);
    return () => clearInterval(id);
  }, [loading]);

  const generate = async () => {
    if (!concept.trim()) return;
    setLoading(true); setError(""); setResult(null); setLoadingStep(0);
    try {
      const res = await fetch("/api/creator-factory/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ concept, platform, duration, style }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed");
      setResult(data);
      saveProject(data);
      setProjects(loadProjects());
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    } catch (err: any) {
      setError(err.message || "Something went wrong — try again.");
    } finally {
      setLoading(false);
    }
  };

  const plat = PLATFORMS.find(p => p.id === platform) || PLATFORMS[0];

  return (
    <div className="p-6 md:p-10 max-w-3xl mx-auto">
      {/* Y2K header */}
      <div className="pb-6 mb-6">
        <div className="eyebrow mb-3" style={{ color: "hsl(180 80% 65%)" }}>▸ AGENT ONE · CONTENT FACTORY</div>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-4xl md:text-5xl aurora-text" style={{ lineHeight: 1 }}>CREATOR FACTORY</h1>
            <p className="text-sm mt-3" style={{ color: "hsl(280 20% 70%)" }}>
              Describe your video idea. Agent One generates the full content package — hook, script, SEO, thumbnail, and more.
            </p>
          </div>
          {projects.length > 0 && (
            <button onClick={() => setShowHistory(!showHistory)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold flex-shrink-0 transition-all"
              style={{ background: "hsl(280 40% 10%)", border: "1px solid hsl(280 50% 22% / 0.5)", color: "hsl(280 20% 70%)" }}>
              <Layers size={12} /> {projects.length} saved
            </button>
          )}
        </div>
        <div className="rule mt-4" />
      </div>

      {/* History drawer */}
      {showHistory && (
        <div className="rounded-2xl border mb-6 overflow-hidden glass" style={{ borderColor: "hsl(280 60% 28% / 0.4)" }}>
          <div className="px-4 py-2.5 border-b text-[10px] font-bold tracking-widest" style={{ borderColor: "hsl(280 50% 22% / 0.4)", color: "hsl(280 15% 50%)" }}>RECENT PROJECTS</div>
          <div className="divide-y" style={{ divideColor: "hsl(280 50% 18% / 0.4)" }}>
            {projects.map(p => (
              <button key={p.id} onClick={() => { setResult(p.data); setConcept(p.concept); setPlatform(p.platform); setShowHistory(false); setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth" }), 100); }}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/5 transition-colors">
                <span className="text-lg">{PLATFORMS.find(pl => pl.id === p.platform)?.emoji ?? "🎬"}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium truncate" style={{ color: "hsl(280 20% 88%)" }}>{p.concept}</div>
                  <div className="text-[10px]" style={{ color: "hsl(280 15% 50%)" }}>{PLATFORMS.find(pl => pl.id === p.platform)?.label} · {new Date(p.created).toLocaleDateString()}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input panel */}
      <div className="rounded-2xl border glass p-5 space-y-4 mb-6" style={{ borderColor: "hsl(280 60% 28% / 0.4)" }}>
        {/* Platform selector */}
        <div className="flex gap-2 flex-wrap">
          {PLATFORMS.map(p => (
            <button key={p.id} onClick={() => { setPlatform(p.id); setDuration(DURATIONS[p.id][0]); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
              style={platform === p.id
                ? { background: `${p.color.replace(")", " / 0.18)")}`, color: p.color, border: `1px solid ${p.color.replace(")", " / 0.5)")}` }
                : { background: "hsl(280 40% 10%)", color: "hsl(280 15% 55%)", border: "1px solid hsl(280 50% 20% / 0.4)" }}>
              {p.emoji} {p.label}
            </button>
          ))}
        </div>

        {/* Concept input */}
        <div>
          <label className="text-[10px] font-bold tracking-widest block mb-2" style={{ color: "hsl(280 15% 50%)" }}>YOUR VIDEO IDEA</label>
          <textarea value={concept} onChange={e => setConcept(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) generate(); }}
            placeholder={`e.g. "Day 7 of rapping until I go viral — I freestyled over a trending beat and this happened…"\n\nOr: "I broke down why NBA Josh's flow is different from every other rapper right now"`}
            rows={3}
            className="w-full rounded-2xl px-4 py-3 text-sm outline-none resize-none leading-relaxed"
            style={{ background: "hsl(280 40% 9%)", border: "1px solid hsl(280 50% 25% / 0.6)", color: "hsl(280 20% 90%)" }} />
          <div className="text-[10px] mt-1.5" style={{ color: "hsl(280 15% 40%)" }}>Tip: more detail = better content. Press Ctrl+Enter to generate.</div>
        </div>

        {/* Duration + Style */}
        <div className="flex gap-3 flex-wrap">
          <div className="flex-1 min-w-[140px]">
            <label className="text-[10px] font-bold tracking-widest block mb-2" style={{ color: "hsl(280 15% 50%)" }}>DURATION</label>
            <div className="flex gap-1.5 flex-wrap">
              {DURATIONS[platform]?.map(d => (
                <button key={d} onClick={() => setDuration(d)}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                  style={duration === d
                    ? { background: `${plat.color.replace(")", " / 0.2)")}`, color: plat.color, border: `1px solid ${plat.color.replace(")", " / 0.5)")}` }
                    : { background: "hsl(280 40% 10%)", color: "hsl(280 15% 55%)", border: "1px solid hsl(280 50% 20% / 0.4)" }}>
                  {d}s
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 min-w-[140px]">
            <label className="text-[10px] font-bold tracking-widest block mb-2" style={{ color: "hsl(280 15% 50%)" }}>CONTENT STYLE</label>
            <select value={style} onChange={e => setStyle(e.target.value)}
              className="w-full rounded-xl px-3 py-2 text-xs font-medium outline-none appearance-none capitalize"
              style={{ background: "hsl(280 40% 10%)", border: "1px solid hsl(280 50% 25% / 0.5)", color: "hsl(280 20% 88%)" }}>
              {STYLES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {/* Generate button */}
        <button onClick={generate} disabled={!concept.trim() || loading}
          className="w-full py-3.5 rounded-2xl text-sm font-black text-white flex items-center justify-center gap-2.5 disabled:opacity-40 transition-all hover:scale-[1.01] glow-pink"
          style={{ background: "linear-gradient(135deg, hsl(0 72% 55%) 0%, hsl(320 100% 60%) 45%, hsl(270 100% 65%) 100%)", border: "1px solid hsl(320 100% 80% / 0.3)", letterSpacing: "0.05em" }}>
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
          {loading ? loadingSteps[loadingStep] : "GENERATE CONTENT PACKAGE"}
        </button>
      </div>

      {error && (
        <div className="rounded-2xl border p-4 mb-5 text-sm" style={{ background: "hsl(0 72% 45% / 0.1)", border: "1px solid hsl(0 72% 45% / 0.35)", color: "hsl(0 72% 70%)" }}>
          {error}
        </div>
      )}

      {/* Result */}
      {result && (
        <div ref={resultRef} className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-[10px] font-bold tracking-widest" style={{ color: "hsl(142 71% 60%)" }}>
              ● CONTENT PACKAGE READY — {result.titles?.[0]?.slice(0, 40)}…
            </div>
            <button onClick={generate} disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
              style={{ background: "hsl(280 40% 10%)", border: "1px solid hsl(280 50% 22% / 0.5)", color: "hsl(280 15% 60%)" }}>
              <RotateCcw size={11} /> Regenerate
            </button>
          </div>

          {/* Hook */}
          <Section icon={Zap} label="Opening Hook" color="hsl(0 72% 65%)" copyText={result.hook?.text}>
            <div className="space-y-2.5">
              <div className="rounded-xl p-3" style={{ background: "hsl(0 72% 51% / 0.08)", border: "1px solid hsl(0 72% 51% / 0.25)" }}>
                <div className="text-xs font-bold mb-1" style={{ color: "hsl(0 72% 65%)" }}>FIRST 3 SECONDS — SAY THIS:</div>
                <p className="text-base font-semibold leading-snug" style={{ color: "hsl(280 20% 97%)" }}>{result.hook?.text}</p>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-xl p-2.5" style={{ background: "hsl(280 40% 10%)", border: "1px solid hsl(280 50% 20% / 0.4)" }}>
                  <div className="font-bold mb-1" style={{ color: "hsl(199 89% 60%)" }}>ON SCREEN</div>
                  <p style={{ color: "hsl(280 15% 75%)" }}>{result.hook?.action}</p>
                </div>
                <div className="rounded-xl p-2.5" style={{ background: "hsl(280 40% 10%)", border: "1px solid hsl(280 50% 20% / 0.4)" }}>
                  <div className="font-bold mb-1" style={{ color: "hsl(270 100% 72%)" }}>WHY IT WORKS</div>
                  <p style={{ color: "hsl(280 15% 75%)" }}>{result.hook?.pattern_interrupt}</p>
                </div>
              </div>
            </div>
          </Section>

          {/* Titles */}
          <Section icon={Film} label="Title Options" color="hsl(320 100% 65%)" defaultOpen>
            <div className="space-y-2">
              {result.titles?.map((t, i) => (
                <div key={i} className="flex items-center gap-2 rounded-xl px-3 py-2.5" style={{ background: "hsl(280 40% 10%)", border: "1px solid hsl(280 50% 20% / 0.4)" }}>
                  <span className="text-xs font-black w-5 flex-shrink-0" style={{ color: i === 0 ? "hsl(142 71% 55%)" : "hsl(280 15% 45%)" }}>#{i + 1}</span>
                  <p className="text-sm flex-1" style={{ color: "hsl(280 20% 92%)" }}>{t}</p>
                  <CopyBtn text={t} small />
                </div>
              ))}
            </div>
          </Section>

          {/* Structure */}
          <Section icon={Layers} label="Video Structure" color="hsl(199 89% 60%)" copyText={result.structure?.map(s => `[${s.timestamp}] ${s.section}: ${s.content}`).join("\n")}>
            <div className="space-y-2">
              {result.structure?.map((s, i) => (
                <div key={i} className="flex gap-3 items-start">
                  <div className="text-center flex-shrink-0 w-12">
                    <div className="text-xs font-black" style={{ color: "hsl(199 89% 65%)" }}>{s.timestamp}</div>
                    <div className="text-[10px]" style={{ color: "hsl(280 15% 45%)" }}>{s.duration_sec}s</div>
                  </div>
                  <div className="flex-1 rounded-xl px-3 py-2" style={{ background: "hsl(280 40% 10%)", border: "1px solid hsl(280 50% 20% / 0.4)" }}>
                    <div className="text-[10px] font-bold mb-0.5" style={{ color: "hsl(199 89% 60%)" }}>{s.section}</div>
                    <p className="text-xs" style={{ color: "hsl(280 15% 78%)" }}>{s.content}</p>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* Script */}
          <Section icon={FileText} label="Full Script" color="hsl(270 100% 72%)" copyText={result.script} defaultOpen={false}>
            <pre className="text-xs leading-relaxed whitespace-pre-wrap font-sans" style={{ color: "hsl(280 15% 80%)" }}>{result.script}</pre>
          </Section>

          {/* Thumbnail */}
          <Section icon={Image} label="Thumbnail" color="hsl(43 100% 65%)" copyText={[result.thumbnail?.headline, result.thumbnail?.subtext, result.thumbnail?.visual_concept].join("\n")}>
            <div className="space-y-2">
              <div className="rounded-2xl flex items-center justify-center p-6 text-center" style={{ background: "linear-gradient(135deg, hsl(280 60% 15%) 0%, hsl(320 60% 12%) 100%)", border: "2px solid hsl(43 100% 55% / 0.4)", minHeight: 100 }}>
                <div>
                  <div className="text-2xl font-black tracking-tight" style={{ color: "hsl(43 100% 65%)" }}>{result.thumbnail?.headline}</div>
                  {result.thumbnail?.subtext && <div className="text-sm mt-1" style={{ color: "hsl(280 20% 80%)" }}>{result.thumbnail.subtext}</div>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-xl p-2.5" style={{ background: "hsl(280 40% 10%)", border: "1px solid hsl(280 50% 20% / 0.4)" }}>
                  <div className="font-bold mb-1" style={{ color: "hsl(43 100% 65%)" }}>VISUAL CONCEPT</div>
                  <p style={{ color: "hsl(280 15% 75%)" }}>{result.thumbnail?.visual_concept}</p>
                </div>
                <div className="rounded-xl p-2.5" style={{ background: "hsl(280 40% 10%)", border: "1px solid hsl(280 50% 20% / 0.4)" }}>
                  <div className="font-bold mb-1" style={{ color: "hsl(320 100% 65%)" }}>YOUR EXPRESSION</div>
                  <p style={{ color: "hsl(280 15% 75%)" }}>{result.thumbnail?.emotion}</p>
                </div>
              </div>
            </div>
          </Section>

          {/* Music */}
          <Section icon={Music} label="Music Vibe" color="hsl(142 71% 55%)" copyText={`${result.music?.vibe} | ${result.music?.genre} | ${result.music?.tempo}\nReferences: ${result.music?.references}`} defaultOpen={false}>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                ["VIBE", result.music?.vibe, "hsl(142 71% 55%)"],
                ["GENRE", result.music?.genre, "hsl(199 89% 60%)"],
                ["TEMPO", result.music?.tempo, "hsl(270 100% 72%)"],
                ["REFERENCES", result.music?.references, "hsl(320 100% 65%)"],
              ].map(([k, v, c]) => (
                <div key={k as string} className="rounded-xl p-2.5" style={{ background: "hsl(280 40% 10%)", border: "1px solid hsl(280 50% 20% / 0.4)" }}>
                  <div className="font-bold mb-1" style={{ color: c as string }}>{k}</div>
                  <p style={{ color: "hsl(280 15% 75%)" }}>{v as string}</p>
                </div>
              ))}
            </div>
          </Section>

          {/* SEO */}
          <Section icon={Tag} label="SEO Package" color="hsl(180 100% 60%)" defaultOpen={false}
            copyText={`CAPTION:\n${result.captions}\n\nDESCRIPTION:\n${result.description}\n\nTAGS:\n${result.tags?.join(", ")}`}>
            <div className="space-y-3">
              <div>
                <div className="text-[10px] font-bold tracking-widest mb-2" style={{ color: "hsl(180 100% 60%)" }}>CAPTION</div>
                <p className="text-xs leading-relaxed" style={{ color: "hsl(280 15% 80%)" }}>{result.captions}</p>
              </div>
              <div>
                <div className="text-[10px] font-bold tracking-widest mb-2" style={{ color: "hsl(180 100% 60%)" }}>DESCRIPTION</div>
                <p className="text-xs leading-relaxed whitespace-pre-wrap" style={{ color: "hsl(280 15% 80%)" }}>{result.description}</p>
              </div>
              <div>
                <div className="text-[10px] font-bold tracking-widest mb-2" style={{ color: "hsl(180 100% 60%)" }}>TAGS</div>
                <div className="flex flex-wrap gap-1.5">
                  {result.tags?.map((t, i) => (
                    <span key={i} className="text-[10px] px-2 py-1 rounded-lg font-medium"
                      style={{ background: "hsl(180 100% 60% / 0.1)", color: "hsl(180 100% 70%)", border: "1px solid hsl(180 100% 60% / 0.25)" }}>
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </Section>

          {/* CTA + Repurpose */}
          <Section icon={RefreshCw} label="CTA + Repurpose" color="hsl(43 100% 65%)" defaultOpen={false}
            copyText={result.cta}>
            <div className="space-y-3">
              <div className="rounded-xl p-3" style={{ background: "hsl(43 100% 55% / 0.07)", border: "1px solid hsl(43 100% 55% / 0.3)" }}>
                <div className="text-[10px] font-bold mb-1.5" style={{ color: "hsl(43 100% 65%)" }}>CLOSING CTA — SAY THIS:</div>
                <p className="text-sm font-semibold" style={{ color: "hsl(280 20% 95%)" }}>"{result.cta}"</p>
              </div>
              <div>
                <div className="text-[10px] font-bold tracking-widest mb-2" style={{ color: "hsl(43 100% 65%)" }}>REPURPOSE THIS VIDEO</div>
                <div className="space-y-1.5">
                  {result.repurpose?.map((r, i) => (
                    <div key={i} className="flex gap-2 text-xs">
                      <span className="text-[10px] mt-0.5 flex-shrink-0" style={{ color: "hsl(43 100% 65%)" }}>→</span>
                      <p style={{ color: "hsl(280 15% 75%)" }}>{r}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Section>
        </div>
      )}
    </div>
  );
}
