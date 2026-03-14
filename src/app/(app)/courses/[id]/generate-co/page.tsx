"use client";

import { useState, use, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Bot, Send, Sparkles, Target, Award, 
  CheckCircle2, AlertCircle, Trash2, Edit3,
  Loader2, RefreshCw, ChevronRight, FileText,
  BrainCircuit, Zap, Info, ArrowRight
} from "lucide-react";
import { fadeSlideUp, staggerContainer } from "@/lib/animations";

// ─── TYPES ───────────────────────────────────────────────────────────────
interface CO {
  id: string;
  name: string;
  description: string;
  level: string;
  verb: string;
  pos: string[];
  psos: string[];
  correlation: number;
}

interface Message {
  role: 'bot' | 'user';
  content: string;
}

export default function AICOGenerationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: courseId } = use(params);
  
  // ── STATE ──
  const [messages, setMessages] = useState<Message[]>([
    { role: 'bot', content: "Hello! I'm Nexus AI. Let's generate Course Outcomes for your subject. What is the Course Name, Regulation Year, and Semester?" }
  ]);
  const [step, setStep] = useState(1);
  const [inputText, setInputText] = useState("");
  const [cos, setCos] = useState<CO[]>([]);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  // ── CHATBOT LOGIC (Spec: Faculty Page 3) ──
  const processStep = (input: string) => {
    const nextMsg = (content: string) => {
      setIsAiTyping(true);
      setTimeout(() => {
        setMessages(prev => [...prev, { role: 'bot', content }]);
        setIsAiTyping(false);
      }, 1000);
    };

    switch(step) {
      case 1: // Course Info
        nextMsg("Great. Now, please paste your syllabus topics or upload the syllabus PDF. I'll analyze the keywords.");
        setStep(2);
        break;
      case 2: // Syllabus
        nextMsg("Syllabus parsed. I've identified key themes like 'SQL', 'Normalization', and 'Transactions'. Shall I use the default University PO/PSO list for 2021 Regulation?");
        setStep(3);
        break;
      case 3: // PO/PSO Confirm
        nextMsg("Confirmed. How many Course Outcomes (COs) should I generate? (Recommended: 4, 5, or 6)");
        setStep(4);
        break;
      case 4: // CO Count
        const count = parseInt(input) || 5;
        nextMsg(`Generating ${count} COs with Bloom's Taxonomy levels and PO mappings... Please wait.`);
        setStep(5);
        // Trigger generation simulation
        setTimeout(() => {
          const generated: CO[] = Array.from({ length: count }).map((_, i) => ({
            id: `CO${i+1}`,
            name: `CO${i+1}`,
            description: i === 0 ? "Design and implement relational databases using normalization." : 
                         i === 1 ? "Execute complex SQL queries for data retrieval." : 
                         "Evaluate database performance and concurrency protocols.",
            level: i % 2 === 0 ? "L4 — Analyze" : "L3 — Apply",
            verb: i === 0 ? "Design" : "Execute",
            pos: ["PO1", "PO2"],
            psos: ["PSO1"],
            correlation: 3
          }));
          setCos(generated);
          setMessages(prev => [...prev, { role: 'bot', content: "Done! Review the COs in the right panel. You can edit any statement or BT level there. Does this look good, or should I regenerate?" }]);
          setStep(6);
        }, 3000);
        break;
      case 6: // Review
        nextMsg("Excellent. All COs have been mapped to POs/PSOs with high correlation. Shall I save these to your course database?");
        setStep(7);
        break;
    }
  };

  const handleSend = () => {
    if (!inputText) return;
    setMessages(prev => [...prev, { role: 'user', content: inputText }]);
    const currentInput = inputText;
    setInputText("");
    processStep(currentInput);
  };

  return (
    <div className="flex h-[calc(100vh-120px)] -m-8 overflow-hidden">
      
      {/* ── LEFT PANEL: CHATBOT (Spec: Faculty Page 3) ── */}
      <section className="w-1/2 border-r border-white/10 flex flex-col bg-cosmic/50">
        <div className="p-8 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded bg-brand/10 border border-brand/20 flex items-center justify-center text-brand">
                <Bot className="w-5 h-5" />
             </div>
             <h2 className="text-sm font-mono text-white/40 uppercase tracking-widest font-bold">Nexus AI <span className="text-white/10">v4.0</span></h2>
          </div>
          <span className="text-[9px] font-mono text-white/20 uppercase tracking-widest">Step {step} of 7</span>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-12 flex flex-col gap-8">
          <AnimatePresence initial={false}>
            {messages.map((m, i) => (
              <motion.div 
                key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className={`flex gap-4 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <div className={`w-8 h-8 rounded flex items-center justify-center shrink-0 ${m.role === 'user' ? 'bg-white/10 text-white/40' : 'bg-brand/10 text-brand'}`}>
                   {m.role === 'user' ? <Users className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>
                <div className={`max-w-[80%] p-6 ${m.role === 'user' ? 'bg-white/[0.03] text-white/60 font-light' : 'bg-brand/[0.03] border border-brand/10 text-white/80 font-normal'} text-sm leading-relaxed italic`}>
                  {m.content}
                </div>
              </motion.div>
            ))}
            {isAiTyping && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-4">
                 <div className="w-8 h-8 rounded bg-brand/10 flex items-center justify-center text-brand">
                    <Loader2 className="w-4 h-4 animate-spin" />
                 </div>
                 <div className="px-6 py-4 bg-brand/5 border border-brand/10 text-[10px] uppercase font-mono tracking-widest text-brand animate-pulse">
                    AI Analysis in progress...
                 </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="p-8 border-t border-white/10 bg-cosmic">
           <div className="relative">
              <input 
                type="text" value={inputText} onChange={e => setInputText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                placeholder="Type your response..."
                className="w-full bg-white/[0.02] border border-white/10 pl-6 pr-24 py-4 text-white text-sm outline-none focus:border-brand/40 transition-colors"
              />
              <button 
                onClick={handleSend}
                className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 bg-brand text-white text-[10px] font-mono uppercase tracking-widest hover:bg-brand/80 transition-all flex items-center gap-2"
              >
                Send <Send className="w-3 h-3" />
              </button>
           </div>
           <div className="mt-4 flex gap-4">
              <button className="text-[9px] font-mono text-white/20 uppercase hover:text-white transition-colors">Load Syllabus PDF</button>
              <button className="text-[9px] font-mono text-white/20 uppercase hover:text-white transition-colors">Use Templates</button>
           </div>
        </div>
      </section>

      {/* ── RIGHT PANEL: LIVE PREVIEW (Spec: Faculty Page 3) ── */}
      <section className="w-1/2 flex flex-col bg-cosmic overflow-hidden">
        <div className="p-8 border-b border-white/10 flex items-center justify-between">
           <h2 className="text-sm font-mono text-white/30 uppercase tracking-widest">CO Matrix Preview</h2>
           <div className="flex gap-4">
              <button className="text-white/20 hover:text-white transition-colors"><RefreshCw className="w-4 h-4" /></button>
           </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8">
           <table className="w-full text-left font-mono text-[10px]">
             <thead className="bg-white/[0.03] border-b border-white/10">
                <tr>
                   <th className="px-4 py-4 text-white/20 font-normal">No.</th>
                   <th className="px-4 py-4 text-white/20 font-normal">Statement</th>
                   <th className="px-4 py-4 text-white/20 font-normal">Level</th>
                   <th className="px-4 py-4 text-white/20 font-normal text-right">Actions</th>
                </tr>
             </thead>
             <tbody className="divide-y divide-white/5">
                {cos.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-32 text-center text-white/5 uppercase tracking-[0.2em] italic">
                      Waiting for AI Generation...
                    </td>
                  </tr>
                ) : (
                  cos.map(co => (
                    <tr key={co.id} className="hover:bg-white/[0.01] transition-colors group">
                       <td className="px-4 py-6 text-brand font-bold align-top">{co.id}</td>
                       <td className="px-4 py-6 text-white/70 font-light leading-relaxed align-top italic">
                          {co.description}
                          <div className="mt-4 flex gap-2">
                             {co.pos.map(p => <span key={p} className="px-1.5 py-0.5 border border-white/10 text-[8px] text-white/30">{p}</span>)}
                          </div>
                       </td>
                       <td className="px-4 py-6 align-top">
                          <span className="text-[9px] font-mono border border-brand/30 text-brand px-2 py-1 uppercase">{co.level}</span>
                       </td>
                       <td className="px-4 py-4 text-right align-top">
                          <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                             <button className="p-2 text-white/20 hover:text-brand"><Edit3 className="w-3.5 h-3.5" /></button>
                             <button className="p-2 text-white/20 hover:text-alert"><Trash2 className="w-3.5 h-3.5" /></button>
                          </div>
                       </td>
                    </tr>
                  ))
                )}
             </tbody>
           </table>
        </div>

        {cos.length > 0 && (
          <motion.div initial={{ y: 20 }} animate={{ y: 0 }} className="p-8 border-t border-brand/20 bg-brand/[0.02] flex justify-between items-center">
             <p className="text-[10px] font-mono text-brand uppercase tracking-widest flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> Ready for Deployment
             </p>
             <button className="px-8 py-3 bg-brand text-white text-[10px] font-mono uppercase tracking-widest hover:bg-brand/90 transition-all flex items-center gap-3">
                Save & Lock COs <ArrowRight className="w-4 h-4" />
             </button>
          </motion.div>
        )}
      </section>

    </div>
  );
}

function Users({ className }: { className?: string }) {
  return <path className={className} d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m16-10a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm-8 0a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />;
}
