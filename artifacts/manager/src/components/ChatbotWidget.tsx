import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Loader2, Sparkles } from "lucide-react";

interface Msg { role: "user" | "assistant"; content: string }

const QUICK_PROMPTS = [
  "Find me 12 playlist curators across all DSPs",
  "Generate emotional-hook pitch variations for my newest single",
  "What playlists fit my vibe right now?",
  "Draft a SubmitHub-style pitch with a story hook",
];

export default function ChatbotWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, open]);

  const send = async (override?: string) => {
    const msg = (override ?? input).trim();
    if (!msg || loading) return;
    setInput("");
    const next: Msg[] = [...messages, { role: "user", content: msg }];
    setMessages(next);
    setLoading(true);
    try {
      // Route through the Playlister agent — it knows curator strategy + emotional hooks
      const r = await fetch("/api/agents/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentType: "playlister", message: msg }),
      });
      const data = await r.json();
      const reply = r.ok
        ? (data.reply || "Empty reply.")
        : `⚠️ ${data?.detail || data?.error || "Server error"}`;
      setMessages([...next, { role: "assistant", content: reply }]);
    } catch (e: any) {
      setMessages([...next, { role: "assistant", content: `⚠️ ${e?.message || "Network error"}` }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-40 group flex items-center gap-2.5 px-5 py-3.5 rounded-full shadow-2xl transition-all hover:scale-105"
          style={{
            background: "hsl(18 75% 48%)",
            color: "hsl(36 15% 96%)",
            boxShadow: "0 12px 40px -8px hsl(18 75% 40% / 0.5), 0 0 0 1px hsl(18 75% 55% / 0.4)",
          }}
          aria-label="Open assistant"
        >
          <MessageCircle size={18} />
          <span className="text-sm font-medium">Ask the Curator</span>
          <Sparkles size={14} style={{ color: "hsl(38 80% 75%)" }} />
        </button>
      )}

      {/* Panel */}
      {open && (
        <div
          className="fixed bottom-6 right-6 z-40 flex flex-col rounded-2xl overflow-hidden shadow-2xl"
          style={{
            width: "min(420px, calc(100vw - 24px))",
            height: "min(640px, calc(100vh - 48px))",
            background: "hsl(30 9% 8%)",
            border: "1px solid hsl(30 8% 22%)",
            boxShadow: "0 30px 80px -12px hsl(0 0% 0% / 0.6)",
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-5 py-4 border-b"
            style={{ borderColor: "hsl(30 8% 18%)", background: "hsl(30 9% 6%)" }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center"
                style={{ background: "hsl(18 75% 48% / 0.18)" }}
              >
                <Sparkles size={16} style={{ color: "hsl(38 75% 65%)" }} />
              </div>
              <div>
                <div className="font-editorial text-base" style={{ color: "hsl(36 12% 95%)" }}>
                  The Curator
                </div>
                <div className="eyebrow" style={{ color: "hsl(30 5% 55%)" }}>
                  Playlists · Pitches · Strategy
                </div>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="p-1.5 rounded-lg transition-colors hover:bg-white/5"
              style={{ color: "hsl(30 5% 55%)" }}
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
            {messages.length === 0 ? (
              <div className="space-y-4">
                <div className="text-sm leading-relaxed" style={{ color: "hsl(30 8% 75%)" }}>
                  I find curators, write pitches, and weaponize emotional hooks so your music
                  doesn't get skipped. Try one of these:
                </div>
                <div className="space-y-2">
                  {QUICK_PROMPTS.map((q) => (
                    <button
                      key={q}
                      onClick={() => send(q)}
                      className="w-full text-left px-3.5 py-2.5 rounded-lg text-xs transition-colors"
                      style={{
                        background: "hsl(30 8% 11%)",
                        border: "1px solid hsl(30 8% 18%)",
                        color: "hsl(36 10% 82%)",
                      }}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className="max-w-[85%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed"
                    style={
                      m.role === "user"
                        ? {
                            background: "hsl(18 75% 48%)",
                            color: "hsl(36 15% 96%)",
                            borderBottomRightRadius: "4px",
                          }
                        : {
                            background: "hsl(30 8% 12%)",
                            border: "1px solid hsl(30 8% 20%)",
                            color: "hsl(36 10% 88%)",
                            borderBottomLeftRadius: "4px",
                            whiteSpace: "pre-wrap",
                          }
                    }
                  >
                    {m.content}
                  </div>
                </div>
              ))
            )}
            {loading && (
              <div className="flex justify-start">
                <div
                  className="px-3.5 py-3 rounded-2xl"
                  style={{ background: "hsl(30 8% 12%)", border: "1px solid hsl(30 8% 20%)" }}
                >
                  <div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className="w-1.5 h-1.5 rounded-full animate-bounce"
                        style={{ background: "hsl(38 75% 65%)", animationDelay: `${i * 150}ms` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="px-4 py-3 border-t" style={{ borderColor: "hsl(30 8% 18%)" }}>
            <div className="flex gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                placeholder="Ask about playlists, curators, pitches…"
                rows={1}
                className="flex-1 rounded-xl px-3.5 py-2.5 text-sm resize-none outline-none"
                style={{
                  background: "hsl(30 8% 11%)",
                  border: "1px solid hsl(30 8% 22%)",
                  color: "hsl(36 12% 92%)",
                  maxHeight: "120px",
                }}
              />
              <button
                onClick={() => send()}
                disabled={!input.trim() || loading}
                className="px-3.5 py-2 rounded-xl font-medium text-sm flex items-center justify-center flex-shrink-0 transition-opacity disabled:opacity-40"
                style={{ background: "hsl(18 75% 48%)", color: "hsl(36 15% 96%)" }}
                aria-label="Send"
              >
                {loading ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
