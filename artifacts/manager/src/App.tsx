import { Switch, Route, Router as WouterRouter, Link, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useState } from "react";
import {
  LayoutDashboard, Bot, CheckSquare, Zap, Settings, BookOpen, Menu, X,
  ChevronRight, Megaphone, TrendingUp, ListMusic,
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
  { path: "/tasks", label: "Tasks", icon: CheckSquare },
  { path: "/engagement", label: "Engagement", icon: Zap },
  { path: "/knowledge", label: "Knowledge Base", icon: BookOpen },
  { path: "/settings", label: "Settings", icon: Settings },
];

function Sidebar({ onClose }: { onClose?: () => void }) {
  const [location] = useLocation();
  return (
    <div
      className="flex flex-col h-full"
      style={{ background: "hsl(30 10% 4%)", borderRight: "1px solid hsl(30 8% 14%)" }}
    >
      {/* Editorial masthead */}
      <div className="px-5 pt-6 pb-5 border-b" style={{ borderColor: "hsl(30 8% 14%)" }}>
        <div className="flex items-start justify-between">
          <Link href="/" onClick={onClose}>
            <div className="cursor-pointer">
              <div className="eyebrow mb-1.5" style={{ color: "hsl(18 70% 60%)" }}>
                NBA Josh · Vol. 01
              </div>
              <div
                className="font-editorial text-2xl leading-none"
                style={{ color: "hsl(36 15% 95%)", letterSpacing: "-0.02em" }}
              >
                The Manager
              </div>
              <div className="text-[11px] mt-1.5 italic" style={{ color: "hsl(30 5% 55%)" }}>
                Autopilot for the modern artist
              </div>
            </div>
          </Link>
          {onClose && (
            <button onClick={onClose} className="p-1 rounded" style={{ color: "hsl(30 5% 55%)" }}>
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV.map(({ path, label, icon: Icon }) => {
          const active = path === "/" ? location === "/" : location.startsWith(path);
          return (
            <Link key={path} href={path} onClick={onClose}>
              <div
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 cursor-pointer"
                style={
                  active
                    ? {
                        background: "hsl(18 75% 48% / 0.14)",
                        color: "hsl(18 75% 75%)",
                        border: "1px solid hsl(18 75% 48% / 0.28)",
                        fontWeight: 500,
                      }
                    : {
                        color: "hsl(30 5% 58%)",
                        border: "1px solid transparent",
                        fontWeight: 400,
                      }
                }
              >
                <Icon size={16} />
                <span>{label}</span>
                {active && <ChevronRight size={13} className="ml-auto opacity-60" />}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Editorial footer */}
      <div className="px-5 py-4 border-t" style={{ borderColor: "hsl(30 8% 14%)" }}>
        <div className="eyebrow mb-1" style={{ color: "hsl(30 5% 45%)" }}>
          Published Daily
        </div>
        <div className="text-[11px] italic leading-relaxed" style={{ color: "hsl(30 5% 50%)" }}>
          Six AI agents, one obsessed editor — pitching, pushing, producing your career.
        </div>
      </div>
    </div>
  );
}

function Layout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "hsl(30 10% 5%)" }}>
      <div className="hidden md:flex flex-col w-64 flex-shrink-0">
        <Sidebar />
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="w-72 h-full">
            <Sidebar onClose={() => setMobileOpen(false)} />
          </div>
          <div className="flex-1 bg-black/70" onClick={() => setMobileOpen(false)} />
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div
          className="flex md:hidden items-center gap-3 px-5 py-4 border-b"
          style={{ borderColor: "hsl(30 8% 14%)", background: "hsl(30 10% 4%)" }}
        >
          <button onClick={() => setMobileOpen(true)} style={{ color: "hsl(30 5% 65%)" }}>
            <Menu size={20} />
          </button>
          <div className="font-editorial text-lg" style={{ color: "hsl(36 15% 95%)" }}>
            The Manager
          </div>
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
