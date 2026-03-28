import { motion } from "framer-motion";
import { format } from "date-fns";
import type { ChatMessage as ChatMessageType } from "@workspace/api-client-react";
import { cn } from "@/lib/utils";

interface ChatMessageProps {
  message: ChatMessageType;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 15, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        type: "spring", 
        stiffness: 400, 
        damping: 30,
        mass: 25
      }}
      className={cn(
        "flex w-full mb-5 group",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex-shrink-0 flex items-center justify-center text-sm shadow-lg shadow-orange-500/20 mr-3 mt-auto mb-1 z-10">
          🦊
        </div>
      )}
      
      <div className={cn("flex flex-col", isUser ? "items-end" : "items-start", "max-w-[80%]")}>
        <div
          className={cn(
            "relative px-5 py-3.5 text-[15px] leading-relaxed shadow-lg",
            isUser 
              ? "bg-gradient-to-br from-indigo-500 to-blue-600 text-white rounded-2xl rounded-tr-sm shadow-blue-500/10" 
              : "bg-gradient-to-br from-orange-500/90 to-pink-500/90 text-white rounded-2xl rounded-tl-sm shadow-orange-500/10 border border-orange-400/20"
          )}
        >
          {message.content}
        </div>
        
        <div className="mt-1.5 px-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <span className="text-[11px] text-zinc-500 font-medium">
            {format(new Date(message.timestamp), "h:mm a")}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
