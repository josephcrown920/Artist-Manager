import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";

interface ClearHistoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isClearing?: boolean;
}

export function ClearHistoryDialog({ isOpen, onClose, onConfirm, isClearing }: ClearHistoryDialogProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={onClose}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="w-full max-w-sm bg-zinc-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 pb-4">
                <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mb-4 border border-red-500/20">
                  <AlertTriangle className="w-6 h-6 text-red-400" />
                </div>
                <h3 className="font-display text-xl font-bold text-zinc-100 mb-2">
                  Forget everything?
                </h3>
                <p className="text-zinc-400 text-[15px] leading-relaxed">
                  Are you sure you want to clear your chat history with Rudy? This action cannot be undone and Rudy will lose all context of your conversation.
                </p>
              </div>
              
              <div className="p-4 bg-zinc-950/50 flex items-center justify-end gap-3 border-t border-white/5">
                <button
                  onClick={onClose}
                  disabled={isClearing}
                  className="px-5 py-2.5 rounded-xl font-semibold text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={onConfirm}
                  disabled={isClearing}
                  className="px-5 py-2.5 rounded-xl font-semibold bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20 transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:transform-none flex items-center gap-2"
                >
                  {isClearing ? "Clearing..." : "Yes, clear it"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
