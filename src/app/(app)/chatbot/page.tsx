"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Sparkles, BrainCircuit, Loader2 } from "lucide-react";
import { staggerContainer, fadeSlideUp } from "@/lib/animations";

type Message = { id: number; role: "user" | "ai"; text: string };

const SUGGESTIONS = [
  "Show CO attainment for DBMS",
  "Which CO has lowest attainment?",
  "Generate PO attainment summary",
  "List at-risk courses this semester",
  "Compare T1 and T2 performance",
];

const MOCK_RESPONSES: Record<string, string> = {
  default: "I've analyzed your request. Based on the current attainment data, CO3 (Apply relational algebra concepts) shows 55% attainment – the lowest among all mapped outcomes. I recommend reviewing the examination type distribution for this CO.",
};

function getBotResponse(q: string): string {
  if (q.toLowerCase().includes("lowest") || q.toLowerCase().includes("risk")) {
    return "Based on the current data, **CO3** has the lowest attainment at **55%** (threshold: 60%). Courses at risk: EC201 – Digital Signal Processing at 67%, ME301 – Thermodynamics at 74%. Recommendations: increase practical coverage for CO3 and schedule supplementary assessments.";
  }
  if (q.toLowerCase().includes("dbms") || q.toLowerCase().includes("attainment")) {
    return "CO Attainment for **DBMS (CS301)**:\n• CO1 – 82% ✓\n• CO2 – 74% ✓\n• CO3 – 55% ⚠ (Below threshold)\n• CO4 – 68% ✓\n• CO5 – 79% ✓\n• CO6 – 91% ✓\n\nOverall: **75%** — 5 of 6 COs above threshold.";
  }
  if (q.toLowerCase().includes("po") || q.toLowerCase().includes("program")) {
    return "PO Attainment Summary for AY 2025-26:\n• PO1 Engineering Knowledge – 78%\n• PO2 Problem Analysis – 65%\n• PO3 Design/Dev of Solutions – 80%\n• PO7 Ethics – 55% ⚠ (Needs attention)\n\nOverall Program Attainment: **73%**";
  }
  return MOCK_RESPONSES.default;
}

export default function ChatbotPage() {
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, role: "ai", text: "Hello! I'm your Nexus AI assistant. Ask me anything about CO/PO attainment, exam performance, or generate detailed reports." },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = (q: string) => {
    if (!q.trim()) return;
    const userMsg: Message = { id: Date.now(), role: "user", text: q };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setTyping(true);
    const delay = 1200 + q.length * 15;
    setTimeout(() => {
      setTyping(false);
      setMessages(prev => [...prev, { id: Date.now() + 1, role: "ai", text: getBotResponse(q) }]);
    }, delay);
  };

  return (
    <div className="w-full flex flex-col h-screen pb-0">
      <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="max-w-3xl mx-auto w-full px-6 pt-12 flex flex-col h-full">

        {/* Header */}
        <motion.div variants={fadeSlideUp} className="mb-8 shrink-0">
          <div className="flex items-center gap-3 text-sm font-mono text-aurora uppercase tracking-widest mb-4">
            <BrainCircuit className="w-4 h-4" /> Nexus Intelligence
          </div>
          <h1 className="text-4xl font-display text-white">AI Assistant</h1>
        </motion.div>

        {/* Suggestion Chips */}
        <motion.div variants={fadeSlideUp} className="flex gap-3 flex-wrap mb-6 shrink-0">
          {SUGGESTIONS.map(s => (
            <button key={s} onClick={() => send(s)}
              className="px-4 py-2 border border-white/10 text-white/50 text-xs font-mono hover:border-aurora/50 hover:text-aurora transition-colors uppercase tracking-wide">
              {s}
            </button>
          ))}
        </motion.div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto flex flex-col gap-8 py-4 pr-2 mb-4">
          <AnimatePresence>
            {messages.map(msg => (
              <motion.div key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-4 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "ai" && (
                  <div className="w-8 h-8 rounded-full border border-aurora/50 flex items-center justify-center shrink-0 mt-1">
                    <Sparkles className="w-4 h-4 text-aurora" />
                  </div>
                )}
                <div className={`max-w-xl ${msg.role === "user" ? "text-right" : ""}`}>
                  <p className={`leading-relaxed whitespace-pre-line font-light text-lg ${msg.role === "ai" ? "text-white/80" : "text-white"}`}>
                    {msg.text}
                  </p>
                  <span className="text-xs font-mono text-white/20 mt-2 block">{msg.role === "ai" ? "Nexus AI" : "You"}</span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Typing indicator */}
          <AnimatePresence>
            {typing && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full border border-aurora/50 flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4 text-aurora" />
                </div>
                <div className="flex gap-1 items-center h-8">
                  {[0, 1, 2].map(i => (
                    <motion.div key={i} className="w-2 h-2 rounded-full bg-aurora/60"
                      animate={{ y: [0, -6, 0] }} transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.15 }} />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="shrink-0 border-t border-white/10 pt-6 pb-8">
          <div className="flex items-center gap-4">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && send(input)}
              placeholder="Ask about attainment, outcomes, or generate reports..."
              className="flex-1 bg-transparent border-b border-white/20 focus:border-white py-3 text-white placeholder-white/30 outline-none transition-colors text-lg"
            />
            <button onClick={() => send(input)} disabled={!input.trim() || typing}
              className="w-12 h-12 flex items-center justify-center border border-white/20 hover:border-white hover:bg-white hover:text-black text-white transition-all disabled:opacity-30 shrink-0">
              {typing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
