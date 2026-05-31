import { Switch, Route, Router as WouterRouter, Link, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useState } from "react";
import {
  LayoutDashboard, Bot, CheckSquare, Zap, Settings, BookOpen, Menu, X,
  Megaphone, TrendingUp, ListMusic, Sparkles, Youtube, Users, ShoppingBag, Clapperboard, Video,
} from "lucide-react";
import Dashboard from "@/pages/Dashboard";
import Agents from "@/pages/Agents";
import Tasks from "@/pages/Tasks";
import Engagement from "@/pages/Engagement";
import AdCampaigns from "@/pages/AdCampaigns";
import SettingsPage from "@/pages/SettingsPage";
import KnowledgeBase from "@/pages/KnowledgeBase";
import GrowthPlaybooks from "@/pages/GrowthPlaybooks";
import PlaylistPitches from "@/pages/PlaylistPitches";
import YouTubeGrowth from "@/pages/YouTubeGrowth";
import CreatorCollab from "@/pages/CreatorCollab";
import CreatorFactory from "@/pages/CreatorFactory";
import VideoStudio from "@/pages/VideoStudio";
import ShopTok from "@/pages/ShopTok";
import YouTubeStudio from "@/pages/YouTubeStudio";
import NotFound from "@/pages/not-found";
import ChatbotWidget from "@/components/ChatbotWidget";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

const NAV = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/playlists", label: "Playlist Pitching", icon: ListMusic },
  { path: "/agents", label: "AI Agents", icon: Bot },
  { path: "/ads", label: "Ad Campaigns", icon: Megaphone },
  { path: "/growth-playbooks", label: "Growth Playbooks", icon: TrendingUp },
  { path: "/youtube", label: "Shorts Growth", icon: Youtube },
  { path: "/youtube-studio", label: "YT Studio", icon: Youtube },
  { path: "/video-studio", label: "Video Studio", icon: Video },
  { path: "/creator-factory", label: "Creator Factory", icon: Clapperboard },
  { path: "/creator", label: "Creator Collab", icon: Users },
  { path: "/shoptok", label: "ShopTok", icon: ShoppingBag },
  { path: "/tasks", label: "Tasks", icon: CheckSquare },
  { path: "/engagement", label: "Engagement", icon: Zap },
  { path: "/knowledge", label: "Knowledge Base", icon: BookOpen },
  { path: "/settings", label: "Settings", icon: Settings },
];

function Sidebar({ onClose }: { onClose?: () => void }) {
  const [location] = useLocation();
  return (
    <div className="flex flex-col h-full glass-strong">
      {/* Holographic header */}
      <div className="px-5 pt-6 pb-5 border-b" style={{ borderColor: "hsl(280 60% 30% / 0.4)" }}>
        <div className="flex items-start justify-between">
          <Link href="/" onClick={onClose}>
            <div className="cursor-pointer">
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="w-9 h-9 rounded-2xl flex items-center justify-center glow-pink"
                  style={{
                    background: "linear-gradient(135deg, hsl(320 100% 62%) 0%, hsl(270 100% 65%) 100%)",
                  }}
                >
                  <Sparkles size={16} className="text-white" />
                </div>
                <div>
                  <div className="font-display text-lg leading-none aurora-text">AUTOPILOT</div>
                  <div className="eyebrow mt-1" style={{ color: "hsl(180 80% 65%)" }}>
                    NBA Josh · v2.0
                  </div>
                </div>
              </div>
              <div className="text-[11px] mt-2" style={{ color: "hsl(280 20% 70%)" }}>
                Your AI artist management OS
              </div>
            </div>
          </Link>
          {onClose && (
            <button onClick={onClose} className="p-1 rounded" style={{ color: "hsl(280 15% 65%)" }}>
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV.map(({ path, label, icon: Icon }) => {
          const active = path === "/" ? location === "/" : location.startsWith(path);
          return (
            <Link key={path} href={path} onClick={onClose}>
              <div
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 cursor-pointer relative overflow-hidden"
                style={
                  active
                    ? {
                        background:
                          "linear-gradient(135deg, hsl(320 100% 62% / 0.25) 0%, hsl(270 100% 65% / 0.15) 100%)",
                        color: "hsl(320 100% 85%)",
                        border: "1px solid hsl(320 100% 62% / 0.45)",
                        boxShadow:
                          "inset 0 1px 0 0 hsl(320 100% 80% / 0.2), 0 0 20px -6px hsl(320 100% 50% / 0.5)",
                        fontWeight: 500,
                      }
                    : {
                        color: "hsl(280 15% 70%)",
                        border: "1px solid transparent",
                        fontWeight: 400,
                      }
                }
              >
                <Icon size={16} />
                <span>{label}</span>
                {active && (
                  <div
                    className="ml-auto w-1.5 h-1.5 rounded-full"
                    style={{
                      background: "hsl(180 100% 60%)",
                      boxShadow: "0 0 8px hsl(180 100% 60%)",
                    }}
                  />
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Footer chip */}
      <div className="px-4 py-4 border-t" style={{ borderColor: "hsl(280 60% 30% / 0.4)" }}>
        <div
          className="rounded-2xl px-3 py-3 chrome-border"
          style={{
            background:
              "linear-gradient(135deg, hsl(180 100% 50% / 0.08) 0%, hsl(320 100% 60% / 0.08) 100%)",
          }}
        >
          <div className="eyebrow mb-1" style={{ color: "hsl(180 80% 70%)" }}>
            SYSTEM ONLINE
          </div>
          <div className="text-[11px] leading-relaxed" style={{ color: "hsl(280 20% 75%)" }}>
            6 AI agents standing by. The future of artist management.
          </div>
        </div>
      </div>
    </div>
  );
}

function Layout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      <div className="hidden md:flex flex-col w-64 flex-shrink-0">
        <Sidebar />
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="w-72 h-full">
            <Sidebar onClose={() => setMobileOpen(false)} />
          </div>
          <div className="flex-1 bg-black/70 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div
          className="flex md:hidden items-center gap-3 px-5 py-4 border-b glass"
          style={{ borderColor: "hsl(280 60% 30% / 0.4)" }}
        >
          <button onClick={() => setMobileOpen(true)} style={{ color: "hsl(280 20% 80%)" }}>
            <Menu size={20} />
          </button>
          <div className="font-display text-lg aurora-text">AUTOPILOT</div>
        </div>

        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>

      <ChatbotWidget />
    </div>
  );
}

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/playlists" component={PlaylistPitches} />
        <Route path="/agents" component={Agents} />
        <Route path="/ads" component={AdCampaigns} />
        <Route path="/growth-playbooks" component={GrowthPlaybooks} />
        <Route path="/youtube" component={YouTubeGrowth} />
        <Route path="/youtube-studio" component={YouTubeStudio} />
        <Route path="/video-studio" component={VideoStudio} />
        <Route path="/creator-factory" component={CreatorFactory} />
        <Route path="/creator" component={CreatorCollab} />
        <Route path="/shoptok" component={ShopTok} />
        <Route path="/tasks" component={Tasks} />
        <Route path="/engagement" component={Engagement} />
        <Route path="/knowledge" component={KnowledgeBase} />
        <Route path="/settings" component={SettingsPage} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
