import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ShoppingBag, TrendingUp, Zap, ExternalLink, Package, BarChart2, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

const TIKTOK_CONTENT_IDEAS = [
  { type: "Product Demo", hook: "POV: you finally got the merch you've been waiting for 🔥", format: "15s unboxing, zoom on design, fit reveal", cta: "Link in bio — dropping now" },
  { type: "Behind the Scenes", hook: "How we designed the [product] (the process nobody shows you)", format: "30s studio montage, design sketches, final product", cta: "Limited run — grab yours" },
  { type: "Fan Reaction", hook: "Reacting to fans wearing my merch in public", format: "Street reactions, genuine moments, artist overlay", cta: "Join the movement" },
  { type: "Challenge", hook: "Wear the drip, do the challenge, tag me", format: "Dance/lip sync over track, merch as requirement", cta: "Top 3 get free merch" },
  { type: "Sold Out Announcement", hook: "We just sold out in 4 hours… restocking?", format: "Countdown, screenshot of orders, tease", cta: "Join waitlist" },
];

const INTEGRATIONS = [
  { id: "tiktok_shop", name: "TikTok Shop", emoji: "🎵", status: "connect", color: "hsl(180 100% 60%)", desc: "Tag products in videos. Buyers checkout without leaving TikTok.", steps: ["Enable TikTok Shop in your TikTok Business Center", "Connect your Shopify store via TikTok Sales Channel", "Sync your product catalog (auto-updates)", "Tag products in every video you post"] },
  { id: "tiktok_pixel", name: "TikTok Pixel", emoji: "📊", status: "connect", color: "hsl(199 89% 60%)", desc: "Track every conversion from TikTok ads back to your Shopify store.", steps: ["Install TikTok Pixel app from Shopify App Store", "Add your TikTok Pixel ID in Settings", "Enable Advanced Matching for better attribution", "Test events in TikTok Events Manager"] },
  { id: "shopify_analytics", name: "Shopify Analytics", emoji: "📈", status: "active", color: "hsl(142 71% 55%)", desc: "Revenue, orders, and conversion data from your merch store.", steps: ["Already connected via Shopify Admin", "View detailed reports in Shopify Analytics"] },
  { id: "spark_ads", name: "Spark Ads", emoji: "⚡", status: "connect", color: "hsl(320 100% 65%)", desc: "Boost your own organic TikTok videos as ads. Best ROI format.", steps: ["Post organic TikTok with product tag", "Go to TikTok Ads Manager → Spark Ads", "Select your top-performing organic video", "Set daily budget ($20–50/day to start)"] },
];

const METRICS = [
  { label: "TikTok Clicks", value: "—", sub: "Connect TikTok Pixel", color: "hsl(180 100% 60%)" },
  { label: "Store Sessions", value: "—", sub: "From all channels", color: "hsl(142 71% 55%)" },
  { label: "Conversion Rate", value: "—", sub: "Industry avg 2–4%", color: "hsl(320 100% 65%)" },
  { label: "Revenue (30d)", value: "—", sub: "Connect Shopify", color: "hsl(43 100% 65%)" },
];

export default function ShopTok() {
  const [activeTab, setActiveTab] = useState<"overview" | "content" | "setup">("overview");
  const [expandedInteg, setExpandedInteg] = useState<string | null>(null);

  const { data: settings } = useQuery({
    queryKey: ["settings"],
    queryFn: () => fetch("/api/settings").then(r => r.json()),
  });

  const shopifyConnected = !!(settings?.shopifyStoreUrl && settings?.shopifyApiKey);
  const tiktokConnected  = !!(settings?.tiktokAdvertiserId);

  return (
    <div className="p-6 md:p-10 max-w-3xl mx-auto">
      {/* Y2K header */}
      <div className="pb-6 mb-6">
        <div className="eyebrow mb-3" style={{ color: "hsl(180 80% 65%)" }}>▸ COMMERCE ENGINE · SHOPIFY × TIKTOK</div>
        <h1 className="text-4xl md:text-5xl aurora-text" style={{ lineHeight: 1 }}>SHOPTOK</h1>
        <p className="text-sm mt-3" style={{ color: "hsl(280 20% 70%)" }}>
          Turn every TikTok view into a merch sale. Shopify + TikTok Shop unified.
        </p>
        <div className="rule mt-4" />
      </div>

      {/* Connection status */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {[
          { name: "Shopify", connected: shopifyConnected, href: "/settings", emoji: "🛍️" },
          { name: "TikTok Ads", connected: tiktokConnected, href: "/settings", emoji: "🎵" },
        ].map(p => (
          <a key={p.name} href={p.href}
            className="rounded-2xl border p-4 flex items-center gap-3 transition-all hover:scale-[1.01] glass"
            style={{ borderColor: p.connected ? "hsl(142 71% 45% / 0.4)" : "hsl(280 60% 28% / 0.35)", textDecoration: "none" }}>
            <span className="text-2xl">{p.emoji}</span>
            <div>
              <div className="text-sm font-semibold" style={{ color: "hsl(280 20% 92%)" }}>{p.name}</div>
              <div className="flex items-center gap-1.5 text-xs mt-0.5" style={{ color: p.connected ? "hsl(142 71% 60%)" : "hsl(280 15% 55%)" }}>
                {p.connected ? <><CheckCircle2 size={11} /> Connected</> : <><AlertCircle size={11} /> Not connected — click to configure</>}
              </div>
            </div>
          </a>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-2xl mb-6" style={{ background: "hsl(280 40% 8%)", border: "1px solid hsl(280 50% 20% / 0.4)" }}>
        {[["overview", "📊 Overview"], ["content", "🎬 Content Ideas"], ["setup", "🔧 Setup Guide"]].map(([key, label]) => (
          <button key={key} onClick={() => setActiveTab(key as any)}
            className="flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all"
            style={activeTab === key
              ? { background: "linear-gradient(135deg, hsl(320 100% 62% / 0.22) 0%, hsl(270 100% 65% / 0.16) 100%)", color: "hsl(320 100% 82%)", border: "1px solid hsl(320 100% 62% / 0.4)" }
              : { color: "hsl(280 15% 55%)", border: "1px solid transparent" }}>
            {label}
          </button>
        ))}
      </div>

      {/* Overview */}
      {activeTab === "overview" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {METRICS.map(m => (
              <div key={m.label} className="rounded-2xl border p-4 glass" style={{ borderColor: "hsl(280 60% 28% / 0.35)" }}>
                <div className="text-2xl font-black" style={{ color: m.color }}>{m.value}</div>
                <div className="text-sm font-semibold mt-1" style={{ color: "hsl(280 20% 85%)" }}>{m.label}</div>
                <div className="text-xs mt-0.5" style={{ color: "hsl(280 15% 55%)" }}>{m.sub}</div>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border p-5 glass" style={{ borderColor: "hsl(280 60% 28% / 0.4)" }}>
            <div className="text-sm font-semibold mb-4" style={{ color: "hsl(280 20% 92%)" }}>📐 TikTok → Shopify Funnel</div>
            <div className="space-y-2">
              {[
                ["TikTok Video", "Organic reach + Spark Ads boost", "hsl(180 100% 60%)"],
                ["Product Tag Click", "Viewer clicks tagged product in video", "hsl(199 89% 60%)"],
                ["TikTok Shop / Shopify", "In-app checkout or redirect to your store", "hsl(270 100% 65%)"],
                ["Purchase + Pixel Fire", "Conversion tracked → ROAS calculated", "hsl(142 71% 55%)"],
              ].map(([step, desc, color], i) => (
                <div key={i} className="flex gap-3 items-start">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 mt-0.5"
                    style={{ background: `${color.replace(")", " / 0.2)")}`, color }}>
                    {i + 1}
                  </div>
                  <div>
                    <div className="text-sm font-semibold" style={{ color: "hsl(280 20% 90%)" }}>{step}</div>
                    <div className="text-xs" style={{ color: "hsl(280 15% 60%)" }}>{desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border p-5 glass" style={{ borderColor: "hsl(280 60% 28% / 0.4)" }}>
            <div className="text-sm font-semibold mb-3" style={{ color: "hsl(280 20% 92%)" }}>💡 Quick Wins</div>
            <div className="space-y-2">
              {[
                ["Add product tags to every TikTok you post", "Most creators ignore this — it adds 15–30% revenue"],
                ["Use Spark Ads on your best organic video", "Boost posts that are already working, not cold ads"],
                ["Set up TikTok Pixel today", "30 days of data before running paid campaigns"],
                ["Launch a limited merch drop with a series video", "Scarcity + narrative = highest conversion rate"],
              ].map(([tip, why], i) => (
                <div key={i} className="flex gap-2.5">
                  <div className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0" style={{ background: "hsl(320 100% 62%)" }} />
                  <div>
                    <div className="text-sm" style={{ color: "hsl(280 20% 88%)" }}>{tip}</div>
                    <div className="text-xs" style={{ color: "hsl(280 15% 55%)" }}>{why}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Content Ideas */}
      {activeTab === "content" && (
        <div className="space-y-3">
          <p className="text-sm" style={{ color: "hsl(280 15% 60%)" }}>
            TikTok content formats proven to drive merch sales for music artists — in order of conversion rate.
          </p>
          {TIKTOK_CONTENT_IDEAS.map((idea, i) => (
            <div key={i} className="rounded-2xl border p-4 glass" style={{ borderColor: "hsl(280 60% 28% / 0.4)" }}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs px-2 py-0.5 rounded-full font-bold"
                  style={{ background: "hsl(320 100% 62% / 0.15)", color: "hsl(320 100% 75%)", border: "1px solid hsl(320 100% 62% / 0.3)" }}>
                  #{i + 1} {idea.type}
                </span>
              </div>
              <p className="text-sm font-semibold mb-2" style={{ color: "hsl(280 20% 95%)" }}>"{idea.hook}"</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-xl p-2.5" style={{ background: "hsl(280 40% 10%)", border: "1px solid hsl(280 50% 22% / 0.4)" }}>
                  <div className="font-bold mb-1" style={{ color: "hsl(199 89% 60%)" }}>FORMAT</div>
                  <div style={{ color: "hsl(280 15% 75%)" }}>{idea.format}</div>
                </div>
                <div className="rounded-xl p-2.5" style={{ background: "hsl(280 40% 10%)", border: "1px solid hsl(280 50% 22% / 0.4)" }}>
                  <div className="font-bold mb-1" style={{ color: "hsl(142 71% 60%)" }}>CTA</div>
                  <div style={{ color: "hsl(280 15% 75%)" }}>{idea.cta}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Setup */}
      {activeTab === "setup" && (
        <div className="space-y-3">
          {INTEGRATIONS.map(integ => (
            <div key={integ.id} className="rounded-2xl border overflow-hidden glass"
              style={{ borderColor: expandedInteg === integ.id ? `${integ.color.replace(")", " / 0.45)")}` : "hsl(280 60% 28% / 0.35)" }}>
              <button className="w-full flex items-center gap-3 p-4 text-left" onClick={() => setExpandedInteg(expandedInteg === integ.id ? null : integ.id)}>
                <span className="text-xl">{integ.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold" style={{ color: "hsl(280 20% 92%)" }}>{integ.name}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold"
                      style={integ.status === "active"
                        ? { background: "hsl(142 71% 45% / 0.15)", color: "hsl(142 71% 60%)", border: "1px solid hsl(142 71% 45% / 0.35)" }
                        : { background: `${integ.color.replace(")", " / 0.12)")}`, color: integ.color, border: `1px solid ${integ.color.replace(")", " / 0.3)")}` }}>
                      {integ.status === "active" ? "● Active" : "Setup needed"}
                    </span>
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: "hsl(280 15% 60%)" }}>{integ.desc}</div>
                </div>
                <span className="text-xs flex-shrink-0" style={{ color: "hsl(280 15% 45%)" }}>
                  {expandedInteg === integ.id ? "▲" : "▼"}
                </span>
              </button>

              {expandedInteg === integ.id && (
                <div className="px-4 pb-4 border-t space-y-2" style={{ borderColor: "hsl(280 50% 22% / 0.4)" }}>
                  <div className="text-[10px] font-bold tracking-widest pt-3 mb-2" style={{ color: integ.color }}>SETUP STEPS</div>
                  {integ.steps.map((step, i) => (
                    <div key={i} className="flex gap-2.5">
                      <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0"
                        style={{ background: `${integ.color.replace(")", " / 0.18)")}`, color: integ.color }}>
                        {i + 1}
                      </div>
                      <p className="text-xs leading-relaxed" style={{ color: "hsl(280 15% 78%)" }}>{step}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          <a href="/settings" className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl text-sm font-semibold transition-all hover:scale-[1.01]"
            style={{ background: "hsl(280 40% 9%)", border: "1px solid hsl(280 50% 22% / 0.5)", color: "hsl(280 20% 85%)", textDecoration: "none" }}>
            <ExternalLink size={15} /> Open Settings to connect platforms
          </a>
        </div>
      )}
    </div>
  );
}
