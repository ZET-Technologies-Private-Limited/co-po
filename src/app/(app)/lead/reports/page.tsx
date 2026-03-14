"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Download, FileText, Loader2 } from "lucide-react";
import jsPDF from "jspdf";
import * as XLSX from "xlsx";
import { useDataStore } from "@/lib/dataStore";
import { AccessGate } from "@/components/auth/AccessGate";
import { useAuthStore } from "@/lib/authStore";
import { staggerContainer, fadeSlideUp } from "@/lib/animations";

type ReportType = "co" | "po" | "pso" | "nba";

type HistoryItem = {
  id: string;
  reportType: ReportType;
  generatedAt: string;
  courseCode: string;
  ay: string;
  exam: string;
  pdfUrl?: string;
  excelUrl?: string;
  nbaUrl?: string;
};

const STORAGE_KEY = "lead-reports-history";

function downloadBlob(url: string, fileName: string) {
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

export default function LeadReportsPage() {
  const { activeAY } = useAuthStore();
  const courses = useDataStore(s => s.courses);
  const examConfigs = useDataStore(s => s.examConfigs);

  const [reportType, setReportType] = useState<ReportType>("co");
  const [courseId, setCourseId] = useState<string>(courses[0]?.id || "");
  const [ay, setAy] = useState<string>(activeAY);
  const [examId, setExamId] = useState<string>("all");

  const [isGenerating, setIsGenerating] = useState(false);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [latestPdfUrl, setLatestPdfUrl] = useState<string | null>(null);
  const [latestExcelUrl, setLatestExcelUrl] = useState<string | null>(null);
  const [latestNbaUrl, setLatestNbaUrl] = useState<string | null>(null);

  const [history, setHistory] = useState<HistoryItem[]>([]);

  const examsForCourse = useMemo(() => {
    if (!courseId) return [];
    return examConfigs[courseId] || [];
  }, [courseId, examConfigs]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as HistoryItem[];
        setHistory(parsed.slice(0, 10));
      }
    } catch {
      setHistory([]);
    }
  }, []);

  const persistHistory = (next: HistoryItem[]) => {
    setHistory(next.slice(0, 10));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next.slice(0, 10)));
  };

  const generate = async () => {
    const course = courses.find(c => c.id === courseId);
    const selectedExam = examId === "all" ? null : examsForCourse.find(e => e.id === examId);

    setIsGenerating(true);

    const title = `${reportType.toUpperCase()} Report`;
    const examLabel = selectedExam ? selectedExam.name : "All Exams";

    const pdf = new jsPDF();
    pdf.setFontSize(14);
    pdf.text(title, 14, 16);
    pdf.setFontSize(10);
    pdf.text(`Course: ${course?.code || "-"} - ${course?.name || "-"}`, 14, 24);
    pdf.text(`AY: ${ay} | Exam: ${examLabel}`, 14, 30);
    pdf.text(`Generated: ${new Date().toLocaleString("en-IN")}`, 14, 36);
    pdf.text("Inline preview is shown below. Download buttons remain separate.", 14, 46);

    const pdfBlob = pdf.output("blob");
    const pdfUrl = URL.createObjectURL(pdfBlob);

    const rows = [
      {
        ReportType: reportType.toUpperCase(),
        CourseCode: course?.code || "-",
        CourseName: course?.name || "-",
        AY: ay,
        Exam: examLabel,
        GeneratedAt: new Date().toISOString(),
      },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), "Report");
    const excelArray = XLSX.write(wb, { type: "array", bookType: "xlsx" });
    const excelBlob = new Blob([excelArray], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const excelUrl = URL.createObjectURL(excelBlob);

    const nbaRows = [
      {
        OutcomeCode: reportType === "pso" ? "PSO" : "PO/CO",
        CourseCode: course?.code || "-",
        AY: ay,
        Exam: examLabel,
        Format: "NBA",
      },
    ];
    const nbaWb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(nbaWb, XLSX.utils.json_to_sheet(nbaRows), "NBA_Format");
    const nbaArray = XLSX.write(nbaWb, { type: "array", bookType: "xlsx" });
    const nbaBlob = new Blob([nbaArray], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const nbaUrl = URL.createObjectURL(nbaBlob);

    setPdfPreviewUrl(pdfUrl);
    setLatestPdfUrl(pdfUrl);
    setLatestExcelUrl(excelUrl);
    setLatestNbaUrl(nbaUrl);

    const item: HistoryItem = {
      id: `${Date.now()}`,
      reportType,
      generatedAt: new Date().toISOString(),
      courseCode: course?.code || "-",
      ay,
      exam: examLabel,
      pdfUrl,
      excelUrl,
      nbaUrl,
    };

    const next = [item, ...history].slice(0, 10);
    persistHistory(next);

    setIsGenerating(false);
  };

  return (
    <AccessGate feature="export_pdf" deny="lock">
      <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="max-w-5xl mx-auto pb-32">
        <motion.div variants={fadeSlideUp} className="pb-8 border-b border-white/5">
          <div className="flex items-center gap-2 text-[10px] font-mono text-brand uppercase tracking-widest mb-3">
            <span className="w-8 h-[1px] bg-brand" /> Lead Reporting
          </div>
          <h1 className="text-4xl font-display text-white">Lead Reports</h1>
          <p className="text-white/40 font-light mt-1">Generate, preview, and download role-specific reports.</p>
        </motion.div>

        <motion.div variants={fadeSlideUp} className="grid gap-3 py-6 border-b border-white/5 md:grid-cols-4">
          <select value={reportType} onChange={e => setReportType(e.target.value as ReportType)} className="bg-transparent border border-white/15 px-3 py-2 text-xs text-white/70 outline-none">
            <option value="co" className="bg-[#0a0a0f]">Report Type: CO</option>
            <option value="po" className="bg-[#0a0a0f]">Report Type: PO</option>
            <option value="pso" className="bg-[#0a0a0f]">Report Type: PSO</option>
            <option value="nba" className="bg-[#0a0a0f]">Report Type: NBA</option>
          </select>

          <select value={courseId} onChange={e => setCourseId(e.target.value)} className="bg-transparent border border-white/15 px-3 py-2 text-xs text-white/70 outline-none">
            {courses.map(c => (
              <option key={c.id} value={c.id} className="bg-[#0a0a0f]">Course: {c.code}</option>
            ))}
          </select>

          <select value={ay} onChange={e => setAy(e.target.value)} className="bg-transparent border border-white/15 px-3 py-2 text-xs text-white/70 outline-none">
            {["2025-26", "2024-25", "2023-24", "2022-23"].map(y => (
              <option key={y} value={y} className="bg-[#0a0a0f]">AY: {y}</option>
            ))}
          </select>

          <select value={examId} onChange={e => setExamId(e.target.value)} className="bg-transparent border border-white/15 px-3 py-2 text-xs text-white/70 outline-none">
            <option value="all" className="bg-[#0a0a0f]">Exam: All</option>
            {examsForCourse.map(ex => (
              <option key={ex.id} value={ex.id} className="bg-[#0a0a0f]">Exam: {ex.id.toUpperCase()}</option>
            ))}
          </select>
        </motion.div>

        <motion.div variants={fadeSlideUp} className="py-6 border-b border-white/5 flex flex-wrap items-center gap-3">
          <button
            onClick={generate}
            disabled={isGenerating}
            className="px-5 py-2.5 bg-brand text-white text-[10px] font-mono uppercase tracking-widest hover:bg-brand/90 disabled:opacity-40 inline-flex items-center gap-2"
          >
            {isGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />} Generate
          </button>

          <button
            onClick={() => latestPdfUrl && downloadBlob(latestPdfUrl, `lead-report-${reportType}.pdf`)}
            disabled={!latestPdfUrl}
            className="px-4 py-2 border border-white/15 text-white/60 text-[10px] font-mono uppercase tracking-widest hover:text-white disabled:opacity-40 inline-flex items-center gap-2"
          >
            <Download className="w-3.5 h-3.5" /> Download PDF
          </button>

          <button
            onClick={() => latestExcelUrl && downloadBlob(latestExcelUrl, `lead-report-${reportType}.xlsx`)}
            disabled={!latestExcelUrl}
            className="px-4 py-2 border border-white/15 text-white/60 text-[10px] font-mono uppercase tracking-widest hover:text-white disabled:opacity-40 inline-flex items-center gap-2"
          >
            <Download className="w-3.5 h-3.5" /> Download Excel
          </button>

          <button
            onClick={() => latestNbaUrl && downloadBlob(latestNbaUrl, `lead-report-nba-${reportType}.xlsx`)}
            disabled={!latestNbaUrl}
            className="px-4 py-2 border border-brand/30 text-brand text-[10px] font-mono uppercase tracking-widest hover:text-white disabled:opacity-40 inline-flex items-center gap-2"
          >
            <Download className="w-3.5 h-3.5" /> Export in NBA Format
          </button>
        </motion.div>

        <motion.div variants={fadeSlideUp} className="py-6 border-b border-white/5">
          <p className="text-[10px] font-mono uppercase tracking-widest text-white/35 mb-3">Inline PDF Preview</p>
          {pdfPreviewUrl ? (
            <iframe src={pdfPreviewUrl} className="w-full h-[420px] border border-white/10" title="PDF Preview" />
          ) : (
            <p className="text-sm text-white/35 italic">Generate a report to preview PDF inline.</p>
          )}
        </motion.div>

        <motion.div variants={fadeSlideUp} className="py-6">
          <p className="text-[10px] font-mono uppercase tracking-widest text-white/35 mb-3">Report history (last 10)</p>
          <div className="border border-white/10 divide-y divide-white/5">
            {history.map(item => (
              <div key={item.id} className="px-4 py-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-white/70">{item.reportType.toUpperCase()} - {item.courseCode} - {item.exam}</p>
                  <p className="text-[10px] text-white/35">{new Date(item.generatedAt).toLocaleString("en-IN")} | AY {item.ay}</p>
                </div>
                <div className="flex items-center gap-2">
                  {item.pdfUrl && (
                    <button onClick={() => downloadBlob(item.pdfUrl!, `history-${item.id}.pdf`)} className="text-[10px] font-mono uppercase tracking-widest text-white/50 hover:text-white">
                      PDF
                    </button>
                  )}
                  {item.excelUrl && (
                    <button onClick={() => downloadBlob(item.excelUrl!, `history-${item.id}.xlsx`)} className="text-[10px] font-mono uppercase tracking-widest text-white/50 hover:text-white">
                      Excel
                    </button>
                  )}
                </div>
              </div>
            ))}
            {history.length === 0 && (
              <p className="px-4 py-6 text-white/35 italic">No report history yet.</p>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AccessGate>
  );
}
