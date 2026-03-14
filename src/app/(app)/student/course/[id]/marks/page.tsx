"use client";

import { use, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronLeft, FileText, Send, AlertCircle, 
  HelpCircle, CheckCircle2, MessageSquare, Info, Target, Award
} from "lucide-react";
import Link from "next/link";
import { fadeSlideUp, staggerContainer } from "@/lib/animations";

// ─── MOCK DATA ───────────────────────────────────────────────────────────
const MARKS_DETAIL = {
  courseId: "cs301", code: "CS301", name: "Database Management Systems",
  exam: "T1 - Unit Test 1",
  questions: [
    { qno: "Q1", marks: 5, max: 5, co: "CO1", bt: "L2 - Understand", text: "Explain the three-schema architecture of DBMS." },
    { qno: "Q2", marks: 4, max: 5, co: "CO1", bt: "L1 - Remember", text: "Define Data Independence." },
    { qno: "Q3a", marks: 9, max: 10, co: "CO2", bt: "L3 - Apply", text: "Create an ER diagram for a Hospital Management System.", choice: "attempted" },
    { qno: "Q3b", marks: 0, max: 10, co: "CO2", bt: "L3 - Apply", text: "Create an ER diagram for a Library Management System.", choice: "alternate" },
  ]
};

export default function StudentMarksDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [showGrievance, setShowGrievance] = useState(false);
  const [grievanceText, setGrievanceText] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmitGrievance = () => {
    setSubmitted(true);
    setTimeout(() => {
      setShowGrievance(false);
      setSubmitted(false);
      setGrievanceText("");
    }, 2000);
  };

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="max-w-5xl mx-auto pb-32">
      
      {/* ── HEADER ── */}
      <motion.div variants={fadeSlideUp} className="mb-12">
        <Link href={`/student/course/${id}/co-attainment`} className="flex items-center gap-2 text-white/40 hover:text-white transition-colors text-xs font-mono uppercase tracking-widest mb-8">
          <ChevronLeft className="w-4 h-4" /> Back to CO Attainment
        </Link>
        <div className="flex items-end justify-between">
          <div>
            <div className="flex items-center gap-3 text-sm font-mono text-cyan-400 uppercase tracking-widest mb-2">
              <FileText className="w-4 h-4" /> Exam Performance
            </div>
            <h1 className="text-4xl font-display text-white">{MARKS_DETAIL.name}</h1>
            <p className="text-white/40 font-light mt-2">{MARKS_DETAIL.exam}</p>
          </div>
          <button 
            onClick={() => setShowGrievance(true)}
            className="px-6 py-3 bg-white/5 border border-white/10 text-white/60 text-[10px] font-mono uppercase tracking-widest hover:border-brand hover:text-brand transition-all flex items-center gap-2"
          >
            <MessageSquare className="w-3.5 h-3.5" /> Raise Grievance
          </button>
        </div>
      </motion.div>

      {/* ── QUESTION TABLE (Spec: Student Page 4) ── */}
      <motion.section variants={fadeSlideUp} className="flex flex-col gap-6">
        <div className="border border-white/10 overflow-hidden">
          <table className="w-full text-left font-mono text-xs">
            <thead className="bg-white/[0.03] border-b border-white/10">
              <tr>
                <th className="px-6 py-4 text-white/30 uppercase tracking-widest font-normal">Q#</th>
                <th className="px-6 py-4 text-white/30 uppercase tracking-widest font-normal">Mapping (CO | BT)</th>
                <th className="px-6 py-4 text-white/30 uppercase tracking-widest font-normal">Score</th>
                <th className="px-6 py-4 text-white/30 uppercase tracking-widest font-normal">Question Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-light">
              {MARKS_DETAIL.questions.map((q, i) => (
                <tr key={i} className={`hover:bg-white/[0.02] transition-colors group ${q.choice === "alternate" ? "opacity-30" : ""}`}>
                  <td className="px-6 py-6 text-white font-medium align-top">
                    {q.qno}
                    {q.choice === "alternate" && <p className="text-[9px] text-white/30 mt-1 uppercase">OR</p>}
                  </td>
                  <td className="px-6 py-6 align-top">
                    <div className="flex flex-col gap-2">
                      <span className="inline-flex items-center gap-1.5 text-cyan-400">
                        <Target className="w-3 h-3" /> {q.co}
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-white/40">
                        <Award className="w-3 h-3" /> {q.bt}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-6 align-top">
                    <span className="text-white text-lg">{q.choice === "alternate" ? "—" : q.marks}</span>
                    <span className="text-white/20"> / {q.max}</span>
                  </td>
                  <td className="px-6 py-6 text-white/50 max-w-sm leading-relaxed align-top italic">
                    {q.text}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.section>

      {/* ── ANALYSIS LEGEND ── */}
      <motion.section variants={fadeSlideUp} className="mt-8 grid md:grid-cols-2 gap-8">
         <div className="p-6 border border-white/5 bg-white/[0.01]">
           <h4 className="text-[10px] font-mono text-white/30 uppercase tracking-widest mb-4 flex items-center gap-2">
             <Info className="w-3 h-3" /> About Bloom's Levels
           </h4>
           <div className="flex flex-col gap-3">
             <p className="text-[10px] text-white/40 leading-relaxed font-mono">
               <span className="text-white/60">L1/L2:</span> Foundational knowledge (Remember/Understand)
             </p>
             <p className="text-[10px] text-white/40 leading-relaxed font-mono">
               <span className="text-white/60">L3/L4:</span> Application & Analysis skills
             </p>
             <p className="text-[10px] text-white/40 leading-relaxed font-mono">
               <span className="text-white/60">L5/L6:</span> Higher-order evaluation and creative design
             </p>
           </div>
         </div>
      </motion.section>

      {/* ── GRIEVANCE MODAL ── */}
      <AnimatePresence>
        {showGrievance && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-8 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 10 }}
              className="w-full max-w-lg bg-[#0a0a0f] border border-white/10 p-10 relative"
            >
              <button 
                onClick={() => setShowGrievance(false)}
                className="absolute top-6 right-6 text-white/20 hover:text-white transition-colors font-mono text-xs"
              >
                Close
              </button>
              
              <h3 className="text-2xl font-display text-white mb-2 flex items-center gap-3">
                <AlertCircle className="w-6 h-6 text-brand" /> Raise Grievance
              </h3>
              <p className="text-white/40 font-light mb-8 text-sm">
                If you believe a question was marked incorrectly, provide a specific reason below. This will be sent directly to <span className="text-white/60">{MARKS_DETAIL.courseId === "cs301" ? "Prof. Anita Nair" : "Course Faculty"}</span>.
              </p>

              {submitted ? (
                <div className="py-12 flex flex-col items-center gap-4">
                  <CheckCircle2 className="w-12 h-12 text-attain" />
                  <p className="text-attain font-mono uppercase tracking-widest text-sm">Grievance Submitted</p>
                </div>
              ) : (
                <div className="flex flex-col gap-6">
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-mono text-white/30 uppercase tracking-widest">Description</label>
                    <textarea 
                      value={grievanceText}
                      onChange={e => setGrievanceText(e.target.value)}
                      placeholder="E.g. Q3a was marked 9/10, but I believe it follows all normalization rules..."
                      className="bg-white/5 border border-white/10 p-4 text-white text-sm min-h-[150px] outline-none focus:border-brand transition-colors font-light"
                    />
                  </div>
                  <button 
                    onClick={handleSubmitGrievance}
                    disabled={!grievanceText}
                    className="w-full py-4 bg-brand text-white font-medium text-sm hover:bg-brand/90 transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                  >
                    Send to Faculty <Send className="w-4 h-4" />
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}

