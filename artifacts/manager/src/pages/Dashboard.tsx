import { useQuery } from "@tanstack/react-query";
import { CheckSquare, Zap, Bot, TrendingUp, Music, Star, Calendar, ArrowRight } from "lucide-react";
import { Link } from "wouter";

function StatCard({ icon: Icon, label, value, sub, color }: {
  icon: React.ElementType; label: string; value: string | number; sub?: string; color: string;
}) {
  return (
    <div className="rounded-xl p-5 border flex flex-col gap-3" style={{ background: "hsl(30 9% 8%)", borderColor: "hsl(30 8% 18%)" }}>
      <div className="flex items-center justify-between">
        <span className="text-sm" style={{ color: "hsl(30 5% 58%)" }}>{label}</span>
        <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: `${color}20` }}>
          <Icon size={18} style={{ color }} />
        </div>
      </div>
      <div>
        <div className="text-2xl font-bold text-white">{value}</div>
        {sub && <div className="text-xs mt-1" style={{ color: "hsl(30 5% 50%)" }}>{sub}</div>}
      </div>
    </div>
  );
}

function QuickActionCard({ title, desc, href, color }: { title: string; desc: string; href: string; color: string }) {
  return (
    <Link href={href}>
      <div className="rounded-xl p-4 border cursor-pointer transition-all hover:border-opacity-60 group" style={{ background: "hsl(30 9% 8%)", borderColor: "hsl(30 8% 18%)" }}>
        <div className="flex items-center justify-between">
          <div>
            <div className="font-semibold text-sm text-white">{title}</div>
            <div className="text-xs mt-1" style={{ color: "hsl(30 5% 50%)" }}>{desc}</div>
          </div>
          <ArrowRight size={16} style={{ color }} className="group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </Link>
  );
}

export default function Dashboard() {
  const { data: tasks } = useQuery({
    queryKey: ["tasks"],
    queryFn: () => fetch("/api/tasks").then(r => r.json()).then(d => Array.isArray(d) ? d : (d.tasks ?? [])).catch(() => []),
  });

  const { data: engagements } = useQuery({
    queryKey: ["engagement-history"],
    queryFn: () => fetch("/api/engagement/history").then(r => r.json()).catch(() => ({ history: [] })),
  });

  const { data: autopilot } = useQuery({
    queryKey: ["autopilot-status"],
    queryFn: () => fetch("/api/engagement/autopilot/status").then(r => r.json()).catch(() => ({ enabled: false })),
  });

  const taskList = Array.isArray(tasks) ? tasks : [];
  const openTasks = taskList.filter((t: any) => t.status !== "done").length;
  const postedToday = Array.isArray(engagements?.history)
    ? engagements.history.filter((e: any) => {
        const d = new Date(e.postedAt || e.createdAt);
        const now = new Date();
        return d.toDateString() === now.toDateString();
      }).length
    : 0;

  const tips = [
    "🎯 Pitch Spotify editorial at least 7 days before your next release",
    "📱 Post on TikTok 1-3x today — consistency is king",
    "💌 Your email list is your most owned audience — grow it",
    "🎵 Aim for a 20%+ save rate on Spotify to trigger Discovery Weekly",
    "🤝 Build relationships with 5 playlist curators this week",
    "📣 Comment meaningfully on 10 posts in your genre hashtags today",
    "💰 Register with ASCAP/BMI if you haven't — free money waiting",
    "🎬 A 15-second TikTok hook is more powerful than a 3-minute video",
  ];
  const tip = tips[new Date().getDay() % tips.length];

  return (
    <div className="px-6 md:px-10 py-8 max-w-6xl mx-auto space-y-8">
      {/* Editorial header */}
      <div className="pb-6 border-b" style={{ borderColor: "hsl(30 8% 18%)" }}>
        <div className="eyebrow mb-3" style={{ color: "hsl(18 70% 60%)" }}>
          Issue No. 01 · Today's Edition
        </div>
        <h1 className="text-4xl md:text-5xl" style={{ color: "hsl(36 12% 95%)", lineHeight: 1.05 }}>
          The Newsroom
        </h1>
        <p className="text-base mt-3 max-w-2xl" style={{ color: "hsl(30 6% 60%)", lineHeight: 1.55 }}>
          Six editors. One artist. Everything moving at once — pitching playlists, drafting copy,
          chasing curators, and keeping the story warm.
        </p>
      </div>

      {/* Daily tip */}
      <div className="rounded-xl p-4 border" style={{ background: "hsl(18 75% 48% / 0.08)", borderColor: "hsl(18 75% 48% / 0.25)" }}>
        <div className="flex items-start gap-3">
          <Star size={16} style={{ color: "hsl(38 75% 60%)" }} className="mt-0.5 flex-shrink-0" />
          <div>
            <div className="text-xs font-semibold mb-1" style={{ color: "hsl(38 75% 72%)" }}>TODAY'S INDUSTRY TIP</div>
            <div className="text-sm text-white">{tip}</div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={CheckSquare} label="Open Tasks" value={openTasks} sub="across all priorities" color="hsl(263, 70%, 65%)" />
        <StatCard icon={Zap} label="Posted Today" value={postedToday} sub="Twitter engagements" color="hsl(38, 92%, 55%)" />
        <StatCard icon={Bot} label="AI Agents" value={6} sub="Manager, PR, Social + more" color="hsl(142, 71%, 50%)" />
        <StatCard icon={TrendingUp} label="Autopilot" value={autopilot?.enabled ? "ON" : "OFF"} sub="engagement engine" color={autopilot?.enabled ? "hsl(142, 71%, 50%)" : "hsl(240, 5%, 45%)"} />
      </div>

      {/* Agent team */}
      <div>
        <div className="eyebrow mb-2" style={{ color: "hsl(30 5% 50%)" }}>The Masthead</div>
        <h2 className="text-2xl mb-4" style={{ color: "hsl(36 12% 92%)" }}>Your AI Team</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { emoji: "👔", name: "Manager", desc: "Career strategy & deals", color: "hsl(18 75% 58%)" },
            { emoji: "📋", name: "Assistant", desc: "Scheduling & logistics", color: "hsl(199 89% 55%)" },
            { emoji: "📣", name: "PR Agent", desc: "Media & press coverage", color: "hsl(38 75% 60%)" },
            { emoji: "📱", name: "Social Media", desc: "Content & growth", color: "hsl(142 71% 50%)" },
            { emoji: "🎵", name: "Playlister", desc: "Playlist strategy & pitching", color: "hsl(316 70% 60%)" },
            { emoji: "📢", name: "Advertiser", desc: "Paid ads & campaigns", color: "hsl(0 72% 60%)" },
          ].map(a => (
            <Link key={a.name} href="/agents">
              <div className="rounded-xl p-4 border cursor-pointer transition-all hover:border-opacity-60" style={{ background: "hsl(30 9% 8%)", borderColor: "hsl(30 8% 18%)" }}>
                <div className="text-2xl mb-2">{a.emoji}</div>
                <div className="text-sm font-semibold text-white">{a.name}</div>
                <div className="text-xs mt-0.5" style={{ color: "hsl(30 5% 50%)" }}>{a.desc}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Quick actions */}
      <div>
        <div className="eyebrow mb-2" style={{ color: "hsl(30 5% 50%)" }}>The Front Page</div>
        <h2 className="text-2xl mb-4" style={{ color: "hsl(36 12% 92%)" }}>Today's Moves</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <QuickActionCard title="Playlist Pitching" desc="Discover curators across every DSP + AI emotional-hook pitches" href="/playlists" color="hsl(18 75% 58%)" />
          <QuickActionCard title="Ad Campaign Drafts" desc="AI-generated ads for Meta, YouTube, TikTok & Spotify" href="/ads" color="hsl(0 72% 60%)" />
          <QuickActionCard title="Growth Playbooks" desc="Step-by-step strategies across every DSP" href="/growth-playbooks" color="hsl(141 73% 50%)" />
          <QuickActionCard title="Chat with the Team" desc="Six specialized agents — manager, PR, social, more" href="/agents" color="hsl(38 75% 60%)" />
          <QuickActionCard title="Engagement Queue" desc="Find tweets to reply to & grow your following" href="/engagement" color="hsl(199 89% 55%)" />
          <QuickActionCard title="Study the Playbook" desc="Decades of artist management research" href="/knowledge" color="hsl(316 70% 60%)" />
        </div>
      </div>
    </div>
  );
}
