"use client";

import { use, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, Upload, Download, AlertCircle, CheckCircle2, Trash2, Save, Send, Loader2 } from "lucide-react";
import Link from "next/link";
import * as XLSX from "xlsx";
import { fadeSlideUp, staggerContainer } from "@/lib/animations";
import { useDataStore, StudentMarkRow } from "@/lib/dataStore";
import { useAuthStore } from "@/lib/authStore";
import { useUIStore } from "@/lib/uiStore";
import {
  calculateUploadDiff,
  formatUploadProgress,
  getFileSizeError,
  getFileSizeInMB,
  getFileTypeError,
  formatReuploadMessage,
  shouldShowUploadProgress,
  validateFileSize,
  validateFileType,
} from "@/lib/fileHandling";

const CURRENT_AY = "2025-26";

export default function MarksUploadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: courseId } = use(params);
  const { addToast } = useUIStore();
  const { user, activeAY } = useAuthStore();
  const courses     = useDataStore(s => s.courses);
  const examConfigs = useDataStore(s => s.examConfigs[courseId] || []);
  const submissions = useDataStore(s => s.submissions[courseId] || []);
  const saveSubmission  = useDataStore(s => s.saveSubmission);
  const addAuditEntry   = useDataStore(s => s.addAuditEntry);

  const course = courses.find(c => c.id === courseId);
  const fileRef = useRef<HTMLInputElement>(null);

  const [selectedExam, setSelectedExam] = useState(examConfigs[0]?.id || "");
  const [parsedRows, setParsedRows]     = useState<StudentMarkRow[]>([]);
  const [fileName, setFileName]         = useState("");
  const [parseError, setParseError]     = useState("");
  const [isDragging, setIsDragging]     = useState(false);
  const [isSaving, setIsSaving]         = useState(false);
  const [saved, setSaved]               = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [pendingRows, setPendingRows] = useState<StudentMarkRow[] | null>(null);
  const [reuploadSummary, setReuploadSummary] = useState("");

  const exam = examConfigs.find(e => e.id === selectedExam);
  const existingSubmission = useMemo(
    () => submissions.find(submission => submission.examId === selectedExam),
    [submissions, selectedExam]
  );
  const isReadOnlyAY = activeAY !== CURRENT_AY;

  const resetParsedState = () => {
    setParsedRows([]);
    setPendingRows(null);
    setReuploadSummary("");
    setSaved(false);
    setUploadProgress("");
  };

  const stageRows = (rows: StudentMarkRow[], file: File) => {
    if (existingSubmission?.students?.length) {
      const diff = calculateUploadDiff(
        rows as unknown as Record<string, any>[],
        existingSubmission.students as unknown as Record<string, any>[],
        "roll"
      );
      setPendingRows(rows);
      setReuploadSummary(formatReuploadMessage(diff));
      addToast("Existing marks found for this exam. Review changes before replacing them.", "warning");
      return;
    }

    setParsedRows(rows);
    addToast(`${rows.length} rows parsed from ${file.name}.`, "success");
  };

  const parseFile = (file: File) => {
    if (isReadOnlyAY) {
      setParseError(`AY ${activeAY} is read-only. Switch to ${CURRENT_AY} to upload or replace marks.`);
      return;
    }
    if (!exam) {
      setParseError("Select an exam before uploading marks.");
      return;
    }
    if (!validateFileType(file, "EXCEL")) {
      setParseError(getFileTypeError(file.name, ".xlsx"));
      return;
    }
    if (!validateFileSize(file)) {
      setParseError(getFileSizeError(getFileSizeInMB(file.size)));
      return;
    }

    setParseError("");
    resetParsedState();
    setFileName(file.name);
    const reader = new FileReader();
    reader.onprogress = event => {
      if (!event.lengthComputable || !shouldShowUploadProgress(file.size)) return;
      setUploadProgress(formatUploadProgress(event.loaded, event.total));
    };
    reader.onload = (e) => {
      try {
        const wb   = XLSX.read(new Uint8Array(e.target?.result as ArrayBuffer), { type: "array" });
        const rows: any[] = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: "" });
        if (!rows.length) { setParseError("Sheet is empty."); return; }
        const qNos = exam?.questions.map(q => q.qno) || [];
        const parsed: StudentMarkRow[] = rows.map((row: any) => ({
          roll: String(row["Roll"] || row["roll"] || row["ROLL"] || ""),
          name: String(row["Name"] || row["name"] || row["NAME"] || ""),
          marks: Object.fromEntries(qNos.map(qno => {
            const v = row[qno];
            const num: number | "" = (v === "" || v === undefined) ? "" : Number(v);
            return [qno, num];
          })) as Record<string, number | "">,
        })).filter(r => r.roll);
        if (!parsed.length) { setParseError("No valid rows. Ensure columns: Roll, Name, then question numbers (Q1, Q2…)."); return; }
        stageRows(parsed, file);
      } catch {
        setParseError("Failed to parse. Upload a valid .xlsx template file.");
      } finally {
        setUploadProgress("");
      }
    };
    reader.onerror = () => {
      setUploadProgress("");
      setParseError("The upload could not be read. Try the original .xlsx export template.");
    };
    reader.readAsArrayBuffer(file);
  };

  const downloadTemplate = () => {
    if (!exam) { addToast("Select an exam first.", "warning"); return; }
    const ws = XLSX.utils.aoa_to_sheet([["Roll", "Name", ...exam.questions.map(q => q.qno)]]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Marks");
    XLSX.writeFile(wb, `${courseId}_${selectedExam}_template.xlsx`);
    addToast("Template downloaded.", "info");
  };

  const handleSave = async (submit = false) => {
    if (isReadOnlyAY) {
      addToast(`AY ${activeAY} is read-only. Upload and submit are disabled.`, "error");
      return;
    }
    if (!parsedRows.length || !selectedExam) return;
    setIsSaving(true);
    await new Promise(r => setTimeout(r, 600));
    saveSubmission({ courseId, examId: selectedExam, students: parsedRows, status: submit ? "pending" : "draft", submittedAt: new Date().toISOString() });
    addAuditEntry({ type: "marks", userId: user?.id || "fac", role: "faculty", action: `Excel marks ${submit ? "submitted" : "saved"} — ${courseId.toUpperCase()} ${exam?.name} (${parsedRows.length} students)`, ip: "127.0.0.1" });
    setIsSaving(false); setSaved(true);
    addToast(submit ? "Submitted for approval." : "Saved as draft.", "success");
  };

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="max-w-5xl mx-auto pb-32">

      {/* ── HEADER ── */}
      <motion.div variants={fadeSlideUp} className="mb-12 flex justify-between items-end">
        <div>
          <Link href={`/courses/${courseId}`} className="flex items-center gap-2 text-white/30 hover:text-white transition-colors text-[10px] font-mono uppercase tracking-widest mb-4">
            <ChevronLeft className="w-3.5 h-3.5" /> Back to Course
          </Link>
          <div className="flex items-center gap-3 text-sm font-mono text-attain uppercase tracking-widest mb-4">
            <span className="w-8 h-[1px] bg-attain" /> Excel Import
          </div>
          <h1 className="text-5xl font-display text-white">Marks Upload</h1>
          <p className="text-white/40 font-light mt-3 italic">{course?.name} · Import from spreadsheet · AY {activeAY}</p>
        </div>
        <button onClick={downloadTemplate} className="px-6 py-3 border border-white/10 text-white/50 hover:text-white text-[10px] font-mono uppercase tracking-widest flex items-center gap-2 transition-colors">
          <Download className="w-3.5 h-3.5" /> Download Template
        </button>
      </motion.div>

      {isReadOnlyAY && (
        <motion.div variants={fadeSlideUp} className="mb-8 rounded-2xl border border-alert/20 bg-alert/5 p-5 text-[10px] font-mono uppercase tracking-widest text-alert/80">
          Read-only mode is active for AY {activeAY}. Upload, replace, save, and submit are disabled until you switch back to {CURRENT_AY}.
        </motion.div>
      )}

      {/* ── EXAM SELECTOR ── */}
      <motion.div variants={fadeSlideUp} className="flex flex-col gap-6 pb-10 border-b border-white/10 mb-10">
        <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest">Select Exam</p>
        <div className="flex flex-wrap gap-0 border-t border-white/10">
          {examConfigs.map(ex => (
            <button key={ex.id} onClick={() => { setSelectedExam(ex.id); setParsedRows([]); setSaved(false); }}
              className={`px-6 py-4 text-[10px] font-mono uppercase tracking-widest border-b-2 transition-all ${selectedExam === ex.id ? "border-brand text-white" : "border-transparent text-white/30 hover:text-white/60"}`}>
              {ex.name}
            </button>
          ))}
        </div>
        {exam && (
          <p className="text-[10px] font-mono text-white/30">
            Expected columns: <span className="text-brand">Roll, Name</span>
            {exam.questions.map(q => <span key={q.qno} className="text-white/50">, {q.qno} (/{q.maxMarks})</span>)}
            <span className="text-white/20"> · Only .xlsx up to 10 MB</span>
          </p>
        )}
        {existingSubmission && (
          <p className="text-[10px] font-mono uppercase tracking-widest text-white/25">
            Existing {selectedExam.toUpperCase()} submission detected: {existingSubmission.status}
          </p>
        )}
      </motion.div>

      {/* ── DROP ZONE ── */}
      <motion.div variants={fadeSlideUp}
        className={`relative flex flex-col items-center justify-center py-28 transition-all border ${isDragging ? "border-brand bg-brand/5" : "border-white/10 hover:border-white/30"} ${isReadOnlyAY ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
        onDragOver={e => { if (isReadOnlyAY) return; e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={e => { if (isReadOnlyAY) return; e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files[0]; if (f) parseFile(f); }}
        onClick={() => { if (!isReadOnlyAY) fileRef.current?.click(); }}
      >
        <input ref={fileRef} type="file" accept=".xlsx" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) parseFile(f); }} />
        <Upload className={`w-10 h-10 mb-6 transition-colors ${isDragging ? "text-brand" : "text-white/20"}`} />
        <p className="text-white/60 font-display text-2xl mb-2 tracking-tight">Drop your Excel file here</p>
        <p className="text-white/25 text-[10px] font-mono uppercase tracking-widest">.xlsx only · max 10 MB</p>
        {fileName && (
          <p className="mt-6 text-[10px] font-mono text-attain uppercase tracking-widest">{fileName}</p>
        )}
        {uploadProgress && <p className="mt-2 text-[10px] font-mono uppercase tracking-widest text-brand">{uploadProgress}</p>}
      </motion.div>

      {/* ── PARSE ERROR ── */}
      <AnimatePresence>
        {parseError && (
          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="mt-4 flex items-center gap-3 p-4 border border-alert/20 bg-alert/5 text-alert text-xs font-mono">
            <AlertCircle className="w-4 h-4 shrink-0" /> {parseError}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {reuploadSummary && pendingRows && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-6 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6">
            <p className="text-[10px] font-mono uppercase tracking-widest text-amber-400">Re-upload review required</p>
            <pre className="mt-4 whitespace-pre-wrap text-sm leading-6 text-white/70 font-sans">{reuploadSummary}</pre>
            <div className="mt-5 flex flex-wrap gap-3">
              <button
                onClick={() => {
                  setParsedRows(pendingRows);
                  setPendingRows(null);
                  setReuploadSummary("");
                  setSaved(false);
                  addToast("Replacement data loaded. Existing marks remain unchanged until you save or submit.", "success");
                }}
                className="px-5 py-2 border border-amber-400/30 text-amber-300 text-[10px] font-mono uppercase tracking-widest hover:border-amber-300 hover:text-white transition-colors"
              >
                Replace preview
              </button>
              <button
                onClick={() => {
                  setPendingRows(null);
                  setReuploadSummary("");
                  addToast("Re-upload cancelled. Existing marks were not changed.", "info");
                }}
                className="px-5 py-2 border border-white/10 text-white/50 text-[10px] font-mono uppercase tracking-widest hover:text-white hover:border-white/30 transition-colors"
              >
                Keep current data
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── PARSED TABLE ── */}
      <AnimatePresence>
        {parsedRows.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-12 flex flex-col gap-8">

            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest flex items-center gap-3">
                <CheckCircle2 className="w-3.5 h-3.5 text-attain" /> {parsedRows.length} students parsed
              </p>
              <button onClick={() => { resetParsedState(); setFileName(""); }}
                className="flex items-center gap-2 text-white/20 hover:text-alert text-[10px] font-mono uppercase tracking-widest transition-colors">
                <Trash2 className="w-3.5 h-3.5" /> Clear
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs border-t border-white/10">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="py-3 pr-6 text-white/30 uppercase tracking-widest font-normal">Roll</th>
                    <th className="py-3 pr-6 text-white/30 uppercase tracking-widest font-normal">Name</th>
                    {exam?.questions.map(q => (
                      <th key={q.qno} className="py-3 pr-4 text-white/30 uppercase tracking-widest font-normal text-center">
                        {q.qno}<span className="text-white/20">/{q.maxMarks}</span>
                      </th>
                    ))}
                    <th className="py-3 text-brand uppercase tracking-widest font-normal text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {parsedRows.map((row, i) => {
                    const total = Object.values(row.marks).reduce((s:number, m) => s + Number(m === "" ? 0 : m), 0 as number);
                    return (
                      <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 pr-6 text-white/60">{row.roll}</td>
                        <td className="py-3 pr-6 text-white">{row.name}</td>
                        {exam?.questions.map(q => (
                          <td key={q.qno} className="py-3 pr-4 text-center text-white/50">
                            {row.marks[q.qno] === "" ? "—" : row.marks[q.qno]}
                          </td>
                        ))}
                        <td className="py-3 text-right text-brand font-bold">{total}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between pt-6 border-t border-white/10">
              {saved ? (
                <span className="flex items-center gap-2 text-attain text-[10px] font-mono uppercase tracking-widest">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Saved as draft
                </span>
              ) : <span />}
              <div className="flex gap-4">
                <button onClick={() => handleSave(false)} disabled={isSaving || saved || isReadOnlyAY}
                  className="px-6 py-3 border border-white/10 text-white/50 hover:text-white text-[10px] font-mono uppercase tracking-widest flex items-center gap-2 transition-colors disabled:opacity-40">
                  {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Save Draft
                </button>
                <button onClick={() => handleSave(true)} disabled={isSaving || isReadOnlyAY}
                  className="px-8 py-3 bg-white text-black text-[10px] font-mono uppercase tracking-widest flex items-center gap-2 hover:bg-white/90 transition-all disabled:opacity-40">
                  {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />} Submit for Approval
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
