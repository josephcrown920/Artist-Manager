import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Film, Sparkles, Loader2, Download, RefreshCw, AlertCircle, CheckCircle2, Clock, Settings as SettingsIcon } from "lucide-react";

const ASPECT_RATIOS = [
  { id: "9:16",  label: "9:16",  sub: "TikTok / Shorts / Reel" },
  { id: "16:9",  label: "16:9",  sub: "YouTube"                },
  { id: "1:1",   label: "1:1",   sub: "Instagram"              },
];

const DURATIONS_KLING     = ["5", "10"];
const DURATIONS_SEEDANCE  = ["5", "10"];

const PROMPT_STARTERS = [
  "NBA Josh in a dark recording studio, mic close-up, red and purple neon lights, cinematic 4K",
  "Hypnotic looping crowd scene at a hip-hop concert, bass drops, confetti, slow motion",
  "Luxury car driving through rain at night, city lights reflected on wet asphalt, mood: victorious",
  "Abstract music visualizer with aurora colors pulsing to the beat, futuristic UI elements",
  "Behind-the-scenes footage of an artist writing lyrics, coffee steam rising, notebook close-up",
];

type JobState = {
  status: "idle" | "submitting" | "processing" | "completed" | "failed";
  taskId?: string;
  statusUrl?: string;
  provider?: string;
  videoUrl?: string;
  coverUrl?: string;
  error?: string;
};

export default function VideoStudio() {
  const [prompt, setPrompt]           = useState("");
  const [provider, setProvider]       = useState<"kling" | "seedance">("kling");
  const [aspectRatio, setAspectRatio] = useState("9:16");
  const [duration, setDuration]       = useState("5");
  const [mode, setMode]               = useState("std");
  const [job, setJob]                 = useState<JobState>({ status: "idle" });
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { data: providers } = useQuery({
    queryKey: ["videoProviders"],
    queryFn: () => fetch("/api/video-gen/providers").then(r => r.json()),
    staleTime: 30000,
  });

  // ── Poll for job status ────────────────────────────────────────────────────
  useEffect(() => {
    if (job.status !== "processing" || !job.taskId) return;
    const poll = async () => {
      try {
        const url = `/api/video-gen/status/${job.provider}/${job.taskId}${job.statusUrl ? `?statusUrl=${encodeURIComponent(job.statusUrl)}` : ""}`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.status === "completed") {
          clearInterval(pollRef.current!);
          setJob(j => ({ ...j, status: "completed", videoUrl: data.videoUrl, coverUrl: data.coverUrl }));
        } else if (data.status === "failed") {
          clearInterval(pollRef.current!);
          setJob(j => ({ ...j, status: "failed", error: "Video generation failed — try again." }));
        }
      } catch { /* keep polling */ }
    };
    pollRef.current = setInterval(poll, 5000);
    poll();
    return () => clearInterval(pollRef.current!);
  }, [job.status, job.taskId]);

  const generate = async () => {
    if (!prompt.trim()) return;
    setJob({ status: "submitting" });
    try {
      const res = await fetch("/api/video-gen/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, provider, aspectRatio, duration, mode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Submission failed");
      setJob({ status: "processing", taskId: data.taskId, statusUrl: data.statusUrl, provider });
    } catch (err: any) {
      setJob({ status: "failed", error: err.message });
    }
  };

  const klingOk    = providers?.kling;
  const seedanceOk = providers?.seedance;
  const noneOk     = !klingOk && !seedanceOk;

  return (
    <div className="p-6 md:p-10 max-w-3xl mx-auto">
      {/* Y2K header */}
      <div className="pb-6 mb-6">
        <div className="eyebrow mb-3" style={{ color: "hsl(180 80% 65%)" }}>▸ VIDEO STUDIO · AI GENERATION</div>
        <h1 className="text-4xl md:text-5xl aurora-text" style={{ lineHeight: 1 }}>VIDEO STUDIO</h1>
        <p className="text-sm mt-3" style={{ color: "hsl(280 20% 70%)" }}>
          Generate cinematic video clips with Kling AI or Seedance. Text prompt → ready-to-post video.
        </p>
        <div className="rule mt-4" />
      </div>

      {/* No providers configured */}
      {noneOk && (
        <div className="rounded-2xl border p-5 mb-6 flex items-start gap-3" style={{ background: "hsl(43 100% 55% / 0.07)", borderColor: "hsl(43 100% 55% / 0.35)" }}>
          <AlertCircle size={18} className="flex-shrink-0 mt-0.5" style={{ color: "hsl(43 100% 65%)" }} />
          <div>
            <div className="text-sm font-semibold mb-1" style={{ color: "hsl(43 100% 75%)" }}>Video providers not configured</div>
            <p className="text-xs leading-relaxed" style={{ color: "hsl(280 15% 65%)" }}>
              Go to <a href="/settings" className="underline" style={{ color: "hsl(180 100% 65%)" }}>Settings → Video Generation</a> and add your Kling API Key + Secret, or your fal.ai API Key for Seedance.
            </p>
          </div>
        </div>
      )}

      {/* Provider selector */}
      <div className="flex gap-2 mb-5">
        {[
          { id: "kling", label: "Kling AI", emoji: "🎬", ok: klingOk, desc: "Cinematic quality, 5–10s clips" },
          { id: "seedance", label: "Seedance", emoji: "🌊", ok: seedanceOk, desc: "ByteDance model via fal.ai" },
        ].map(p => (
          <button key={p.id} onClick={() => setProvider(p.id as any)} disabled={!p.ok}
            className="flex-1 rounded-2xl border p-3 text-left transition-all disabled:opacity-35 disabled:cursor-not-allowed"
            style={provider === p.id
              ? { background: "hsl(320 100% 62% / 0.12)", borderColor: "hsl(320 100% 62% / 0.5)" }
              : { background: "hsl(280 40% 9%)", borderColor: "hsl(280 50% 22% / 0.4)" }}>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{p.emoji}</span>
              <span className="text-sm font-bold" style={{ color: provider === p.id ? "hsl(320 100% 80%)" : "hsl(280 20% 88%)" }}>{p.label}</span>
              {p.ok
                ? <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold ml-auto" style={{ background: "hsl(142 71% 45% / 0.15)", color: "hsl(142 71% 60%)", border: "1px solid hsl(142 71% 45% / 0.3)" }}>ready</span>
                : <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold ml-auto" style={{ background: "hsl(280 30% 18%)", color: "hsl(280 15% 50%)", border: "1px solid hsl(280 50% 22% / 0.4)" }}>setup needed</span>
              }
            </div>
            <div className="text-[11px]" style={{ color: "hsl(280 15% 55%)" }}>{p.desc}</div>
          </button>
        ))}
      </div>

      {/* Prompt area */}
      <div className="rounded-2xl border glass p-5 space-y-4 mb-5" style={{ borderColor: "hsl(280 60% 28% / 0.4)" }}>
        <div>
          <label className="text-[10px] font-bold tracking-widest block mb-2" style={{ color: "hsl(280 15% 50%)" }}>VIDEO PROMPT</label>
          <textarea value={prompt} onChange={e => setPrompt(e.target.value)} rows={3}
            placeholder="Describe the video you want to generate — be specific about lighting, mood, camera style, and setting..."
            className="w-full rounded-2xl px-4 py-3 text-sm outline-none resize-none leading-relaxed"
            style={{ background: "hsl(280 40% 9%)", border: "1px solid hsl(280 50% 25% / 0.6)", color: "hsl(280 20% 90%)" }} />
          {/* Prompt starters */}
          <div className="mt-2 flex gap-1.5 flex-wrap">
            {PROMPT_STARTERS.map((s, i) => (
              <button key={i} onClick={() => setPrompt(s)}
                className="text-[10px] px-2 py-1 rounded-lg truncate max-w-[180px] transition-all"
                style={{ background: "hsl(280 40% 11%)", border: "1px solid hsl(280 50% 22% / 0.4)", color: "hsl(280 15% 55%)" }}>
                {s.slice(0, 30)}…
              </button>
            ))}
          </div>
        </div>

        {/* Settings row */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-[10px] font-bold tracking-widest block mb-2" style={{ color: "hsl(280 15% 50%)" }}>ASPECT RATIO</label>
            <div className="flex gap-1.5">
              {ASPECT_RATIOS.map(a => (
                <button key={a.id} onClick={() => setAspectRatio(a.id)}
                  className="flex-1 py-2 rounded-xl text-[10px] font-bold transition-all"
                  style={aspectRatio === a.id
                    ? { background: "hsl(270 100% 65% / 0.2)", color: "hsl(270 100% 80%)", border: "1px solid hsl(270 100% 65% / 0.5)" }
                    : { background: "hsl(280 40% 10%)", color: "hsl(280 15% 55%)", border: "1px solid hsl(280 50% 20% / 0.4)" }}>
                  {a.id}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold tracking-widest block mb-2" style={{ color: "hsl(280 15% 50%)" }}>DURATION</label>
            <div className="flex gap-1.5">
              {(provider === "kling" ? DURATIONS_KLING : DURATIONS_SEEDANCE).map(d => (
                <button key={d} onClick={() => setDuration(d)}
                  className="flex-1 py-2 rounded-xl text-xs font-bold transition-all"
                  style={duration === d
                    ? { background: "hsl(199 89% 55% / 0.2)", color: "hsl(199 89% 75%)", border: "1px solid hsl(199 89% 55% / 0.5)" }
                    : { background: "hsl(280 40% 10%)", color: "hsl(280 15% 55%)", border: "1px solid hsl(280 50% 20% / 0.4)" }}>
                  {d}s
                </button>
              ))}
            </div>
          </div>

          {provider === "kling" && (
            <div>
              <label className="text-[10px] font-bold tracking-widest block mb-2" style={{ color: "hsl(280 15% 50%)" }}>QUALITY MODE</label>
              <div className="flex gap-1.5">
                {[["std","Standard"],["pro","Pro"]].map(([k,l]) => (
                  <button key={k} onClick={() => setMode(k)}
                    className="flex-1 py-2 rounded-xl text-[10px] font-bold transition-all"
                    style={mode === k
                      ? { background: "hsl(142 71% 45% / 0.2)", color: "hsl(142 71% 70%)", border: "1px solid hsl(142 71% 45% / 0.5)" }
                      : { background: "hsl(280 40% 10%)", color: "hsl(280 15% 55%)", border: "1px solid hsl(280 50% 20% / 0.4)" }}>
                    {l}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <button onClick={generate}
          disabled={!prompt.trim() || job.status === "submitting" || job.status === "processing" || noneOk}
          className="w-full py-3.5 rounded-2xl text-sm font-black text-white flex items-center justify-center gap-2.5 disabled:opacity-40 transition-all hover:scale-[1.01] glow-pink"
          style={{ background: "linear-gradient(135deg, hsl(270 100% 55%) 0%, hsl(320 100% 60%) 50%, hsl(0 72% 58%) 100%)", border: "1px solid hsl(320 100% 80% / 0.3)", letterSpacing: "0.05em" }}>
          {job.status === "submitting" || job.status === "processing"
            ? <><Loader2 size={16} className="animate-spin" /> Generating…</>
            : <><Film size={16} /> GENERATE VIDEO</>}
        </button>
      </div>

      {/* Job status */}
      {job.status === "processing" && (
        <div className="rounded-2xl border p-6 text-center mb-5 glass" style={{ borderColor: "hsl(270 100% 65% / 0.4)" }}>
          <div className="relative mx-auto mb-4" style={{ width: 64, height: 64 }}>
            <div className="absolute inset-0 rounded-full animate-ping" style={{ background: "hsl(270 100% 65% / 0.2)" }} />
            <div className="relative w-full h-full rounded-full flex items-center justify-center" style={{ background: "hsl(270 100% 65% / 0.15)", border: "2px solid hsl(270 100% 65% / 0.5)" }}>
              <Clock size={24} style={{ color: "hsl(270 100% 75%)" }} />
            </div>
          </div>
          <div className="text-sm font-bold mb-1" style={{ color: "hsl(270 100% 80%)" }}>Generating your video…</div>
          <div className="text-xs" style={{ color: "hsl(280 15% 55%)" }}>
            {provider === "kling" ? "Kling typically takes 2–4 minutes" : "Seedance typically takes 1–3 minutes"}
          </div>
          <div className="text-[10px] mt-2 font-mono" style={{ color: "hsl(280 15% 40%)" }}>Task: {job.taskId}</div>
        </div>
      )}

      {job.status === "failed" && (
        <div className="rounded-2xl border p-4 mb-5 flex items-start gap-3" style={{ background: "hsl(0 72% 45% / 0.1)", borderColor: "hsl(0 72% 45% / 0.4)" }}>
          <AlertCircle size={16} className="flex-shrink-0 mt-0.5" style={{ color: "hsl(0 72% 65%)" }} />
          <div className="flex-1">
            <div className="text-xs font-semibold mb-1" style={{ color: "hsl(0 72% 70%)" }}>Generation failed</div>
            <p className="text-xs" style={{ color: "hsl(280 15% 65%)" }}>{job.error}</p>
          </div>
          <button onClick={() => setJob({ status: "idle" })} className="flex-shrink-0 text-xs px-2 py-1 rounded-lg"
            style={{ background: "hsl(280 40% 12%)", color: "hsl(280 15% 60%)", border: "1px solid hsl(280 50% 22% / 0.4)" }}>
            <RefreshCw size={11} />
          </button>
        </div>
      )}

      {job.status === "completed" && job.videoUrl && (
        <div className="rounded-2xl border overflow-hidden glass" style={{ borderColor: "hsl(142 71% 45% / 0.4)" }}>
          <div className="flex items-center justify-between px-4 py-3" style={{ background: "hsl(142 71% 45% / 0.08)", borderBottom: "1px solid hsl(142 71% 45% / 0.2)" }}>
            <div className="flex items-center gap-2 text-xs font-bold" style={{ color: "hsl(142 71% 65%)" }}>
              <CheckCircle2 size={14} /> Video Ready
            </div>
            <div className="flex items-center gap-2">
              <a href={job.videoUrl} download target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                style={{ background: "hsl(142 71% 45% / 0.15)", color: "hsl(142 71% 70%)", border: "1px solid hsl(142 71% 45% / 0.35)" }}>
                <Download size={12} /> Download
              </a>
              <button onClick={() => setJob({ status: "idle" })}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold"
                style={{ background: "hsl(280 40% 12%)", color: "hsl(280 15% 60%)", border: "1px solid hsl(280 50% 22% / 0.4)" }}>
                <RefreshCw size={11} /> New
              </button>
            </div>
          </div>
          <div className="bg-black flex items-center justify-center" style={{ minHeight: 320 }}>
            <video src={job.videoUrl} controls autoPlay loop playsInline
              poster={job.coverUrl}
              className="max-w-full max-h-[480px]"
              style={{ aspectRatio: aspectRatio.replace(":", "/") }}>
              Your browser doesn't support video.
            </video>
          </div>
        </div>
      )}

      {/* How-to section */}
      {job.status === "idle" && (
        <div className="rounded-2xl border p-5 glass mt-2" style={{ borderColor: "hsl(280 60% 28% / 0.4)" }}>
          <div className="text-sm font-bold mb-4" style={{ color: "hsl(280 20% 90%)" }}>🎥 Prompt tips for music artists</div>
          <div className="space-y-2.5">
            {[
              ["Be specific about lighting", "\"moody purple neon, backlit, fog machine\" beats \"cool lighting\""],
              ["Set the camera style", "\"slow zoom in\", \"handheld tracking shot\", \"wide establishing shot\""],
              ["Name the emotion/energy", "\"triumphant\", \"contemplative\", \"high-energy\" guides the AI's choices"],
              ["Add technical quality tags", "\"4K cinematic\", \"film grain\", \"sharp focus\" all improve results"],
              ["Avoid text/faces for loops", "Abstract and environment shots loop better than talking heads"],
            ].map(([tip, ex], i) => (
              <div key={i} className="flex gap-2.5">
                <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0 mt-0.5"
                  style={{ background: "hsl(270 100% 65% / 0.15)", color: "hsl(270 100% 75%)" }}>{i + 1}</div>
                <div className="text-xs">
                  <span className="font-semibold" style={{ color: "hsl(280 20% 88%)" }}>{tip} — </span>
                  <span style={{ color: "hsl(280 15% 58%)" }}>{ex}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
