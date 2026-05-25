import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Loader2, Sparkles } from "lucide-react";

interface Msg { role: "user" | "assistant"; content: string }

const QUICK_PROMPTS = [
  "Find me 12 playlist curators across all DSPs",
  "Generate emotional-hook pitch variations for my newest single",
  "What playlists fit my vibe right now?",
  "Draft a SubmitHub pitch with a story hook",
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
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 px-5 py-3.5 rounded-full transition-all hover:scale-105 glow-pink"
          style={{
            background:
              "linear-gradient(135deg, hsl(320 100% 62%) 0%, hsl(270 100% 65%) 50%, hsl(180 100% 60%) 100%)",
            color: "white",
            border: "1px solid hsl(280 100% 80% / 0.5)",
            boxShadow:
              "0 12px 40px -8px hsl(320 100% 50% / 0.6), inset 0 1px 0 0 hsl(280 100% 90% / 0.4)",
          }}
          aria-label="Open assistant"
        >
          <MessageCircle size={18} />
          <span className="text-sm font-semibold tracking-wide">AI CURATOR</span>
          <Sparkles size={14} />
        </button>
      )}

      {open && (
        <div
          className="fixed bottom-6 right-6 z-40 flex flex-col overflow-hidden rounded-3xl glass-strong"
          style={{
            width: "min(420px, calc(100vw - 24px))",
            height: "min(640px, calc(100vh - 48px))",
          }}
        >
          <div
            className="flex items-center justify-between px-5 py-4 border-b"
            style={{ borderColor: "hsl(280 60% 30% / 0.5)" }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-2xl flex items-center justify-center glow-pink"
                style={{
                  background:
                    "linear-gradient(135deg, hsl(320 100% 62%) 0%, hsl(270 100% 65%) 100%)",
                }}
              >
                <Sparkles size={16} className="text-white" />
              </div>
              <div>
                <div className="font-display text-base aurora-text">AI CURATOR</div>
                <div className="eyebrow" style={{ color: "hsl(180 80% 65%)" }}>
                  Playlists · Pitches · Hooks
                </div>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="p-1.5 rounded-xl transition-colors hover:bg-white/10"
              style={{ color: "hsl(280 15% 70%)" }}
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
            {messages.length === 0 ? (
              <div className="space-y-4">
                <div className="text-sm leading-relaxed" style={{ color: "hsl(280 20% 85%)" }}>
                  I find curators, write pitches, and weaponize emotional hooks so your music
                  doesn't get skipped. Pick a starter:
                </div>
                <div className="space-y-2">
                  {QUICK_PROMPTS.map((q) => (
                    <button
                      key={q}
                      onClick={() => send(q)}
                      className="w-full text-left px-3.5 py-2.5 rounded-2xl text-xs transition-all hover:scale-[1.01]"
                      style={{
                        background: "hsl(280 40% 14% / 0.7)",
                        border: "1px solid hsl(280 60% 35% / 0.5)",
                        color: "hsl(280 25% 88%)",
                        backdropFilter: "blur(8px)",
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
                            background:
                              "linear-gradient(135deg, hsl(320 100% 62%) 0%, hsl(270 100% 65%) 100%)",
                            color: "white",
                            borderBottomRightRadius: "6px",
                            boxShadow: "0 4px 16px -4px hsl(320 100% 50% / 0.4)",
                          }
                        : {
                            background: "hsl(280 40% 14% / 0.8)",
                            border: "1px solid hsl(280 50% 30% / 0.5)",
                            color: "hsl(280 25% 92%)",
                            borderBottomLeftRadius: "6px",
                            whiteSpace: "pre-wrap",
                            backdropFilter: "blur(8px)",
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
                  style={{
                    background: "hsl(280 40% 14% / 0.8)",
                    border: "1px solid hsl(280 50% 30% / 0.5)",
                  }}
                >
                  <div className="flex gap-1.5">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className="w-1.5 h-1.5 rounded-full animate-bounce"
                        style={{
                          background: i === 0 ? "hsl(320 100% 65%)" : i === 1 ? "hsl(270 100% 70%)" : "hsl(180 100% 60%)",
                          animationDelay: `${i * 150}ms`,
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div
            className="px-4 py-3 border-t"
            style={{ borderColor: "hsl(280 60% 30% / 0.5)" }}
          >
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
                className="flex-1 rounded-2xl px-3.5 py-2.5 text-sm resize-none outline-none"
                style={{
                  background: "hsl(280 40% 10% / 0.7)",
                  border: "1px solid hsl(280 60% 35% / 0.5)",
                  color: "hsl(280 25% 92%)",
                  maxHeight: "120px",
                }}
              />
              <button
                onClick={() => send()}
                disabled={!input.trim() || loading}
                className="px-3.5 rounded-2xl font-medium text-sm flex items-center justify-center flex-shrink-0 transition-opacity disabled:opacity-40"
                style={{
                  background:
                    "linear-gradient(135deg, hsl(320 100% 62%) 0%, hsl(270 100% 65%) 100%)",
                  color: "white",
                  boxShadow: "0 4px 16px -4px hsl(320 100% 50% / 0.4)",
                }}
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
