import { useState, useRef, useEffect } from "react";
import { Send, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [message, setMessage] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Focus on mount and re-focus after sending completes
    if (!disabled) {
      inputRef.current?.focus();
    }
  }, [disabled]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSend(message.trim());
      setMessage("");
    }
  };

  return (
    <div className="p-4 bg-transparent w-full">
      <form
        onSubmit={handleSubmit}
        className={cn(
          "relative flex items-center bg-zinc-900/90 backdrop-blur-xl rounded-full border border-white/10 p-1.5 shadow-2xl transition-all duration-300",
          "focus-within:border-orange-500/40 focus-within:ring-4 focus-within:ring-orange-500/10 focus-within:bg-zinc-900",
          disabled && "opacity-70 pointer-events-none"
        )}
      >
        <div className="pl-4 pr-2 flex items-center justify-center text-orange-500/50">
          <Sparkles className="w-4 h-4" />
        </div>
        
        <input
          ref={inputRef}
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          disabled={disabled}
          className="flex-1 bg-transparent px-2 py-3 text-[15px] text-zinc-100 placeholder:text-zinc-500 focus:outline-none"
          placeholder="Say something to Rudy..."
          autoComplete="off"
        />
        
        <button
          type="submit"
          disabled={!message.trim() || disabled}
          className={cn(
            "p-3 rounded-full flex items-center justify-center transition-all duration-300 ml-1",
            message.trim() && !disabled
              ? "bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg shadow-orange-500/25 hover:scale-105 active:scale-95 hover:shadow-orange-500/40"
              : "bg-zinc-800 text-zinc-500"
          )}
        >
          <Send className="w-4 h-4 translate-x-px translate-y-px" />
        </button>
      </form>
    </div>
  );
}
