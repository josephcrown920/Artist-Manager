import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Zap, RotateCcw, Check, X, Loader2, Clock, History } from "lucide-react";

interface QueueItem {
  id: number; tweetId: string; tweetText: string; tweetAuthor: string;
  generatedReply: string; status: string; createdAt: string;
}

export default function Engagement() {
  const [tab, setTab] = useState<"queue" | "history">("queue");
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

  const queue: QueueItem[] = queueData?.queue || [];
  const history: QueueItem[] = histData?.history || [];

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-5">
      <div>
        <h1 className="text-xl font-bold text-white">Engagement Engine</h1>
        <p className="text-sm mt-0.5" style={{ color: "hsl(240 5% 50%)" }}>Find tweets, generate replies, grow your audience</p>
      </div>

      {/* Autopilot card */}
      <div className="rounded-xl border p-5" style={{ background: "hsl(240 8% 7%)", borderColor: "hsl(240 5% 16%)" }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "hsl(38 92% 50% / 0.15)" }}>
              <Zap size={20} style={{ color: "hsl(38 92% 55%)" }} />
            </div>
            <div>
              <div className="font-semibold text-sm text-white">Autopilot Mode</div>
              <div className="text-xs mt-0.5" style={{ color: "hsl(240 5% 45%)" }}>
                {autopilot?.enabled ? `Runs every 30 min · Next: ${autopilot.nextRun || "soon"}` : "Manually generate & post"}
              </div>
            </div>
          </div>
          <button onClick={() => toggleAutopilot.mutate()} disabled={toggleAutopilot.isPending || apLoading}
            className="px-4 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
            style={autopilot?.enabled
              ? { background: "hsl(142 71% 45% / 0.15)", color: "hsl(142 71% 60%)", border: "1px solid hsl(142 71% 45% / 0.3)" }
              : { background: "hsl(240 6% 13%)", color: "hsl(240 5% 60%)", border: "1px solid hsl(240 5% 20%)" }}>
            {autopilot?.enabled ? "● ON" : "○ OFF"}
          </button>
        </div>
      </div>

      {/* Generate */}
      <div className="rounded-xl border p-5 space-y-3" style={{ background: "hsl(240 8% 7%)", borderColor: "hsl(240 5% 16%)" }}>
        <div className="text-sm font-semibold text-white">Generate Engagement Queue</div>
        <div className="flex gap-2">
          <input value={keywords} onChange={e => setKeywords(e.target.value)}
            placeholder="Keywords (e.g. new music, rap, artist...)"
            className="flex-1 rounded-lg px-3 py-2 text-sm outline-none"
            style={{ background: "hsl(240 8% 10%)", border: "1px solid hsl(240 5% 18%)", color: "hsl(0 0% 90%)" }} />
          <select value={genCount} onChange={e => setGenCount(Number(e.target.value))}
            className="rounded-lg px-3 py-2 text-sm outline-none w-20"
            style={{ background: "hsl(240 8% 10%)", border: "1px solid hsl(240 5% 18%)", color: "hsl(0 0% 90%)" }}>
            {[5, 10, 20].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <button onClick={() => generateMut.mutate({ keywords: keywords || undefined, count: genCount })}
          disabled={generateMut.isPending}
          className="w-full py-2.5 rounded-xl text-sm font-medium text-white flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          style={{ background: "hsl(263 70% 58%)" }}>
          {generateMut.isPending ? <><Loader2 size={15} className="animate-spin" /> Generating...</> : <><RotateCcw size={15} /> Generate Queue</>}
        </button>
        {generateMut.isError && <p className="text-xs" style={{ color: "hsl(0 72% 65%)" }}>Error — check Twitter API credentials in Settings</p>}
        {generateMut.isSuccess && generateMut.data?.message && (
          <p className="text-xs" style={{ color: "hsl(142 71% 55%)" }}>{generateMut.data.message}</p>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl" style={{ background: "hsl(240 8% 7%)", border: "1px solid hsl(240 5% 14%)" }}>
        {[["queue", "Pending Queue", queue.length], ["history", "Posted History", history.length]].map(([key, label, count]) => (
          <button key={key as string} onClick={() => setTab(key as any)}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={tab === key ? { background: "hsl(263 70% 58% / 0.15)", color: "hsl(263 70% 75%)" } : { color: "hsl(240 5% 50%)" }}>
            {key === "queue" ? <Clock size={12} /> : <History size={12} />}
            {label} {(count as number) > 0 && <span className="opacity-60">{count}</span>}
          </button>
        ))}
      </div>

      {/* Queue */}
      {tab === "queue" && (
        <div className="space-y-3">
          {qLoading ? (
            <div className="flex justify-center pt-6"><Loader2 size={22} className="animate-spin" style={{ color: "hsl(263 70% 58%)" }} /></div>
          ) : queue.length === 0 ? (
            <div className="text-center py-12" style={{ color: "hsl(240 5% 40%)" }}>
              <Zap size={32} className="mx-auto mb-3 opacity-30" />
              <div className="text-sm">Queue is empty. Generate some tweets above!</div>
            </div>
          ) : queue.map(item => (
            <div key={item.id} className="rounded-xl border p-4 space-y-3" style={{ background: "hsl(240 8% 7%)", borderColor: "hsl(240 5% 16%)" }}>
              <div>
                <div className="text-xs font-semibold mb-1" style={{ color: "hsl(263 70% 65%)" }}>@{item.tweetAuthor}</div>
                <div className="text-sm text-white">{item.tweetText}</div>
              </div>
              <div className="rounded-lg p-3" style={{ background: "hsl(142 71% 45% / 0.08)", border: "1px solid hsl(142 71% 45% / 0.2)" }}>
                <div className="text-xs font-semibold mb-1" style={{ color: "hsl(142 71% 60%)" }}>AI Reply</div>
                <div className="text-sm text-white">{item.generatedReply}</div>
              </div>
              <div className="flex gap-2 justify-end">
                <button onClick={() => skipMut.mutate(item.id)} disabled={skipMut.isPending}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                  style={{ background: "hsl(0 72% 51% / 0.15)", color: "hsl(0 72% 65%)", border: "1px solid hsl(0 72% 51% / 0.25)" }}>
                  <X size={12} /> Skip
                </button>
                <button onClick={() => postMut.mutate(item.id)} disabled={postMut.isPending}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-all"
                  style={{ background: "hsl(142 71% 45%)" }}>
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
            <div className="flex justify-center pt-6"><Loader2 size={22} className="animate-spin" style={{ color: "hsl(263 70% 58%)" }} /></div>
          ) : history.length === 0 ? (
            <div className="text-center py-12" style={{ color: "hsl(240 5% 40%)" }}>
              <History size={32} className="mx-auto mb-3 opacity-30" />
              <div className="text-sm">No engagements posted yet.</div>
            </div>
          ) : history.map(item => (
            <div key={item.id} className="rounded-xl border p-4 space-y-2" style={{ background: "hsl(240 8% 7%)", borderColor: "hsl(240 5% 16%)" }}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold" style={{ color: "hsl(142 71% 60%)" }}>@{item.tweetAuthor}</span>
                <span className="text-xs" style={{ color: "hsl(240 5% 40%)" }}>{new Date(item.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="text-xs" style={{ color: "hsl(240 5% 55%)" }}>{item.tweetText}</div>
              <div className="text-sm text-white border-t pt-2" style={{ borderColor: "hsl(240 5% 14%)" }}>{item.generatedReply}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
