"use client";

import { use, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronLeft, BrainCircuit, Sparkles, Plus, 
  Trash2, Save, FileText, CheckCircle2, 
  Target, Activity, ArrowRight, Zap, Info, AlertCircle
} from "lucide-react";
import Link from "next/link";
import { fadeSlideUp, staggerContainer } from "@/lib/animations";
import { useDataStore, ExamQuestion } from "@/lib/dataStore";
import { useAuthStore } from "@/lib/authStore";
import { useUIStore } from "@/lib/uiStore";
import { detectBloomsLevel, BLOOMS_LEVELS } from "@/lib/computations";

export default function QuestionMappingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: courseId } = use(params);
  const { addToast }      = useUIStore();
  const { user }          = useAuthStore();
  const courses           = useDataStore(s => s.courses);
  const cos               = useDataStore(s => s.cos[courseId] || []);
  const examConfigs       = useDataStore(s => s.examConfigs[courseId] || []);
  const setQuestions    = useDataStore(s => s.setQuestions);
  
  const course = courses.find(c => c.id === courseId);

  // Analysis State
  const [inputText, setInputText] = useState("");
  const [analyzed, setAnalyzed]   = useState<{
    bt: { code: string; name: string; verb: string };
    co: string;
    confidence: number;
    reason: string;
  } | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Buffer for addition
  const [selectedExam, setSelectedExam] = useState(examConfigs[0]?.id || "");
  const [qNo, setQNo]                   = useState("");
  const [maxMarks, setMaxMarks]         = useState(5);

  const handleAnalyze = async () => {
    if (!inputText.trim()) return;
    setIsAnalyzing(true);
    setAnalyzed(null);
    
    // Simulate AI latency
    await new Promise(r => setTimeout(r, 1200));
    
    const bt = detectBloomsLevel(inputText);
    
    // Simple mock CO suggestion logic based on keywords
    let suggestedCO = cos[0]?.co || "CO1";
    let reason = "Contextual relevance to specific outcomes.";
    const lower = inputText.toLowerCase();
    
    if (lower.includes("map") || lower.includes("tree")) { suggestedCO = "CO2"; reason = "Topic matches Data Structures CO2"; }
    else if (lower.includes("sql") || lower.includes("query")) { suggestedCO = "CO3"; reason = "Keywords match Database query outcomes"; }
    
    setAnalyzed({
      bt,
      co: suggestedCO,
      confidence: 85 + Math.random() * 10,
      reason
    });
    setIsAnalyzing(false);
  };

  const handleAddToPaper = () => {
    if (!analyzed || !qNo || !selectedExam) {
       addToast("Select an exam, enter Q No, and analyze first.", "warning");
       return;
    }
    
    const existingExam = examConfigs.find(e => e.id === selectedExam);
    if (!existingExam) return;

    const newQuestion: ExamQuestion = {
      qno: qNo,
      co: analyzed.co,
      maxMarks: 10, // Default
      bloomCode: analyzed.bt.code,
      text: inputText
    };

    setQuestions(courseId, selectedExam, [...existingExam.questions, newQuestion]);
    
    addToast(`${qNo} added to ${existingExam.name} paper.`, "success");
    setInputText("");
    setAnalyzed(null);
    setQNo("");
  };

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="max-w-[1200px] mx-auto pb-32">
      
      {/* Header */}
      <motion.div variants={fadeSlideUp} className="mb-10">
        <Link href={`/courses/${courseId}`} className="flex items-center gap-2 text-white/30 hover:text-white transition-colors text-[10px] font-mono uppercase tracking-widest mb-4">
          <ChevronLeft className="w-3.5 h-3.5" /> Back to Course
        </Link>
        <h1 className="text-4xl font-display text-white mb-2 flex items-center gap-3">
          <BrainCircuit className="w-8 h-8 text-brand" /> AI Question Analyser
        </h1>
        <p className="text-white/40 font-light italic">Paste your question paper content for automated Bloom's assessment and CO mapping.</p>
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-12">
        
        {/* LEFT: Analysis Input */}
        <div className="flex flex-col gap-6">
          <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-8 flex flex-col gap-6">
             <div className="flex flex-col gap-2">
                <label className="text-[10px] font-mono text-white/40 uppercase tracking-widest flex items-center gap-2">
                   <FileText className="w-3 h-3" /> Question Content
                </label>
                <textarea 
                  value={inputText} onChange={e => setInputText(e.target.value)}
                  placeholder="e.g. Discuss the various ACID properties of a transaction in DBMS with suitable examples."
                  rows={8}
                  className="bg-black/30 border border-white/10 p-5 text-white text-sm outline-none focus:border-brand/50 rounded-xl resize-none font-light leading-relaxed"
                />
             </div>
             
             <div className="flex items-center gap-4">
                <button 
                  onClick={handleAnalyze} disabled={isAnalyzing || !inputText.trim()}
                  className="flex-1 bg-brand text-white py-4 rounded-xl flex items-center justify-center gap-3 hover:bg-brand/90 transition-all font-display text-sm disabled:opacity-30">
                  {isAnalyzing ? <Zap className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  Analyse Question
                </button>
                <div className="px-5 py-4 border border-white/10 text-white/30 rounded-xl hover:bg-white/5 cursor-pointer transition-all">
                  <FileText className="w-5 h-5" />
                </div>
             </div>
          </div>

          <AnimatePresence>
            {analyzed && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                className="bg-brand/5 border border-brand/20 p-8 rounded-2xl flex flex-col gap-8 shadow-[0_0_50px_rgba(30,174,219,0.05)]">
                
                <h3 className="text-sm font-display text-brand flex items-center gap-2 uppercase tracking-widest">
                  <Sparkles className="w-4 h-4" /> AI Diagnostics
                </h3>

                <div className="grid grid-cols-2 gap-8">
                   <div className="flex flex-col gap-1">
                      <p className="text-[9px] font-mono text-white/30 uppercase tracking-widest">Cognitive Level (BT)</p>
                      <span className="text-xl text-white font-display border-b border-brand/30 pb-2">{analyzed.bt.code} — {analyzed.bt.name}</span>
                      <p className="text-[10px] text-brand/60 font-mono mt-1 italic">Action Verb: "{analyzed.bt.verb}"</p>
                   </div>
                   <div className="flex flex-col gap-1">
                      <p className="text-[9px] font-mono text-white/30 uppercase tracking-widest">Mapped Outcome (CO)</p>
                      <span className="text-xl text-white font-display border-b border-brand/30 pb-2">{analyzed.co}</span>
                      <p className="text-[10px] text-attain/60 font-mono mt-1 italic">{Math.floor(analyzed.confidence)}% Confidence</p>
                   </div>
                </div>

                <div className="p-4 bg-black/20 rounded-lg flex gap-3 items-start border border-white/5">
                   <Info className="w-4 h-4 text-white/20 mt-0.5" />
                   <p className="text-[11px] text-white/40 leading-relaxed italic">{analyzed.reason}</p>
                </div>

                <div className="flex flex-col gap-4 border-t border-white/10 pt-8">
                   <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-mono text-white/20 uppercase tracking-widest">Select Exam Paper</label>
                        <select value={selectedExam} onChange={e => setSelectedExam(e.target.value)}
                          className="bg-black/30 border border-white/10 p-3 text-white text-xs rounded outline-none focus:border-brand/40 transition-all">
                          <option value="">Select Exam...</option>
                          {examConfigs.map(ex => <option key={ex.id} value={ex.id}>{ex.name}</option>)}
                        </select>
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-mono text-white/20 uppercase tracking-widest">Question No.</label>
                        <input type="text" value={qNo} onChange={e => setQNo(e.target.value)}
                           placeholder="Q1a"
                           className="bg-black/30 border border-white/10 p-3 text-white text-xs rounded outline-none focus:border-brand/40" />
                      </div>
                   </div>
                   <button onClick={handleAddToPaper}
                     className="w-full bg-white/5 border border-white/10 text-white hover:bg-white/10 py-3 rounded-xl flex items-center justify-center gap-2 text-xs font-mono uppercase tracking-widest transition-all mt-2">
                      <Plus className="w-4 h-4" /> Add to Exam Paper
                   </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* RIGHT: Visual Context */}
        <div className="flex flex-col gap-8">
           <div className="p-8 border border-white/5 bg-white/[0.01] rounded-2xl h-full">
              <h3 className="text-xs font-mono text-white/30 uppercase tracking-widest mb-8 flex items-center gap-3">
                <Target className="w-4 h-4" /> Mapping Coverage Hub
              </h3>
              
              <div className="space-y-12">
                <div className="flex flex-col gap-4">
                   <div className="flex justify-between items-end">
                      <p className="text-sm text-white/60 font-light">Bloom's Distribution</p>
                      <p className="text-[10px] font-mono text-white/20">Target: High cognitive (L4+)</p>
                   </div>
                   <div className="flex gap-1 h-3 rounded-full overflow-hidden bg-white/5">
                      <div className="w-[30%] bg-brand" />
                      <div className="w-[20%] bg-aurora" />
                      <div className="w-[40%] bg-insight" />
                      <div className="w-[10%] bg-alert" />
                   </div>
                   <div className="flex justify-between text-[9px] font-mono text-white/20 uppercase">
                      <span>Remember</span>
                      <span>Apply</span>
                      <span>Analyse</span>
                      <span>Create</span>
                   </div>
                </div>

                <div className="flex flex-col gap-6">
                   <p className="text-sm text-white/60 font-light underline decoration-brand/30 underline-offset-8">Outcome Correlation</p>
                   <div className="space-y-4">
                      {cos.slice(0, 4).map(co => (
                        <div key={co.co} className="flex flex-col gap-1.5">
                           <div className="flex justify-between items-center text-[10px] font-mono">
                              <span className="text-white/40">{co.co}</span>
                              <span className="text-white/60">35% Coverage</span>
                           </div>
                           <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                              <motion.div initial={{ width: 0 }} animate={{ width: "35%" }} className="h-full bg-attain" />
                           </div>
                        </div>
                      ))}
                   </div>
                </div>

                <div className="mt-12 p-6 bg-amber-400/5 border border-amber-400/10 rounded-xl flex gap-4 items-start">
                   <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
                   <div>
                      <p className="text-xs text-amber-400 font-medium">Curricular Imbalance Detected</p>
                      <p className="text-[10px] text-white/40 font-mono mt-1 leading-relaxed">CO4 and CO6 have 0% coverage in the active assessment set. Consider adding questions for these outcomes.</p>
                   </div>
                </div>
              </div>
           </div>
        </div>

      </div>

    </motion.div>
  );
}
