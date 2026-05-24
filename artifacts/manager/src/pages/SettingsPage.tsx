import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Save, Eye, EyeOff, CheckCircle2, Loader2, ExternalLink } from "lucide-react";

interface Settings {
  artistName?: string; genre?: string;
  twitterBearerToken?: string; twitterApiKey?: string; twitterApiSecret?: string;
  twitterAccessToken?: string; twitterAccessSecret?: string;
  engagementKeywords?: string; twitterConnected?: boolean;
  fbAdAccountId?: string; fbAccessToken?: string;
  tiktokAdvertiserId?: string; tiktokAccessToken?: string;
  googleAdsCustomerId?: string; googleAdsRefreshToken?: string;
  spotifyArtistId?: string; spotifyForArtistsEmail?: string;
  appleMusicArtistId?: string;
  audiomackArtistUrl?: string;
  boomplayArtistUrl?: string;
  shopifyStoreUrl?: string; shopifyApiKey?: string;
  metaPixelId?: string; tiktokPixelId?: string; googleAnalyticsId?: string;
  [key: string]: any;
}

function SecretInput({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label className="block text-xs font-medium mb-1.5" style={{ color: "hsl(240 5% 60%)" }}>{label}</label>
      <div className="relative">
        <input type={show ? "text" : "password"} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder || "••••••••••••"}
          className="w-full rounded-lg px-3 py-2 pr-10 text-sm outline-none"
          style={{ background: "hsl(240 8% 10%)", border: "1px solid hsl(240 5% 18%)", color: "hsl(0 0% 90%)" }} />
        <button onClick={() => setShow(!show)} className="absolute right-2.5 top-2" style={{ color: "hsl(240 5% 45%)" }}>
          {show ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </div>
    </div>
  );
}

function TextInput({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="block text-xs font-medium mb-1.5" style={{ color: "hsl(240 5% 60%)" }}>{label}</label>
      <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full rounded-lg px-3 py-2 text-sm outline-none"
        style={{ background: "hsl(240 8% 10%)", border: "1px solid hsl(240 5% 18%)", color: "hsl(0 0% 90%)" }} />
    </div>
  );
}

function PlatformSection({ emoji, title, subtitle, link, linkText, children }: {
  emoji: string; title: string; subtitle: string; link?: string; linkText?: string; children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border p-5 space-y-4" style={{ background: "hsl(240 8% 7%)", borderColor: "hsl(240 5% 16%)" }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="text-xl">{emoji}</span>
          <div>
            <div className="text-sm font-semibold text-white">{title}</div>
            <div className="text-xs" style={{ color: "hsl(240 5% 45%)" }}>{subtitle}</div>
          </div>
        </div>
        {link && (
          <a href={link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg transition-colors"
            style={{ color: "hsl(263 70% 65%)", background: "hsl(263 70% 58% / 0.1)" }}>
            {linkText || "Setup"} <ExternalLink size={10} />
          </a>
        )}
      </div>
      {children}
    </div>
  );
}

export default function SettingsPage() {
  const [form, setForm] = useState<Settings>({});
  const [saved, setSaved] = useState(false);

  const { data, isLoading } = useQuery<Settings>({
    queryKey: ["settings"],
    queryFn: () => fetch("/api/settings").then(r => r.json()).catch(() => ({})),
  });

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  const saveMut = useMutation({
    mutationFn: (body: Settings) => fetch("/api/settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then(r => r.json()),
    onSuccess: () => { setSaved(true); setTimeout(() => setSaved(false), 3000); },
  });

  const set = (k: string) => (v: string) => setForm(f => ({ ...f, [k]: v }));

  if (isLoading) {
    return <div className="flex justify-center pt-20"><Loader2 size={24} className="animate-spin" style={{ color: "hsl(263 70% 58%)" }} /></div>;
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-5">
      <div>
        <h1 className="text-xl font-bold text-white">Settings</h1>
        <p className="text-sm mt-0.5" style={{ color: "hsl(240 5% 50%)" }}>Configure your artist profile, platform connections & tracking</p>
      </div>

      <PlatformSection emoji="🎤" title="Artist Profile" subtitle="Your core identity">
        <TextInput label="Artist Name" value={form.artistName || ""} onChange={set("artistName")} placeholder="NBA Josh" />
        <TextInput label="Genre" value={form.genre || ""} onChange={set("genre")} placeholder="Hip-hop, R&B, Pop..." />
        <TextInput label="Engagement Keywords" value={form.engagementKeywords || ""} onChange={set("engagementKeywords")} placeholder="music, new artist, rapper, producer..." />
      </PlatformSection>

      <div className="text-xs font-semibold uppercase tracking-wider pt-2" style={{ color: "hsl(263 70% 65%)" }}>
        Advertising Platforms
      </div>

      <PlatformSection emoji="📘" title="Meta (Facebook + Instagram) Ads" subtitle="Ad account for FB & IG campaigns"
        link="https://business.facebook.com/settings" linkText="Business Manager">
        <TextInput label="Ad Account ID" value={form.fbAdAccountId || ""} onChange={set("fbAdAccountId")} placeholder="act_123456789" />
        <SecretInput label="Access Token" value={form.fbAccessToken || ""} onChange={set("fbAccessToken")} placeholder="Long-lived access token" />
      </PlatformSection>

      <PlatformSection emoji="🎵" title="TikTok Ads" subtitle="TikTok Business Center"
        link="https://ads.tiktok.com" linkText="TikTok Ads">
        <TextInput label="Advertiser ID" value={form.tiktokAdvertiserId || ""} onChange={set("tiktokAdvertiserId")} placeholder="Your advertiser ID" />
        <SecretInput label="Access Token" value={form.tiktokAccessToken || ""} onChange={set("tiktokAccessToken")} />
      </PlatformSection>

      <PlatformSection emoji="🔍" title="Google Ads (YouTube + Search)" subtitle="Google Ads manager account"
        link="https://ads.google.com" linkText="Google Ads">
        <TextInput label="Customer ID" value={form.googleAdsCustomerId || ""} onChange={set("googleAdsCustomerId")} placeholder="123-456-7890" />
        <SecretInput label="Refresh Token" value={form.googleAdsRefreshToken || ""} onChange={set("googleAdsRefreshToken")} />
      </PlatformSection>

      <div className="text-xs font-semibold uppercase tracking-wider pt-2" style={{ color: "hsl(38 92% 55%)" }}>
        Music Platforms
      </div>

      <PlatformSection emoji="🟢" title="Spotify" subtitle="Artist profile & ad studio"
        link="https://artists.spotify.com" linkText="Spotify for Artists">
        <TextInput label="Spotify Artist ID" value={form.spotifyArtistId || ""} onChange={set("spotifyArtistId")} placeholder="e.g. 4Z8W4fKeB5YxbusRsdQVPb" />
        <TextInput label="Spotify for Artists Email" value={form.spotifyForArtistsEmail || ""} onChange={set("spotifyForArtistsEmail")} placeholder="Your login email" />
      </PlatformSection>

      <PlatformSection emoji="🍎" title="Apple Music" subtitle="Apple Music for Artists"
        link="https://artists.apple.com" linkText="Apple for Artists">
        <TextInput label="Apple Music Artist ID" value={form.appleMusicArtistId || ""} onChange={set("appleMusicArtistId")} placeholder="Your artist ID" />
      </PlatformSection>

      <PlatformSection emoji="🎶" title="Audiomack" subtitle="Audiomack artist profile"
        link="https://audiomack.com/creator" linkText="Creator Hub">
        <TextInput label="Audiomack Profile URL" value={form.audiomackArtistUrl || ""} onChange={set("audiomackArtistUrl")} placeholder="https://audiomack.com/nbajosh" />
      </PlatformSection>

      <PlatformSection emoji="🔊" title="Boomplay" subtitle="Boomplay artist profile"
        link="https://www.boomplay.com" linkText="Boomplay">
        <TextInput label="Boomplay Profile URL" value={form.boomplayArtistUrl || ""} onChange={set("boomplayArtistUrl")} placeholder="https://www.boomplay.com/artists/..." />
      </PlatformSection>

      <div className="text-xs font-semibold uppercase tracking-wider pt-2" style={{ color: "hsl(142 71% 55%)" }}>
        Social & Engagement
      </div>

      <PlatformSection emoji="🐦" title="Twitter / X" subtitle="Required for the Engagement Engine"
        link="https://developer.twitter.com" linkText="Developer Portal">
        <SecretInput label="Bearer Token (for searching tweets)" value={form.twitterBearerToken || ""} onChange={set("twitterBearerToken")} />
        <TextInput label="Your Twitter User ID (numeric — needed for posting/likes)" value={form.twitterUserId || ""} onChange={set("twitterUserId")} placeholder="e.g. 783214" />
        <div className="grid grid-cols-2 gap-3">
          <SecretInput label="API Key" value={form.twitterApiKey || ""} onChange={set("twitterApiKey")} />
          <SecretInput label="API Secret" value={form.twitterApiSecret || ""} onChange={set("twitterApiSecret")} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <SecretInput label="Access Token" value={form.twitterAccessToken || ""} onChange={set("twitterAccessToken")} />
          <SecretInput label="Access Secret" value={form.twitterAccessSecret || ""} onChange={set("twitterAccessSecret")} />
        </div>
        <div className="text-[11px]" style={{ color: "hsl(240 5% 50%)" }}>
          {form.twitterConnected ? "✓ Search enabled" : "○ Bearer token needed for search"}
          {" · "}
          {form.twitterWriteEnabled ? "✓ Posting/likes enabled" : "○ API keys + User ID needed for posting"}
        </div>
      </PlatformSection>

      <div className="text-xs font-semibold uppercase tracking-wider pt-2" style={{ color: "hsl(199 89% 55%)" }}>
        E-Commerce & Tracking
      </div>

      <PlatformSection emoji="🛍️" title="Shopify" subtitle="Your merch store"
        link="https://admin.shopify.com" linkText="Shopify Admin">
        <TextInput label="Store URL" value={form.shopifyStoreUrl || ""} onChange={set("shopifyStoreUrl")} placeholder="https://your-store.myshopify.com" />
        <SecretInput label="Shopify API Key" value={form.shopifyApiKey || ""} onChange={set("shopifyApiKey")} />
      </PlatformSection>

      <PlatformSection emoji="📊" title="Tracking Pixels & Analytics" subtitle="Measure conversions across platforms">
        <TextInput label="Meta Pixel ID" value={form.metaPixelId || ""} onChange={set("metaPixelId")} placeholder="123456789012345" />
        <TextInput label="TikTok Pixel ID" value={form.tiktokPixelId || ""} onChange={set("tiktokPixelId")} placeholder="Your TikTok pixel ID" />
        <TextInput label="Google Analytics ID" value={form.googleAnalyticsId || ""} onChange={set("googleAnalyticsId")} placeholder="G-XXXXXXXXXX or UA-XXXXXXXX" />
      </PlatformSection>

      <button onClick={() => saveMut.mutate(form)} disabled={saveMut.isPending}
        className="w-full py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all disabled:opacity-50"
        style={{ background: saved ? "hsl(142 71% 45%)" : "hsl(263 70% 58%)" }}>
        {saveMut.isPending ? <><Loader2 size={16} className="animate-spin" /> Saving...</>
          : saved ? <><CheckCircle2 size={16} /> Saved!</>
          : <><Save size={16} /> Save All Settings</>}
      </button>
    </div>
  );
}
