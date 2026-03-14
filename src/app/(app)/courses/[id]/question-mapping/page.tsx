"use client";

import { use, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FileUp, Search, BrainCircuit, Sparkles, 
  CheckCircle2, AlertCircle, ChevronLeft, 
  Target, Award, Download, ArrowRight,
  Info, Loader2, Link2
} from "lucide-react";
import Link from "next/link";
import { fadeSlideUp, staggerContainer } from "@/lib/animations";

// ─── MOCK DATA ───────────────────────────────────────────────────────────
const QUESTIONS = [
  { id: 1, text: "Explain the ACID properties of database transactions.", co: "CO4", bt: "L2 — Understand", confidence: 94 },
  { id: 2, text: "Write a SQL query to find employees earning more than their managers.", co: "CO2", bt: "L3 — Apply", confidence: 88 },
  { id: 3, text: "Design a B+ tree index structure for the given dataset.", co: "CO3", bt: "L4 — Analyze", confidence: 72 },
];

export default function AIQuestionMapperPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState<typeof QUESTIONS>([]);

  const handleBulkUpload = () => {
    setAnalyzing(true);
    setTimeout(() => {
      setAnalyzing(false);
      setResults(QUESTIONS);
    }, 2500);
  };

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="max-w-6xl mx-auto pb-32">
      
      {/* ── HEADER ── */}
      <motion.div variants={fadeSlideUp} className="mb-12">
        <Link href={`/courses/${id}/exams`} className="flex items-center gap-2 text-white/40 hover:text-white transition-colors text-xs font-mono uppercase tracking-widest mb-8">
          <ChevronLeft className="w-4 h-4" /> Back to Exams
        </Link>
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-display text-white mb-2">AI Question Analyser</h1>
            <p className="text-white/40 font-light italic">Bulk analysis of Bloom's levels and CO mapping</p>
          </div>
          <div className="flex gap-4">
             <button 
               onClick={handleBulkUpload}
               className="px-8 py-3 bg-brand text-white font-mono text-[10px] uppercase tracking-widest hover:bg-brand/90 transition-all flex items-center gap-3"
             >
                <FileUp className="w-4 h-4" /> Upload Question Paper PDF
             </button>
          </div>
        </div>
      </motion.div>

      {/* ── ANALYSIS GRID (Spec: Faculty Page 5) ── */}
      <div className="grid lg:grid-cols-3 gap-12">
        
        {/* Bulk Results Table */}
        <div className="lg:col-span-2 flex flex-col gap-6">
           <h3 className="text-xs font-mono text-white/30 uppercase tracking-[0.2em] flex items-center gap-2">
             <BrainCircuit className="w-4 h-4" /> Extraction Results
           </h3>

           <div className="border border-white/10 overflow-hidden">
             <table className="w-full text-left font-mono text-[10px]">
               <thead className="bg-white/[0.03] border-b border-white/10">
                 <tr>
                   <th className="px-6 py-4 text-white/30 uppercase tracking-widest font-normal">Question Text</th>
                   <th className="px-6 py-4 text-white/30 uppercase tracking-widest font-normal">Mapping</th>
                   <th className="px-6 py-4 text-white/30 uppercase tracking-widest font-normal text-right">Confidence</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-white/5">
                 {analyzing ? (
                   <tr>
                     <td colSpan={3} className="py-24 text-center">
                        <Loader2 className="w-8 h-8 animate-spin text-brand mx-auto mb-4" />
                        <p className="text-[10px] uppercase font-mono text-white/20 tracking-widest">AI Engine parsing PDF structure...</p>
                     </td>
                   </tr>
                 ) : results.length === 0 ? (
                   <tr>
                     <td colSpan={3} className="py-24 text-center text-white/10 italic">
                        No questions analyzed yet.
                     </td>
                   </tr>
                 ) : (
                   results.map((q, i) => (
                     <tr key={i} className="hover:bg-white/[0.01] transition-colors group">
                       <td className="px-6 py-6 text-white/50 italic leading-relaxed max-w-sm">"{q.text}"</td>
                       <td className="px-6 py-6 font-mono">
                          <div className="flex flex-col gap-1.5">
                             <span className="text-brand flex items-center gap-1.5"><Target className="w-3 h-3" /> {q.co}</span>
                             <span className="text-white/30 flex items-center gap-1.5"><Award className="w-3 h-3" /> {q.bt}</span>
                          </div>
                       </td>
                       <td className="px-6 py-6 text-right">
                          <div className="flex flex-col items-end gap-1">
                             <span className={`text-xs ${q.confidence > 80 ? 'text-attain' : 'text-amber-500'}`}>{q.confidence}%</span>
                             <div className="w-12 h-0.5 bg-white/5">
                                <div className={`h-full ${q.confidence > 80 ? 'bg-attain' : 'bg-amber-500'}`} style={{ width: `${q.confidence}%` }} />
                             </div>
                          </div>
                       </td>
                     </tr>
                   ))
                 )}
               </tbody>
             </table>
           </div>
        </div>

        {/* Coverage Sidebar (Spec Page 5) */}
        <div className="flex flex-col gap-8">
           <div className="p-8 border border-white/10 bg-white/[0.02]">
              <h3 className="text-sm font-display text-white mb-6 uppercase tracking-widest flex items-center gap-2">
                <BarChart className="w-4 h-4 text-brand" /> CO Coverage
              </h3>
              <div className="flex flex-col gap-4">
                 {["CO1", "CO2", "CO3", "CO4"].map(co => (
                   <div key={co} className="flex flex-col gap-2">
                      <div className="flex justify-between text-[10px] font-mono">
                         <span className="text-white/40">{co} Coverage</span>
                         <span className="text-white">{results.filter(r => r.co === co).length > 0 ? '25%' : '0%'}</span>
                      </div>
                      <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                         <div className={`h-full bg-brand`} style={{ width: results.filter(r => r.co === co).length > 0 ? '25%' : '0%' }} />
                      </div>
                   </div>
                 ))}
                 <div className="mt-4 p-4 bg-alert/5 border border-alert/10 flex gap-3 items-start">
                    <AlertCircle className="w-4 h-4 text-alert shrink-0" />
                    <p className="text-[9px] text-white/40 leading-relaxed font-mono italic">
                      Warning: CO5 and CO6 have 0% coverage in this assessment.
                    </p>
                 </div>
              </div>
           </div>

           <div className="p-8 border border-white/5 bg-white/[0.01]">
              <h3 className="text-[10px] font-mono text-white/20 uppercase tracking-widest mb-4">Heuristics</h3>
              <p className="text-[10px] text-white/40 leading-relaxed font-mono">
                AI uses keyword extraction vs Bloom's dictionary to predict mapping. Confidence scores reflect semantic proximity between question text and CO descriptors.
              </p>
           </div>
        </div>

      </div>
    </motion.div>
  );
}

function BarChart({ className }: { className?: string }) {
  return <path className={className} d="M12 20V10M18 20V4M6 20v-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />;
}
