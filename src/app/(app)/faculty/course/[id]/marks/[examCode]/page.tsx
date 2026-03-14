"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  FileSpreadsheet,
  Edit3,
  Download,
  Upload,
  CheckCircle2,
  AlertCircle,
  Save,
  Send,
  UserX,
  ArrowLeft,
  Loader2,
  Table as TableIcon,
  Clock,
  Lock,
  RotateCcw,
} from "lucide-react";
import * as XLSX from "xlsx";
import { useDataStore, StudentMark } from "@/lib/dataStore";
import { useAuthStore } from "@/lib/authStore";
import { AccessGate } from "@/components/auth/AccessGate";
import { fadeSlideUp } from "@/lib/animations";
import { computeCOAttainmentFromMarks } from "@/lib/computations";

export default function MarksPortalPage() {
  const { id, examCode } = useParams();
  const router    = useRouter();
  const courseId  = id as string;
  const examId    = examCode as string;

  const courses      = useDataStore(s => s.courses);
  const course       = useMemo(() => courses.find(c => c.id === courseId), [courses, courseId]);
  const examConfigs  = useDataStore(s => s.examConfigs[courseId] || []);
  const exam         = useMemo(() => examConfigs.find(e => e.id === examId), [examConfigs, examId]);
  const submissions  = useDataStore(s => s.submissions[courseId] || []);
  const currentSub   = useMemo(() => submissions.find(s => s.examId === examId), [submissions, examId]);
  const saveSubmission = useDataStore(s => s.saveSubmission);
  const addFacultyNotif = useDataStore(s => s.addFacultyNotification);
  const cos          = useDataStore(s => s.cos[courseId] || []);
  const { user }     = useAuthStore();

  const [mode, setMode]       = useState<"excel" | "manual">("excel");
  const [data, setData]       = useState<StudentMark[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors]   = useState<string[]>([]);
  const [uploadErrors, setUploadErrors] = useState<string[]>([]);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [absentRows, setAbsentRows] = useState<Set<string>>(new Set());
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [highlightRoll, setHighlightRoll] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [colWidths, setColWidths] = useState<Record<string, number>>({ roll: 120, abs: 50, total: 100 });
  const resizingCol = useRef<string | null>(null);
  const startX = useRef<number>(0);
  const startWidth = useRef<number>(0);

  const handleResizeStart = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    resizingCol.current = id;
    startX.current = e.pageX;
    startWidth.current = colWidths[id] || 80;
    document.addEventListener("mousemove", handleResizeMove);
    document.addEventListener("mouseup", handleResizeEnd);
  };

  const handleResizeMove = (e: MouseEvent) => {
    if (!resizingCol.current) return;
    const diff = e.pageX - startX.current;
    setColWidths(prev => ({
      ...prev,
      [resizingCol.current!]: Math.max(40, startWidth.current + diff)
    }));
  };

  const handleResizeEnd = () => {
    resizingCol.current = null;
    document.removeEventListener("mousemove", handleResizeMove);
    document.removeEventListener("mouseup", handleResizeEnd);
  };

  const fileRef = useRef<HTMLInputElement>(null);

  const questions = exam?.questions || [];

  // Either-Or groups
  const eitherOrGroups = useMemo(() => {
    const groups: Record<string, string[]> = {};
    questions.forEach(q => {
      if (q.isEitherOr && q.eitherOrGroup) {
        if (!groups[q.eitherOrGroup]) groups[q.eitherOrGroup] = [];
        groups[q.eitherOrGroup].push(q.qno);
      }
    });
    return groups;
  }, [questions]);

  // For a given student + question, is this cell disabled because the other Either-Or option has marks?
  const isCellDisabled = (roll: string, qno: string): boolean => {
    const q = questions.find(x => x.qno === qno);
    if (!q?.isEitherOr || !q.eitherOrGroup) return false;
    const group = eitherOrGroups[q.eitherOrGroup] || [];
    const student = data.find(s => s.roll === roll);
    if (!student) return false;
    return group.some(pairQno => pairQno !== qno && student.marks[pairQno] !== "" && student.marks[pairQno] !== undefined && Number(student.marks[pairQno]) > 0);
  };

  useEffect(() => {
    if (currentSub?.students?.length) {
      setData(currentSub.students);
    } else if (course?.studentRolls?.length) {
      setData(course.studentRolls.map(roll => ({ roll, name: "Student", marks: {} })));
    } else {
      // Seed demo students
      const demoRolls = Array.from({ length: 10 }, (_, i) => `21CS00${i + 1}`);
      setData(demoRolls.map(roll => ({ roll, name: "Student", marks: {} })));
    }
  }, [currentSub, course]);

  // Auto-save every 30 seconds in manual mode
  useEffect(() => {
    const interval = setInterval(() => {
      if (data.length > 0 && mode === "manual") {
        saveSubmission({
          courseId,
          examId,
          students: data,
          status: currentSub?.status || "draft",
          submittedAt: new Date().toISOString(),
        });
        setLastSaved(new Date().toLocaleTimeString());
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [data, mode, courseId, examId, saveSubmission, currentSub?.status]);

  const updateMark = (roll: string, qno: string, val: string) => {
    const num = val === "" ? "" : parseFloat(val);
    setData(prev => prev.map(s =>
      s.roll === roll ? { ...s, marks: { ...s.marks, [qno]: num } } : s
    ));
  };

  const toggleAbsent = (roll: string) => {
    setAbsentRows(prev => {
      const next = new Set(prev);
      if (next.has(roll)) {
        next.delete(roll);
        setData(d => d.map(s => s.roll === roll ? { ...s, marks: {} } : s));
      } else {
        next.add(roll);
        const zeroMarks: Record<string, number> = {};
        questions.forEach(q => { zeroMarks[q.qno] = 0; });
        setData(d => d.map(s => s.roll === roll ? { ...s, marks: zeroMarks } : s));
      }
      return next;
    });
  };

  // Template download
  const downloadTemplate = () => {
    const headers = ["Roll Number", "Student Name", ...questions.map(q => `${q.qno} (Max: ${q.maxMarks})`)];
    const maxRow  = ["MAX", "", ...questions.map(q => q.maxMarks)];
    const ws = XLSX.utils.aoa_to_sheet([headers, maxRow]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Marks");
    XLSX.writeFile(wb, `${course?.code}_${examId}_template.xlsx`);
  };

  // Excel upload + parse
  const handleFileUpload = (file: File) => {
    setUploadErrors([]);
    setUploadSuccess(false);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb   = XLSX.read(e.target?.result, { type: "binary" });
        const ws   = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<Record<string, any>>(ws, { header: 1 }) as any[][];

        if (rows.length < 2) { setUploadErrors(["File is empty or has no data rows."]); return; }

        const headerRow = rows[0] as string[];
        const errs: string[] = [];
        const parsed: StudentMark[] = [];

        // Find column indices
        const rollIdx = headerRow.findIndex(h => String(h).toLowerCase().includes("roll"));
        const nameIdx = headerRow.findIndex(h => String(h).toLowerCase().includes("name"));
        if (rollIdx === -1) { setUploadErrors(["Roll Number column not found in template."]); return; }

        // Map question columns
        const qColMap: Record<string, number> = {};
        questions.forEach(q => {
          const idx = headerRow.findIndex(h => String(h).startsWith(q.qno));
          if (idx !== -1) qColMap[q.qno] = idx;
        });

        const enrolledRolls = new Set(data.map(s => s.roll));
        const seenRolls = new Set<string>();

        rows.slice(1).forEach((row, ri) => {
          const roll = String(row[rollIdx] || "").trim();
          if (!roll || roll.toLowerCase() === "max") return;

          if (seenRolls.has(roll)) { errs.push(`Duplicate entry for roll ${roll}.`); return; }
          seenRolls.add(roll);
          if (!enrolledRolls.has(roll)) { errs.push(`Roll ${roll} not found in enrolled list.`); return; }

          const marks: Record<string, number | ""> = {};
          let rowTotal = 0;

          questions.forEach(q => {
            const colIdx = qColMap[q.qno];
            if (colIdx === undefined) return;
            const raw = row[colIdx];
            if (raw === undefined || raw === null || raw === "") { marks[q.qno] = ""; return; }
            const val = Number(raw);
            if (isNaN(val)) { errs.push(`Row ${ri + 2}: ${q.qno} has non-numeric value.`); marks[q.qno] = ""; return; }
            if (val < 0) { errs.push(`Negative marks not allowed. Row ${ri + 2}, ${q.qno}.`); marks[q.qno] = ""; return; }
            if (val > q.maxMarks) { errs.push(`${q.qno} marks ${val} exceed max ${q.maxMarks} for ${roll}.`); }
            marks[q.qno] = val;
            rowTotal += val;
          });

          // Either-Or check
          Object.entries(eitherOrGroups).forEach(([group, qnos]) => {
            const filled = qnos.filter(qno => marks[qno] !== "" && Number(marks[qno]) > 0);
            if (filled.length > 1) errs.push(`Both ${qnos.join(" and ")} have marks for ${roll}. Only one allowed.`);
          });

          if (rowTotal > (exam?.maxMarks || 0)) {
            errs.push(`Total marks ${rowTotal} exceed exam max ${exam?.maxMarks} for ${roll}.`);
          }

          parsed.push({ roll, name: String(row[nameIdx] ?? "Student"), marks });
        });

        setUploadErrors(errs);
        if (parsed.length > 0) {
          setData(prev => prev.map(s => {
            const found = parsed.find(p => p.roll === s.roll);
            return found ? { ...s, ...found } : s;
          }));
          if (errs.length === 0) setUploadSuccess(true);
        }
      } catch {
        setUploadErrors(["Failed to parse file. Ensure it is a valid .xlsx file."]);
      }
    };
    reader.readAsBinaryString(file);
  };

  // Bulk paste from clipboard
  const handleBulkPaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const rows = text.trim().split("\n").map(r => r.split("\t"));
      if (!rows.length) return;
      const updated = [...data];
      rows.forEach(row => {
        const roll = row[0]?.trim();
        if (!roll) return;
        const idx = updated.findIndex(s => s.roll === roll);
        if (idx === -1) return;
        questions.forEach((q, qi) => {
          const val = row[qi + 1]?.trim();
          if (val !== undefined) updated[idx].marks[q.qno] = val === "" ? "" : parseFloat(val);
        });
      });
      setData(updated);
    } catch {
      alert("Clipboard access denied. Please allow clipboard permissions.");
    }
  };

  const validate = (): string[] => {
    const errs: string[] = [];
    if (!questions.length) {
      errs.push("No questions are configured for this assessment.");
      return errs;
    }

    data.forEach(s => {
      const missing = questions.filter(
        q => s.marks[q.qno] === undefined || s.marks[q.qno] === "",
      );
      if (missing.length > 0) {
        errs.push(
          `Missing marks for ${s.roll}: ${missing.map(q => q.qno).join(", ")}.`,
        );
      }

      const total = Object.values(s.marks).reduce((sum:number,m)=>sum+Number(m===""?0:m),0);
      if (total > (exam?.maxMarks || 0)) errs.push(`Total ${total} exceeds max ${exam?.maxMarks} for ${s.roll}.`);
      questions.forEach(q => {
        const val = s.marks[q.qno];
        if (typeof val === "number" && val < 0) errs.push(`Negative marks for ${s.roll}, ${q.qno}.`);
        if (typeof val === "number" && val > q.maxMarks) errs.push(`${q.qno} marks ${val} exceed max ${q.maxMarks} for ${s.roll}.`);
      });
      Object.entries(eitherOrGroups).forEach(([, qnos]) => {
        const filled = qnos.filter(qno => typeof s.marks[qno] === "number" && Number(s.marks[qno]) > 0);
        if (filled.length > 1) errs.push(`Both ${qnos.join(" & ")} filled for ${s.roll}. Only one allowed.`);
      });
    });
    return errs;
  };

  const handleManualSave = async () => {
    setIsSaving(true);
    await new Promise(r => setTimeout(r, 600));
    saveSubmission({ courseId, examId, students: data, status: "draft", submittedAt: new Date().toISOString() });
    setLastSaved(new Date().toLocaleTimeString());
    setIsSaving(false);
  };

  const handleSubmit = async () => {
    const errs = validate();
    if (errs.length > 0) { setErrors(errs); return; }
    setErrors([]);
    setShowConfirm(true);
  };

  const confirmSubmit = async () => {
    setShowConfirm(false);
    setIsSaving(true);
    await new Promise(r => setTimeout(r, 1000));
    saveSubmission({ courseId, examId, students: data, status: "pending", submittedAt: new Date().toISOString() });
    const leadId = course?.leadId;
    if (leadId) {
      addFacultyNotif({
        userId: leadId,
        type: "reminder",
        title: "Marks Submitted for Approval",
        message: `${user?.name || "Faculty"} has submitted ${exam?.name || examId.toUpperCase()} marks for ${course?.code}. Please review and approve.`,
        link: "/lead/marks-approval",
      });
    }
    setIsSaving(false);
  };

  const enrolledCount = course?.students || data.length;

  const filledStudents = useMemo(
    () =>
      data.filter(s => {
        if (absentRows.has(s.roll)) return true;
        if (!questions.length) return false;
        return questions.every(q => s.marks[q.qno] !== undefined && s.marks[q.qno] !== "");
      }).length,
    [data, questions, absentRows],
  );

  const filteredData = useMemo(
    () =>
      data.filter(
        s =>
          s.roll.toLowerCase().includes(search.toLowerCase()) ||
          (s.name || "").toLowerCase().includes(search.toLowerCase()),
      ),
    [data, search],
  );

  const liveCOPreview = useMemo(() => {
    if (!showPreview || !questions.length || !data.length) return null;
    const studentsRows = data.map(s => ({
      roll: s.roll,
      name: s.name,
      marks: s.marks,
    }));
    const qMappings = questions.map(q => ({
      qno: q.qno,
      co: q.co,
      maxMarks: q.maxMarks,
      isEitherOr: q.isEitherOr,
      eitherOrGroup: q.eitherOrGroup,
    }));
    const res = computeCOAttainmentFromMarks(studentsRows, qMappings, 50);
    return res;
  }, [showPreview, questions, data]);

  // ── SUBMITTED / APPROVED / RETURNED STATUS VIEWS ──────────────────────────
  const isLocked = currentSub?.status === "pending" || currentSub?.status === "approved";
  const isReturned = currentSub?.status === "returned";

  return (
    <AccessGate feature="marks_upload" deny="lock">
      <div className="max-w-screen-2xl mx-auto flex flex-col gap-0 pb-32">

        {/* ── CONFIRMATION DIALOG ── */}
        {showConfirm && (
          <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-8">
            <div className="w-full max-w-md bg-[#0D1829] border border-white/10 p-8 flex flex-col gap-6">
              <p className="text-white font-display text-lg">Submit {examId.toUpperCase()} marks for {course?.code} to Course Lead for approval?</p>
              <p className="text-white/40 text-sm">{data.length} students · {exam?.name}</p>
              <div className="flex gap-3">
                <button onClick={confirmSubmit} className="flex-1 py-3 bg-attain text-white text-xs font-mono uppercase tracking-widest hover:bg-attain/90 transition-colors flex items-center justify-center gap-2">
                  <Send className="w-3.5 h-3.5" /> Confirm Submit
                </button>
                <button onClick={() => setShowConfirm(false)} className="px-6 py-3 border border-white/10 text-white/50 text-xs font-mono uppercase tracking-widest hover:text-white transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── APPROVED STATUS BANNER ── */}
        {currentSub?.status === "approved" && (
          <div className="mb-6 flex items-center gap-3 px-5 py-4 bg-attain/5 border border-attain/30">
            <CheckCircle2 className="w-5 h-5 text-attain shrink-0" />
            <div>
              <p className="text-attain text-sm font-mono">Marks approved{currentSub.approvedBy ? ` by ${currentSub.approvedBy}` : ""}{currentSub.approvedAt ? ` on ${new Date(currentSub.approvedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}` : ""}. CO attainment is being calculated.</p>
            </div>
          </div>
        )}

        {/* ── PENDING SUBMITTED BANNER ── */}
        {currentSub?.status === "pending" && (
          <div className="mb-6 flex items-center gap-3 px-5 py-4 bg-amber-400/5 border border-amber-400/30">
            <Clock className="w-5 h-5 text-amber-400 shrink-0" />
            <p className="text-amber-400 text-sm font-mono">
              Submitted {currentSub.submittedAt ? new Date(currentSub.submittedAt).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : ""}. Awaiting Course Lead approval.
            </p>
          </div>
        )}

        {/* ── RETURNED BANNER with reason + Edit button ── */}
        {isReturned && (
          <div className="mb-6 flex items-start gap-3 px-5 py-4 bg-alert/5 border border-alert/30">
            <AlertCircle className="w-5 h-5 text-alert shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-alert text-sm font-mono font-medium">Marks returned by Course Lead.</p>
              {currentSub?.returnReason && (
                <p className="text-white/60 text-xs mt-1">Reason: {currentSub.returnReason}</p>
              )}
            </div>
            <button
              onClick={() => saveSubmission({ courseId, examId, students: data, status: "draft", submittedAt: currentSub?.submittedAt })}
              className="shrink-0 flex items-center gap-1.5 px-4 py-2 border border-alert/40 text-alert text-[10px] font-mono uppercase tracking-widest hover:bg-alert hover:text-white transition-colors"
            >
              <RotateCcw className="w-3 h-3" /> Edit Marks
            </button>
          </div>
        )}

        {/* Exam tabs + header */}
        <div className="flex flex-col gap-4 pb-6 border-b border-white/5">
          <div className="flex items-center gap-3 border-b border-white/10 pb-2">
            {["t1","t2","t3","t4","t5","see"].map(code => {
              const examCfg = examConfigs.find(e => e.id === code);
              if (!examCfg) return null;
              const sub = submissions.find(s => s.examId === code);
              const status = sub?.status || "draft";
              const color =
                status === "approved"
                  ? "bg-attain"
                  : status === "pending"
                  ? "bg-amber-400"
                  : "bg-white/20";
              return (
                <button
                  key={code}
                  onClick={() => router.push(`/faculty/course/${courseId}/marks/${code}`)}
                  className={`flex items-center gap-2 px-4 py-2 text-[10px] font-mono uppercase tracking-widest border-b-2 ${
                    examId === code
                      ? "border-brand text-brand"
                      : "border-transparent text-white/40 hover:text-white"
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${color}`} />
                  {code.toUpperCase()}
                </button>
              );
            })}
          </div>

        {/* Header */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-4">
            <button onClick={() => router.back()} className="p-2 hover:bg-white/5 transition-colors">
              <ArrowLeft className="w-5 h-5 text-white/40" />
            </button>
            <div>
              <h1 className="text-3xl font-display text-white">{exam?.name || examId.toUpperCase()}</h1>
              <p className="text-white/40 text-sm font-light mt-0.5">
                {course?.name} · Max Marks: {exam?.maxMarks}
              </p>
            </div>
          </div>

          {/* Status banner */}
          <p className="text-xs font-mono text-white/40">
            {examId.toUpperCase()} —{" "}
            {currentSub?.status === "approved"
              ? "Approved"
              : currentSub?.status === "pending"
              ? "Submitted for approval"
              : currentSub?.status === "returned"
              ? "Returned"
              : "In Progress"}{" "}
            — {filledStudents}/{enrolledCount || data.length} students entered
            {lastSaved && ` — Last saved: ${lastSaved}`}
          </p>

          {/* Student count + CO preview toggle */}
          <div className="flex items-center justify-between text-xs text-white/40">
            <span>
              {enrolledCount || data.length} students enrolled in this course
              section.
            </span>
            <button
              type="button"
              onClick={() => setShowPreview(v => !v)}
              className="text-[11px] font-mono text-brand hover:text-white underline-offset-4 hover:underline"
            >
              {showPreview ? "Hide CO preview" : "Show live CO preview"}
            </button>
          </div>

          {/* Mode toggle — hidden when submitted/approved */}
          <div className="flex border-b border-white/5">
            <button onClick={() => setMode("excel")}
              className={`px-6 py-3 text-[10px] font-mono uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 ${
                mode === "excel" ? "border-brand text-brand" : "border-transparent text-white/30 hover:text-white"
              }`}>
              <FileSpreadsheet className="w-3.5 h-3.5" /> Excel Upload
            </button>
            <button onClick={() => setMode("manual")}
              className={`px-6 py-3 text-[10px] font-mono uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 ${
                mode === "manual" ? "border-brand text-brand" : "border-transparent text-white/30 hover:text-white"
              }`}>
              <Edit3 className="w-3.5 h-3.5" /> Manual Entry
            </button>
          </div>
        </div>
        </div>

        {/* ── READ-ONLY VIEW when pending/approved ── */}
        {isLocked && (
          <div className="py-8 flex flex-col gap-4">
            <div className="flex items-center gap-2 text-[10px] font-mono text-white/30 uppercase tracking-widest">
              <Lock className="w-3.5 h-3.5" /> Read-only — marks {currentSub?.status === "approved" ? "approved" : "submitted, awaiting approval"}
            </div>
            <div className="overflow-x-auto border border-white/10 rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-white/[0.02]">
                  <tr>
                    <th className="px-4 py-3 text-[9px] font-mono text-white/30 uppercase tracking-widest">Roll No.</th>
                    {questions.map(q => (
                      <th key={q.qno} className="px-4 py-3 text-center text-[9px] font-mono text-white/30 uppercase">
                        {q.qno}<br /><span className="text-white/20">/{q.maxMarks}</span>
                      </th>
                    ))}
                    <th className="px-4 py-3 text-center text-[9px] font-mono text-white/30 uppercase">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map(s => {
                    const total = Object.values(s.marks).reduce((sum: number, m) => sum + Number(m === "" ? 0 : m), 0);
                    return (
                      <tr key={s.roll} className="border-t border-white/5">
                        <td className="px-4 py-2 font-mono text-white/50">{s.roll}</td>
                        {questions.map(q => (
                          <td key={q.qno} className="px-4 py-2 text-center font-mono text-white/60">
                            {s.marks[q.qno] !== undefined && s.marks[q.qno] !== "" ? String(s.marks[q.qno]) : "—"}
                          </td>
                        ))}
                        <td className="px-4 py-2 text-center font-mono text-brand font-bold">{total}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── EXCEL MODE ── */}
        {!isLocked && mode === "excel" && (
          <motion.div variants={fadeSlideUp} className="flex flex-col gap-0 divide-y divide-white/5">

            {/* Drop zone */}
            <div
              className="py-16 flex flex-col items-center gap-6 text-center hover:bg-white/[0.01] transition-colors cursor-pointer"
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFileUpload(f); }}
              onClick={() => fileRef.current?.click()}
            >
              <div className="w-16 h-16 border border-white/10 flex items-center justify-center text-white/20">
                <Upload className="w-8 h-8" />
              </div>
              <div>
                <p className="text-xl font-display text-white">Drag & Drop Marks Template</p>
                <p className="text-white/30 text-sm font-light mt-1">Only .xlsx files. Roll Numbers must match enrolled list.</p>
              </div>
              <div className="flex gap-4">
                <button onClick={e => { e.stopPropagation(); downloadTemplate(); }}
                  className="px-6 py-2.5 border border-white/10 text-white/60 text-[10px] font-mono uppercase tracking-widest hover:border-white/30 hover:text-white transition-colors flex items-center gap-2">
                  <Download className="w-3.5 h-3.5" /> Download Template
                </button>
                <span className="px-6 py-2.5 bg-brand text-white text-[10px] font-mono uppercase tracking-widest flex items-center gap-2">
                  <Upload className="w-3.5 h-3.5" /> Browse Files
                </span>
              </div>
              <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleFileUpload(f); }} />
            </div>

            {/* Validation results */}
            {(uploadErrors.length > 0 || uploadSuccess) && (
              <div className="py-6 px-8 flex flex-col gap-3">
                <h3 className="text-[10px] font-mono text-white/30 uppercase tracking-widest">Validation Report</h3>
                {uploadSuccess && (
                  <div className="flex items-center gap-2 text-attain text-xs">
                    <CheckCircle2 className="w-4 h-4" /> File parsed successfully. No errors found. Ready to submit.
                  </div>
                )}
                {uploadErrors.map((err, i) => (
                  <div key={i} className="flex items-start gap-2 text-alert text-xs border-b border-white/5 pb-2">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" /> {err}
                  </div>
                ))}
              </div>
            )}

            {/* Validation rules */}
            <div className="py-6 px-8">
              <h3 className="text-[10px] font-mono text-white/30 uppercase tracking-widest mb-4">Validation Rules</h3>
              <div className="flex flex-col divide-y divide-white/5">
                {[
                  "Sum of question marks ≤ Exam maximum marks",
                  "Negative values are strictly prohibited",
                  "Only one question in an Either-Or pair can have marks per student",
                  "Unknown Roll Numbers will be flagged as errors",
                  "Duplicate roll number rows will be rejected",
                  "Each question mark must not exceed that question's maximum",
                ].map((rule, i) => (
                  <div key={i} className="flex items-center gap-3 py-3 text-xs text-white/40">
                    <CheckCircle2 className="w-3.5 h-3.5 text-attain shrink-0" /> {rule}
                  </div>
                ))}
              </div>
            </div>

            {/* Submit after upload */}
            {uploadSuccess && (
              <div className="py-6 px-8 flex justify-end">
                <button onClick={handleSubmit} disabled={isSaving}
                  className="px-8 py-3 bg-attain text-white text-xs font-mono uppercase tracking-widest flex items-center gap-2 hover:bg-attain/90 transition-colors disabled:opacity-50">
                  {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  Submit for Lead Approval
                </button>
              </div>
            )}
          </motion.div>
        )}

        {/* ── MANUAL MODE ── */}
        {!isLocked && mode === "manual" && (
          <motion.div variants={fadeSlideUp} className="flex flex-col gap-0">

            {/* Toolbar */}
            <div className="flex items-center justify-between py-4 border-b border-white/5">
              <div className="flex items-center gap-6">
                <span className={`text-[10px] font-mono uppercase tracking-widest px-3 py-1 border ${
                  currentSub?.status === "approved" ? "border-attain/30 text-attain" :
                  currentSub?.status === "pending"  ? "border-amber-400/30 text-amber-400" :
                  currentSub?.status === "returned" ? "border-alert/30 text-alert" :
                  "border-white/10 text-white/30"
                }`}>
                  {currentSub?.status || "Draft"}
                </span>
                {lastSaved && (
                  <span className="flex items-center gap-1.5 text-[10px] font-mono text-white/20">
                    <Clock className="w-3 h-3" /> Auto-saved {lastSaved}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <button onClick={handleBulkPaste}
                  className="flex items-center gap-2 text-[10px] font-mono text-white/30 uppercase tracking-widest hover:text-white transition-colors border border-white/5 px-3 py-2">
                  <TableIcon className="w-3.5 h-3.5" /> Bulk Paste
                </button>
                <button onClick={handleManualSave} disabled={isSaving}
                  className="flex items-center gap-2 text-[10px] font-mono text-white/40 uppercase tracking-widest hover:text-white transition-colors px-3 py-2">
                  {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Save
                </button>
                <button onClick={handleSubmit} disabled={isSaving}
                  className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest px-5 py-2 bg-attain text-white hover:bg-attain/90 transition-colors disabled:opacity-50">
                  <Send className="w-3.5 h-3.5" /> Submit for Approval
                </button>
              </div>
            </div>

            {/* Errors */}
            {errors.length > 0 && (
              <div className="py-4 border-b border-alert/20 bg-alert/5 flex flex-col gap-2 px-4">
                {errors.slice(0, 5).map((err, i) => (
                  <div key={i} className="flex items-center gap-2 text-alert text-xs">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {err}
                  </div>
                ))}
                {errors.length > 5 && <p className="text-[10px] text-alert/60 font-mono">+{errors.length - 5} more errors</p>}
              </div>
            )}

            {/* Table + CO preview layout */}
            <div className="flex gap-4">
            <div className="flex-1 overflow-x-auto relative border border-white/10 rounded-xl bg-white/[0.01] custom-scrollbar">
              <table className="w-full text-left border-collapse table-fixed">
                <thead className="sticky top-0 z-30 bg-[#0c0c12]">
                  <tr className="border-b border-white/10">
                    <th 
                      style={{ width: colWidths.roll }}
                      className="px-5 py-4 text-[9px] font-mono text-white/30 uppercase tracking-widest sticky left-0 z-40 bg-[#0c0c12] border-r border-white/10"
                    >
                       Roll No.
                       <div onMouseDown={e => handleResizeStart(e, "roll")} className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-brand/50" />
                    </th>
                    <th style={{ width: colWidths.abs || 50 }} className="px-5 py-4 text-[9px] font-mono text-white/30 uppercase tracking-widest text-center border-r border-white/10">
                       Abs.
                    </th>
                    {questions.map(q => {
                      const w = colWidths[q.qno] || 80;
                      return (
                        <th 
                          key={q.qno} 
                          style={{ width: w }}
                          className={`px-4 py-4 text-center border-r border-white/10 relative ${q.isEitherOr ? "bg-brand/[0.03]" : ""}`}
                        >
                          <p className="text-brand font-mono text-xs">{q.qno}</p>
                          <p className="text-[8px] text-white/20 font-mono mt-0.5">/{q.maxMarks}</p>
                          {q.isEitherOr && <p className="text-[8px] text-brand/40 font-mono">OR</p>}
                          <div onMouseDown={e => handleResizeStart(e, q.qno)} className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-brand/50" />
                        </th>
                      );
                    })}
                    <th style={{ width: colWidths.total || 100 }} className="px-5 py-4 text-center border-l border-brand/20 bg-brand/10 z-40">
                      <p className="text-[9px] font-mono text-white/40 uppercase">Total</p>
                      <p className="text-[8px] font-mono text-white/20">/{exam?.maxMarks}</p>
                    </th>
                  </tr>
                  {/* CO indicator row */}
                  {questions.length > 0 && (
                    <tr className="border-b border-white/10">
                      <th className="px-5 py-1 text-[9px] font-mono text-white/30 uppercase tracking-widest sticky left-0 bg-[#0c0c12] z-30">
                        Student
                      </th>
                      <th className="px-5 py-1 text-center text-[9px] font-mono text-white/30 uppercase tracking-widest border-r border-white/10">
                        Abs
                      </th>
                      {questions.map(q => (
                        <th
                          key={`${q.qno}-co`}
                          className="px-4 py-1 text-center text-[9px] font-mono text-white/30"
                        >
                          {q.co}
                        </th>
                      ))}
                      <th />
                    </tr>
                  )}
                </thead>
                <tbody>
                  {filteredData.map(s => {
                    const isAbsent  = absentRows.has(s.roll);
                    const rowTotal  = Object.values(s.marks).reduce((sum:number,m)=>sum+Number(m===""?0:m),0);
                    const isOverMax = rowTotal > (exam?.maxMarks || 0);
                    return (
                      <tr key={s.roll} className={`border-b border-white/5 hover:bg-white/[0.02] group transition-colors ${isAbsent ? "opacity-40" : ""}`}>
                        <td
                          onClick={() =>
                            setHighlightRoll(r =>
                              r === s.roll ? null : s.roll,
                            )
                          }
                          className={`px-5 py-3 font-mono text-xs text-white/50 sticky left-0 bg-[#0c0c12] border-r border-white/10 z-20 group-hover:bg-[#15151b] ${
                            highlightRoll === s.roll ? "bg-amber-500/20" : ""
                          }`}
                        >
                          {s.roll}
                        </td>
                        <td className="px-3 py-3 text-center border-r border-white/10">{/* Absent logic unchanged */}
                          <button onClick={() => toggleAbsent(s.roll)}
                            className={`w-5 h-5 border flex items-center justify-center mx-auto transition-colors ${
                              isAbsent ? "border-alert/40 bg-alert/10 text-alert" : "border-white/10 text-white/10 hover:border-white/30"
                            }`}>
                            {isAbsent && <UserX className="w-3 h-3" />}
                          </button>
                        </td>
                        {questions.map(q => {
                          const val      = s.marks[q.qno] ?? "";
                          const disabled = isAbsent || isCellDisabled(s.roll, q.qno);
                          const overMax =
                            typeof val === "number" && val > q.maxMarks;
                          return (
                            <td
                              key={q.qno}
                              className={`px-2 py-2 border-r border-white/10 ${
                                q.isEitherOr ? "bg-brand/[0.01]" : ""
                              } ${
                                disabled && !isAbsent
                                  ? "bg-white/[0.03]"
                                  : ""
                              }`}
                            >
                              <input
                                type="number"
                                value={val}
                                placeholder="—"
                                disabled={disabled}
                                onChange={e => updateMark(s.roll, q.qno, e.target.value)}
                                title={
                                  overMax
                                    ? `Max allowed: ${q.maxMarks}`
                                    : undefined
                                }
                                className={`w-full bg-transparent text-center text-xs font-mono outline-none border ${
                                  disabled
                                    ? "border-transparent text-white/10 cursor-not-allowed"
                                    : overMax
                                    ? "border-alert text-alert"
                                    : "border-transparent text-white"
                                } py-1 transition-colors`}
                              />
                            </td>
                          );
                        })}
                        <td className={`px-5 py-3 text-center border-l border-brand/20 font-mono text-sm font-bold ${
                          isOverMax ? "text-alert bg-alert/5" : "text-brand bg-brand/5"
                        }`}>
                          {rowTotal}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {/* Live CO preview panel */}
            {showPreview && liveCOPreview && (
              <div className="w-64 shrink-0 border border-white/10 rounded-xl bg-black/60 p-4 space-y-2">
                <p className="text-[10px] font-mono text-white/40 uppercase tracking-widest">
                  Estimated CO preview
                </p>
                <p className="text-[10px] text-white/30">
                  Estimated — not final until marks are approved.
                </p>
                {cos.map(co => {
                  const v = liveCOPreview[co.co];
                  const pct = v?.pct ?? 0;
                  const color =
                    pct >= 60
                      ? "text-attain"
                      : pct >= 40
                      ? "text-amber-400"
                      : "text-alert";
                  return (
                    <div
                      key={co.co}
                      className="flex items-center justify-between text-[11px] text-white/60"
                    >
                      <span className="font-mono">{co.co}</span>
                      <span className={color}>{pct}%</span>
                    </div>
                  );
                })}
              </div>
            )}
            </div>

            {/* Completion + checklist */}
            <div className="mt-4 flex flex-col gap-2 text-[10px] font-mono text-white/40">
              <span>
                {filledStudents} of {enrolledCount || data.length} students have
                all marks entered (or marked absent).
              </span>
              <div className="flex flex-col gap-1">
                <span>
                  <span className={filledStudents === (enrolledCount || data.length) ? "text-attain" : "text-white/30"}>
                    ✓
                  </span>{" "}
                  All students have marks entered
                </span>
                <span>
                  <span className={errors.length === 0 ? "text-attain" : "text-alert"}>
                    ✓
                  </span>{" "}
                  No validation errors
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </AccessGate>
  );
}
