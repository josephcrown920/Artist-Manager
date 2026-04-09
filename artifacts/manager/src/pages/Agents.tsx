import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Send, Trash2, Loader2 } from "lucide-react";

const AGENTS = [
  { id: "manager", label: "Manager", emoji: "👔", color: "hsl(263 70% 65%)", desc: "Career strategy, deals & big picture" },
  { id: "assistant", label: "Assistant", emoji: "📋", color: "hsl(199 89% 55%)", desc: "Scheduling, tasks & organization" },
  { id: "pr", label: "PR Agent", emoji: "📣", color: "hsl(38 92% 55%)", desc: "Press, media & public image" },
  { id: "social", label: "Social Media", emoji: "📱", color: "hsl(142 71% 50%)", desc: "Content strategy & growth" },
  { id: "playlister", label: "Playlister", emoji: "🎵", color: "hsl(316 70% 60%)", desc: "Playlist pitching & strategy" },
  { id: "advertiser", label: "Advertiser", emoji: "📢", color: "hsl(0 72% 60%)", desc: "Paid ads & marketing campaigns" },
];

interface Message { role: "user" | "assistant"; content: string; }

function ChatWindow({ agentId, agentColor }: { agentId: string; agentColor: string }) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const qc = useQueryClient();

  const { data: history, isLoading: histLoading } = useQuery({
    queryKey: ["conversations", agentId],
    queryFn: () => fetch(`/api/agents/conversations/${agentId}`).then(r => r.json()),
    select: (d) => d.messages as Message[],
  });

  useEffect(() => {
    if (history) setMessages(history);
  }, [history]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const clearMut = useMutation({
    mutationFn: () => fetch(`/api/agents/conversations/${agentId}`, { method: "DELETE" }),
    onSuccess: () => { setMessages([]); qc.invalidateQueries({ queryKey: ["conversations", agentId] }); },
  });

  const send = async () => {
    const msg = input.trim();
    if (!msg || isLoading) return;
    setInput("");
    const newMsgs: Message[] = [...messages, { role: "user", content: msg }];
    setMessages(newMsgs);
    setIsLoading(true);
    try {
      const res = await fetch("/api/agents/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentType: agentId, message: msg }),
      });
      const data = await res.json();
      if (!res.ok) {
        const errDetail = data?.detail || data?.error || `Server error ${res.status}`;
        setMessages([...newMsgs, { role: "assistant", content: `⚠️ ${errDetail}` }]);
      } else {
        setMessages([...newMsgs, { role: "assistant", content: data.reply || "⚠️ Empty reply received." }]);
      }
    } catch (e: any) {
      setMessages([...newMsgs, { role: "assistant", content: `⚠️ Network error: ${e?.message || "Could not reach the API server."}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {histLoading ? (
          <div className="flex justify-center pt-10"><Loader2 size={22} className="animate-spin" style={{ color: agentColor }} /></div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center pt-12">
            <div className="text-4xl mb-3">{AGENTS.find(a => a.id === agentId)?.emoji}</div>
            <div className="text-sm font-medium text-white mb-1">Start a conversation</div>
            <div className="text-xs" style={{ color: "hsl(240 5% 45%)" }}>{AGENTS.find(a => a.id === agentId)?.desc}</div>
          </div>
        ) : messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
              m.role === "user"
                ? "rounded-br-sm text-white"
                : "rounded-bl-sm border"
            }`} style={m.role === "user" ? { background: agentColor } : { background: "hsl(240 8% 11%)", borderColor: "hsl(240 5% 18%)", color: "hsl(0 0% 87%)", whiteSpace: "pre-wrap" }}>
              {m.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="px-4 py-3 rounded-2xl rounded-bl-sm border text-sm" style={{ background: "hsl(240 8% 11%)", borderColor: "hsl(240 5% 18%)" }}>
              <div className="flex gap-1">
                {[0,1,2].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: agentColor, animationDelay: `${i*150}ms` }} />)}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 pb-4 pt-2 border-t" style={{ borderColor: "hsl(240 5% 14%)" }}>
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={onKey}
            placeholder="Ask anything..."
            rows={1}
            className="flex-1 rounded-xl px-4 py-2.5 text-sm resize-none outline-none"
            style={{ background: "hsl(240 8% 10%)", border: "1px solid hsl(240 5% 18%)", color: "hsl(0 0% 90%)", maxHeight: "120px" }}
          />
          <button onClick={send} disabled={!input.trim() || isLoading}
            className="px-4 py-2 rounded-xl text-white font-medium text-sm flex items-center gap-1.5 flex-shrink-0 transition-opacity disabled:opacity-40"
            style={{ background: agentColor }}>
            <Send size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Agents() {
  const [activeAgent, setActiveAgent] = useState("manager");
  const agent = AGENTS.find(a => a.id === activeAgent)!;
  const qc = useQueryClient();

  const clearMut = useMutation({
    mutationFn: () => fetch(`/api/agents/conversations/${activeAgent}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["conversations", activeAgent] }),
  });

  return (
    <div className="flex flex-col md:flex-row h-full" style={{ minHeight: "calc(100vh - 57px)" }}>
      {/* Agent list */}
      <div className="md:w-56 flex-shrink-0 border-b md:border-b-0 md:border-r overflow-x-auto md:overflow-y-auto" style={{ borderColor: "hsl(240 5% 13%)", background: "hsl(240 10% 5%)" }}>
        <div className="flex md:flex-col gap-1 p-3">
          {AGENTS.map(a => (
            <button key={a.id} onClick={() => setActiveAgent(a.id)}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left transition-all flex-shrink-0 w-full"
              style={activeAgent === a.id ? {
                background: `${a.color.replace("hsl(", "hsl(").replace(")", " / 0.15)")}`,
                border: `1px solid ${a.color.replace("hsl(", "hsl(").replace(")", " / 0.3)")}`,
              } : { border: "1px solid transparent" }}>
              <span className="text-xl">{a.emoji}</span>
              <div className="min-w-0 hidden md:block">
                <div className="text-xs font-semibold text-white truncate">{a.label}</div>
                <div className="text-xs truncate" style={{ color: "hsl(240 5% 45%)" }}>{a.desc}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b" style={{ borderColor: "hsl(240 5% 13%)" }}>
          <div className="flex items-center gap-3">
            <span className="text-2xl">{agent.emoji}</span>
            <div>
              <div className="font-semibold text-sm text-white">{agent.label}</div>
              <div className="text-xs" style={{ color: "hsl(240 5% 45%)" }}>{agent.desc}</div>
            </div>
          </div>
          <button onClick={() => clearMut.mutate()} disabled={clearMut.isPending}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors"
            style={{ color: "hsl(240 5% 45%)", background: "hsl(240 8% 10%)", border: "1px solid hsl(240 5% 16%)" }}>
            <Trash2 size={12} />
            Clear
          </button>
        </div>
        <div className="flex-1 min-h-0">
          <ChatWindow key={activeAgent} agentId={activeAgent} agentColor={agent.color} />
        </div>
      </div>
    </div>
  );
}
