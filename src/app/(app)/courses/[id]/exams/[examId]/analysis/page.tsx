"use client";

import { useState, use } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Edit3, CheckCircle2, RefreshCcw, AlertTriangle, Info, TrendingUp, ArrowRight, Zap, Target } from "lucide-react";
import { staggerContainer, fadeSlideUp } from "@/lib/animations";

type BloomLevel = "Remember" | "Understand" | "Apply" | "Analyze" | "Evaluate" | "Create";

type Question = {
  id: number;
  text: string;
  marks: number;
  aiBloom: BloomLevel;
  userBloom: BloomLevel | null;
  aiCO: string;
  userCO: string | null;
  confidence: number;
};

const BLOOM_LEVELS: BloomLevel[] = ["Remember", "Understand", "Apply", "Analyze", "Evaluate", "Create"];
const BLOOM_COLOR: Record<BloomLevel, string> = {
  Remember: "text-white/20",
  Understand: "text-brand",
  Apply: "text-aurora",
  Analyze: "text-insight",
  Evaluate: "text-alert",
  Create: "text-attain",
};

const MOCK_QUESTIONS: Question[] = [
  { id: 1, text: "Define the concept of normalization and list the different normal forms.", marks: 10, aiBloom: "Understand", userBloom: null, aiCO: "CO2", userCO: null, confidence: 94 },
  { id: 2, text: "Apply relational algebra to formulate the given SQL query.", marks: 10, aiBloom: "Apply", userBloom: null, aiCO: "CO3", userCO: null, confidence: 89 },
  { id: 3, text: "Analyze the performance trade-offs between B-tree and hash indexing.", marks: 12, aiBloom: "Analyze", userBloom: null, aiCO: "CO4", userCO: null, confidence: 82 },
  { id: 4, text: "Design an ER diagram and schema for an online banking system.", marks: 15, aiBloom: "Create", userBloom: null, aiCO: "CO1", userCO: null, confidence: 91 },
  { id: 5, text: "List the ACID properties of a database transaction.", marks: 5, aiBloom: "Remember", userBloom: null, aiCO: "CO5", userCO: null, confidence: 97 },
  { id: 6, text: "Evaluate two concurrency control protocols and justify which is better.", marks: 8, aiBloom: "Evaluate", userBloom: null, aiCO: "CO6", userCO: null, confidence: 77 },
];

export default function QuestionAnalysisPage({ params }: { params: Promise<{ id: string; examId: string }> }) {
  const { id: courseId, examId } = use(params);
  const [questions, setQuestions] = useState(MOCK_QUESTIONS);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saved, setSaved] = useState(false);

  const setBloom = (id: number, bloom: BloomLevel) => {
    setQuestions(prev => prev.map(q => q.id === id ? { ...q, userBloom: bloom } : q));
  };
  const setCO = (id: number, co: string) => {
    setQuestions(prev => prev.map(q => q.id === id ? { ...q, userCO: co } : q));
  };
  const resetQ = (id: number) => {
    setQuestions(prev => prev.map(q => q.id === id ? { ...q, userBloom: null, userCO: null } : q));
  };
  const saveAll = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); setEditingId(null); };

  const totalMarks = questions.reduce((a, q) => a + q.marks, 0);

  return (
    <div className="w-full min-h-screen pb-32 pt-4">
      <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="max-w-5xl mx-auto flex flex-col gap-20">

        {/* ── HERO SECTION ── */}
        <motion.section variants={fadeSlideUp} className="flex flex-col gap-8">
          <div className="flex items-center gap-3 text-sm font-mono text-aurora uppercase tracking-widest">
            <span className="w-8 h-[1px] bg-aurora" /> Cognitive Analysis
          </div>
          <div className="flex items-end justify-between flex-wrap gap-8">
            <div className="flex-1 min-w-[300px]">
              <h1 className="text-6xl md:text-7xl font-display font-medium text-white leading-tight tracking-tight">
                Bloom's<br />
                <span className="text-white/30">Classification.</span>
              </h1>
              <p className="text-xl text-white/50 font-light mt-6 max-w-xl">
                 AI-driven taxonomy mapping for <span className="text-white">{courseId.toUpperCase()}</span> assessments.
              </p>
            </div>
            <div className="shrink-0 flex items-center gap-10 bg-white/[0.03] border border-white/10 px-8 py-6">
                <div className="text-right">
                   <p className="text-3xl font-mono text-white">{questions.length}</p>
                   <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest mt-1">Total Items</p>
                </div>
                <div className="w-[1px] h-10 bg-white/10" />
                <div className="text-right">
                   <p className="text-3xl font-mono text-aurora">91%</p>
                   <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest mt-1">Avg Confidence</p>
                </div>
            </div>
          </div>
        </motion.section>

        {/* ── DISTRIBUTION STRIP ── */}
        <motion.section variants={fadeSlideUp} className="flex flex-wrap items-center gap-16 py-8 border-y border-white/10">
           <div className="flex items-center gap-4">
              <Zap className="w-4 h-4 text-aurora" />
              <span className="text-[10px] font-mono text-white/30 uppercase tracking-widest">Cognitive Load:</span>
           </div>
           <div className="flex flex-wrap gap-12">
             {BLOOM_LEVELS.map(level => {
               const count = questions.filter(q => q.aiBloom === level).length;
               if (count === 0) return null;
               return (
                 <div key={level} className="flex flex-col items-start">
                    <span className={`text-[10px] font-mono uppercase tracking-widest ${BLOOM_COLOR[level]}`}>{level}</span>
                    <span className="text-2xl font-mono text-white mt-1">{count}</span>
                 </div>
               );
             })}
           </div>
        </motion.section>

        {/* ── ANALYSIS LIST (FLAT) ── */}
        <motion.section variants={staggerContainer} className="flex flex-col divide-y divide-white/10">
          {questions.map((q, i) => {
            const bloom = q.userBloom ?? q.aiBloom;
            const co = q.userCO ?? q.aiCO;
            const isEditing = editingId === q.id;
            const wasEdited = q.userBloom !== null || q.userCO !== null;

            return (
              <motion.div key={q.id} variants={fadeSlideUp}
                className="py-12 group transition-all hover:bg-white/[0.01]">
                
                <div className="flex flex-col md:flex-row gap-12 items-start">
                  <div className="w-12 shrink-0">
                     <span className="text-4xl font-mono text-white/10 group-hover:text-white/30 transition-colors">{i+1}</span>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-2xl font-light text-white/70 group-hover:text-white transition-colors leading-relaxed mb-8">{q.text}</p>
                    
                    <div className="flex flex-wrap items-center gap-10">
                       <div className="flex flex-col gap-2">
                          <span className="text-[10px] font-mono text-white/20 uppercase tracking-widest">Classification</span>
                          <span className={`text-sm font-mono uppercase tracking-widest ${BLOOM_COLOR[bloom]} flex items-center gap-2`}>
                             {q.userBloom ? <Edit3 className="w-3 h-3" /> : <Sparkles className="w-3 h-3 opacity-50 text-aurora" />}
                             {bloom}
                          </span>
                       </div>
                       <div className="flex flex-col gap-2">
                          <span className="text-[10px] font-mono text-white/20 uppercase tracking-widest">Alignment</span>
                          <span className="text-sm font-mono text-white/60 uppercase tracking-widest flex items-center gap-2">
                             {q.userCO ? <Edit3 className="w-3 h-3" /> : <Target className="w-3 h-3 opacity-30" />}
                             Map → {co}
                          </span>
                       </div>
                       <div className="flex flex-col gap-2">
                          <span className="text-[10px] font-mono text-white/20 uppercase tracking-widest">Value</span>
                          <span className="text-sm font-mono text-white/40 uppercase tracking-widest">{q.marks} Pts</span>
                       </div>
                    </div>

                    {/* Confidence Warning */}
                    {q.confidence < 80 && !wasEdited && (
                      <div className="mt-8 flex items-center gap-3 py-3 px-6 bg-alert/5 border-l-2 border-alert">
                         <AlertTriangle className="w-4 h-4 text-alert" />
                         <p className="text-xs font-mono text-alert uppercase tracking-widest">Low Confidence Detection • Manual Override Advised</p>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-4 shrink-0 transition-all">
                    {!isEditing ? (
                       <button onClick={() => setEditingId(q.id)}
                         className="px-6 py-3 border border-white/5 text-white/20 hover:border-white hover:text-white text-xs font-mono uppercase tracking-widest transition-all">
                         Override
                       </button>
                    ) : (
                       <button onClick={() => setEditingId(null)}
                         className="px-6 py-3 bg-white text-black text-xs font-mono uppercase tracking-widest hover:bg-white/90 transition-all">
                         Finalize
                       </button>
                    )}
                    {wasEdited && (
                       <button onClick={() => resetQ(q.id)} className="w-12 h-12 flex items-center justify-center border border-white/5 text-aurora/30 hover:text-aurora hover:border-aurora/40 transition-all">
                         <RefreshCcw className="w-4 h-4" />
                       </button>
                    )}
                  </div>
                </div>

                {/* EDITING DRAWER */}
                <AnimatePresence>
                  {isEditing && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden pl-24 pt-12">
                      <div className="flex flex-col gap-10 bg-white/[0.02] border border-white/5 p-10">
                        <div>
                          <p className="text-[10px] font-mono text-white/20 uppercase tracking-widest mb-6">Recalibrate Cognitive Complexity</p>
                          <div className="flex flex-wrap gap-4">
                            {BLOOM_LEVELS.map(level => (
                              <button key={level} onClick={() => setBloom(q.id, level)}
                                className={`px-6 py-3 border text-[10px] font-mono uppercase tracking-widest transition-all ${
                                  bloom === level ? `border-white bg-white text-black` : "border-white/5 text-white/20 hover:text-white/60 hover:border-white/20"
                                }`}>
                                {level}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="text-[10px] font-mono text-white/20 uppercase tracking-widest mb-6">Redirect Target Outcome</p>
                          <div className="flex gap-4">
                            {["CO1","CO2","CO3","CO4","CO5","CO6"].map(c => (
                              <button key={c} onClick={() => setCO(q.id, c)}
                                className={`w-16 h-12 border text-xs font-mono uppercase tracking-widest transition-all ${
                                  co === c ? "border-brand text-brand bg-brand/5" : "border-white/5 text-white/20 hover:border-white/20"
                                }`}>
                                {c}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </motion.section>

        {/* ── FOOTER ACTIONS ── */}
        <motion.section variants={fadeSlideUp} className="flex flex-col md:flex-row items-center justify-between gap-12 pt-12 border-t border-white/10">
           <div className="flex items-start gap-4">
              <Info className="w-4 h-4 text-white/20 mt-1" />
              <p className="text-white/30 text-sm font-light max-w-md leading-relaxed">
                 AI classification utilizes <span className="text-white">BloomBERT™ 4.0</span> models. Accuracy benchmarks indicate 98.2% alignment with discipline-specific pedagogical standards.
              </p>
           </div>
           <div className="flex items-center gap-10">
              <span className="text-white/20 font-mono text-[10px] uppercase tracking-widest">
                {questions.filter(q => q.userBloom !== null).length}/{questions.length} Changes Staged
              </span>
              <button onClick={saveAll}
                className="group flex items-center gap-8 px-16 py-6 bg-white text-black font-medium text-sm hover:bg-white/95 transition-all uppercase tracking-[0.2em] font-mono">
                {saved ? "Analysis Commited ✓" : "Commit Audit"}
                {!saved && <ArrowRight className="w-5 h-5 group-hover:translate-x-3 transition-transform" />}
              </button>
           </div>
        </motion.section>

      </motion.div>
    </div>
  );
}
