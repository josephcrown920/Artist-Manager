import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Megaphone, Loader2, RefreshCcw, Trash2, ChevronDown, ChevronUp,
  Target, DollarSign, Eye, MousePointerClick, Sparkles, CheckCircle2
} from "lucide-react";

interface AdDraft {
  id: number; platform: string; campaignName: string; objective: string;
  targetAudience: string; adCopy: string; creativeSpecs: string;
  placement: string; estimatedBudget: string; estimatedCpm: string;
  estimatedCpc: string; estimatedReach: string; tips: string;
  status: string; generatedDate: string; createdAt: string;
}

const PLATFORM_STYLES: Record<string, { emoji: string; color: string }> = {
  "Meta": { emoji: "📘", color: "hsl(221 83% 53%)" },
  "Facebook": { emoji: "📘", color: "hsl(221 83% 53%)" },
  "Instagram": { emoji: "📸", color: "hsl(316 70% 55%)" },
  "TikTok": { emoji: "🎵", color: "hsl(0 0% 90%)" },
  "Google": { emoji: "🔍", color: "hsl(38 75% 55%)" },
  "YouTube": { emoji: "▶️", color: "hsl(0 72% 51%)" },
  "Spotify": { emoji: "🎧", color: "hsl(142 71% 45%)" },
  "Audiomack": { emoji: "🎶", color: "hsl(38 75% 60%)" },
  "Boomplay": { emoji: "🔊", color: "hsl(199 89% 48%)" },
  "Retarget": { emoji: "🎯", color: "hsl(18 75% 48%)" },
  "Cross": { emoji: "🌐", color: "hsl(18 75% 48%)" },
};

function getPlatformStyle(platform: string) {
  for (const [key, style] of Object.entries(PLATFORM_STYLES)) {
    if (platform.toLowerCase().includes(key.toLowerCase())) return style;
  }
  return { emoji: "📢", color: "hsl(18 75% 48%)" };
}

const STATUS_OPTIONS = [
  { value: "draft", label: "Draft", color: "hsl(30 5% 55%)" },
  { value: "ready", label: "Ready", color: "hsl(38 75% 60%)" },
  { value: "launched", label: "Launched", color: "hsl(142 71% 55%)" },
  { value: "paused", label: "Paused", color: "hsl(0 72% 60%)" },
  { value: "completed", label: "Completed", color: "hsl(263 70% 60%)" },
];

function CampaignCard({ draft, onStatusChange, onDelete }: {
  draft: AdDraft; onStatusChange: (id: number, status: string) => void; onDelete: (id: number) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const pStyle = getPlatformStyle(draft.platform);

  return (
    <div className="rounded-xl border overflow-hidden transition-all" style={{ background: "hsl(30 9% 8%)", borderColor: "hsl(30 8% 18%)" }}>
      <button className="w-full text-left px-5 py-4 flex items-start gap-3" onClick={() => setExpanded(!expanded)}>
        <span className="text-2xl mt-0.5">{pStyle.emoji}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-white">{draft.campaignName}</span>
            <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: `${pStyle.color}20`, color: pStyle.color }}>{draft.platform}</span>
          </div>
          <div className="text-xs mt-1" style={{ color: "hsl(30 5% 50%)" }}>{draft.objective}</div>
          <div className="flex items-center gap-4 mt-2 flex-wrap">
            <span className="flex items-center gap-1 text-xs" style={{ color: "hsl(142 71% 55%)" }}>
              <Eye size={11} /> {draft.estimatedReach}
            </span>
            <span className="flex items-center gap-1 text-xs" style={{ color: "hsl(38 75% 60%)" }}>
              <DollarSign size={11} /> CPM: {draft.estimatedCpm}
            </span>
            <span className="flex items-center gap-1 text-xs" style={{ color: "hsl(18 75% 58%)" }}>
              <MousePointerClick size={11} /> CPC: {draft.estimatedCpc}
            </span>
          </div>
        </div>
        <div className="flex-shrink-0" style={{ color: "hsl(30 5% 48%)" }}>
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>

      {expanded && (
        <div className="px-5 pb-5 border-t space-y-4" style={{ borderColor: "hsl(30 8% 15%)" }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-4">
            <DetailBlock icon={Target} label="Target Audience" text={draft.targetAudience} color="hsl(18 75% 58%)" />
            <DetailBlock icon={DollarSign} label="Budget" text={draft.estimatedBudget} color="hsl(38 75% 60%)" />
          </div>

          <DetailBlock icon={Megaphone} label="Ad Copy (Ready to Use)" text={draft.adCopy} color="hsl(142 71% 55%)" highlight />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <DetailBlock icon={Eye} label="Creative Specs (Add Your Assets)" text={draft.creativeSpecs} color="hsl(199 89% 55%)" />
            <DetailBlock icon={Target} label="Placement" text={draft.placement} color="hsl(316 70% 60%)" />
          </div>

          <DetailBlock icon={Sparkles} label="Optimization Tips" text={draft.tips} color="hsl(38 75% 60%)" />

          <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: "hsl(30 8% 15%)" }}>
            <div className="flex items-center gap-2">
              <span className="text-xs" style={{ color: "hsl(30 5% 48%)" }}>Status:</span>
              <select value={draft.status} onChange={e => onStatusChange(draft.id, e.target.value)}
                className="text-xs rounded-lg px-2 py-1 outline-none cursor-pointer"
                style={{ background: "hsl(30 8% 12%)", border: "1px solid hsl(30 8% 20%)", color: "hsl(0 0% 80%)" }}>
                {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <button onClick={() => onDelete(draft.id)} className="flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors"
              style={{ color: "hsl(0 72% 60%)" }}>
              <Trash2 size={12} /> Remove
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailBlock({ icon: Icon, label, text, color, highlight }: {
  icon: React.ElementType; label: string; text: string; color: string; highlight?: boolean;
}) {
  return (
    <div className="rounded-lg p-3" style={highlight
      ? { background: `${color}10`, border: `1px solid ${color}30` }
      : { background: "hsl(30 9% 10%)" }}>
      <div className="flex items-center gap-1.5 mb-1.5">
        <Icon size={12} style={{ color }} />
        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color }}>{label}</span>
      </div>
      <div className="text-sm text-white leading-relaxed" style={{ whiteSpace: "pre-wrap" }}>{text}</div>
    </div>
  );
}

export default function AdCampaigns() {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["ad-drafts"],
    queryFn: () => fetch("/api/ad-drafts").then(r => r.json()).then(d => d.drafts ?? []),
  });

  const generateMut = useMutation({
    mutationFn: () => fetch("/api/ad-drafts/generate", { method: "POST" }).then(r => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ad-drafts"] }),
  });

  const statusMut = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      fetch(`/api/ad-drafts/${id}/status`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) }).then(r => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ad-drafts"] }),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => fetch(`/api/ad-drafts/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ad-drafts"] }),
  });

  const drafts: AdDraft[] = data || [];
  const today = new Date().toISOString().split("T")[0];
  const todayDrafts = drafts.filter(d => d.generatedDate === today);
  const olderDrafts = drafts.filter(d => d.generatedDate !== today);

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-5">
      <div>
        <h1 className="text-xl font-bold text-white">Ad Campaign Drafts</h1>
        <p className="text-sm mt-0.5" style={{ color: "hsl(30 5% 55%)" }}>
          AI-generated campaigns optimized for maximum reach at lowest CPM/CPC — just add your creatives
        </p>
      </div>

      {/* Generate */}
      <div className="rounded-xl border p-5" style={{ background: "hsl(30 9% 8%)", borderColor: "hsl(18 75% 48% / 0.3)" }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "hsl(18 75% 48% / 0.15)" }}>
              <Megaphone size={20} style={{ color: "hsl(18 75% 58%)" }} />
            </div>
            <div>
              <div className="font-semibold text-sm text-white">Generate Today's Campaigns</div>
              <div className="text-xs" style={{ color: "hsl(30 5% 50%)" }}>
                Creates 6 optimized campaigns across Meta, TikTok, Google, YouTube, Spotify & retargeting
              </div>
            </div>
          </div>
          {todayDrafts.length > 0 && (
            <span className="flex items-center gap-1 text-xs" style={{ color: "hsl(142 71% 55%)" }}>
              <CheckCircle2 size={12} /> {todayDrafts.length} today
            </span>
          )}
        </div>
        <button onClick={() => generateMut.mutate()} disabled={generateMut.isPending}
          className="w-full py-2.5 rounded-xl text-sm font-medium text-white flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          style={{ background: "hsl(18 75% 48%)" }}>
          {generateMut.isPending
            ? <><Loader2 size={15} className="animate-spin" /> Generating campaigns (this may take 30s)...</>
            : <><RefreshCcw size={15} /> Generate Ad Drafts</>}
        </button>
        {generateMut.isError && (
          <p className="text-xs mt-2" style={{ color: "hsl(0 72% 65%)" }}>
            Error generating drafts — {(generateMut.error as any)?.message || "check xAI credits"}
          </p>
        )}
        {generateMut.isSuccess && (
          <p className="text-xs mt-2" style={{ color: "hsl(142 71% 55%)" }}>
            {(generateMut.data as any)?.message || "Campaigns generated!"}
          </p>
        )}
      </div>

      {/* How it works */}
      <div className="rounded-xl border p-4" style={{ background: "hsl(38 75% 55% / 0.06)", borderColor: "hsl(38 75% 55% / 0.2)" }}>
        <div className="text-xs font-semibold mb-2" style={{ color: "hsl(38 92% 60%)" }}>HOW IT WORKS</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { step: "1", title: "Generate Drafts", desc: "AI creates campaign blueprints across all platforms" },
            { step: "2", title: "Add Your Creatives", desc: "Upload your video/image assets following the specs" },
            { step: "3", title: "Launch", desc: "Copy the targeting, copy & budget into your ad platform" },
          ].map(s => (
            <div key={s.step} className="flex items-start gap-2">
              <span className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: "hsl(38 75% 55% / 0.2)", color: "hsl(38 92% 60%)" }}>{s.step}</span>
              <div>
                <div className="text-xs font-semibold text-white">{s.title}</div>
                <div className="text-xs" style={{ color: "hsl(30 5% 55%)" }}>{s.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Campaign list */}
      {isLoading ? (
        <div className="flex justify-center pt-10"><Loader2 size={22} className="animate-spin" style={{ color: "hsl(18 75% 48%)" }} /></div>
      ) : drafts.length === 0 ? (
        <div className="text-center py-16" style={{ color: "hsl(30 5% 48%)" }}>
          <Megaphone size={36} className="mx-auto mb-3 opacity-30" />
          <div className="text-sm mb-1">No campaign drafts yet</div>
          <div className="text-xs">Hit "Generate Ad Drafts" above to create your first batch</div>
        </div>
      ) : (
        <>
          {todayDrafts.length > 0 && (
            <div>
              <div className="text-xs font-semibold mb-3 uppercase tracking-wider" style={{ color: "hsl(18 75% 58%)" }}>
                Today's Campaigns ({todayDrafts.length})
              </div>
              <div className="space-y-3">
                {todayDrafts.map(d => (
                  <CampaignCard key={d.id} draft={d}
                    onStatusChange={(id, status) => statusMut.mutate({ id, status })}
                    onDelete={id => deleteMut.mutate(id)} />
                ))}
              </div>
            </div>
          )}
          {olderDrafts.length > 0 && (
            <div>
              <div className="text-xs font-semibold mb-3 uppercase tracking-wider" style={{ color: "hsl(30 5% 50%)" }}>
                Previous Campaigns ({olderDrafts.length})
              </div>
              <div className="space-y-3">
                {olderDrafts.map(d => (
                  <CampaignCard key={d.id} draft={d}
                    onStatusChange={(id, status) => statusMut.mutate({ id, status })}
                    onDelete={id => deleteMut.mutate(id)} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
