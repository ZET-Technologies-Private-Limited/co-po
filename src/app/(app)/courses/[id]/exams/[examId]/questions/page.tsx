"use client";

import { useState, use } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  UploadCloud, Loader2, Plus, Edit3, Trash2, 
  Sparkles, CheckCircle2, ArrowRight, X, BrainCircuit, 
  FileText, Link2, ArrowRightLeft, Target, Award
} from "lucide-react";
import { staggerContainer, fadeSlideUp } from "@/lib/animations";
import { BLOOMS_LEVELS, detectBloomsLevel } from "@/lib/appData";

type Question = {
  id: number; text: string; marks: number; bloom: string; bloomCode?: string;
  co: string; aiSuggested?: boolean; aiVerb?: string;
  overrideLog?: string;
  pairId?: number;
};

const BLOOM_LEVELS = BLOOMS_LEVELS.map(b => b.name);

const MOCK_QUESTIONS: Question[] = [
  { id: 1, text: "Define normalization and explain the different normal forms.",    marks: 10, bloom: "Understand", bloomCode: "L2", co: "CO2", aiSuggested: true, aiVerb: "explain" },
  { id: 2, text: "Apply relational algebra operations to solve a given query.",         marks: 10, bloom: "Apply",     bloomCode: "L3", co: "CO3", aiSuggested: true, aiVerb: "apply" },
  { id: 3, text: "Compare B-tree and B+ tree indexing structures.",                   marks: 8,  bloom: "Analyse",   bloomCode: "L4", co: "CO4", aiSuggested: true, aiVerb: "compare" },
  { id: 4, text: "Design an ER diagram for a hospital management system.",            marks: 12, bloom: "Create",    bloomCode: "L6", co: "CO1", aiSuggested: true, aiVerb: "design" },
];

export default function QuestionsPage({ params }: { params: Promise<{ id: string; examId: string }> }) {
  const { id: courseId, examId } = use(params);
  const [tab, setTab] = useState<"upload" | "bank" | "entry">("upload");
  const [scanning, setScanning] = useState(false);
  const [questions, setQuestions] = useState<Question[]>(MOCK_QUESTIONS);
  const [newQ, setNewQ] = useState({ text: "", marks: 5, bloom: "Remember", co: "CO1", aiSuggested: false });
  const [isPredicting, setIsPredicting] = useState(false);

  const simulateScan = () => {
    setScanning(true);
    setTimeout(() => { setScanning(false); setQuestions(MOCK_QUESTIONS); setTab("bank"); }, 2800);
  };

  const addManual = () => {
    const detected = detectBloomsLevel(newQ.text);
    setQuestions(prev => [...prev, { id: Date.now(), ...newQ, bloomCode: detected.code, aiVerb: detected.verb }]);
    setNewQ({ text: "", marks: 5, bloom: "Remember", co: "CO1", aiSuggested: false });
    setTab("bank");
  };

  const predictBloom = () => {
    if (!newQ.text.trim()) return;
    setIsPredicting(true);
    setTimeout(() => {
       const result = detectBloomsLevel(newQ.text);
       const coByCognitive: Record<string, string> = {
         "Remember": "CO2", "Understand": "CO2", "Apply": "CO3",
         "Analyse": "CO4", "Analyze": "CO4", "Evaluate": "CO5", "Create": "CO1"
       };
       const predictedCo = coByCognitive[result.name] || "CO1";
       setNewQ(prev => ({
         ...prev, bloom: result.name, co: predictedCo, aiSuggested: true,
       } as any));
       setIsPredicting(false);
    }, 1200);
  };

  const removeQ = (id: number) => setQuestions(prev => prev.filter(q => q.id !== id));

  const BLOOM_COLORS: Record<string, string> = {
    "Remember": "text-white/40", "Understand": "text-brand", "Apply": "text-aurora",
    "Analyze": "text-insight", "Analyse": "text-insight", "Evaluate": "text-alert", "Create": "text-attain"
  };

  return (
    <div className="w-full min-h-screen pb-32 pt-4">
      <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="max-w-5xl mx-auto flex flex-col gap-20">
        
        {/* ── HERO SECTION ── */}
        <motion.section variants={fadeSlideUp} className="flex flex-col gap-8">
          <div className="flex items-center gap-3 text-sm font-mono text-insight uppercase tracking-widest">
            <span className="w-8 h-[1px] bg-insight" /> Resource Compilation
          </div>
          <div className="flex items-end justify-between flex-wrap gap-8">
            <div className="flex-1 min-w-[300px]">
              <h1 className="text-6xl md:text-7xl font-display font-medium text-white leading-tight tracking-tight">
                Question<br />
                <span className="text-white/30">Management.</span>
              </h1>
              <p className="text-xl text-white/50 font-light mt-6 max-w-xl">
                 Configuring the item bank for <span className="text-white">{courseId.toUpperCase()}</span> · {examId.toUpperCase()}.
              </p>
            </div>
            <div className="shrink-0 flex items-center gap-4 bg-white/[0.03] border border-white/10 px-6 py-4">
               <FileText className="w-4 h-4 text-insight animate-pulse" />
               <span className="text-xs font-mono uppercase tracking-widest text-white/40">Repository Level: {questions.length} Items</span>
            </div>
          </div>
        </motion.section>

        {/* ── TABS ── */}
        <motion.section variants={fadeSlideUp} className="flex border-b border-white/10">
          {[["upload", "Scan Paper"], ["bank", "Archive"], ["entry", "Direct Entry"]].map(([id, label]) => (
            <button key={id} onClick={() => setTab(id as any)}
              className={`px-8 py-5 text-xs font-mono uppercase tracking-widest transition-all ${tab === id ? "border-b-2 border-white text-white" : "text-white/30 hover:text-white/60"}`}>
              {label}
            </button>
          ))}
        </motion.section>

        <AnimatePresence mode="wait">
          {tab === "upload" && (
            <motion.section key="upload" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="min-h-[400px]">
               {!scanning ? (
                 <div
                   onClick={simulateScan}
                   className="group relative overflow-hidden flex flex-col items-center justify-center py-32 cursor-pointer transition-all border border-white/10 hover:border-white/30"
                 >
                    <div className="absolute inset-0 bg-gradient-to-t from-insight/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <UploadCloud className="w-16 h-16 text-white/20 group-hover:text-white/40 group-hover:scale-110 transition-all mb-8" />
                    <div className="text-center relative z-10">
                       <p className="text-white/70 text-2xl font-display tracking-tight group-hover:text-white transition-colors">Digitalize Examination Paper</p>
                       <p className="text-white/25 text-xs font-mono uppercase tracking-widest mt-4">AI will perform OCR & Bloom classification automatically</p>
                    </div>
                    <div className="mt-12 px-6 py-2 border border-white/10 text-white/30 text-[10px] font-mono uppercase tracking-widest group-hover:border-white/30 group-hover:text-white/60 transition-all">
                       Select Document
                    </div>
                 </div>
               ) : (
                 <div className="flex flex-col items-center justify-center py-32 gap-10">
                   <div className="relative">
                      <Loader2 className="w-16 h-16 text-insight animate-spin" />
                      <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-aurora animate-pulse" />
                   </div>
                   <div className="text-center">
                     <p className="text-white text-3xl font-display tracking-tight">AI Vision Scanning</p>
                     <p className="text-white/30 text-xs font-mono uppercase tracking-widest mt-4">Calibrating Bloom's taxonomy mapping sensors</p>
                   </div>
                   <div className="w-80 h-[2px] bg-white/5 relative overflow-hidden">
                     <motion.div className="h-full bg-insight shadow-[0_0_15px_rgba(30,174,219,0.5)]" initial={{ width: 0 }} animate={{ width: "100%" }} transition={{ duration: 2.8 }} />
                   </div>
                 </div>
               )}
            </motion.section>
          )}

          {tab === "bank" && (
            <motion.section key="bank" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
               {questions.length === 0 ? (
                 <div className="py-24 text-center text-white/20 font-mono text-sm uppercase tracking-widest">Repository Vacant</div>
               ) : (
                 <div className="flex flex-col divide-y divide-white/10 border-t border-white/10">
                    {questions.map((q, i) => (
                      <motion.div key={q.id} initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                        className="py-10 flex flex-col md:flex-row md:items-start gap-8 md:gap-16 group hover:pl-4 transition-all">
                        <div className="w-12 shrink-0">
                           <span className="text-3xl font-mono text-white/10 group-hover:text-white/30 transition-colors">{i+1}</span>
                        </div>
                        <div className="flex-1">
                           <div className="flex items-center gap-4 mb-3">
                              <span className="px-2 py-0.5 bg-brand/10 border border-brand/20 text-brand text-[9px] font-mono uppercase tracking-widest flex items-center gap-1.5">
                                 <Target className="w-3 h-3" /> {q.co}
                              </span>
                              <span className={`px-2 py-0.5 bg-white/5 border border-white/10 text-[9px] font-mono uppercase tracking-widest flex items-center gap-1.5 ${BLOOM_COLORS[q.bloom] || "text-white/40"}`}>
                                 <Award className="w-3 h-3" /> {q.bloomCode || q.bloom}
                               </span>
                               {q.pairId && (
                                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[9px] font-mono uppercase tracking-widest">
                                  <ArrowRightLeft className="w-3 h-3" /> OR with Q{questions.findIndex(x => x.id === q.pairId) + 1}
                                </div>
                               )}
                           </div>
                           <p className="text-xl font-light text-white/70 group-hover:text-white transition-colors leading-relaxed whitespace-pre-wrap italic">"{q.text}"</p>
                           <div className="flex items-center gap-6 mt-6 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button className="text-[9px] font-mono text-white/20 hover:text-white uppercase tracking-widest flex items-center gap-2">
                                 <Edit3 className="w-3.5 h-3.5" /> Modify
                              </button>
                              <button onClick={() => removeQ(q.id)} className="text-[9px] font-mono text-white/20 hover:text-alert uppercase tracking-widest flex items-center gap-2">
                                 <Trash2 className="w-3.5 h-3.5" /> Remove
                              </button>
                              {!q.pairId && (
                                <button className="text-[9px] font-mono text-white/20 hover:text-amber-500 uppercase tracking-widest flex items-center gap-2">
                                  <Link2 className="w-3.5 h-3.5" /> Pair with Choice
                                </button>
                              )}
                           </div>
                        </div>
                        <div className="shrink-0 text-right">
                           <p className="text-4xl font-mono text-white/10 group-hover:text-white transition-colors">{q.marks}</p>
                           <p className="text-[10px] font-mono text-white/20 uppercase mt-2 tracking-widest">Points Max</p>
                        </div>
                      </motion.div>
                    ))}
                 </div>
               )}
               <div className="flex justify-center pt-20">
                  <button onClick={() => setTab("entry")} className="group flex items-center gap-6 px-10 py-5 bg-white text-black font-medium text-sm hover:bg-white/90 transition-all uppercase tracking-widest font-mono">
                    Append Custom Question <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />
                  </button>
               </div>
            </motion.section>
          )}

          {tab === "entry" && (
            <motion.section key="entry" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex flex-col gap-12">
               <div className="flex flex-col border-t border-white/10">
                  <div className="py-12 border-b border-white/10">
                     <span className="text-[10px] font-mono text-white/20 uppercase tracking-widest block mb-4">Question Lexicon</span>
                     <textarea
                        value={newQ.text}
                        onChange={e => setNewQ(n => ({ ...n, text: e.target.value }))}
                        placeholder="Define the scope of the question..."
                        className="bg-transparent text-white w-full h-32 outline-none font-display text-4xl placeholder-white/5 py-4 focus:placeholder-transparent transition-all resize-none"
                     />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-12 py-12 border-b border-white/10">
                     <div className="flex flex-col gap-4">
                        <span className="text-[10px] font-mono text-white/20 uppercase tracking-widest">Marks Calibration</span>
                        <input type="number" value={newQ.marks} onChange={e => setNewQ(n => ({ ...n, marks: +e.target.value, aiSuggested: false }))}
                           className="bg-transparent border-b border-white/10 text-white font-mono text-2xl outline-none focus:border-white transition-colors py-2" />
                     </div>
                     <div className="flex items-end mb-2">
                        <button 
                          onClick={predictBloom}
                          disabled={!newQ.text.trim() || isPredicting}
                          className="w-full flex items-center justify-center gap-2 py-3 bg-brand/10 text-brand text-xs font-mono uppercase tracking-widest border border-brand/20 hover:bg-brand hover:text-white transition-all disabled:opacity-50"
                        >
                           {isPredicting ? <Loader2 className="w-4 h-4 animate-spin" /> : <BrainCircuit className="w-4 h-4" />}
                           {isPredicting ? "Analyzing..." : "AI Predict"}
                        </button>
                     </div>
                     <div className="flex flex-col gap-4">
                        <span className="flex justify-between items-center text-[10px] font-mono text-white/20 uppercase tracking-widest">
                           Cognitive Level
                           {newQ.aiSuggested && <Sparkles className="w-3 h-3 text-aurora" />}
                        </span>
                        <select value={newQ.bloom} onChange={e => setNewQ(n => ({ ...n, bloom: e.target.value }))}
                           className="bg-transparent text-white font-mono text-lg border-b border-white/10 outline-none focus:border-white transition-all cursor-pointer py-2">
                           {BLOOM_LEVELS.map(l => <option key={l} value={l} className="bg-cosmic">{l}</option>)}
                        </select>
                     </div>
                     <div className="flex flex-col gap-4">
                        <span className="text-[10px] font-mono text-white/20 uppercase tracking-widest">Outcome Reference</span>
                        <select value={newQ.co} onChange={e => setNewQ(n => ({ ...n, co: e.target.value }))}
                           className="bg-transparent text-white font-mono text-lg border-b border-white/10 outline-none focus:border-white transition-all cursor-pointer py-2">
                           {["CO1","CO2","CO3","CO4","CO5","CO6"].map(c => <option key={c} value={c} className="bg-cosmic">{c}</option>)}
                        </select>
                     </div>
                  </div>
               </div>
               <div className="flex justify-end gap-6 pt-6">
                  <button onClick={() => setTab("bank")} className="text-[10px] font-mono text-white/30 hover:text-white transition-colors uppercase tracking-widest py-4 px-10 border border-white/10 hover:border-white/30">Cancel</button>
                  <button onClick={addManual} className="group flex items-center gap-6 px-16 py-6 bg-white text-black font-medium text-sm hover:bg-white/90 transition-all uppercase tracking-widest font-mono">
                    Commit To Archive <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
                  </button>
               </div>
            </motion.section>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
