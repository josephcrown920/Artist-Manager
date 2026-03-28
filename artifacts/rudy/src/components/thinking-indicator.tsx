import { motion } from "framer-motion";

export function ThinkingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      className="flex w-full mb-6 justify-start"
    >
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex-shrink-0 flex items-center justify-center text-sm shadow-lg shadow-orange-500/20 mr-3 mt-auto mb-1">
        🦊
      </div>
      <div className="bg-zinc-800/80 backdrop-blur-md border border-white/5 rounded-2xl rounded-tl-sm px-5 py-4 shadow-lg flex items-center gap-1.5 mt-auto">
        <motion.div
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
          className="w-1.5 h-1.5 bg-orange-400 rounded-full"
        />
        <motion.div
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 0.6, repeat: Infinity, delay: 0.15 }}
          className="w-1.5 h-1.5 bg-orange-500 rounded-full"
        />
        <motion.div
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 0.6, repeat: Infinity, delay: 0.3 }}
          className="w-1.5 h-1.5 bg-pink-500 rounded-full"
        />
      </div>
    </motion.div>
  );
}
