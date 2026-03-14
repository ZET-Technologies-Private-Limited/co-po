"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  CheckCircle2, XCircle, ChevronLeft, Eye, 
  Search, Filter, ArrowRight, MessageSquare,
  Lock, AlertTriangle, Check
} from "lucide-react";
import Link from "next/link";
import { fadeSlideUp, staggerContainer } from "@/lib/animations";

// ─── MOCK DATA ───────────────────────────────────────────────────────────
const PENDING_SUBMISSIONS = [
  { id: "sub_1", course: "CS301", exam: "T2", faculty: "Anita Nair", submitted: "2h ago", students: 58 },
  { id: "sub_2", course: "CS303", exam: "T1", faculty: "S. Kapoor", submitted: "Yesterday", students: 45 },
];

export default function LeadMarksApprovalPage() {
  const [selected, setSelected] = useState<typeof PENDING_SUBMISSIONS[0] | null>(null);
  const [comment, setComment] = useState("");
  const [isApproving, setIsApproving] = useState(false);
  const [isReturning, setIsReturning] = useState(false);

  const handleAction = (type: 'approve' | 'return') => {
    if (type === 'approve') setIsApproving(true);
    else setIsReturning(true);

    setTimeout(() => {
      setSelected(null);
      setIsApproving(false);
      setIsReturning(false);
      setComment("");
    }, 1500);
  };

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="max-w-6xl mx-auto pb-32">
      
      {/* ── HEADER ── */}
      <motion.div variants={fadeSlideUp} className="mb-12">
        <h1 className="text-4xl font-display text-white mb-2">Marks Approval Hub</h1>
        <p className="text-white/40 font-light">Lead Approval Multi-step Workflow</p>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-12">
        
        {/* ── QUEUE (Left Panel) ── */}
        <div className="lg:col-span-1 flex flex-col gap-4">
          <h3 className="text-xs font-mono text-white/20 uppercase tracking-[0.2em] mb-4">Pending Submissions</h3>
          {PENDING_SUBMISSIONS.map(sub => (
            <button 
              key={sub.id}
              onClick={() => setSelected(sub)}
              className={`p-6 border text-left transition-all relative ${
                selected?.id === sub.id ? 'border-brand bg-brand/5' : 'border-white/10 bg-white/[0.01] hover:border-white/30'
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <span className="text-[10px] font-mono text-white/30 uppercase">{sub.exam}</span>
                <span className="text-[10px] font-mono text-white/20">{sub.submitted}</span>
              </div>
              <p className="text-lg font-display text-white mb-1">{sub.course}</p>
              <p className="text-xs text-white/40 font-light italic">by {sub.faculty}</p>
              
              {selected?.id === sub.id && (
                <div className="absolute right-6 bottom-6 w-10 h-10 rounded-full bg-brand/10 flex items-center justify-center text-brand">
                   <ArrowRight className="w-4 h-4" />
                </div>
              )}
            </button>
          ))}
        </div>

        {/* ── DETAIL VIEW (Spec: Lead Page 2 workflow) ── */}
        <div className="lg:col-span-2 min-h-[600px]">
          <AnimatePresence mode="wait">
            {!selected ? (
              <motion.div 
                key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="h-full border border-dashed border-white/10 flex flex-col items-center justify-center gap-4 text-white/10"
              >
                <Filter className="w-12 h-12" />
                <p className="font-mono text-[10px] uppercase tracking-widest">Select a submission to review</p>
              </motion.div>
            ) : (
              <motion.div 
                key="detail" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="flex flex-col gap-8"
              >
                {/* 1. Open Submission (Spec) */}
                <div className="p-8 border border-white/10 bg-white/[0.02]">
                  <div className="flex justify-between items-center mb-8">
                     <h2 className="text-2xl font-display text-white">{selected.course} — {selected.exam} Detail</h2>
                     <span className="px-3 py-1 bg-brand/10 border border-brand/30 text-brand font-mono text-[10px] uppercase tracking-widest">Read Only Mode</span>
                  </div>

                  {/* 2. Review Marks (Spec) - Simplified Table */}
                  <div className="border border-white/5 overflow-hidden mb-8">
                    <table className="w-full text-left font-mono text-[10px]">
                      <thead className="bg-white/[0.05]">
                        <tr>
                          <th className="px-4 py-3">Roll No</th>
                          <th className="px-4 py-3">Q1 (5)</th>
                          <th className="px-4 py-3">Q2 (5)</th>
                          <th className="px-4 py-3">Q3a (10)</th>
                          <th className="px-4 py-3">Total (20)</th>
                        </tr>
                      </thead>
                      <tbody className="text-white/40 divide-y divide-white/5">
                        <tr className="hover:bg-brand/5 hover:text-white transition-colors">
                          <td className="px-4 py-3">21CSE001</td><td className="px-4 py-3 italic">5</td><td className="px-4 py-3 italic">4</td><td className="px-4 py-3 italic">9</td><td className="px-4 py-3 font-bold text-attain">18</td>
                        </tr>
                        <tr className="hover:bg-brand/5 hover:text-white transition-colors">
                          <td className="px-4 py-3">21CSE002</td><td className="px-4 py-3 italic">3</td><td className="px-4 py-3 italic">2</td><td className="px-4 py-3 italic">7</td><td className="px-4 py-3 font-bold text-amber-400">12</td>
                        </tr>
                        <tr><td colSpan={5} className="px-4 py-3 text-center text-white/10">... +{selected.students - 2} more students</td></tr>
                      </tbody>
                    </table>
                  </div>

                  {/* 3. Check CO Preview (Spec) */}
                  <div className="p-6 bg-white/[0.01] border border-white/5">
                     <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest mb-4">Calculated CO Impact (Estimated)</p>
                     <div className="grid grid-cols-4 gap-4">
                        <div className="flex flex-col gap-1">
                          <span className="text-xs text-brand font-bold">CO1</span>
                          <span className="text-lg text-white font-mono leading-none">82%</span>
                          <span className="text-[9px] text-attain font-mono">Level 3</span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-xs text-brand font-bold">CO2</span>
                          <span className="text-lg text-white font-mono leading-none">68%</span>
                          <span className="text-[9px] text-attain font-mono">Level 3</span>
                        </div>
                        <div className="flex flex-col gap-1 opacity-20">
                          <span className="text-xs font-bold text-white/50">CO3</span>
                          <span className="text-lg text-white/50 font-mono leading-none">0%</span>
                        </div>
                     </div>
                  </div>
                </div>

                {/* 4. Action Controls (Spec 4a/4b) */}
                <div className="p-8 border border-white/10 bg-white/[0.03] flex flex-col gap-6">
                   <div className="flex flex-col gap-2">
                     <label className="text-[10px] font-mono text-white/30 uppercase tracking-widest">Comments (Required for Return)</label>
                     <textarea 
                       value={comment}
                       onChange={e => setComment(e.target.value)}
                       placeholder="Enter approval feedback or mention required corrections..."
                       className="bg-cosmic/50 border border-white/10 p-4 text-white text-sm min-h-[100px] outline-none focus:border-brand transition-colors font-light"
                     />
                   </div>

                   <div className="flex gap-4">
                      {/* Approve button (Spec 4a) */}
                      <button 
                        onClick={() => handleAction('approve')}
                        disabled={isApproving || isReturning}
                        className="flex-1 py-4 bg-attain text-white font-mono text-xs uppercase tracking-widest hover:bg-attain/90 transition-all flex items-center justify-center gap-3"
                      >
                        {isApproving ? "Finalizing..." : <><CheckCircle2 className="w-4 h-4" /> Approve & Lock Marks</>}
                      </button>

                      {/* Return button (Spec 4b) */}
                      <button 
                        onClick={() => handleAction('return')}
                        disabled={isApproving || isReturning || !comment}
                        className="px-8 border border-alert/30 text-alert font-mono text-xs uppercase tracking-widest hover:bg-alert hover:text-white transition-all flex items-center justify-center gap-3 disabled:opacity-20"
                      >
                         {isReturning ? "Returning..." : <><XCircle className="w-4 h-4" /> Return to Faculty</>}
                      </button>
                   </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
