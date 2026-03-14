"use client";

import { use, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, AlertCircle, CheckCircle2, Send, Loader2, ShieldCheck, Flag } from "lucide-react";
import Link from "next/link";
import { fadeSlideUp, staggerContainer } from "@/lib/animations";
import { useDataStore } from "@/lib/dataStore";
import { useAuthStore } from "@/lib/authStore";
import { useUIStore } from "@/lib/uiStore";

type Flag = { row: number; roll: string; qno: string; issue: string; severity: "error" | "warning" };

export default function MarksValidatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id: courseId } = use(params);
  const { addToast }     = useUIStore();
  const { user }         = useAuthStore();
  const courses          = useDataStore(s => s.courses);
  const examConfigs      = useDataStore(s => s.examConfigs[courseId] || []);
  const getSubmission    = useDataStore(s => s.getSubmission);
  const saveSubmission   = useDataStore(s => s.saveSubmission);
  const addAuditEntry    = useDataStore(s => s.addAuditEntry);

  const course = courses.find(c => c.id === courseId);
  const [selectedExam, setSelectedExam] = useState(examConfigs[0]?.id || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const exam = examConfigs.find(e => e.id === selectedExam);
  const sub  = getSubmission(courseId, selectedExam);

  // ── Run all validation rules ──
  const { flags, stats } = useMemo(() => {
    const flags: Flag[] = [];
    if (!sub || !exam) return { flags, stats: null };

    const students = sub.students;
    const maxTotal = exam.questions.reduce((s, q) => s + q.maxMarks, 0);

    students.forEach((student, i) => {
      if (!student.roll) flags.push({ row: i + 1, roll: "—", qno: "—", issue: "Missing roll number", severity: "error" });
      if (!student.name) flags.push({ row: i + 1, roll: student.roll, qno: "—", issue: "Missing student name", severity: "warning" });

      exam.questions.forEach(q => {
        const m = student.marks[q.qno];
        if (m === "" || m === undefined)
          flags.push({ row: i + 1, roll: student.roll, qno: q.qno, issue: `Mark missing for ${q.qno}`, severity: "warning" });
        if (typeof m === "number" && m > q.maxMarks)
          flags.push({ row: i + 1, roll: student.roll, qno: q.qno, issue: `${q.qno}: ${m} exceeds max ${q.maxMarks}`, severity: "error" });
        if (typeof m === "number" && m < 0)
          flags.push({ row: i + 1, roll: student.roll, qno: q.qno, issue: `${q.qno}: negative mark`, severity: "error" });
      });

      const total = Object.values(student.marks).reduce((s:number, m) => s + Number(m === "" ? 0 : m), 0 as number);
      if (total > maxTotal)
        flags.push({ row: i + 1, roll: student.roll, qno: "Total", issue: `Total ${total} exceeds exam max ${maxTotal}`, severity: "error" });
    });

    const rolls = students.map(s => s.roll).filter(Boolean);
    const dupes = rolls.filter((r, i) => rolls.indexOf(r) !== i);
    [...new Set(dupes)].forEach(roll =>
      flags.push({ row: 0, roll, qno: "—", issue: `Duplicate roll number: ${roll}`, severity: "error" })
    );

    const errors   = flags.filter(f => f.severity === "error").length;
    const warnings = flags.filter(f => f.severity === "warning").length;
    const totals   = students.map(s => Object.values(s.marks).reduce((a:number, m) => a + Number(m === "" ? 0 : m), 0 as number));
    const avg      = totals.length ? Math.round(totals.reduce((a: number, b: number) => a + b, 0) / totals.length) : 0;
    const highest  = totals.length ? Math.max(...totals) : 0;
    const lowest   = totals.length ? Math.min(...totals) : 0;

    return { flags, stats: { errors, warnings, total: students.length, avg, highest, lowest, maxTotal } };
  }, [sub, exam, selectedExam]);

  const canSubmit = stats && stats.errors === 0 && sub?.status === "draft";

  const handleSubmit = async () => {
    if (!sub) return;
    setIsSubmitting(true);
    await new Promise(r => setTimeout(r, 700));
    saveSubmission({ ...sub, status: "pending", submittedAt: new Date().toISOString() });
    addAuditEntry({ type: "marks", userId: user?.id || "fac", role: "faculty", action: `Marks validated and submitted — ${courseId.toUpperCase()} ${exam?.name}`, ip: "127.0.0.1" });
    setIsSubmitting(false);
    addToast("Marks submitted for Lead approval.", "success");
  };

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="max-w-5xl mx-auto pb-32">

      {/* ── HEADER ── */}
      <motion.div variants={fadeSlideUp} className="mb-12 flex justify-between items-end">
        <div>
          <Link href={`/courses/${courseId}`} className="flex items-center gap-2 text-white/30 hover:text-white transition-colors text-[10px] font-mono uppercase tracking-widest mb-4">
            <ChevronLeft className="w-3.5 h-3.5" /> Back to Course
          </Link>
          <div className="flex items-center gap-3 text-sm font-mono text-insight uppercase tracking-widest mb-4">
            <span className="w-8 h-[1px] bg-insight" /> Validation Engine
          </div>
          <h1 className="text-5xl font-display text-white">Marks Validation</h1>
          <p className="text-white/40 font-light mt-3 italic">{course?.name} · Pre-submission error check</p>
        </div>
      </motion.div>

      {/* ── EXAM TABS ── */}
      <motion.div variants={fadeSlideUp} className="flex flex-wrap gap-0 border-b border-white/10 mb-10">
        {examConfigs.map(ex => {
          const s = getSubmission(courseId, ex.id);
          return (
            <button key={ex.id} onClick={() => setSelectedExam(ex.id)}
              className={`flex items-center gap-2 px-6 py-4 text-[10px] font-mono uppercase tracking-widest border-b-2 transition-all ${selectedExam === ex.id ? "border-insight text-white" : "border-transparent text-white/30 hover:text-white/60"}`}>
              {ex.name}
              {s?.status === "approved" && <CheckCircle2 className="w-3 h-3 text-attain" />}
            </button>
          );
        })}
      </motion.div>

      {!sub ? (
        <motion.div variants={fadeSlideUp} className="py-32 text-center border border-dashed border-white/10">
          <p className="text-white/20 font-mono text-sm uppercase tracking-widest">No marks data found for this exam.</p>
          <Link href={`/courses/${courseId}/marks-entry`} className="mt-6 inline-flex items-center gap-2 text-brand text-[10px] font-mono uppercase tracking-widest hover:underline">
            Go to Marks Entry →
          </Link>
        </motion.div>
      ) : (
        <>
          {/* ── STATS STRIP ── */}
          <motion.div variants={fadeSlideUp} className="flex gap-16 mb-12 pb-10 border-b border-white/10">
            <div>
              <span className={`text-4xl font-mono font-light ${stats?.errors ? "text-alert" : "text-attain"}`}>{stats?.errors ?? 0}</span>
              <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest mt-1">Errors</p>
            </div>
            <div>
              <span className="text-4xl font-mono font-light text-amber-400">{stats?.warnings ?? 0}</span>
              <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest mt-1">Warnings</p>
            </div>
            <div>
              <span className="text-4xl font-mono font-light text-white">{stats?.total ?? 0}</span>
              <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest mt-1">Students</p>
            </div>
            <div>
              <span className="text-4xl font-mono font-light text-white">{stats?.avg ?? 0}</span>
              <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest mt-1">Avg Score</p>
            </div>
            <div>
              <span className="text-4xl font-mono font-light text-attain">{stats?.highest ?? 0}</span>
              <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest mt-1">Highest</p>
            </div>
            <div>
              <span className="text-4xl font-mono font-light text-alert">{stats?.lowest ?? 0}</span>
              <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest mt-1">Lowest</p>
            </div>
          </motion.div>

          {/* ── FLAGS LIST ── */}
          <motion.div variants={fadeSlideUp} className="flex flex-col gap-0 divide-y divide-white/5 mb-12">
            {flags.length === 0 ? (
              <div className="py-16 flex flex-col items-center gap-4 text-center">
                <ShieldCheck className="w-10 h-10 text-attain" />
                <p className="text-attain font-mono text-sm uppercase tracking-widest">All checks passed — zero flags</p>
                <p className="text-white/30 text-xs font-mono">Marks are clean and ready for submission.</p>
              </div>
            ) : flags.map((f, i) => (
              <div key={i} className={`flex items-start gap-6 py-5 group ${f.severity === "error" ? "hover:bg-alert/5" : "hover:bg-amber-400/5"}`}>
                <div className={`w-1.5 h-1.5 rounded-full mt-2 shrink-0 ${f.severity === "error" ? "bg-alert" : "bg-amber-400"}`} />
                <div className="flex-1">
                  <p className={`text-sm font-mono ${f.severity === "error" ? "text-alert" : "text-amber-400"}`}>{f.issue}</p>
                  <p className="text-[10px] text-white/30 font-mono mt-1 uppercase tracking-widest">
                    Row {f.row || "—"} · Roll: {f.roll} · Field: {f.qno}
                  </p>
                </div>
                <span className={`text-[9px] font-mono uppercase tracking-widest px-2 py-0.5 border ${f.severity === "error" ? "border-alert/30 text-alert" : "border-amber-400/30 text-amber-400"}`}>
                  {f.severity}
                </span>
              </div>
            ))}
          </motion.div>

          {/* ── SUBMISSION STATUS + ACTION ── */}
          <motion.div variants={fadeSlideUp} className="flex items-center justify-between pt-6 border-t border-white/10">
            <div className="flex items-center gap-3">
              <span className={`text-[10px] font-mono uppercase tracking-widest px-3 py-1 border ${
                sub.status === "approved" ? "border-attain/30 text-attain" :
                sub.status === "pending"  ? "border-amber-400/30 text-amber-400" :
                sub.status === "returned" ? "border-alert/30 text-alert" :
                "border-white/20 text-white/40"
              }`}>{sub.status}</span>
              {sub.submittedAt && <span className="text-[10px] font-mono text-white/20">{new Date(sub.submittedAt).toLocaleDateString()}</span>}
            </div>
            {canSubmit && (
              <button onClick={handleSubmit} disabled={isSubmitting}
                className="px-8 py-3 bg-white text-black text-[10px] font-mono uppercase tracking-widest flex items-center gap-2 hover:bg-white/90 transition-all disabled:opacity-40">
                {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                Submit for Approval
              </button>
            )}
            {sub.status === "returned" && (
              <Link href={`/courses/${courseId}/marks-entry`}
                className="px-8 py-3 border border-alert/30 text-alert text-[10px] font-mono uppercase tracking-widest hover:bg-alert/5 transition-all">
                Fix & Re-enter →
              </Link>
            )}
          </motion.div>
        </>
      )}
    </motion.div>
  );
}
