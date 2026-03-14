"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2, XCircle, AlertCircle, Loader2,
  Table as TableIcon, TrendingUp, ArrowLeft, MessageSquare
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useDataStore } from "@/lib/dataStore";
import { computeCOAttainmentFromMarks, getAttainmentLevel } from "@/lib/computations";
import { AccessGate } from "@/components/auth/AccessGate";
import { staggerContainer, fadeSlideUp } from "@/lib/animations";

export default function LeadMarksApprovalPage() {
  const router = useRouter();

  const courses        = useDataStore(s => s.courses);
  const submissions    = useDataStore(s => s.submissions);
  const examConfigs    = useDataStore(s => s.examConfigs);
  const thresholds     = useDataStore(s => s.thresholds);
  const updateSubmission = useDataStore(s => s.updateSubmissionStatus);
  const addFacultyNotif  = useDataStore(s => s.addFacultyNotification);

  const allPending = useMemo(() => {
    const list: Array<{ courseId: string; examId: string; submittedAt?: string; students: any[] }> = [];
    for (const cId in submissions) {
      submissions[cId].forEach(s => {
        if (s.status === "pending") list.push({ ...s, courseId: cId });
      });
    }
    return list;
  }, [submissions]);

  const [selectedIdx, setSelectedIdx] = useState(0);
  const pendingSub = allPending[selectedIdx] ?? null;

  const course = useMemo(() => courses.find(c => c.id === pendingSub?.courseId), [courses, pendingSub]);
  const exam   = useMemo(() => examConfigs[pendingSub?.courseId || ""]?.find(e => e.id === pendingSub?.examId), [examConfigs, pendingSub]);

  const [comment, setComment]         = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showConfirm, setShowConfirm] = useState<"approve" | "return" | null>(null);

  const attainment = useMemo(() => {
    if (!pendingSub || !exam) return {};
    return computeCOAttainmentFromMarks(pendingSub.students, exam.questions, thresholds.targetPassPct);
  }, [pendingSub, exam, thresholds]);

  const handleAction = async (status: "approved" | "returned") => {
    if (!pendingSub) return;
    setIsProcessing(true);
    await new Promise(r => setTimeout(r, 800));
    updateSubmission(pendingSub.courseId, pendingSub.examId, status);
    // Notify faculty
    const course_ = courses.find(c => c.id === pendingSub.courseId);
    if (course_?.facultyId) {
      addFacultyNotif({
        userId: course_.facultyId,
        type: status === "approved" ? "success" : "critical",
        title: status === "approved" ? "Marks Approved" : "Marks Returned",
        message: status === "approved"
          ? `Your ${exam?.name} marks for ${course_?.code} have been approved.`
          : `Your ${exam?.name} marks for ${course_?.code} were returned. ${comment ? `Reason: ${comment}` : ""}`,
        link: `/faculty/course/${pendingSub.courseId}/marks/${pendingSub.examId}`,
      });
    }
    setIsProcessing(false);
    setShowConfirm(null);
    setComment("");
    setSelectedIdx(0);
  };

  if (allPending.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-6 text-center">
        <CheckCircle2 className="w-12 h-12 text-white/10" />
        <h2 className="text-xl font-display text-white">Queue Clear</h2>
        <p className="text-white/40 text-sm">No marks submissions awaiting approval.</p>
        <button onClick={() => router.push("/dashboard")}
          className="px-6 py-2 border border-white/10 text-white/60 hover:text-white text-[10px] font-mono uppercase tracking-widest transition-colors">
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <AccessGate feature="marks_approval" deny="lock">
      <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="flex flex-col gap-0 pb-32">

        {/* Header */}
        <motion.div variants={fadeSlideUp} className="flex items-center justify-between pb-8 border-b border-white/5">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push("/dashboard")} className="p-2 hover:bg-white/5 transition-colors">
              <ArrowLeft className="w-5 h-5 text-white/40" />
            </button>
            <div>
              <div className="flex items-center gap-2 text-[10px] font-mono text-brand uppercase tracking-widest mb-2">
                <span className="w-8 h-[1px] bg-brand" /> Marks Review Workflow
              </div>
              <h1 className="text-3xl font-display text-white">Lead Approval Queue</h1>
              <p className="text-white/40 text-sm font-light mt-0.5">
                {allPending.length} submission{allPending.length > 1 ? "s" : ""} pending review
              </p>
            </div>
          </div>
          <span className="text-[10px] font-mono text-amber-400 border border-amber-400/20 px-3 py-1 uppercase tracking-widest">
            {allPending.length} Pending
          </span>
        </motion.div>

        {/* Queue tabs */}
        {allPending.length > 1 && (
          <div className="flex border-b border-white/5">
            {allPending.map((sub, i) => {
              const c = courses.find(x => x.id === sub.courseId);
              const e = examConfigs[sub.courseId]?.find(x => x.id === sub.examId);
              return (
                <button key={i} onClick={() => setSelectedIdx(i)}
                  className={`px-6 py-3 text-[10px] font-mono uppercase tracking-widest border-b-2 transition-all ${
                    selectedIdx === i ? "border-brand text-brand" : "border-transparent text-white/30 hover:text-white"
                  }`}>
                  {c?.code} · {e?.name?.split("—")[0].trim() || sub.examId.toUpperCase()}
                </button>
              );
            })}
          </div>
        )}

        {/* Submission info strip */}
        <motion.div variants={fadeSlideUp} className="flex items-center gap-8 py-5 border-b border-white/5">
          <div className="flex flex-col gap-0.5">
            <span className="text-[9px] font-mono text-white/20 uppercase tracking-widest">Course</span>
            <span className="text-sm font-display text-white">{course?.name}</span>
          </div>
          <div className="w-px h-8 bg-white/5" />
          <div className="flex flex-col gap-0.5">
            <span className="text-[9px] font-mono text-white/20 uppercase tracking-widest">Exam</span>
            <span className="text-sm font-mono text-white">{exam?.name}</span>
          </div>
          <div className="w-px h-8 bg-white/5" />
          <div className="flex flex-col gap-0.5">
            <span className="text-[9px] font-mono text-white/20 uppercase tracking-widest">Max Marks</span>
            <span className="text-sm font-mono text-white">{exam?.maxMarks}</span>
          </div>
          <div className="w-px h-8 bg-white/5" />
          <div className="flex flex-col gap-0.5">
            <span className="text-[9px] font-mono text-white/20 uppercase tracking-widest">Students</span>
            <span className="text-sm font-mono text-white">{pendingSub?.students.length}</span>
          </div>
          <div className="w-px h-8 bg-white/5" />
          <div className="flex flex-col gap-0.5">
            <span className="text-[9px] font-mono text-white/20 uppercase tracking-widest">Submitted</span>
            <span className="text-sm font-mono text-white/60">
              {pendingSub?.submittedAt ? new Date(pendingSub.submittedAt).toLocaleDateString() : "—"}
            </span>
          </div>
        </motion.div>

        <div className="flex gap-0 divide-x divide-white/5">

          {/* ── LEFT: MARKS TABLE ── */}
          <div className="flex-1 flex flex-col">
            <div className="flex items-center gap-3 px-8 py-5 border-b border-white/5">
              <TableIcon className="w-4 h-4 text-brand" />
              <h3 className="text-[10px] font-mono text-white/30 uppercase tracking-widest">Submission Data — Read Only</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 bg-white/[0.02]">
                    <th className="px-6 py-4 text-[9px] font-mono text-white/30 uppercase tracking-widest">Roll</th>
                    <th className="px-6 py-4 text-[9px] font-mono text-white/30 uppercase tracking-widest">Name</th>
                    {exam?.questions.map(q => (
                      <th key={q.qno} className="px-4 py-4 text-center border-l border-white/5">
                        <p className="text-brand font-mono text-xs">{q.qno}</p>
                        <p className="text-[8px] text-white/20 font-mono">/{q.maxMarks}</p>
                      </th>
                    ))}
                    <th className="px-6 py-4 text-center border-l border-brand/20 bg-brand/5">
                      <p className="text-[9px] font-mono text-white/40 uppercase">Total</p>
                      <p className="text-[8px] font-mono text-white/20">/{exam?.maxMarks}</p>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pendingSub?.students.map(s => {
                    const rowTotal = Object.values(s.marks).reduce((sum:number, m) => sum + Number(m === '' ? 0 : m), 0 as number);
                    const isOver   = rowTotal > (exam?.maxMarks || 0);
                    return (
                      <tr key={s.roll} className="border-b border-white/5 hover:bg-white/[0.01] transition-colors">
                        <td className="px-6 py-3 font-mono text-xs text-white/50">{s.roll}</td>
                        <td className="px-6 py-3 text-xs text-white/40 italic">{s.name}</td>
                        {exam?.questions.map(q => (
                          <td key={q.qno} className="px-4 py-3 text-center text-xs font-mono text-white/50 border-l border-white/5">
                            {s.marks[q.qno] === "" || s.marks[q.qno] === undefined ? "—" : String(s.marks[q.qno])}
                          </td>
                        ))}
                        <td className={`px-6 py-3 text-center font-mono text-sm font-bold border-l border-brand/20 ${isOver ? "text-alert bg-alert/5" : "text-brand bg-brand/5"}`}>
                          {rowTotal}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── RIGHT: ATTAINMENT + ACTIONS ── */}
          <div className="w-80 shrink-0 flex flex-col divide-y divide-white/5">

            {/* Attainment preview */}
            <div className="p-6 flex flex-col gap-4">
              <h3 className="text-[10px] font-mono text-white/30 uppercase tracking-widest flex items-center gap-2">
                <TrendingUp className="w-3.5 h-3.5" /> Attainment Preview
              </h3>
              {Object.entries(attainment).map(([co, data]) => {
                const lvl = getAttainmentLevel(data.pct, thresholds);
                return (
                  <div key={co} className="flex flex-col gap-1">
                    <div className="flex justify-between text-[9px] font-mono uppercase">
                      <span className="text-white/30">{co}</span>
                      <span className={lvl.color}>{data.pct}%</span>
                    </div>
                    <div className="h-0.5 bg-white/5">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${data.pct}%` }}
                        className={`h-full ${lvl.level === 3 ? "bg-attain" : lvl.level === 2 ? "bg-amber-400" : "bg-alert"}`} />
                    </div>
                    <span className={`text-[8px] font-mono uppercase ${lvl.color}`}>{lvl.label}</span>
                  </div>
                );
              })}
              {Object.keys(attainment).length === 0 && (
                <p className="text-[10px] text-white/20 italic">No question-CO mapping found for this exam.</p>
              )}
            </div>

            {/* Comment */}
            <div className="p-6 flex flex-col gap-3">
              <label className="text-[9px] font-mono text-white/20 uppercase tracking-widest flex items-center gap-1.5">
                <MessageSquare className="w-3 h-3" /> Remarks (optional)
              </label>
              <textarea
                value={comment} onChange={e => setComment(e.target.value)}
                placeholder="Add remarks for the faculty..."
                className="w-full bg-white/[0.02] border border-white/10 p-3 text-xs text-white outline-none focus:border-brand h-24 resize-none"
              />
            </div>

            {/* Action buttons */}
            <div className="p-6 flex flex-col gap-3">
              <button onClick={() => setShowConfirm("approve")}
                className="w-full py-3 bg-attain text-white text-[10px] font-mono uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-attain/90 transition-colors">
                <CheckCircle2 className="w-3.5 h-3.5" /> Approve Marks
              </button>
              <button onClick={() => setShowConfirm("return")}
                className="w-full py-3 border border-alert/20 text-alert text-[10px] font-mono uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-alert/5 transition-colors">
                <XCircle className="w-3.5 h-3.5" /> Return for Correction
              </button>
            </div>
          </div>
        </div>

        {/* Confirm modal */}
        <AnimatePresence>
          {showConfirm && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80">
              <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }}
                className="max-w-md w-full p-10 bg-[#0a0a0f] border border-white/10 flex flex-col gap-6">
                <div className={`flex items-center gap-3 ${showConfirm === "approve" ? "text-attain" : "text-alert"}`}>
                  {showConfirm === "approve"
                    ? <CheckCircle2 className="w-6 h-6" />
                    : <AlertCircle className="w-6 h-6" />}
                  <h2 className="text-xl font-display text-white">
                    {showConfirm === "approve" ? "Approve marks?" : "Return for revision?"}
                  </h2>
                </div>
                <p className="text-white/40 text-sm font-light leading-relaxed">
                  {showConfirm === "approve"
                    ? "This will lock the marks and notify the faculty. CO attainment will be finalized."
                    : "This will unlock the portal for the faculty to make corrections."}
                </p>
                {comment && (
                  <div className="border-l-2 border-white/10 pl-4">
                    <p className="text-[10px] font-mono text-white/20 uppercase mb-1">Your Remark</p>
                    <p className="text-xs text-white/50 italic">{comment}</p>
                  </div>
                )}
                <div className="flex gap-4 pt-2 border-t border-white/5">
                  <button onClick={() => setShowConfirm(null)}
                    className="flex-1 py-3 border border-white/10 text-white/40 hover:text-white text-[10px] font-mono uppercase tracking-widest transition-colors">
                    Cancel
                  </button>
                  <button
                    onClick={() => handleAction(showConfirm === "approve" ? "approved" : "returned")}
                    disabled={isProcessing}
                    className={`flex-1 py-3 text-white text-[10px] font-mono uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-50 transition-colors ${
                      showConfirm === "approve" ? "bg-attain hover:bg-attain/90" : "bg-alert hover:bg-alert/90"
                    }`}>
                    {isProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Confirm"}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </motion.div>
    </AccessGate>
  );
}
