import { Switch, Route, Router as WouterRouter, Link, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useState } from "react";
import {
  LayoutDashboard, Bot, CheckSquare, Zap, Settings, BookOpen, Menu, X,
  Music2, ChevronRight, Megaphone
} from "lucide-react";
import Dashboard from "@/pages/Dashboard";
import Agents from "@/pages/Agents";
import Tasks from "@/pages/Tasks";
import Engagement from "@/pages/Engagement";
import AdCampaigns from "@/pages/AdCampaigns";
import SettingsPage from "@/pages/SettingsPage";
import KnowledgeBase from "@/pages/KnowledgeBase";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

const NAV = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/agents", label: "AI Agents", icon: Bot },
  { path: "/tasks", label: "Tasks", icon: CheckSquare },
  { path: "/engagement", label: "Engagement", icon: Zap },
  { path: "/ads", label: "Ad Campaigns", icon: Megaphone },
  { path: "/knowledge", label: "Knowledge Base", icon: BookOpen },
  { path: "/settings", label: "Settings", icon: Settings },
];

function Sidebar({ onClose }: { onClose?: () => void }) {
  const [location] = useLocation();
  return (
    <div className="flex flex-col h-full" style={{ background: "hsl(240 10% 5%)", borderRight: "1px solid hsl(240 5% 13%)" }}>
      {/* Logo */}
      <div className="flex items-center justify-between px-4 py-5 border-b" style={{ borderColor: "hsl(240 5% 13%)" }}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, hsl(263 70% 58%), hsl(263 70% 40%))" }}>
            <Music2 size={16} className="text-white" />
          </div>
          <div>
            <div className="text-sm font-bold text-white leading-none">Artist Manager</div>
            <div className="text-xs mt-0.5" style={{ color: "hsl(263 70% 70%)" }}>Autopilot</div>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-1 rounded" style={{ color: "hsl(240 5% 50%)" }}>
            <X size={18} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV.map(({ path, label, icon: Icon }) => {
          const active = path === "/" ? location === "/" : location.startsWith(path);
          return (
            <Link key={path} href={path} onClick={onClose}>
              <div className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${active ? "sidebar-active" : "sidebar-idle"}`}
                style={active ? {
                  background: "hsl(263 70% 58% / 0.15)",
                  color: "hsl(263 70% 78%)",
                  border: "1px solid hsl(263 70% 58% / 0.25)"
                } : {
                  color: "hsl(240 5% 55%)",
                  border: "1px solid transparent"
                }}>
                <Icon size={17} />
                <span>{label}</span>
                {active && <ChevronRight size={13} className="ml-auto opacity-60" />}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t" style={{ borderColor: "hsl(240 5% 13%)" }}>
        <div className="text-xs" style={{ color: "hsl(240 5% 38%)" }}>
          Powered by Grok AI · xAI
        </div>
      </div>
    </div>
  );
}

function Layout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "hsl(240 10% 4%)" }}>
      {/* Desktop sidebar */}
      <div className="hidden md:flex flex-col w-60 flex-shrink-0">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="w-64 h-full">
            <Sidebar onClose={() => setMobileOpen(false)} />
          </div>
          <div className="flex-1 bg-black/60" onClick={() => setMobileOpen(false)} />
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile header */}
        <div className="flex md:hidden items-center gap-3 px-4 py-3 border-b" style={{ borderColor: "hsl(240 5% 13%)", background: "hsl(240 10% 5%)" }}>
          <button onClick={() => setMobileOpen(true)} style={{ color: "hsl(240 5% 60%)" }}>
            <Menu size={22} />
          </button>
          <div className="flex items-center gap-2">
            <Music2 size={16} style={{ color: "hsl(263 70% 65%)" }} />
            <span className="text-sm font-semibold text-white">Artist Manager</span>
          </div>
        </div>

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/agents" component={Agents} />
        <Route path="/tasks" component={Tasks} />
        <Route path="/engagement" component={Engagement} />
        <Route path="/ads" component={AdCampaigns} />
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
