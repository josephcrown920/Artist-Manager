import { useState, useRef, useEffect } from "react";
import { Settings, RefreshCcw } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { useRudyChat } from "@/hooks/use-rudy-chat";
import { ChatMessage } from "@/components/chat-message";
import { ChatInput } from "@/components/chat-input";
import { ThinkingIndicator } from "@/components/thinking-indicator";
import { ClearHistoryDialog } from "@/components/clear-history-dialog";

export default function Home() {
  const { messages, isLoadingHistory, sendMessage, isSending, clearHistory, isClearing } = useRudyChat();
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Auto-scroll to bottom when messages update or when thinking starts/stops
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSending]);

  const handleClearConfirm = () => {
    clearHistory();
    setIsClearModalOpen(false);
  };

  return (
    <div className="min-h-[100dvh] w-full bg-zinc-950 flex justify-center overflow-hidden relative selection:bg-orange-500/30 selection:text-orange-200">
      
      {/* Ambient Background Glows */}
      <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] max-w-[600px] max-h-[600px] bg-orange-600/15 rounded-full blur-[100px] pointer-events-none opacity-60 mix-blend-screen" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] max-w-[500px] max-h-[500px] bg-indigo-600/15 rounded-full blur-[120px] pointer-events-none opacity-50 mix-blend-screen" />

      {/* Main Chat Container */}
      <div className="w-full max-w-[560px] h-[100dvh] flex flex-col relative z-10 glass-panel shadow-2xl shadow-black">
        
        {/* Header */}
        <header className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-zinc-950/60 backdrop-blur-2xl z-20 shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-amber-400 via-orange-500 to-pink-500 flex items-center justify-center text-xl shadow-lg shadow-orange-500/25">
                🦊
              </div>
              {/* Online indicator dot */}
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-zinc-900 rounded-full shadow-sm" />
            </div>
            <div className="flex flex-col justify-center">
              <h1 className="font-display font-bold text-zinc-100 text-lg leading-none tracking-wide">
                Rudy
              </h1>
              <span className="text-[12px] text-orange-200/70 font-medium mt-0.5">
                Your permanent hybrid companion
              </span>
            </div>
          </div>
          
          <button 
            onClick={() => setIsClearModalOpen(true)}
            className="w-10 h-10 rounded-full flex items-center justify-center text-zinc-400 hover:text-orange-400 hover:bg-white/5 active:scale-95 transition-all duration-200"
            title="Clear history"
          >
            <Settings className="w-5 h-5" />
          </button>
        </header>

        {/* Chat Area */}
        <main className="flex-1 overflow-y-auto no-scrollbar p-5 flex flex-col relative">
          {isLoadingHistory ? (
            <div className="flex-1 flex flex-col items-center justify-center text-orange-500/50 gap-3">
              <RefreshCcw className="w-6 h-6 animate-spin" />
              <span className="text-sm font-medium text-zinc-500">Loading history...</span>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-4 fade-in animate-in duration-700">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-400/10 to-orange-500/10 flex items-center justify-center text-4xl mb-4 border border-orange-500/20 shadow-xl shadow-orange-500/5">
                🦊
              </div>
              <h2 className="font-display text-2xl font-bold text-zinc-200 mb-2">Say hi to Rudy!</h2>
              <p className="text-zinc-500 max-w-[280px] text-sm leading-relaxed">
                Rudy is a sassy, loving red panda powered by xAI's Grok. Start a conversation below.
              </p>
            </div>
          ) : (
            <div className="flex flex-col justify-end min-h-full pb-2">
              {messages.map((msg, i) => (
                <ChatMessage key={`${msg.timestamp}-${i}`} message={msg} />
              ))}
              
              <AnimatePresence>
                {isSending && <ThinkingIndicator />}
              </AnimatePresence>
              
              <div ref={messagesEndRef} className="h-1 w-full" />
            </div>
          )}
        </main>

        {/* Input Area */}
        <footer className="shrink-0 relative z-20 pb-safe">
          <div className="absolute top-0 left-0 right-0 h-8 -mt-8 bg-gradient-to-t from-zinc-950/90 to-transparent pointer-events-none" />
          <div className="bg-zinc-950/80 backdrop-blur-xl border-t border-white/5 pt-2 pb-6 px-2">
            <ChatInput onSend={sendMessage} disabled={isSending || isLoadingHistory} />
          </div>
        </footer>

      </div>

      <ClearHistoryDialog 
        isOpen={isClearModalOpen}
        onClose={() => setIsClearModalOpen(false)}
        onConfirm={handleClearConfirm}
        isClearing={isClearing}
      />
    </div>
  );
}
