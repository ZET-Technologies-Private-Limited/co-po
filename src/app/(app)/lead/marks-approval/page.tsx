"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, RotateCcw, AlertCircle, ChevronDown, ChevronUp, Loader2, MessageSquare } from "lucide-react";
import { fadeSlideUp, staggerContainer } from "@/lib/animations";
import { useDataStore } from "@/lib/dataStore";
import { useAuthStore } from "@/lib/authStore";
import { useUIStore } from "@/lib/uiStore";

export default function LeadMarksApprovalPage() {
  const { user }             = useAuthStore();
  const { addToast }         = useUIStore();
  const submissions          = useDataStore(s => s.submissions);
  const courses              = useDataStore(s => s.courses);
  const examConfigs          = useDataStore(s => s.examConfigs);
  const approveSubmission    = useDataStore(s => s.approveSubmission);
  const returnSubmission     = useDataStore(s => s.returnSubmission);

  const [expanded, setExpanded]       = useState<string | null>(null);
  const [returnReason, setReturnReason] = useState("");
  const [actionId, setActionId]       = useState<string | null>(null);
  const [loading, setLoading]         = useState(false);
  const [showReturnModal, setShowReturnModal] = useState<{ courseId: string; examId: string } | null>(null);

  // Gather all pending submissions across all courses
  const pendingItems = useMemo(() => {
    const items: { course: any; exam: any; sub: any; key: string }[] = [];
    for (const course of courses) {
      const subs = submissions[course.id] || [];
      const exams = examConfigs[course.id] || [];
      for (const sub of subs) {
        if (sub.status === "pending") {
          const exam = exams.find(e => e.id === sub.examId);
          items.push({ course, exam, sub, key: `${course.id}-${sub.examId}` });
        }
      }
    }
    return items;
  }, [submissions, courses, examConfigs]);

  const handleApprove = async (courseId: string, examId: string) => {
    setLoading(true); setActionId(`${courseId}-${examId}`);
    await new Promise(r => setTimeout(r, 700));
    approveSubmission(courseId, examId, user?.id || "lead");
    setLoading(false); setActionId(null);
    addToast("Marks approved and locked. Students will be notified.", "success");
  };

  const handleReturn = async () => {
    if (!showReturnModal) return;
    if (!returnReason.trim()) { addToast("Please provide a reason for returning.", "warning"); return; }
    setLoading(true);
    await new Promise(r => setTimeout(r, 600));
    returnSubmission(showReturnModal.courseId, showReturnModal.examId, returnReason.trim());
    setLoading(false);
    setShowReturnModal(null);
    setReturnReason("");
    addToast("Marks returned to faculty for correction.", "info");
  };

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="max-w-5xl mx-auto pb-32">
      
      <motion.div variants={fadeSlideUp} className="mb-10">
        <h1 className="text-4xl font-display text-white mb-2">Marks Approval Queue</h1>
        <p className="text-white/40 font-light">{pendingItems.length} submission{pendingItems.length !== 1 ? "s" : ""} awaiting your review</p>
      </motion.div>

      {pendingItems.length === 0 ? (
        <motion.div variants={fadeSlideUp} className="py-32 text-center">
          <CheckCircle2 className="w-12 h-12 text-attain mx-auto mb-4 opacity-40" />
          <p className="text-white/30 font-mono uppercase tracking-widest text-sm">All submissions have been processed.</p>
        </motion.div>
      ) : (
        <div className="flex flex-col gap-4">
          {pendingItems.map(({ course, exam, sub, key }) => (
            <motion.div key={key} variants={fadeSlideUp} className="border border-amber-400/20 bg-amber-400/5 rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-6 py-5 cursor-pointer" onClick={() => setExpanded(expanded === key ? null : key)}>
                <div className="flex items-center gap-4">
                  <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  <div>
                    <p className="font-display text-white">{course.code} — {exam?.name || sub.examId.toUpperCase()}</p>
                    <p className="text-xs text-white/40 font-mono mt-0.5">{course.name} &nbsp;·&nbsp; Submitted {sub.submittedAt?.substring(0, 10)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[9px] font-mono uppercase tracking-widest px-2.5 py-1 border border-amber-400/30 text-amber-400 bg-amber-400/10 rounded">
                    {sub.students.length} students
                  </span>
                  {expanded === key ? <ChevronUp className="w-4 h-4 text-white/40" /> : <ChevronDown className="w-4 h-4 text-white/40" />}
                </div>
              </div>

              <AnimatePresence>
                {expanded === key && (
                  <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }}
                    className="overflow-hidden border-t border-white/10">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left font-mono text-xs">
                        <thead className="bg-white/[0.03]">
                          <tr>
                            <th className="px-5 py-3 text-white/30 uppercase tracking-widest font-normal">Roll</th>
                            <th className="px-5 py-3 text-white/30 uppercase tracking-widest font-normal">Name</th>
                            {exam?.questions.map((q: any) => (
                              <th key={q.qno} className="px-3 py-3 text-white/30 uppercase tracking-widest font-normal text-center">{q.qno}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {sub.students.slice(0, 5).map((s: any) => (
                            <tr key={s.roll} className="hover:bg-white/[0.02]">
                              <td className="px-5 py-3 text-white/60">{s.roll}</td>
                              <td className="px-5 py-3 text-white">{s.name}</td>
                              {exam?.questions.map((q: any) => (
                                <td key={q.qno} className="px-3 py-3 text-center text-white/60">{s.marks[q.qno] ?? "—"}</td>
                              ))}
                            </tr>
                          ))}
                          {sub.students.length > 5 && (
                            <tr><td colSpan={99} className="px-5 py-2 text-white/20 italic">{sub.students.length - 5} more students…</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                    <div className="flex gap-3 p-5 border-t border-white/5">
                      <button
                        onClick={() => handleApprove(course.id, sub.examId)}
                        disabled={loading && actionId === key}
                        className="flex items-center gap-2 px-6 py-2.5 bg-attain text-white text-[10px] font-mono uppercase tracking-widest hover:bg-attain/90 transition-colors rounded disabled:opacity-50">
                        {loading && actionId === key ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                        Approve & Lock
                      </button>
                      <button
                        onClick={() => setShowReturnModal({ courseId: course.id, examId: sub.examId })}
                        className="flex items-center gap-2 px-6 py-2.5 border border-alert/30 text-alert text-[10px] font-mono uppercase tracking-widest hover:bg-alert/10 transition-colors rounded">
                        <RotateCcw className="w-3.5 h-3.5" /> Return to Faculty
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      )}

      {/* ── Return Modal ── */}
      <AnimatePresence>
        {showReturnModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-8">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }}
              className="w-full max-w-md bg-[#0a0a0f] border border-white/10 rounded-xl p-8">
              <h3 className="text-xl font-display text-white mb-2">Return Marks</h3>
              <p className="text-white/40 text-sm font-light mb-6">Provide a clear reason so the faculty can correct the submission.</p>
              <div className="flex flex-col gap-2 mb-6">
                <label className="text-[10px] font-mono text-white/40 uppercase tracking-widest flex items-center gap-2">
                  <MessageSquare className="w-3 h-3" /> Reason for Return
                </label>
                <textarea value={returnReason} onChange={e => setReturnReason(e.target.value)} rows={3}
                  placeholder="e.g. Q3 marks exceed maximum 10. Please verify and resubmit."
                  className="bg-black/30 border border-white/10 p-4 text-white text-sm outline-none focus:border-brand/50 transition-colors rounded resize-none" />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowReturnModal(null)}
                  className="flex-1 px-4 py-2.5 border border-white/10 text-white/50 hover:text-white transition-colors text-[10px] font-mono uppercase tracking-widest rounded">Cancel</button>
                <button onClick={handleReturn} disabled={loading}
                  className="flex-1 px-4 py-2.5 bg-alert text-white hover:bg-alert/90 transition-colors text-[10px] font-mono uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-50 rounded">
                  {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />} Confirm Return
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
