import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ListMusic, Search, Loader2, Copy, Trash2, Mail, Instagram,
  Twitter, MessageSquare, ExternalLink, Sparkles, CheckCircle2, Clock, X,
} from "lucide-react";

interface Curator {
  id: number;
  name: string;
  platform: string;
  playlistName: string | null;
  niche: string;
  contactMethod: string;
  contactValue: string;
  followers: number | null;
  notes: string | null;
  createdAt: string;
}
interface Variation { hook: "story" | "sonic" | "culture"; subject: string; body: string }
interface Draft {
  id: number;
  curatorId: number;
  songTitle: string;
  variations: Variation[];
  selectedVariationIdx: number;
  status: "draft" | "sent" | "accepted" | "rejected";
  sentAt: string | null;
  createdAt: string;
}

const PLATFORM_META: Record<string, { label: string; color: string }> = {
  spotify:        { label: "Spotify",         color: "hsl(141 60% 45%)" },
  apple_music:    { label: "Apple Music",     color: "hsl(355 75% 60%)" },
  youtube_music:  { label: "YouTube Music",   color: "hsl(0 75% 55%)" },
  audiomack:      { label: "Audiomack",       color: "hsl(45 95% 55%)" },
  boomplay:       { label: "Boomplay",        color: "hsl(195 90% 50%)" },
  tidal:          { label: "Tidal",           color: "hsl(210 15% 60%)" },
  deezer:         { label: "Deezer",          color: "hsl(280 75% 60%)" },
  amazon_music:   { label: "Amazon Music",    color: "hsl(195 75% 50%)" },
  submithub:      { label: "SubmitHub",       color: "hsl(18 75% 55%)" },
  groover:        { label: "Groover",         color: "hsl(165 65% 50%)" },
  soundplate:     { label: "Soundplate",      color: "hsl(38 75% 60%)" },
  playlistpush:   { label: "PlaylistPush",    color: "hsl(330 70% 60%)" },
  indie:          { label: "Indie",           color: "hsl(30 30% 70%)" },
};

function contactIcon(m: string) {
  if (m === "email") return Mail;
  if (m === "instagram") return Instagram;
  if (m === "twitter") return Twitter;
  if (m === "discord") return MessageSquare;
  return ExternalLink;
}

function copy(text: string, toast: (s: string) => void) {
  navigator.clipboard.writeText(text).then(
    () => toast("Copied to clipboard"),
    () => toast("Copy failed"),
  );
}

export default function PlaylistPitches() {
  const qc = useQueryClient();
  const [songTitle, setSongTitle] = useState("");
  const [pitchingCuratorId, setPitchingCuratorId] = useState<number | null>(null);
  const [filterPlatform, setFilterPlatform] = useState<string>("all");
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const toast = (s: string) => {
    setToastMsg(s);
    setTimeout(() => setToastMsg(null), 2000);
  };

  const { data: curatorsData, isLoading: cLoading } = useQuery({
    queryKey: ["playlist-curators"],
    queryFn: () => fetch("/api/playlists/curators").then((r) => r.json()),
  });
  const { data: draftsData } = useQuery({
    queryKey: ["pitch-drafts"],
    queryFn: () => fetch("/api/playlists/drafts").then((r) => r.json()),
  });

  const curators: Curator[] = curatorsData?.curators ?? [];
  const drafts: Draft[] = draftsData?.drafts ?? [];

  const discoverMut = useMutation({
    mutationFn: async () => {
      const r = await fetch("/api/playlists/discover", { method: "POST" });
      const d = await r.json();
      if (!r.ok) throw new Error(d?.error || "Discovery failed");
      return d;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["playlist-curators"] }),
  });

  const deleteCurator = useMutation({
    mutationFn: async (id: number) => {
      const r = await fetch(`/api/playlists/curators/${id}`, { method: "DELETE" });
      if (!r.ok) throw new Error("Failed to delete curator");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["playlist-curators"] }),
    onError: (e: Error) => toast(`⚠️ ${e.message}`),
  });

  const generatePitch = useMutation({
    mutationFn: async ({ curatorId, songTitle }: { curatorId: number; songTitle: string }) => {
      const r = await fetch("/api/playlists/drafts/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ curatorId, songTitle }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d?.error || "Failed to generate pitch");
      return d;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pitch-drafts"] });
      setPitchingCuratorId(null);
    },
  });

  const selectVariation = useMutation({
    mutationFn: async ({ id, idx }: { id: number; idx: number }) => {
      const r = await fetch(`/api/playlists/drafts/${id}/select`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variationIdx: idx }),
      });
      if (!r.ok) throw new Error("Failed to switch hook");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pitch-drafts"] }),
    onError: (e: Error) => toast(`⚠️ ${e.message}`),
  });

  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const r = await fetch(`/api/playlists/drafts/${id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!r.ok) throw new Error("Failed to update status");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pitch-drafts"] }),
    onError: (e: Error) => toast(`⚠️ ${e.message}`),
  });

  const deleteDraft = useMutation({
    mutationFn: async (id: number) => {
      const r = await fetch(`/api/playlists/drafts/${id}`, { method: "DELETE" });
      if (!r.ok) throw new Error("Failed to delete draft");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pitch-drafts"] }),
    onError: (e: Error) => toast(`⚠️ ${e.message}`),
  });

  const filteredCurators =
    filterPlatform === "all"
      ? curators
      : curators.filter((c) => c.platform === filterPlatform);

  const draftsByCurator = new Map<number, Draft[]>();
  for (const d of drafts) {
    const list = draftsByCurator.get(d.curatorId) || [];
    list.push(d);
    draftsByCurator.set(d.curatorId, list);
  }

  const platformsInUse = Array.from(new Set(curators.map((c) => c.platform)));

  return (
    <div className="px-6 md:px-10 py-8 max-w-6xl mx-auto">
      {/* Editorial header */}
      <div className="mb-8 pb-6 border-b" style={{ borderColor: "hsl(30 8% 18%)" }}>
        <div className="eyebrow mb-3" style={{ color: "hsl(18 70% 60%)" }}>
          Volume 01 · Distribution & Reach
        </div>
        <div className="flex items-start justify-between gap-6 flex-wrap">
          <div>
            <h1 className="text-4xl md:text-5xl mb-3" style={{ color: "hsl(36 12% 95%)", lineHeight: 1.05 }}>
              Playlist Pitching
            </h1>
            <p className="text-base max-w-2xl" style={{ color: "hsl(30 6% 60%)", lineHeight: 1.55 }}>
              Curators discovered across every DSP and submission service. Pitches written with emotional hooks
              that play the listener's ears first — copy, paste, and ship.
            </p>
          </div>
          <button
            onClick={() => discoverMut.mutate()}
            disabled={discoverMut.isPending}
            className="flex items-center gap-2 px-5 py-3 rounded-full text-sm font-medium transition-opacity disabled:opacity-50 flex-shrink-0"
            style={{ background: "hsl(18 75% 48%)", color: "hsl(36 15% 96%)" }}
          >
            {discoverMut.isPending ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />}
            Discover Curators
          </button>
        </div>
      </div>

      {/* Platform filter */}
      {curators.length > 0 && (
        <div className="flex gap-2 mb-6 flex-wrap">
          <button
            onClick={() => setFilterPlatform("all")}
            className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
            style={
              filterPlatform === "all"
                ? { background: "hsl(36 12% 92%)", color: "hsl(30 15% 8%)" }
                : { border: "1px solid hsl(30 8% 22%)", color: "hsl(30 6% 65%)" }
            }
          >
            All ({curators.length})
          </button>
          {platformsInUse.map((p) => {
            const meta = PLATFORM_META[p] || { label: p, color: "hsl(30 30% 70%)" };
            const count = curators.filter((c) => c.platform === p).length;
            return (
              <button
                key={p}
                onClick={() => setFilterPlatform(p)}
                className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                style={
                  filterPlatform === p
                    ? { background: `${meta.color.replace(")", " / 0.18)")}`, color: meta.color, border: `1px solid ${meta.color.replace(")", " / 0.4)")}` }
                    : { border: "1px solid hsl(30 8% 22%)", color: "hsl(30 6% 65%)" }
                }
              >
                {meta.label} ({count})
              </button>
            );
          })}
        </div>
      )}

      {/* Empty state */}
      {!cLoading && curators.length === 0 && !discoverMut.isPending && (
        <div
          className="rounded-2xl border p-12 text-center"
          style={{ borderColor: "hsl(30 8% 18%)", background: "hsl(30 9% 7%)" }}
        >
          <ListMusic size={36} className="mx-auto mb-4" style={{ color: "hsl(18 75% 50%)" }} />
          <h2 className="text-2xl mb-2" style={{ color: "hsl(36 12% 92%)" }}>
            No curators yet
          </h2>
          <p className="text-sm mb-6 max-w-md mx-auto" style={{ color: "hsl(30 6% 60%)" }}>
            Tap <em>Discover Curators</em> and the AI will surface 12 playlist owners across Spotify,
            Apple Music, Audiomack, SubmitHub, Groover, and indie tastemaker channels.
          </p>
          <button
            onClick={() => discoverMut.mutate()}
            disabled={discoverMut.isPending}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-full text-sm font-medium"
            style={{ background: "hsl(18 75% 48%)", color: "hsl(36 15% 96%)" }}
          >
            <Search size={15} /> Discover the first 12
          </button>
        </div>
      )}

      {(cLoading || discoverMut.isPending) && curators.length === 0 && (
        <div className="flex flex-col items-center py-20">
          <Loader2 size={28} className="animate-spin mb-3" style={{ color: "hsl(18 75% 50%)" }} />
          <p className="text-sm" style={{ color: "hsl(30 6% 55%)" }}>
            {discoverMut.isPending ? "AI is scouting curators…" : "Loading…"}
          </p>
        </div>
      )}

      {/* Curator grid */}
      <div className="grid md:grid-cols-2 gap-5">
        {filteredCurators.map((c) => {
          const meta = PLATFORM_META[c.platform] || { label: c.platform, color: "hsl(30 30% 70%)" };
          const Icon = contactIcon(c.contactMethod);
          const myDrafts = draftsByCurator.get(c.id) || [];
          return (
            <div
              key={c.id}
              className="rounded-2xl border overflow-hidden flex flex-col"
              style={{ borderColor: "hsl(30 8% 18%)", background: "hsl(30 9% 8%)" }}
            >
              <div className="p-5 border-b" style={{ borderColor: "hsl(30 8% 16%)" }}>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0">
                    <div className="eyebrow mb-1.5" style={{ color: meta.color }}>
                      {meta.label}
                    </div>
                    <h3 className="text-xl mb-1" style={{ color: "hsl(36 12% 94%)" }}>
                      {c.name}
                    </h3>
                    {c.playlistName && (
                      <div className="text-sm italic" style={{ color: "hsl(30 6% 65%)" }}>
                        “{c.playlistName}”
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => deleteCurator.mutate(c.id)}
                    className="p-1.5 rounded-lg hover:bg-white/5"
                    style={{ color: "hsl(30 5% 45%)" }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>

                <p className="text-sm leading-relaxed mb-3" style={{ color: "hsl(36 8% 75%)" }}>
                  {c.niche}
                </p>

                {c.notes && (
                  <p className="text-xs leading-relaxed mb-3 italic" style={{ color: "hsl(30 5% 58%)" }}>
                    {c.notes}
                  </p>
                )}

                <div className="flex items-center gap-2 flex-wrap">
                  <div
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs"
                    style={{ background: "hsl(30 8% 12%)", color: "hsl(36 8% 80%)" }}
                  >
                    <Icon size={12} />
                    <span className="font-mono">{c.contactValue}</span>
                    <button
                      onClick={() => copy(c.contactValue, toast)}
                      className="ml-1 opacity-60 hover:opacity-100"
                      aria-label="Copy contact"
                    >
                      <Copy size={11} />
                    </button>
                  </div>
                  {c.followers && (
                    <span className="text-xs" style={{ color: "hsl(30 5% 55%)" }}>
                      ~{c.followers.toLocaleString()} reach
                    </span>
                  )}
                </div>
              </div>

              {/* Pitch action */}
              <div className="p-5">
                {pitchingCuratorId === c.id ? (
                  <div className="space-y-2">
                    <input
                      autoFocus
                      type="text"
                      value={songTitle}
                      onChange={(e) => setSongTitle(e.target.value)}
                      placeholder="Song title to pitch…"
                      className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                      style={{
                        background: "hsl(30 8% 11%)",
                        border: "1px solid hsl(30 8% 22%)",
                        color: "hsl(36 12% 92%)",
                      }}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => generatePitch.mutate({ curatorId: c.id, songTitle })}
                        disabled={!songTitle.trim() || generatePitch.isPending}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium disabled:opacity-40"
                        style={{ background: "hsl(18 75% 48%)", color: "hsl(36 15% 96%)" }}
                      >
                        {generatePitch.isPending ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Sparkles size={14} />
                        )}
                        Generate 3 hooks
                      </button>
                      <button
                        onClick={() => setPitchingCuratorId(null)}
                        className="px-3 py-2 rounded-lg text-sm"
                        style={{ background: "hsl(30 8% 12%)", color: "hsl(30 6% 65%)" }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setPitchingCuratorId(c.id);
                      setSongTitle("");
                    }}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors"
                    style={{
                      background: "hsl(30 8% 12%)",
                      border: "1px solid hsl(30 8% 20%)",
                      color: "hsl(36 10% 85%)",
                    }}
                  >
                    <Sparkles size={14} style={{ color: "hsl(38 75% 65%)" }} />
                    Write pitch with emotional hook
                  </button>
                )}

                {/* Existing drafts */}
                {myDrafts.map((d) => (
                  <PitchDraftCard
                    key={d.id}
                    draft={d}
                    onSelect={(idx) => selectVariation.mutate({ id: d.id, idx })}
                    onStatus={(s) => setStatus.mutate({ id: d.id, status: s })}
                    onDelete={() => deleteDraft.mutate(d.id)}
                    onCopy={(text) => copy(text, toast)}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {generatePitch.isError && (
        <div className="mt-4 p-3 rounded-lg text-sm" style={{ background: "hsl(0 50% 12%)", color: "hsl(0 50% 80%)" }}>
          ⚠️ {(generatePitch.error as Error)?.message}
        </div>
      )}
      {discoverMut.isError && (
        <div className="mt-4 p-3 rounded-lg text-sm" style={{ background: "hsl(0 50% 12%)", color: "hsl(0 50% 80%)" }}>
          ⚠️ {(discoverMut.error as Error)?.message}
        </div>
      )}

      {/* Toast */}
      {toastMsg && (
        <div
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-full text-sm shadow-2xl"
          style={{ background: "hsl(36 12% 92%)", color: "hsl(30 15% 8%)" }}
        >
          {toastMsg}
        </div>
      )}
    </div>
  );
}

function PitchDraftCard({
  draft,
  onSelect,
  onStatus,
  onDelete,
  onCopy,
}: {
  draft: Draft;
  onSelect: (idx: number) => void;
  onStatus: (s: string) => void;
  onDelete: () => void;
  onCopy: (text: string) => void;
}) {
  const v = draft.variations?.[draft.selectedVariationIdx] || draft.variations?.[0];
  if (!v) return null;
  const hookColor =
    v.hook === "story"
      ? "hsl(18 75% 60%)"
      : v.hook === "sonic"
      ? "hsl(195 70% 60%)"
      : "hsl(38 75% 65%)";

  const fullText = `Subject: ${v.subject}\n\n${v.body}`;

  return (
    <div
      className="mt-3 rounded-xl border overflow-hidden"
      style={{ borderColor: "hsl(30 8% 18%)", background: "hsl(30 9% 6%)" }}
    >
      <div className="px-4 py-3 border-b flex items-center justify-between gap-2" style={{ borderColor: "hsl(30 8% 14%)" }}>
        <div className="flex items-center gap-2 min-w-0">
          <span className="eyebrow" style={{ color: hookColor }}>
            {v.hook} hook
          </span>
          <span className="text-xs truncate" style={{ color: "hsl(30 5% 50%)" }}>
            · “{draft.songTitle}”
          </span>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {draft.status === "draft" && (
            <button
              onClick={() => onStatus("sent")}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs"
              style={{ background: "hsl(141 50% 25%)", color: "hsl(141 60% 80%)" }}
            >
              <CheckCircle2 size={11} /> Mark sent
            </button>
          )}
          {draft.status === "sent" && (
            <span
              className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs"
              style={{ background: "hsl(141 50% 18%)", color: "hsl(141 60% 75%)" }}
            >
              <Clock size={11} /> Sent
            </span>
          )}
          <button
            onClick={onDelete}
            className="p-1 rounded hover:bg-white/5"
            style={{ color: "hsl(30 5% 45%)" }}
            aria-label="Delete pitch"
          >
            <X size={13} />
          </button>
        </div>
      </div>

      <div className="px-4 py-3 space-y-2">
        <div className="text-xs uppercase tracking-wider" style={{ color: "hsl(30 5% 50%)" }}>
          Subject
        </div>
        <div className="text-sm font-medium" style={{ color: "hsl(36 12% 92%)" }}>
          {v.subject}
        </div>
        <div className="text-xs uppercase tracking-wider mt-3" style={{ color: "hsl(30 5% 50%)" }}>
          Body
        </div>
        <div
          className="text-sm leading-relaxed whitespace-pre-wrap p-3 rounded-lg"
          style={{ background: "hsl(30 8% 10%)", color: "hsl(36 10% 85%)" }}
        >
          {v.body}
        </div>
        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={() => onCopy(fullText)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium"
            style={{ background: "hsl(36 12% 92%)", color: "hsl(30 15% 8%)" }}
          >
            <Copy size={12} /> Copy pitch
          </button>
          <div className="flex items-center gap-1 ml-auto">
            {draft.variations.map((vv, i) => (
              <button
                key={i}
                onClick={() => onSelect(i)}
                className="w-6 h-6 rounded-full text-xs font-semibold transition-all"
                style={
                  i === draft.selectedVariationIdx
                    ? { background: "hsl(18 75% 48%)", color: "hsl(36 15% 96%)" }
                    : { background: "hsl(30 8% 14%)", color: "hsl(30 6% 60%)" }
                }
                title={`${vv.hook} hook`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
