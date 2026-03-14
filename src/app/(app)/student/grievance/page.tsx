"use client";

import { useMemo, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare, ChevronDown, ChevronUp, CheckCircle2,
  AlertTriangle, Clock, XCircle, Loader2, Paperclip,
} from "lucide-react";
import { useAuthStore } from "@/lib/authStore";
import { useDataStore } from "@/lib/dataStore";
import { useUIStore } from "@/lib/uiStore";
import { AccessGate } from "@/components/auth/AccessGate";
import { staggerContainer, fadeSlideUp } from "@/lib/animations";

const GRIEVANCE_WINDOW_DAYS = 7;

const STATUS_META: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending:            { label: "Pending Review",          color: "text-amber-400",  icon: <Clock className="w-3 h-3" /> },
  under_review:       { label: "Under Review",            color: "text-blue-400",   icon: <Clock className="w-3 h-3" /> },
  resolved_unchanged: { label: "Resolved — Marks Unchanged", color: "text-white/40", icon: <CheckCircle2 className="w-3 h-3" /> },
  resolved_updated:   { label: "Resolved — Marks Updated",   color: "text-emerald-400", icon: <CheckCircle2 className="w-3 h-3" /> },
  rejected:           { label: "Rejected",                color: "text-red-400",    icon: <XCircle className="w-3 h-3" /> },
};

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  } catch { return iso; }
}

function deadlineDate(approvedAt: string): Date {
  const d = new Date(approvedAt);
  d.setDate(d.getDate() + GRIEVANCE_WINDOW_DAYS);
  return d;
}

export default function StudentGrievancePage() {
  const { user }         = useAuthStore();
  const courses          = useDataStore(s => s.courses);
  const submissions      = useDataStore(s => s.submissions);
  const examConfigs      = useDataStore(s => s.examConfigs);
  const grievances       = useDataStore(s => s.grievances);
  const addGrievance     = useDataStore(s => s.addGrievance);
  const { addToast }     = useUIStore();

  const myRoll = user?.employeeId ?? "";

  // Enrolled courses
  const enrolledCourses = useMemo(
    () => courses.filter(c => c.studentRolls?.includes(myRoll)),
    [courses, myRoll]
  );

  // Form state
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedExam,   setSelectedExam]   = useState("");
  const [selectedQ,      setSelectedQ]      = useState("");
  const [reason,         setReason]         = useState("");
  const [evidenceFile,   setEvidenceFile]   = useState<File | null>(null);
  const [submitting,     setSubmitting]     = useState(false);
  const [submitted,      setSubmitted]      = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Expandable resolution rows
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Exams for selected course (only approved submissions)
  const availableExams = useMemo(() => {
    if (!selectedCourse) return [];
    const approvedSubs = (submissions[selectedCourse] ?? []).filter(s => s.status === "approved");
    const exams        = examConfigs[selectedCourse] ?? [];
    return exams.filter(e => approvedSubs.some(s => s.examId === e.id));
  }, [selectedCourse, submissions, examConfigs]);

  // Questions for selected exam
  const availableQuestions = useMemo(() => {
    if (!selectedCourse || !selectedExam) return [];
    const exam = (examConfigs[selectedCourse] ?? []).find(e => e.id === selectedExam);
    return exam?.questions ?? [];
  }, [selectedCourse, selectedExam, examConfigs]);

  // Current marks for selected question
  const currentMark = useMemo(() => {
    if (!selectedCourse || !selectedExam || !selectedQ) return null;
    const sub   = (submissions[selectedCourse] ?? []).find(s => s.examId === selectedExam && s.status === "approved");
    const myRow = sub?.students.find(s => s.roll === myRoll);
    if (!myRow) return null;
    const exam  = (examConfigs[selectedCourse] ?? []).find(e => e.id === selectedExam);
    const q     = exam?.questions.find(q => q.qno === selectedQ);
    const val   = myRow.marks[selectedQ];
    return { awarded: val === "" || val === undefined ? 0 : Number(val), max: q?.maxMarks ?? 0 };
  }, [selectedCourse, selectedExam, selectedQ, submissions, examConfigs, myRoll]);

  // Deadline for selected exam — 7 days from approvedAt (marks publication date)
  // Falls back to submittedAt for submissions approved before approvedAt field was added
  const examDeadline = useMemo(() => {
    if (!selectedCourse || !selectedExam) return null;
    const sub = (submissions[selectedCourse] ?? []).find(s => s.examId === selectedExam && s.status === "approved");
    if (!sub) return null;
    const anchor = sub.approvedAt ?? sub.submittedAt;
    if (!anchor) return null;
    return deadlineDate(anchor);
  }, [selectedCourse, selectedExam, submissions]);

  const withinDeadline = useMemo(() => {
    if (!examDeadline) return false;
    return new Date() <= examDeadline;
  }, [examDeadline]);

  // Already raised grievance for this Q?
  const alreadyRaised = useMemo(() => {
    if (!selectedCourse || !selectedExam || !selectedQ) return false;
    return grievances.some(
      g => g.studentRoll === myRoll &&
           g.courseId === selectedCourse &&
           g.examId === selectedExam &&
           g.qno === selectedQ
    );
  }, [grievances, myRoll, selectedCourse, selectedExam, selectedQ]);

  // My grievances
  const myGrievances = useMemo(
    () => [...grievances.filter(g => g.studentRoll === myRoll)]
            .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()),
    [grievances, myRoll]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse || !selectedExam || !selectedQ || !reason.trim()) return;
    if (!withinDeadline) { addToast("Grievance deadline has passed for this exam.", "error"); return; }
    if (alreadyRaised)   { addToast("You have already raised a grievance for this question.", "error"); return; }

    setSubmitting(true);
    await new Promise(r => setTimeout(r, 700));

    addGrievance({
      studentRoll:      myRoll,
      courseId:         selectedCourse,
      examId:           selectedExam,
      qno:              selectedQ,
      text:             reason.trim(),
      status:           "pending",
      evidenceFileName: evidenceFile?.name,
    });

    const courseCode = courses.find(c => c.id === selectedCourse)?.code ?? selectedCourse;
    addToast(`Grievance submitted for ${courseCode}, ${selectedExam.toUpperCase()}, ${selectedQ}`, "success");

    setSubmitted(true);
    setSubmitting(false);
    setSelectedCourse("");
    setSelectedExam("");
    setSelectedQ("");
    setReason("");
    setEvidenceFile(null);
    setTimeout(() => setSubmitted(false), 4000);
  };

  const canSubmit =
    selectedCourse && selectedExam && selectedQ &&
    reason.trim().length >= 10 &&
    withinDeadline && !alreadyRaised;

  return (
    <AccessGate feature="student_marks_view" deny="lock">
      <motion.div variants={staggerContainer} initial="hidden" animate="visible"
        className="max-w-4xl mx-auto pb-32 flex flex-col">

        {/* ── HEADER ── */}
        <motion.div variants={fadeSlideUp} className="pb-8 border-b border-white/5">
          <div className="flex items-center gap-2 text-[10px] font-mono text-cyan-400 uppercase tracking-widest mb-3">
            <span className="w-8 h-[1px] bg-cyan-400" /> Marks Grievance
          </div>
          <h1 className="text-4xl font-display text-white flex items-center gap-4">
            <MessageSquare className="w-8 h-8 text-cyan-400" /> Grievance Portal
          </h1>
          <p className="text-white/40 font-light mt-1 text-sm">
            Raise a grievance within {GRIEVANCE_WINDOW_DAYS} days of marks publication.
          </p>
        </motion.div>

        {/* ── S4-01 RAISE GRIEVANCE FORM ── */}
        <motion.div variants={fadeSlideUp} className="pt-8 pb-10 border-b border-white/5">
          <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest mb-6">Raise a Grievance</p>

          <AnimatePresence>
            {submitted && (
              <motion.div
                initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="flex items-center gap-3 p-4 bg-emerald-400/10 border border-emerald-400/30 mb-6"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <p className="text-sm font-mono text-emerald-400">Grievance submitted successfully.</p>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            {/* Course selector */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Course</label>
              <select
                value={selectedCourse}
                onChange={e => { setSelectedCourse(e.target.value); setSelectedExam(""); setSelectedQ(""); }}
                className="bg-transparent text-white text-sm outline-none border-b border-white/20 pb-2 focus:border-cyan-400 transition-colors appearance-none cursor-pointer"
              >
                <option value="" className="bg-[#0D1829]">Select course…</option>
                {enrolledCourses.map(c => (
                  <option key={c.id} value={c.id} className="bg-[#0D1829]">{c.code} — {c.name}</option>
                ))}
              </select>
            </div>

            {/* Exam selector */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Exam</label>
              <select
                value={selectedExam}
                onChange={e => { setSelectedExam(e.target.value); setSelectedQ(""); }}
                disabled={!selectedCourse}
                className="bg-transparent text-white text-sm outline-none border-b border-white/20 pb-2 focus:border-cyan-400 transition-colors appearance-none cursor-pointer disabled:opacity-30"
              >
                <option value="" className="bg-[#0D1829]">Select exam…</option>
                {availableExams.map(e => (
                  <option key={e.id} value={e.id} className="bg-[#0D1829]">{e.name}</option>
                ))}
              </select>
              {selectedCourse && availableExams.length === 0 && (
                <p className="text-[10px] font-mono text-white/20 italic">No approved exams for this course yet.</p>
              )}
            </div>

            {/* Question selector */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Question</label>
              <select
                value={selectedQ}
                onChange={e => setSelectedQ(e.target.value)}
                disabled={!selectedExam}
                className="bg-transparent text-white text-sm outline-none border-b border-white/20 pb-2 focus:border-cyan-400 transition-colors appearance-none cursor-pointer disabled:opacity-30"
              >
                <option value="" className="bg-[#0D1829]">Select question…</option>
                {availableQuestions.map(q => (
                  <option key={q.qno} value={q.qno} className="bg-[#0D1829]">
                    {q.qno} — {q.co} — Max: {q.maxMarks}
                  </option>
                ))}
              </select>
            </div>

            {/* S4-02 Current marks display */}
            {currentMark !== null && (
              <div className="flex items-center gap-3 p-3 bg-white/[0.02] border border-white/10">
                <p className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Marks awarded for {selectedQ}:</p>
                <p className="font-mono text-sm text-white">
                  {currentMark.awarded}
                  <span className="text-white/30"> / {currentMark.max}</span>
                </p>
              </div>
            )}

            {/* S4-08 Deadline notice */}
            {examDeadline && (
              <div className={`flex items-start gap-3 p-3 border text-[10px] font-mono ${
                withinDeadline
                  ? "border-cyan-400/20 bg-cyan-400/5 text-cyan-400/70"
                  : "border-red-400/20 bg-red-400/5 text-red-400/70"
              }`}>
                <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />
                <p>
                  Grievances can only be raised within {GRIEVANCE_WINDOW_DAYS} days of marks publication.
                  Deadline for {selectedExam.toUpperCase()}: <span className="font-medium">{formatDate(examDeadline.toISOString())}</span>
                  {!withinDeadline && " — Deadline passed."}
                </p>
              </div>
            )}

            {/* Already raised warning */}
            {alreadyRaised && (
              <p className="text-[10px] font-mono text-amber-400 flex items-center gap-2">
                <AlertTriangle className="w-3 h-3" />
                You have already raised a grievance for this question.
              </p>
            )}

            {/* S4-03 Reason textarea */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Reason</label>
              <textarea
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="Explain why you believe the marks are incorrect…"
                rows={4}
                required
                className="bg-transparent text-white text-sm outline-none border border-white/10 p-4 resize-none focus:border-cyan-400 transition-colors placeholder-white/20 font-light"
              />
              <p className="text-[9px] font-mono text-white/20 text-right">{reason.length} chars (min 10)</p>
            </div>

            {/* S4-04 Evidence upload */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Evidence (Optional)</label>
              <div
                onClick={() => fileRef.current?.click()}
                className="flex items-center gap-3 p-4 border border-dashed border-white/10 hover:border-cyan-400/30 transition-colors cursor-pointer"
              >
                <Paperclip className="w-4 h-4 text-white/20" />
                <span className="text-sm font-mono text-white/30">
                  {evidenceFile ? evidenceFile.name : "Upload image or PDF of answer sheet"}
                </span>
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*,.pdf"
                className="hidden"
                onChange={e => setEvidenceFile(e.target.files?.[0] ?? null)}
              />
            </div>

            {/* S4-05 Submit button */}
            <button
              type="submit"
              disabled={!canSubmit || submitting}
              className="flex items-center justify-center gap-3 py-4 bg-cyan-500 text-white font-medium text-sm hover:bg-cyan-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {submitting
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</>
                : "Submit Grievance"}
            </button>
          </form>
        </motion.div>

        {/* ── S4-06/07/08/09 GRIEVANCE STATUS TABLE ── */}
        <motion.div variants={fadeSlideUp} className="pt-8">
          <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest mb-6">My Grievances</p>

          {myGrievances.length === 0 ? (
            <p className="text-white/20 text-sm font-mono italic py-8 text-center">
              No grievances raised yet.
            </p>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10">
                  {["Course", "Exam", "Question", "Submitted On", "Status", "Faculty Response"].map(h => (
                    <th key={h} className="pb-3 pr-6 text-[9px] font-mono text-white/30 uppercase tracking-widest font-normal">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {myGrievances.map(g => {
                  const courseCode = courses.find(c => c.id === g.courseId)?.code ?? g.courseId;
                  const meta       = STATUS_META[g.status] ?? STATUS_META.pending;
                  const isExpanded = expandedId === g.id;
                  const isResolved = g.status.startsWith("resolved") || g.status === "rejected";

                  return (
                    <>
                      <tr key={g.id} className="border-b border-white/5 hover:bg-white/[0.01] transition-colors">
                        <td className="py-4 pr-6 font-mono text-xs text-cyan-400">{courseCode}</td>
                        <td className="py-4 pr-6 font-mono text-xs text-white/60 uppercase">{g.examId}</td>
                        <td className="py-4 pr-6 font-mono text-xs text-white/60">{g.qno}</td>
                        <td className="py-4 pr-6 font-mono text-xs text-white/40">{formatDate(g.submittedAt)}</td>
                        {/* S4-07 Status column */}
                        <td className="py-4 pr-6">
                          <span className={`flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest ${meta.color}`}>
                            {meta.icon} {meta.label}
                          </span>
                        </td>
                        {/* S4-09 Expand resolution */}
                        <td className="py-4">
                          {isResolved && g.resolution && (
                            <button
                              onClick={() => setExpandedId(isExpanded ? null : g.id)}
                              className="flex items-center gap-1 text-[9px] font-mono uppercase tracking-widest text-white/20 hover:text-cyan-400 transition-colors"
                            >
                              {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                              {isExpanded ? "Hide" : "Response"}
                            </button>
                          )}
                        </td>
                      </tr>
                      {/* S4-09 Expandable resolution note */}
                      <AnimatePresence>
                        {isExpanded && g.resolution && (
                          <motion.tr
                            key={`${g.id}-resolution`}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                          >
                            <td colSpan={6} className="pb-4 pt-0 px-0">
                              <div className="ml-0 p-4 bg-white/[0.02] border-l-2 border-cyan-400/30">
                                <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest mb-2">Faculty Response</p>
                                <p className="text-sm text-white/60 font-light leading-relaxed">{g.resolution}</p>
                                {g.status === "resolved_updated" && g.updatedMarks !== undefined && (
                                  <p className="text-[10px] font-mono text-emerald-400 mt-2 uppercase tracking-widest">
                                    Marks updated to: {g.updatedMarks}
                                  </p>
                                )}
                              </div>
                            </td>
                          </motion.tr>
                        )}
                      </AnimatePresence>
                    </>
                  );
                })}
              </tbody>
            </table>
          )}
        </motion.div>

      </motion.div>
    </AccessGate>
  );
}
