"use client";

import { motion, AnimatePresence } from "framer-motion";
import { spring } from "@/lib/animations";
import { useState } from "react";
import { MessageSquare, X, Sparkles, Mic } from "lucide-react";

interface AIOrbProps {
  thinking?: boolean;
}

export function AIOrb({ thinking = false }: AIOrbProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Orb Trigger */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-8 right-8 w-16 h-16 rounded-full bg-brand flex items-center justify-center text-white shadow-lg shadow-brand/30 z-50 overflow-hidden"
          >
            {/* Breathing glow animation */}
            <motion.div
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.6, 0.3]
              }}
              transition={{ 
                repeat: Infinity, 
                duration: 3, 
                ease: "easeInOut" 
              }}
              className="absolute inset-0 bg-aurora/50 rounded-full"
            />
            <Sparkles className="w-7 h-7 relative z-10" />
            
            {thinking && (
               <motion.div
                 animate={{ rotate: 360 }}
                 transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                 className="absolute inset-[-2px] rounded-full border-t-2 border-r-2 border-white/80"
               />
            )}
          </motion.button>
        )}
      </AnimatePresence>

      {/* Expanded Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.9, originX: 1, originY: 1 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.9 }}
            transition={spring.smooth}
            className="fixed bottom-8 right-8 w-[800px] h-[600px] bg-cosmic border border-white/10 rounded-2xl shadow-2xl z-50 flex overflow-hidden backdrop-blur-xl"
            style={{ backgroundColor: 'rgba(15, 23, 42, 0.85)' }}
          >
            {/* Left: Chat side */}
            <div className="w-[45%] border-r border-white/10 flex flex-col h-full bg-cosmic/50">
              <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2 text-white font-display">
                  <Sparkles className="text-aurora w-5 h-5" />
                  <h3>Academic Intelligence</h3>
                </div>
                <button onClick={() => setIsOpen(false)} className="text-white/50 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-4">
                <div className="bg-white/5 p-3 rounded-lg text-sm text-surface self-start max-w-[85%]">
                  Hello Dr. Kumar! How can I assist you with your course data today?
                </div>
                <div className="bg-brand/20 border border-brand/30 p-3 rounded-lg text-sm text-white self-end max-w-[85%]">
                   Show me the CO attainment for DBMS.
                </div>
                {thinking && (
                  <div className="bg-white/5 p-3 rounded-lg text-sm text-surface self-start flex gap-1 items-center">
                    <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0 }} className="w-1.5 h-1.5 bg-aurora rounded-full" />
                    <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 bg-aurora rounded-full" />
                    <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 bg-aurora rounded-full" />
                  </div>
                )}
              </div>
              
              <div className="p-4 border-t border-white/10 relative">
                 <input 
                   type="text" 
                   placeholder="Ask anything..." 
                   className="w-full bg-white/5 border border-white/10 rounded-full px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-aurora/50 focus:ring-1 focus:ring-aurora/50 transition-all pr-10"
                 />
                 <button className="absolute right-6 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors">
                   <Mic className="w-4 h-4" />
                 </button>
              </div>
            </div>
            
            {/* Right: Visualization side */}
            <div className="w-[55%] p-6 flex items-center justify-center bg-transparent">
              <div className="text-center text-white/40 flex flex-col items-center gap-3">
                 <MessageSquare className="w-12 h-12 opacity-20" />
                 <p className="text-sm">Contextual visualizations will appear here</p>
                 <div className="flex flex-wrap justify-center gap-2 mt-4">
                   <button className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs hover:bg-white/10 transition-colors">
                     Show CO below threshold
                   </button>
                   <button className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs hover:bg-white/10 transition-colors">
                     Generate attainment report
                   </button>
                 </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
