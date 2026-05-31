import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Users, Sparkles, Plus, Trash2, Copy, Check, Loader2, MessageSquare, Instagram, Twitter, Youtube, Music } from "lucide-react";

interface Creator {
  id: number; name: string; platform: string; handle?: string; niche: string;
  followers?: number; contactMethod?: string; contactValue?: string;
  status: string; pitchDraft?: string; notes?: string; createdAt: string;
}

const PLATFORM_META: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  instagram: { label: "Instagram", color: "hsl(320 100% 68%)", icon: Instagram },
  tiktok:    { label: "TikTok",    color: "hsl(180 100% 60%)", icon: Music    },
  youtube:   { label: "YouTube",   color: "hsl(0 72% 60%)",    icon: Youtube  },
  twitter:   { label: "Twitter/X", color: "hsl(199 89% 55%)",  icon: Twitter  },
};

const STATUS_STEPS = ["discovered", "contacted", "replied", "negotiating", "signed", "passed"];
const STATUS_COLORS: Record<string, string> = {
  discovered: "hsl(280 30% 60%)", contacted: "hsl(199 89% 60%)", replied: "hsl(43 100% 65%)",
  negotiating: "hsl(320 100% 65%)", signed: "hsl(142 71% 55%)", passed: "hsl(0 0% 40%)",
};

function CreatorCard({ creator, onDelete, onPitch, onStatusChange }: {
  creator: Creator; onDelete: () => void; onPitch: () => void; onStatusChange: (s: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const meta = PLATFORM_META[creator.platform] || { label: creator.platform, color: "hsl(280 30% 60%)", icon: Users };
  const Icon = meta.icon;

  const copy = (text: string) => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  return (
    <div className="rounded-2xl border overflow-hidden glass" style={{ borderColor: "hsl(280 60% 28% / 0.4)" }}>
      <div className="p-4 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: `${meta.color.replace(")", " / 0.15)")}` }}>
            <Icon size={18} style={{ color: meta.color }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold" style={{ color: "hsl(280 20% 95%)" }}>{creator.name}</span>
              {creator.handle && <span className="text-xs" style={{ color: meta.color }}>{creator.handle}</span>}
              <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{ background: `${STATUS_COLORS[creator.status].replace(")", " / 0.15)")}`, color: STATUS_COLORS[creator.status] }}>
                {creator.status}
              </span>
            </div>
            <div className="flex items-center gap-3 mt-1 text-xs" style={{ color: "hsl(280 15% 60%)" }}>
              <span>{creator.niche}</span>
              {creator.followers && <span>{creator.followers.toLocaleString()} followers</span>}
              {creator.contactValue && <span>{creator.contactMethod}: {creator.contactValue}</span>}
            </div>
          </div>
          <button onClick={e => { e.stopPropagation(); onDelete(); }} className="p-1.5 rounded-xl flex-shrink-0 hover:text-red-400 transition-colors" style={{ color: "hsl(280 15% 50%)" }}>
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t px-4 pb-4 space-y-3" style={{ borderColor: "hsl(280 50% 22% / 0.4)" }}>
          {creator.notes && (
            <p className="text-xs pt-3 leading-relaxed" style={{ color: "hsl(280 15% 65%)" }}>{creator.notes}</p>
          )}

          {/* Status progress */}
          <div className="flex gap-1 flex-wrap pt-1">
            {STATUS_STEPS.map(s => (
              <button key={s} onClick={() => onStatusChange(s)}
                className="text-[10px] px-2 py-1 rounded-lg font-medium transition-all"
                style={creator.status === s
                  ? { background: `${STATUS_COLORS[s].replace(")", " / 0.2)")}`, color: STATUS_COLORS[s], border: `1px solid ${STATUS_COLORS[s].replace(")", " / 0.4)")}` }
                  : { color: "hsl(280 15% 45%)", border: "1px solid hsl(280 50% 20% / 0.3)" }}>
                {s}
              </button>
            ))}
          </div>

          {/* Pitch draft */}
          {creator.pitchDraft ? (
            <div className="rounded-xl p-3 space-y-2" style={{ background: "hsl(142 71% 45% / 0.07)", border: "1px solid hsl(142 71% 45% / 0.2)" }}>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold tracking-widest" style={{ color: "hsl(142 71% 60%)" }}>PITCH DRAFT</span>
                <button onClick={() => copy(creator.pitchDraft!)} className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-lg border transition-colors"
                  style={{ borderColor: "hsl(280 50% 25% / 0.4)", color: copied ? "hsl(142 71% 60%)" : "hsl(280 15% 50%)" }}>
                  {copied ? <Check size={10} /> : <Copy size={10} />} {copied ? "Copied" : "Copy"}
                </button>
              </div>
              <p className="text-xs leading-relaxed whitespace-pre-wrap" style={{ color: "hsl(280 15% 82%)" }}>{creator.pitchDraft}</p>
            </div>
          ) : (
            <button onClick={onPitch}
              className="w-full py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all hover:scale-[1.01]"
              style={{ background: "linear-gradient(135deg, hsl(320 100% 62% / 0.18) 0%, hsl(270 100% 65% / 0.12) 100%)", border: "1px solid hsl(320 100% 62% / 0.35)", color: "hsl(320 100% 80%)" }}>
              <Sparkles size={12} /> Generate AI Pitch
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function CreatorCollab() {
  const qc = useQueryClient();
  const [filterStatus, setFilterStatus] = useState("all");
  const [showAdd, setShowAdd]           = useState(false);
  const [discoverNiche, setDiscoverNiche] = useState("");
  const [discoverPlatform, setDiscoverPlatform] = useState("all");

  const [newForm, setNewForm] = useState({ name: "", platform: "instagram", handle: "", niche: "", followers: "", contactMethod: "dm", contactValue: "" });

  const { data, isLoading } = useQuery({
    queryKey: ["creators"],
    queryFn: () => fetch("/api/creators").then(r => r.json()),
  });

  const discoverMut = useMutation({
    mutationFn: (body: any) => fetch("/api/creators/discover", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then(r => r.json()),
    onSuccess: async (data) => {
      if (data.creators) {
        for (const c of data.creators) {
          await fetch("/api/creators", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(c) });
        }
        qc.invalidateQueries({ queryKey: ["creators"] });
      }
    },
  });

  const addMut = useMutation({
    mutationFn: (body: any) => fetch("/api/creators", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then(r => r.json()),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["creators"] }); setShowAdd(false); setNewForm({ name: "", platform: "instagram", handle: "", niche: "", followers: "", contactMethod: "dm", contactValue: "" }); },
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => fetch(`/api/creators/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["creators"] }),
  });

  const pitchMut = useMutation({
    mutationFn: (id: number) => fetch(`/api/creators/${id}/pitch`, { method: "POST" }).then(r => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["creators"] }),
  });

  const statusMut = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      fetch(`/api/creators/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) }).then(r => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["creators"] }),
  });

  const creators: Creator[] = data?.creators ?? [];
  const filtered = filterStatus === "all" ? creators : creators.filter(c => c.status === filterStatus);

  const statusCounts = STATUS_STEPS.reduce((acc, s) => ({ ...acc, [s]: creators.filter(c => c.status === s).length }), {} as Record<string, number>);

  return (
    <div className="p-6 md:p-10 max-w-3xl mx-auto">
      {/* Y2K header */}
      <div className="pb-6 mb-6">
        <div className="eyebrow mb-3" style={{ color: "hsl(180 80% 65%)" }}>▸ CREATOR NETWORK · ACTIVE</div>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-4xl md:text-5xl aurora-text" style={{ lineHeight: 1 }}>CREATOR COLLAB</h1>
            <p className="text-sm mt-3" style={{ color: "hsl(280 20% 70%)" }}>
              Discover creators, generate AI pitches, track collabs from discovery to signed.
            </p>
          </div>
          <button onClick={() => setShowAdd(!showAdd)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-semibold text-white transition-all hover:scale-[1.03] glow-pink flex-shrink-0"
            style={{ background: "linear-gradient(135deg, hsl(320 100% 62%) 0%, hsl(270 100% 65%) 100%)", border: "1px solid hsl(280 100% 80% / 0.4)" }}>
            <Plus size={15} /> Add Creator
          </button>
        </div>
        <div className="rule mt-4" />
      </div>

      {/* AI Discover */}
      <div className="rounded-2xl border p-5 mb-6 glass" style={{ borderColor: "hsl(280 60% 28% / 0.4)" }}>
        <div className="text-sm font-semibold mb-3" style={{ color: "hsl(280 20% 92%)" }}>⚡ AI Creator Discovery</div>
        <div className="flex gap-2">
          <input value={discoverNiche} onChange={e => setDiscoverNiche(e.target.value)}
            placeholder="Niche (e.g. hip-hop battles, rap reaction, music review...)"
            className="flex-1 rounded-xl px-3 py-2.5 text-sm outline-none"
            style={{ background: "hsl(280 40% 10% / 0.7)", border: "1px solid hsl(280 60% 35% / 0.5)", color: "hsl(280 25% 92%)" }} />
          <select value={discoverPlatform} onChange={e => setDiscoverPlatform(e.target.value)}
            className="rounded-xl px-3 py-2 text-sm outline-none w-28"
            style={{ background: "hsl(280 40% 10% / 0.7)", border: "1px solid hsl(280 60% 35% / 0.5)", color: "hsl(280 25% 92%)" }}>
            <option value="all">All</option>
            <option value="tiktok">TikTok</option>
            <option value="instagram">Instagram</option>
            <option value="youtube">YouTube</option>
            <option value="twitter">Twitter</option>
          </select>
          <button onClick={() => discoverMut.mutate({ niche: discoverNiche || "hip-hop music", platform: discoverPlatform, count: 5 })}
            disabled={discoverMut.isPending}
            className="px-4 py-2.5 rounded-2xl text-sm font-semibold text-white flex items-center gap-2 disabled:opacity-50 transition-all hover:scale-[1.02]"
            style={{ background: "linear-gradient(135deg, hsl(320 100% 62%) 0%, hsl(270 100% 65%) 100%)" }}>
            {discoverMut.isPending ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
            Discover
          </button>
        </div>
      </div>

      {/* Add creator form */}
      {showAdd && (
        <div className="rounded-2xl border p-4 mb-5 space-y-3 glass" style={{ borderColor: "hsl(320 100% 62% / 0.3)" }}>
          <div className="grid grid-cols-2 gap-3">
            <input value={newForm.name} onChange={e => setNewForm(f => ({ ...f, name: e.target.value }))} placeholder="Creator name"
              className="rounded-xl px-3 py-2.5 text-sm outline-none"
              style={{ background: "hsl(280 40% 10% / 0.7)", border: "1px solid hsl(280 60% 35% / 0.5)", color: "hsl(280 25% 92%)" }} />
            <select value={newForm.platform} onChange={e => setNewForm(f => ({ ...f, platform: e.target.value }))}
              className="rounded-xl px-3 py-2 text-sm outline-none"
              style={{ background: "hsl(280 40% 10% / 0.7)", border: "1px solid hsl(280 60% 35% / 0.5)", color: "hsl(280 25% 92%)" }}>
              {Object.entries(PLATFORM_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input value={newForm.handle} onChange={e => setNewForm(f => ({ ...f, handle: e.target.value }))} placeholder="@handle"
              className="rounded-xl px-3 py-2.5 text-sm outline-none"
              style={{ background: "hsl(280 40% 10% / 0.7)", border: "1px solid hsl(280 60% 35% / 0.5)", color: "hsl(280 25% 92%)" }} />
            <input value={newForm.niche} onChange={e => setNewForm(f => ({ ...f, niche: e.target.value }))} placeholder="Niche"
              className="rounded-xl px-3 py-2.5 text-sm outline-none"
              style={{ background: "hsl(280 40% 10% / 0.7)", border: "1px solid hsl(280 60% 35% / 0.5)", color: "hsl(280 25% 92%)" }} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input value={newForm.followers} onChange={e => setNewForm(f => ({ ...f, followers: e.target.value }))} placeholder="Followers"
              className="rounded-xl px-3 py-2.5 text-sm outline-none"
              style={{ background: "hsl(280 40% 10% / 0.7)", border: "1px solid hsl(280 60% 35% / 0.5)", color: "hsl(280 25% 92%)" }} />
            <input value={newForm.contactValue} onChange={e => setNewForm(f => ({ ...f, contactValue: e.target.value }))} placeholder="Email or contact"
              className="rounded-xl px-3 py-2.5 text-sm outline-none"
              style={{ background: "hsl(280 40% 10% / 0.7)", border: "1px solid hsl(280 60% 35% / 0.5)", color: "hsl(280 25% 92%)" }} />
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowAdd(false)} className="px-3 py-1.5 rounded-xl text-xs" style={{ color: "hsl(280 15% 60%)" }}>Cancel</button>
            <button onClick={() => addMut.mutate({ ...newForm, followers: newForm.followers ? Number(newForm.followers) : undefined })}
              disabled={!newForm.name || !newForm.niche || addMut.isPending}
              className="px-4 py-1.5 rounded-xl text-xs font-semibold text-white disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, hsl(320 100% 62%) 0%, hsl(270 100% 65%) 100%)" }}>
              {addMut.isPending ? "Adding..." : "Add Creator"}
            </button>
          </div>
        </div>
      )}

      {/* Pipeline summary */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-5">
        {STATUS_STEPS.map(s => (
          <button key={s} onClick={() => setFilterStatus(filterStatus === s ? "all" : s)}
            className="rounded-xl p-2.5 text-center transition-all"
            style={filterStatus === s
              ? { background: `${STATUS_COLORS[s].replace(")", " / 0.15)")}`, border: `1px solid ${STATUS_COLORS[s].replace(")", " / 0.4)")}` }
              : { background: "hsl(280 40% 9%)", border: "1px solid hsl(280 50% 22% / 0.4)" }}>
            <div className="text-lg font-black" style={{ color: filterStatus === s ? STATUS_COLORS[s] : "hsl(280 20% 80%)" }}>{statusCounts[s] || 0}</div>
            <div className="text-[10px] capitalize" style={{ color: "hsl(280 15% 55%)" }}>{s}</div>
          </button>
        ))}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex justify-center pt-10"><Loader2 size={22} className="animate-spin" style={{ color: "hsl(320 100% 62%)" }} /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16" style={{ color: "hsl(280 15% 50%)" }}>
          <Users size={32} className="mx-auto mb-3 opacity-30" />
          <div className="text-sm mb-3">No creators yet — use AI Discovery above</div>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(c => (
            <CreatorCard key={c.id} creator={c}
              onDelete={() => deleteMut.mutate(c.id)}
              onPitch={() => pitchMut.mutate(c.id)}
              onStatusChange={status => statusMut.mutate({ id: c.id, status })}
            />
          ))}
        </div>
      )}

      {pitchMut.isPending && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2.5 rounded-2xl glass text-sm"
          style={{ border: "1px solid hsl(280 60% 28% / 0.4)", color: "hsl(280 20% 85%)" }}>
          <Loader2 size={14} className="animate-spin" style={{ color: "hsl(320 100% 62%)" }} />
          Generating AI pitch…
        </div>
      )}
    </div>
  );
}
