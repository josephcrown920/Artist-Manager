import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Zap, RotateCcw, Check, X, Loader2, Clock, History } from "lucide-react";

interface QueueItem {
  id: number; tweetId: string; tweetText: string; tweetAuthor: string;
  generatedReply: string; status: string; createdAt: string;
}

export default function Engagement() {
  const [tab, setTab]         = useState<"queue" | "history">("queue");
  const [keywords, setKeywords] = useState("");
  const [genCount, setGenCount] = useState(10);
  const qc = useQueryClient();

  const { data: autopilot, isLoading: apLoading } = useQuery({
    queryKey: ["autopilot"],
    queryFn: () => fetch("/api/engagement/autopilot/status").then(r => r.json()).catch(() => ({ enabled: false })),
  });

  const { data: queueData, isLoading: qLoading } = useQuery({
    queryKey: ["engagement-queue"],
    queryFn: () => fetch("/api/engagement/queue").then(r => r.json()).catch(() => ({ queue: [] })),
    refetchInterval: 10_000,
  });

  const { data: histData, isLoading: hLoading } = useQuery({
    queryKey: ["engagement-history"],
    queryFn: () => fetch("/api/engagement/history").then(r => r.json()).catch(() => ({ history: [] })),
    enabled: tab === "history",
  });

  const toggleAutopilot = useMutation({
    mutationFn: () => fetch("/api/engagement/autopilot", { method: "POST" }).then(r => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["autopilot"] }),
  });

  const generateMut = useMutation({
    mutationFn: (body: any) => fetch("/api/engagement/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then(r => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["engagement-queue"] }),
  });

  const postMut = useMutation({
    mutationFn: (id: number) => fetch(`/api/engagement/queue/${id}/post`, { method: "POST" }).then(r => r.json()),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["engagement-queue"] }); qc.invalidateQueries({ queryKey: ["engagement-history"] }); },
  });

  const skipMut = useMutation({
    mutationFn: (id: number) => fetch(`/api/engagement/queue/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["engagement-queue"] }),
  });

  const queue:   QueueItem[] = queueData?.queue   || [];
  const history: QueueItem[] = histData?.history  || [];

  return (
    <div className="p-6 md:p-10 max-w-3xl mx-auto space-y-6">
      {/* Y2K header */}
      <div className="pb-4">
        <div className="eyebrow mb-3" style={{ color: "hsl(180 80% 65%)" }}>▸ ENGAGEMENT ENGINE · ONLINE</div>
        <h1 className="text-4xl md:text-5xl aurora-text" style={{ lineHeight: 1 }}>ENGAGEMENT</h1>
        <p className="text-sm mt-3" style={{ color: "hsl(280 20% 70%)" }}>
          Find tweets, drop AI replies, grow your audience on autopilot.
        </p>
        <div className="rule mt-4" />
      </div>

      {/* Autopilot card */}
      <div className="rounded-2xl border p-5 glass" style={{ borderColor: "hsl(280 60% 30% / 0.4)" }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, hsl(180 100% 60% / 0.2) 0%, hsl(320 100% 62% / 0.15) 100%)" }}>
              <Zap size={20} style={{ color: "hsl(180 100% 65%)" }} />
            </div>
            <div>
              <div className="font-semibold text-sm" style={{ color: "hsl(280 25% 92%)" }}>Autopilot Mode</div>
              <div className="text-xs mt-0.5" style={{ color: "hsl(280 15% 60%)" }}>
                {autopilot?.enabled ? `Runs every 30 min · Next: ${autopilot.nextRun || "soon"}` : "Manually generate & post"}
              </div>
            </div>
          </div>
          <button onClick={() => toggleAutopilot.mutate()} disabled={toggleAutopilot.isPending || apLoading}
            className="px-4 py-2 rounded-2xl text-sm font-semibold transition-all disabled:opacity-50"
            style={autopilot?.enabled
              ? { background: "hsl(142 71% 45% / 0.15)", color: "hsl(142 71% 65%)", border: "1px solid hsl(142 71% 45% / 0.35)" }
              : { background: "hsl(280 40% 14%)", color: "hsl(280 15% 65%)", border: "1px solid hsl(280 50% 25% / 0.4)" }}>
            {autopilot?.enabled ? "● ON" : "○ OFF"}
          </button>
        </div>
      </div>

      {/* Generate */}
      <div className="rounded-2xl border p-5 space-y-3 glass" style={{ borderColor: "hsl(280 60% 30% / 0.4)" }}>
        <div className="text-sm font-semibold" style={{ color: "hsl(280 25% 92%)" }}>Generate Engagement Queue</div>
        <div className="flex gap-2">
          <input value={keywords} onChange={e => setKeywords(e.target.value)}
            placeholder="Keywords (e.g. new music, rap, artist...)"
            className="flex-1 rounded-xl px-3 py-2.5 text-sm outline-none"
            style={{ background: "hsl(280 40% 10% / 0.7)", border: "1px solid hsl(280 60% 35% / 0.5)", color: "hsl(280 25% 92%)" }} />
          <select value={genCount} onChange={e => setGenCount(Number(e.target.value))}
            className="rounded-xl px-3 py-2 text-sm outline-none w-20"
            style={{ background: "hsl(280 40% 10% / 0.7)", border: "1px solid hsl(280 60% 35% / 0.5)", color: "hsl(280 25% 92%)" }}>
            {[5, 10, 20].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <button onClick={() => generateMut.mutate({ keywords: keywords || undefined, count: genCount })}
          disabled={generateMut.isPending}
          className="w-full py-2.5 rounded-2xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all hover:scale-[1.01] disabled:opacity-50 glow-pink"
          style={{ background: "linear-gradient(135deg, hsl(320 100% 62%) 0%, hsl(270 100% 65%) 100%)", border: "1px solid hsl(280 100% 80% / 0.4)" }}>
          {generateMut.isPending ? <><Loader2 size={15} className="animate-spin" /> Generating...</> : <><RotateCcw size={15} /> Generate Queue</>}
        </button>
        {generateMut.isError && <p className="text-xs" style={{ color: "hsl(0 72% 65%)" }}>Error — check Twitter API credentials in Settings</p>}
        {generateMut.isSuccess && generateMut.data?.message && (
          <p className="text-xs" style={{ color: "hsl(142 71% 60%)" }}>{generateMut.data.message}</p>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-2xl" style={{ background: "hsl(280 40% 9%)", border: "1px solid hsl(280 50% 22% / 0.5)" }}>
        {[["queue", "Pending Queue", queue.length], ["history", "Posted History", history.length]].map(([key, label, count]) => (
          <button key={key as string} onClick={() => setTab(key as any)}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all"
            style={tab === key
              ? { background: "linear-gradient(135deg, hsl(320 100% 62% / 0.2) 0%, hsl(270 100% 65% / 0.15) 100%)", color: "hsl(320 100% 80%)", border: "1px solid hsl(320 100% 62% / 0.35)" }
              : { color: "hsl(280 15% 60%)", border: "1px solid transparent" }}>
            {key === "queue" ? <Clock size={12} /> : <History size={12} />}
            {label} {(count as number) > 0 && <span className="opacity-50 ml-0.5">{count}</span>}
          </button>
        ))}
      </div>

      {/* Queue */}
      {tab === "queue" && (
        <div className="space-y-3">
          {qLoading ? (
            <div className="flex justify-center pt-6"><Loader2 size={22} className="animate-spin" style={{ color: "hsl(320 100% 62%)" }} /></div>
          ) : queue.length === 0 ? (
            <div className="text-center py-12" style={{ color: "hsl(280 15% 50%)" }}>
              <Zap size={32} className="mx-auto mb-3 opacity-30" />
              <div className="text-sm">Queue is empty — generate some replies above!</div>
            </div>
          ) : queue.map(item => (
            <div key={item.id} className="rounded-2xl border p-4 space-y-3 glass" style={{ borderColor: "hsl(280 60% 28% / 0.4)" }}>
              <div>
                <div className="text-xs font-semibold mb-1" style={{ color: "hsl(320 100% 72%)" }}>@{item.tweetAuthor}</div>
                <div className="text-sm" style={{ color: "hsl(280 20% 88%)" }}>{item.tweetText}</div>
              </div>
              <div className="rounded-xl p-3" style={{ background: "hsl(142 71% 45% / 0.08)", border: "1px solid hsl(142 71% 45% / 0.2)" }}>
                <div className="text-xs font-semibold mb-1" style={{ color: "hsl(142 71% 65%)" }}>AI Reply</div>
                <div className="text-sm" style={{ color: "hsl(280 20% 90%)" }}>{item.generatedReply}</div>
              </div>
              <div className="flex gap-2 justify-end">
                <button onClick={() => skipMut.mutate(item.id)} disabled={skipMut.isPending}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
                  style={{ background: "hsl(0 72% 51% / 0.12)", color: "hsl(0 72% 65%)", border: "1px solid hsl(0 72% 51% / 0.25)" }}>
                  <X size={12} /> Skip
                </button>
                <button onClick={() => postMut.mutate(item.id)} disabled={postMut.isPending}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-white transition-all"
                  style={{ background: "hsl(142 71% 40%)" }}>
                  <Check size={12} /> Post
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* History */}
      {tab === "history" && (
        <div className="space-y-3">
          {hLoading ? (
            <div className="flex justify-center pt-6"><Loader2 size={22} className="animate-spin" style={{ color: "hsl(320 100% 62%)" }} /></div>
          ) : history.length === 0 ? (
            <div className="text-center py-12" style={{ color: "hsl(280 15% 50%)" }}>
              <History size={32} className="mx-auto mb-3 opacity-30" />
              <div className="text-sm">No engagements posted yet.</div>
            </div>
          ) : history.map(item => (
            <div key={item.id} className="rounded-2xl border p-4 space-y-2 glass" style={{ borderColor: "hsl(280 60% 28% / 0.4)" }}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold" style={{ color: "hsl(142 71% 65%)" }}>@{item.tweetAuthor}</span>
                <span className="text-xs" style={{ color: "hsl(280 15% 50%)" }}>{new Date(item.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="text-xs" style={{ color: "hsl(280 10% 60%)" }}>{item.tweetText}</div>
              <div className="text-sm border-t pt-2" style={{ color: "hsl(280 20% 88%)", borderColor: "hsl(280 50% 22% / 0.4)" }}>{item.generatedReply}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
