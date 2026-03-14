"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  Table as TableIcon,
  TrendingUp,
  ArrowLeft,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Flag,
  PencilLine,
  ShieldAlert,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useDataStore } from "@/lib/dataStore";
import { computeCOAttainmentFromMarks, getAttainmentLevel } from "@/lib/computations";
import { AccessGate } from "@/components/auth/AccessGate";
import { staggerContainer, fadeSlideUp } from "@/lib/animations";
import { useAuthStore } from "@/lib/authStore";

type StudentRow = {
  roll: string;
  name: string;
  marks: Record<string, number | "">;
};

export default function LeadMarksApprovalPage() {
  const router = useRouter();

  const { user, activeRole } = useAuthStore();
  const courses = useDataStore(s => s.courses);
  const users = useDataStore(s => s.users);
  const submissions = useDataStore(s => s.submissions);
  const examConfigs = useDataStore(s => s.examConfigs);
  const thresholds = useDataStore(s => s.thresholds);
  const updateSubmission = useDataStore(s => s.updateSubmissionStatus);
  const addFacultyNotif = useDataStore(s => s.addFacultyNotification);
  const addAuditEntry = useDataStore(s => s.addAuditEntry);

  const allPending = useMemo(() => {
    const list: Array<{
      courseId: string;
      examId: string;
      submittedAt?: string;
      leadComment?: string;
      students: StudentRow[];
      history?: {
        id: string;
        action: "submitted" | "approved" | "returned" | "override";
        by: string;
        role: string;
        at: string;
        comment?: string;
      }[];
    }> = [];
    for (const cId in submissions) {
      submissions[cId].forEach(s => {
        if (s.status === "pending") {
          list.push({
            courseId: cId,
            examId: s.examId,
            submittedAt: s.submittedAt,
            leadComment: s.leadComment,
            students: s.students,
            history: s.history,
          });
        }
      });
    }
    return list;
  }, [submissions]);

  const [selectedIdx, setSelectedIdx] = useState(0);
  const pendingSub = allPending[selectedIdx] ?? null;

  const course = useMemo(() => courses.find(c => c.id === pendingSub?.courseId), [courses, pendingSub]);
  const exam = useMemo(() => examConfigs[pendingSub?.courseId || ""]?.find(e => e.id === pendingSub?.examId), [examConfigs, pendingSub]);
  const submitter = useMemo(() => users.find(u => u.id === course?.facultyId), [users, course?.facultyId]);

  const hasOverrideAuth =
    activeRole === "admin" ||
    activeRole === "department_head" ||
    !!user?.roles?.includes("admin") ||
    !!user?.roles?.includes("department_head");

  const [comment, setComment] = useState("");
  const [returnReason, setReturnReason] = useState("");
  const [overrideMode, setOverrideMode] = useState(false);
  const [overrideReason, setOverrideReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showConfirm, setShowConfirm] = useState<"approve" | "return" | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);

  const [editedStudents, setEditedStudents] = useState<StudentRow[]>([]);

  const workingStudents = useMemo(() => {
    if (!pendingSub) return [];
    return editedStudents.length ? editedStudents : pendingSub.students;
  }, [pendingSub, editedStudents]);

  const hasMarkOverrides = useMemo(() => {
    if (!pendingSub) return false;
    return pendingSub.students.some((s, idx) => {
      const edited = workingStudents[idx];
      if (!edited) return false;
      return Object.keys(s.marks).some(q => (s.marks[q] ?? "") !== (edited.marks[q] ?? ""));
    });
  }, [pendingSub, workingStudents]);

  const attainment = useMemo(() => {
    if (!pendingSub || !exam) return {};
    return computeCOAttainmentFromMarks(workingStudents, exam.questions, thresholds.targetPassPct);
  }, [pendingSub, exam, thresholds, workingStudents]);

  const previousExamComparison = useMemo(() => {
    if (!pendingSub || !exam || !course) return null;
    const exams = examConfigs[pendingSub.courseId] || [];
    const currentIdx = exams.findIndex(e => e.id === exam.id);
    if (currentIdx <= 0) return null;
    const prevExam = exams[currentIdx - 1];
    const prevSub = (submissions[pendingSub.courseId] || []).find(
      s => s.examId === prevExam.id && s.status === "approved",
    );
    if (!prevSub) return null;

    const currentAvg =
      workingStudents.reduce((sum, s) => {
        const total = Object.values(s.marks).reduce((t: number, m) => t + Number(m === "" ? 0 : m), 0);
        return sum + total;
      }, 0) / Math.max(workingStudents.length, 1);

    const prevAvg =
      prevSub.students.reduce((sum, s) => {
        const total = Object.values(s.marks).reduce((t: number, m) => t + Number(m === "" ? 0 : m), 0);
        return sum + total;
      }, 0) / Math.max(prevSub.students.length, 1);

    const diff = Math.round((currentAvg - prevAvg) * 10) / 10;
    return {
      prevExamName: prevExam.name,
      prevAvg: Math.round(prevAvg * 10) / 10,
      currentAvg: Math.round(currentAvg * 10) / 10,
      diff,
    };
  }, [pendingSub, exam, course, examConfigs, submissions, workingStudents]);

  const anomalyStats = useMemo(() => {
    if (!exam) return { zeroTotal: 0, fullTotal: 0, overMax: 0, allMissing: 0 };
    const zeroTotal = workingStudents.filter(s => {
      const total = Object.values(s.marks).reduce((t: number, m) => t + Number(m === "" ? 0 : m), 0);
      return total === 0;
    }).length;
    const fullTotal = workingStudents.filter(s => {
      const total = Object.values(s.marks).reduce((t: number, m) => t + Number(m === "" ? 0 : m), 0);
      return total === exam.maxMarks;
    }).length;
    const overMax = workingStudents.filter(s => {
      const total = Object.values(s.marks).reduce((t: number, m) => t + Number(m === "" ? 0 : m), 0);
      return total > exam.maxMarks;
    }).length;
    const allMissing = workingStudents.filter(
      s => exam.questions.every(q => s.marks[q.qno] === "" || s.marks[q.qno] === undefined),
    ).length;
    return { zeroTotal, fullTotal, overMax, allMissing };
  }, [workingStudents, exam]);

  const submissionHistory = useMemo(() => {
    if (!pendingSub) return [];
    const seeded = pendingSub.submittedAt
      ? [
          {
            id: `submitted-${pendingSub.submittedAt}`,
            action: "submitted",
            by: submitter?.name || submitter?.id || "Faculty",
            role: "faculty",
            at: pendingSub.submittedAt,
            comment: "Submitted for lead review",
          },
        ]
      : [];
    const merged = [...seeded, ...(pendingSub.history || [])];
    return merged.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  }, [pendingSub, submitter?.id, submitter?.name]);

  const updateCellMark = (roll: string, qno: string, raw: string) => {
    if (!pendingSub) return;
    const parsed = raw === "" ? "" : Number(raw);
    setEditedStudents(prev => {
      const base = prev.length ? prev : pendingSub.students.map(s => ({ ...s, marks: { ...s.marks } }));
      return base.map(s =>
        s.roll === roll
          ? {
              ...s,
              marks: {
                ...s.marks,
                [qno]: parsed,
              },
            }
          : s,
      );
    });
  };

  const handleAction = async (status: "approved" | "returned") => {
    if (!pendingSub) return;
    if (status === "returned" && !returnReason.trim()) return;
    if (hasMarkOverrides && !overrideReason.trim()) return;

    setIsProcessing(true);
    await new Promise(r => setTimeout(r, 800));

    const reviewerId = user?.id || "u3";
    const reviewerName = user?.name || "Course Lead";

    updateSubmission(pendingSub.courseId, pendingSub.examId, status, {
      by: reviewerId,
      comment: comment.trim() || undefined,
      returnReason: status === "returned" ? returnReason.trim() : undefined,
      overrideReason: hasMarkOverrides ? overrideReason.trim() : undefined,
      students: hasMarkOverrides ? workingStudents : undefined,
    });

    addAuditEntry({
      type: "approval",
      userId: reviewerId,
      role: activeRole || "subject_lead",
      action:
        status === "approved"
          ? `Approved ${pendingSub.examId.toUpperCase()} marks for ${pendingSub.courseId.toUpperCase()}`
          : `Returned ${pendingSub.examId.toUpperCase()} marks for ${pendingSub.courseId.toUpperCase()}`,
      ip: "127.0.0.1",
      result: "success",
    });

    if (hasMarkOverrides) {
      addAuditEntry({
        type: "override",
        userId: reviewerId,
        role: activeRole || "subject_lead",
        action: `Marks override on ${pendingSub.courseId.toUpperCase()} ${pendingSub.examId.toUpperCase()} by ${reviewerName}. Reason: ${overrideReason.trim()}`,
        ip: "127.0.0.1",
        result: "success",
      });
    }

    const course_ = courses.find(c => c.id === pendingSub.courseId);
    if (course_?.facultyId) {
      addFacultyNotif({
        userId: course_.facultyId,
        type: status === "approved" ? "success" : "critical",
        title: status === "approved" ? "Marks Approved" : "Marks Returned",
        message: status === "approved"
          ? `Your ${exam?.name} marks for ${course_?.code} were approved and CO attainment has been triggered for finalisation.`
          : `Your ${exam?.name} marks for ${course_?.code} were returned. ${returnReason ? `Reason: ${returnReason}` : ""}`,
        link: `/faculty/course/${pendingSub.courseId}/marks/${pendingSub.examId}`,
      });
    }

    setIsProcessing(false);
    setShowConfirm(null);
    setComment("");
    setReturnReason("");
    setOverrideReason("");
    setEditedStudents([]);
    setOverrideMode(false);
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
              {pendingSub && exam && course && (
                <p className="mt-2 text-[10px] font-mono uppercase tracking-widest text-white/50">
                  {exam.name} | {course.code} - {course.name} | Submitted by {submitter?.name || "Faculty"} | {pendingSub.submittedAt ? new Date(pendingSub.submittedAt).toLocaleString("en-IN") : "Time not available"}
                </p>
              )}
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
              {pendingSub?.submittedAt ? new Date(pendingSub.submittedAt).toLocaleString("en-IN") : "—"}
            </span>
          </div>
        </motion.div>

        <div className="flex gap-0 divide-x divide-white/5">

          {/* ── LEFT: MARKS TABLE ── */}
          <div className="flex-1 flex flex-col">
            <div className="flex items-center gap-3 px-8 py-5 border-b border-white/5">
              <TableIcon className="w-4 h-4 text-brand" />
              <h3 className="text-[10px] font-mono text-white/30 uppercase tracking-widest">Submission Data — Read Only</h3>
              {hasOverrideAuth && (
                <button
                  onClick={() => setOverrideMode(v => !v)}
                  className={`ml-auto inline-flex items-center gap-2 px-3 py-1.5 border text-[10px] font-mono uppercase tracking-widest transition-colors ${
                    overrideMode
                      ? "border-amber-400/40 text-amber-300 bg-amber-400/10"
                      : "border-white/10 text-white/40 hover:text-white"
                  }`}
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  HOD Authorised Override Mode
                </button>
              )}
            </div>
            <div className="px-8 py-3 border-b border-white/5 bg-white/[0.01]">
              <p className="text-[11px] text-white/55">
                Anomaly summary: {anomalyStats.zeroTotal} zero-total row(s), {anomalyStats.fullTotal} full-marks row(s), {anomalyStats.overMax} row(s) above max, {anomalyStats.allMissing} row(s) with all marks missing.
              </p>
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
                        <p className="text-[8px] text-white/40 font-mono uppercase">{q.co}</p>
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
                  {workingStudents.map((s, rowIdx) => {
                    const rowTotal = Object.values(s.marks).reduce((sum:number, m) => sum + Number(m === '' ? 0 : m), 0 as number);
                    const isOver   = rowTotal > (exam?.maxMarks || 0);
                    const isZero = rowTotal === 0;
                    const isFull = rowTotal === (exam?.maxMarks || 0);
                    const originalRow = pendingSub?.students[rowIdx];
                    return (
                      <tr
                        key={s.roll}
                        className={`border-b border-white/5 transition-colors hover:bg-white/[0.01] ${isZero ? "bg-amber-400/10" : ""}`}
                      >
                        <td className="px-6 py-3 font-mono text-xs text-white/50">{s.roll}</td>
                        <td className="px-6 py-3 text-xs text-white/40 italic">{s.name}</td>
                        {exam?.questions.map(q => {
                          const value = s.marks[q.qno] === "" || s.marks[q.qno] === undefined ? "" : String(s.marks[q.qno]);
                          const isChanged =
                            overrideMode &&
                            originalRow &&
                            (originalRow.marks[q.qno] === "" || originalRow.marks[q.qno] === undefined
                              ? ""
                              : String(originalRow.marks[q.qno])) !== value;
                          return (
                            <td
                              key={q.qno}
                              className={`px-4 py-3 text-center text-xs font-mono border-l border-white/5 ${
                                isChanged ? "bg-yellow-300/25" : "text-white/50"
                              }`}
                            >
                              {overrideMode ? (
                                <input
                                  type="number"
                                  min={0}
                                  max={q.maxMarks}
                                  value={value}
                                  onChange={e => updateCellMark(s.roll, q.qno, e.target.value)}
                                  className="w-full bg-transparent text-center text-xs font-mono text-white outline-none"
                                />
                              ) : (
                                <span>{value || "—"}</span>
                              )}
                            </td>
                          );
                        })}
                        <td className={`px-6 py-3 text-center font-mono text-sm font-bold border-l border-brand/20 ${isOver ? "text-alert bg-alert/5" : "text-brand bg-brand/5"}`}>
                          <div className="flex items-center justify-center gap-2">
                            <span>{rowTotal}</span>
                            {isFull && <Flag className="w-3.5 h-3.5 text-amber-300" />}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {previousExamComparison && (
              <div className="px-8 py-3 border-t border-white/5">
                <p className="text-xs text-white/55">
                  Previous exam comparison: {previousExamComparison.prevExamName} average was {previousExamComparison.prevAvg}. Current average is {previousExamComparison.currentAvg} ({previousExamComparison.diff >= 0 ? "+" : ""}{previousExamComparison.diff}).
                </p>
              </div>
            )}
          </div>

          {/* ── RIGHT: ATTAINMENT + ACTIONS ── */}
          <div className="w-80 shrink-0 flex flex-col divide-y divide-white/5">

            {/* Attainment preview */}
            <div className="p-6 flex flex-col gap-4">
              <h3 className="text-[10px] font-mono text-white/30 uppercase tracking-widest flex items-center gap-2">
                <TrendingUp className="w-3.5 h-3.5" /> Preview — will be finalised on approval
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
              <label className="text-[9px] font-mono text-white/20 uppercase tracking-widest">Return reason (required when returning)</label>
              <textarea
                value={returnReason}
                onChange={e => setReturnReason(e.target.value)}
                placeholder="Reason to return this submission..."
                className="w-full bg-white/[0.02] border border-white/10 p-3 text-xs text-white outline-none focus:border-brand h-20 resize-none"
              />
              {hasMarkOverrides && (
                <>
                  <label className="text-[9px] font-mono text-yellow-300 uppercase tracking-widest flex items-center gap-1.5">
                    <PencilLine className="w-3 h-3" /> Override reason (required)
                  </label>
                  <textarea
                    value={overrideReason}
                    onChange={e => setOverrideReason(e.target.value)}
                    placeholder="Explain the HOD-authorised override..."
                    className="w-full bg-yellow-300/10 border border-yellow-300/30 p-3 text-xs text-white outline-none focus:border-yellow-300 h-20 resize-none"
                  />
                </>
              )}
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

              <button
                onClick={() => setHistoryOpen(v => !v)}
                className="w-full py-2 border border-white/10 text-white/50 text-[10px] font-mono uppercase tracking-widest inline-flex items-center justify-center gap-2 hover:text-white"
              >
                Submission History
                {historyOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              {historyOpen && (
                <div className="border border-white/10 bg-white/[0.02] p-3 max-h-56 overflow-y-auto">
                  {submissionHistory.length === 0 ? (
                    <p className="text-[10px] text-white/30 italic">No history entries found.</p>
                  ) : (
                    <div className="space-y-2">
                      {submissionHistory.map(item => (
                        <div key={item.id} className="border-b border-white/5 pb-2 last:border-0">
                          <p className="text-[10px] font-mono text-white/65 uppercase">{item.action} · {new Date(item.at).toLocaleString("en-IN")}</p>
                          <p className="text-[10px] text-white/45">By {item.by} ({item.role})</p>
                          {item.comment && <p className="text-[10px] text-white/35 italic">{item.comment}</p>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
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
                    ? "This will lock marks, notify faculty, and trigger CO attainment finalisation for this assessment."
                    : "This will return the submission to faculty for correction. A return reason is required."}
                </p>
                {showConfirm === "return" && !returnReason.trim() && (
                  <p className="text-xs text-alert">Return reason is required to continue.</p>
                )}
                {hasMarkOverrides && !overrideReason.trim() && (
                  <p className="text-xs text-yellow-300">Override reason is required when marks are edited in override mode.</p>
                )}
                {comment && (
                  <div className="border-l-2 border-white/10 pl-4">
                    <p className="text-[10px] font-mono text-white/20 uppercase mb-1">Your Remark</p>
                    <p className="text-xs text-white/50 italic">{comment}</p>
                  </div>
                )}
                {showConfirm === "return" && returnReason && (
                  <div className="border-l-2 border-alert/30 pl-4">
                    <p className="text-[10px] font-mono text-alert uppercase mb-1">Return Reason</p>
                    <p className="text-xs text-white/70 italic">{returnReason}</p>
                  </div>
                )}
                <div className="flex gap-4 pt-2 border-t border-white/5">
                  <button onClick={() => setShowConfirm(null)}
                    className="flex-1 py-3 border border-white/10 text-white/40 hover:text-white text-[10px] font-mono uppercase tracking-widest transition-colors">
                    Cancel
                  </button>
                  <button
                    onClick={() => handleAction(showConfirm === "approve" ? "approved" : "returned")}
                    disabled={
                      isProcessing ||
                      (showConfirm === "return" && !returnReason.trim()) ||
                      (hasMarkOverrides && !overrideReason.trim())
                    }
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
