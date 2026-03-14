"use client";

import { use, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, Save, Send, Plus, Trash2, AlertCircle, Lock, Loader2, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { fadeSlideUp, staggerContainer } from "@/lib/animations";
import { useDataStore, MarksSubmission, StudentMarkRow } from "@/lib/dataStore";
import { useAuthStore } from "@/lib/authStore";
import { useUIStore } from "@/lib/uiStore";

export default function MarksEntryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: courseId } = use(params);
  const { addToast }    = useUIStore();
  const { user }        = useAuthStore();
  const courses         = useDataStore(s => s.courses);
  const examConfigs     = useDataStore(s => s.examConfigs[courseId] || []);
  const getSubmission   = useDataStore(s => s.getSubmission);
  const saveSubmission  = useDataStore(s => s.saveSubmission);
  const addAuditEntry   = useDataStore(s => s.addAuditEntry);

  const course = courses.find(c => c.id === courseId);
  const [selectedExam, setSelectedExam] = useState(examConfigs[0]?.id || "");
  const [isSaving, setIsSaving]         = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const exam       = examConfigs.find(e => e.id === selectedExam);
  const existingSub = getSubmission(courseId, selectedExam);
  const isLocked   = existingSub?.status === "approved" || existingSub?.status === "pending";

  const blankRow = (): StudentMarkRow => ({
    roll: "", name: "",
    marks: Object.fromEntries((exam?.questions || []).map(q => [q.qno, ""])),
  });

  const [rows, setRows] = useState<StudentMarkRow[]>(() => {
    if (existingSub?.students.length) return existingSub.students.map(s => ({ ...s, marks: { ...s.marks } }));
    return Array.from({ length: 10 }, blankRow);
  });

  const handleExamChange = (id: string) => {
    setSelectedExam(id);
    const sub = getSubmission(courseId, id);
    const ex  = examConfigs.find(e => e.id === id);
    setRows(sub?.students.length
      ? sub.students.map(s => ({ ...s, marks: { ...s.marks } }))
      : Array.from({ length: 10 }, () => ({ roll: "", name: "", marks: Object.fromEntries((ex?.questions || []).map(q => [q.qno, ""])) }))
    );
  };

  const updateCell = (i: number, field: string, val: string) =>
    setRows(prev => prev.map((r, idx) => {
      if (idx !== i) return r;
      if (field === "roll" || field === "name") return { ...r, [field]: val };
      return { ...r, marks: { ...r.marks, [field]: val === "" ? "" : Math.max(0, Number(val)) } };
    }));

  const errors = useMemo(() => {
    const errs: string[] = [];
    const rolls = rows.filter(r => r.roll).map(r => r.roll);
    const dupes = rolls.filter((r, i) => rolls.indexOf(r) !== i);
    if (dupes.length) errs.push(`Duplicate rolls: ${[...new Set(dupes)].join(", ")}`);
    rows.forEach((row, i) => {
      if (!row.roll) return;
      exam?.questions.forEach(q => {
        const m = row.marks[q.qno];
        if (typeof m === "number" && m > q.maxMarks)
          errs.push(`Row ${i + 1} (${row.roll}): ${q.qno} exceeds max ${q.maxMarks}`);
      });
    });
    return errs;
  }, [rows, exam]);

  const filledRows = rows.filter(r => r.roll && r.name);

  const handleSave = async (submit = false) => {
    if (!filledRows.length) { addToast("Enter at least one student.", "warning"); return; }
    if (errors.length)      { addToast("Fix validation errors first.", "error"); return; }
    submit ? setIsSubmitting(true) : setIsSaving(true);
    await new Promise(r => setTimeout(r, 700));
    saveSubmission({ courseId, examId: selectedExam, students: filledRows, status: submit ? "pending" : "draft", submittedAt: new Date().toISOString() });
    addAuditEntry({ type: "marks", userId: user?.id || "fac", role: "faculty", action: `Marks ${submit ? "submitted" : "saved"} — ${courseId.toUpperCase()} ${exam?.name} (${filledRows.length} students)`, ip: "127.0.0.1" });
    submit ? setIsSubmitting(false) : setIsSaving(false);
    addToast(submit ? "Submitted for Lead approval." : "Draft saved.", "success");
  };

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="max-w-[1400px] mx-auto pb-32">

      {/* ── HEADER ── */}
      <motion.div variants={fadeSlideUp} className="mb-12 flex justify-between items-end">
        <div>
          <Link href={`/courses/${courseId}`} className="flex items-center gap-2 text-white/30 hover:text-white transition-colors text-[10px] font-mono uppercase tracking-widest mb-4">
            <ChevronLeft className="w-3.5 h-3.5" /> Back to Course
          </Link>
          <div className="flex items-center gap-3 text-sm font-mono text-brand uppercase tracking-widest mb-4">
            <span className="w-8 h-[1px] bg-brand" /> Manual Entry
          </div>
          <h1 className="text-5xl font-display text-white">Marks Entry Portal</h1>
          <p className="text-white/40 font-light mt-3 italic">{course?.name} · Direct keyboard entry</p>
        </div>
        <Link href={`/courses/${courseId}/marks-upload`}
          className="px-6 py-3 border border-white/10 text-white/50 hover:text-white text-[10px] font-mono uppercase tracking-widest transition-colors">
          Switch to Excel Upload
        </Link>
      </motion.div>

      {/* ── EXAM TABS ── */}
      <motion.div variants={fadeSlideUp} className="flex flex-wrap gap-0 border-b border-white/10 mb-10">
        {examConfigs.map(ex => {
          const sub = getSubmission(courseId, ex.id);
          return (
            <button key={ex.id} onClick={() => handleExamChange(ex.id)}
              className={`flex items-center gap-2 px-6 py-4 text-[10px] font-mono uppercase tracking-widest border-b-2 transition-all ${selectedExam === ex.id ? "border-brand text-white" : "border-transparent text-white/30 hover:text-white/60"}`}>
              {ex.name}
              {sub?.status === "approved" && <CheckCircle2 className="w-3 h-3 text-attain" />}
              {sub?.status === "pending"  && <Lock className="w-3 h-3 text-amber-400" />}
            </button>
          );
        })}
      </motion.div>

      {/* ── LOCKED NOTICE ── */}
      {isLocked && (
        <motion.div variants={fadeSlideUp} className="mb-8 flex items-center gap-3 p-4 border border-amber-400/20 bg-amber-400/5 text-amber-400 text-xs font-mono">
          <Lock className="w-4 h-4 shrink-0" />
          This submission is <strong className="uppercase">{existingSub?.status}</strong> — editing is locked.
        </motion.div>
      )}

      {/* ── VALIDATION ERRORS ── */}
      <AnimatePresence>
        {errors.length > 0 && (
          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="mb-8 p-4 border border-alert/20 bg-alert/5">
            <p className="flex items-center gap-2 text-alert text-[10px] font-mono uppercase tracking-widest mb-2">
              <AlertCircle className="w-3.5 h-3.5" /> {errors.length} error{errors.length > 1 ? "s" : ""}
            </p>
            {errors.map((e, i) => <p key={i} className="text-xs text-white/50 font-mono ml-5">· {e}</p>)}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── MARKS TABLE ── */}
      <motion.div variants={fadeSlideUp} className="overflow-x-auto">
        <table className="w-full text-left font-mono text-xs border-t border-white/10">
          <thead>
            <tr className="border-b border-white/10">
              <th className="py-3 pr-4 text-white/20 font-normal w-8">#</th>
              <th className="py-3 pr-6 text-white/30 uppercase tracking-widest font-normal min-w-[110px]">Roll No.</th>
              <th className="py-3 pr-6 text-white/30 uppercase tracking-widest font-normal min-w-[160px]">Name</th>
              {exam?.questions.map(q => (
                <th key={q.qno} className="py-3 pr-4 text-white/30 uppercase tracking-widest font-normal text-center min-w-[70px]">
                  {q.qno}<br /><span className="text-white/20 text-[9px]">/{q.maxMarks}</span>
                </th>
              ))}
              <th className="py-3 text-brand uppercase tracking-widest font-normal text-right min-w-[60px]">Total</th>
              {!isLocked && <th className="py-3 w-8" />}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {rows.map((row, i) => {
              const total    = Object.values(row.marks).reduce((s:number, m) => s + Number(m === "" ? 0 : m), 0 as number);
              const hasError = errors.some(e => e.includes(`Row ${i + 1}`));
              return (
                <tr key={i} className={`transition-colors group ${hasError ? "bg-alert/5" : "hover:bg-white/[0.015]"}`}>
                  <td className="py-2 pr-4 text-white/20">{i + 1}</td>
                  <td className="py-2 pr-4">
                    <input value={row.roll} disabled={isLocked} onChange={e => updateCell(i, "roll", e.target.value)}
                      placeholder="21CS001"
                      className="w-full bg-transparent border-b border-white/10 text-white py-1 outline-none focus:border-brand transition-colors disabled:opacity-40 placeholder-white/15 font-mono text-xs" />
                  </td>
                  <td className="py-2 pr-4">
                    <input value={row.name} disabled={isLocked} onChange={e => updateCell(i, "name", e.target.value)}
                      placeholder="Student Name"
                      className="w-full bg-transparent border-b border-white/10 text-white py-1 outline-none focus:border-brand transition-colors disabled:opacity-40 placeholder-white/15 font-mono text-xs" />
                  </td>
                  {exam?.questions.map(q => {
                    const m = row.marks[q.qno];
                    const over = typeof m === "number" && Number(m) > q.maxMarks;
                    return (
                      <td key={q.qno} className="py-2 pr-4">
                        <input type="number" min={0} max={q.maxMarks}
                          value={m === "" ? "" : m}
                          disabled={isLocked}
                          onChange={e => updateCell(i, q.qno, e.target.value)}
                          className={`w-full bg-transparent border-b text-center py-1 outline-none transition-colors disabled:opacity-40 font-mono text-xs ${over ? "border-alert text-alert" : "border-white/10 text-white focus:border-brand"}`} />
                      </td>
                    );
                  })}
                  <td className="py-2 text-right text-brand font-bold">{total > 0 ? total : "—"}</td>
                  {!isLocked && (
                    <td className="py-2 pl-2">
                      <button onClick={() => setRows(p => p.filter((_, idx) => idx !== i))}
                        className="opacity-0 group-hover:opacity-100 text-white/20 hover:text-alert transition-all">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </motion.div>

      {/* ── ADD ROW + ACTIONS ── */}
      {!isLocked && (
        <motion.div variants={fadeSlideUp} className="mt-6 flex items-center justify-between border-t border-white/10 pt-6">
          <button onClick={() => setRows(p => [...p, blankRow()])}
            className="flex items-center gap-2 text-white/30 hover:text-white text-[10px] font-mono uppercase tracking-widest transition-colors">
            <Plus className="w-3.5 h-3.5" /> Add Row
          </button>
          <div className="flex items-center gap-6">
            <span className="text-[10px] font-mono text-white/20">{filledRows.length} students · max {exam?.questions.reduce((s, q) => s + q.maxMarks, 0) || 0} marks</span>
            <button onClick={() => handleSave(false)} disabled={isSaving || !filledRows.length}
              className="px-6 py-3 border border-white/10 text-white/50 hover:text-white text-[10px] font-mono uppercase tracking-widest flex items-center gap-2 transition-colors disabled:opacity-40">
              {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Save Draft
            </button>
            <button onClick={() => handleSave(true)} disabled={isSubmitting || !filledRows.length || errors.length > 0}
              className="px-8 py-3 bg-white text-black text-[10px] font-mono uppercase tracking-widest flex items-center gap-2 hover:bg-white/90 transition-all disabled:opacity-40">
              {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />} Submit for Approval
            </button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
