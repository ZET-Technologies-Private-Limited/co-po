"use client";

import { useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  Download,
  AlertTriangle,
  CheckCircle2,
  Users,
  TrendingUp,
  Save,
  Loader2,
  Info,
} from "lucide-react";
import * as XLSX from "xlsx";
import { useDataStore } from "@/lib/dataStore";
import {
  computeCOAttainmentFromMarks,
  computeFinalAttainment,
  CIE_WEIGHT,
  SEE_WEIGHT,
  getAttainmentLevel,
} from "@/lib/computations";
import { AccessGate } from "@/components/auth/AccessGate";
import { staggerContainer, fadeSlideUp } from "@/lib/animations";

export default function FacultyCOAttainmentPage() {
  const { id }    = useParams();
  const courseId  = id as string;

  const courses        = useDataStore(s => s.courses);
  const course         = useMemo(() => courses.find(c => c.id === courseId), [courses, courseId]);
  const submissions    = useDataStore(s => s.submissions[courseId] || []);
  const examConfigs    = useDataStore(s => s.examConfigs[courseId] || []);
  const thresholds     = useDataStore(s => s.thresholds);
  const courseCOs      = useDataStore(s => s.cos[courseId] || []);
  const remedialActions = useDataStore(s => s.remedialActions[courseId] || {});
  const saveRemedial   = useDataStore(s => s.saveRemedialAction);
  const coOverrides    = useDataStore(s => (s.coOverrides || {})[courseId] || {});

  const [activeExamTab, setActiveExamTab] = useState<string>("all");
  const [chartView, setChartView] = useState<"bar" | "radar" | "table">("bar");
  const [showFormula, setShowFormula] = useState(false);
  const [studentSortCo, setStudentSortCo] = useState<string | null>(null);
  const [studentSortDir, setStudentSortDir] = useState<"asc" | "desc">("desc");
  const [studentFilterCo, setStudentFilterCo] = useState<string>("all");
  const [activeRemedial, setActiveRemedial] = useState<Record<string, string>>(remedialActions);
  const [isSaving, setIsSaving] = useState(false);

  const approvedSubs = useMemo(() => submissions.filter(s => s.status === "approved"), [submissions]);
  const allMarks     = useMemo(() => approvedSubs.flatMap(s => s.students), [approvedSubs]);

  // Per-exam attainment
  const examAttainments = useMemo(() => {
    const result: Record<string, ReturnType<typeof computeCOAttainmentFromMarks>> = {};
    examConfigs.forEach(exam => {
      const sub = submissions.find(s => s.examId === exam.id && s.status === "approved");
      if (sub && exam.questions.length > 0) {
        result[exam.id] = computeCOAttainmentFromMarks(sub.students, exam.questions, thresholds.targetPassPct);
      }
    });
    return result;
  }, [examConfigs, submissions, thresholds]);

  const allQuestions = useMemo(() => examConfigs.flatMap(e => e.questions), [examConfigs]);

  // CIE attainment (from CIE exams only)
  const cieExams    = useMemo(() => examConfigs.filter(e => e.group === "CIE"), [examConfigs]);
  const seeExams    = useMemo(() => examConfigs.filter(e => e.group === "SEE"), [examConfigs]);
  const cieMarks    = useMemo(() => approvedSubs.filter(s => cieExams.some(e => e.id === s.examId)).flatMap(s => s.students), [approvedSubs, cieExams]);
  const seeMarks    = useMemo(() => approvedSubs.filter(s => seeExams.some(e => e.id === s.examId)).flatMap(s => s.students), [approvedSubs, seeExams]);
  const cieQs       = useMemo(() => cieExams.flatMap(e => e.questions), [cieExams]);
  const seeQs       = useMemo(() => seeExams.flatMap(e => e.questions), [seeExams]);

  const cieAttainment   = useMemo(() => cieMarks.length > 0 ? computeCOAttainmentFromMarks(cieMarks, cieQs, thresholds.targetPassPct) : {}, [cieMarks, cieQs, thresholds]);
  const seeAttainment   = useMemo(() => seeMarks.length > 0 ? computeCOAttainmentFromMarks(seeMarks, seeQs, thresholds.targetPassPct) : {}, [seeMarks, seeQs, thresholds]);
  const finalAttainment = useMemo(() => {
    if (!Object.keys(cieAttainment).length && !Object.keys(seeAttainment).length) {
      return allMarks.length > 0
        ? computeCOAttainmentFromMarks(allMarks, allQuestions, thresholds.targetPassPct)
        : {};
    }
    const result: typeof cieAttainment = {};
    const allCos = new Set([
      ...Object.keys(cieAttainment),
      ...Object.keys(seeAttainment),
    ]);
    allCos.forEach(co => {
      const ciePct = cieAttainment[co]?.pct ?? 0;
      const seePct = seeAttainment[co]?.pct ?? 0;
      const finalPct = computeFinalAttainment(ciePct, seePct);
      const total = Math.max(
        cieAttainment[co]?.total ?? 0,
        seeAttainment[co]?.total ?? 0,
      );
      const attained = Math.round((finalPct / 100) * total);
      result[co] = { attained, total, pct: finalPct };
    });
    return result;
  }, [cieAttainment, seeAttainment, allMarks, allQuestions, thresholds]);

  // Active tab attainment
  const activeAttainment = useMemo(() => {
    if (activeExamTab === "all")  return finalAttainment;
    if (activeExamTab === "cie")  return cieAttainment;
    if (activeExamTab === "see")  return seeAttainment;
    return examAttainments[activeExamTab] || {};
  }, [activeExamTab, finalAttainment, cieAttainment, seeAttainment, examAttainments]);

  // Per-student CO scores (real computation)
  const studentCOScores = useMemo(() => {
    if (!allMarks.length || !allQuestions.length) return [];
    return allMarks.map(student => {
      const coScores: Record<string, number> = {};
      const coQs: Record<string, typeof allQuestions> = {};
      allQuestions.forEach(q => {
        if (!coQs[q.co]) coQs[q.co] = [];
        coQs[q.co].push(q);
      });
      Object.entries(coQs).forEach(([co, qs]) => {
        const totalMax = qs.reduce((s, q) => s + q.maxMarks, 0);
        const scored   = qs.reduce((s, q) => {
          const m = student.marks[q.qno];
          return s + (typeof m === "number" ? m : 0);
        }, 0);
        coScores[co] = totalMax > 0 ? Math.round((scored / totalMax) * 100) : 0;
      });
      return { ...student, coScores };
    });
  }, [allMarks, allQuestions]);

  const sortedFilteredStudents = useMemo(() => {
    let rows = [...studentCOScores];
    if (studentFilterCo !== "all") {
      rows = rows.filter(
        s => (s.coScores[studentFilterCo] ?? 0) < thresholds.targetPassPct,
      );
    }
    if (studentSortCo) {
      rows.sort((a, b) => {
        const av = a.coScores[studentSortCo] ?? 0;
        const bv = b.coScores[studentSortCo] ?? 0;
        return studentSortDir === "asc" ? av - bv : bv - av;
      });
    }
    return rows;
  }, [studentCOScores, studentFilterCo, studentSortCo, studentSortDir, thresholds]);

  const handleExcelExport = () => {
    const wb = XLSX.utils.book_new();
    // Summary sheet
    const summaryData = [
      ["CO", "CIE %", "SEE %", "Final %", "Level"],
      ...Object.keys(finalAttainment).map(co => {
        const cie   = cieAttainment[co]?.pct ?? 0;
        const see   = seeAttainment[co]?.pct ?? 0;
        const final = finalAttainment[co]?.pct ?? 0;
        const lvl   = getAttainmentLevel(final, thresholds);
        return [co, cie, see, final, lvl.label];
      }),
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summaryData), "CO Attainment");
    // Student sheet
    const coKeys = Object.keys(finalAttainment);
    const studentData = [
      ["Roll", "Name", ...coKeys.map(co => `${co} Score %`), "Status"],
      ...studentCOScores.map(s => [
        s.roll, s.name,
        ...coKeys.map(co => s.coScores[co] ?? 0),
        coKeys.every(co => (s.coScores[co] ?? 0) >= thresholds.targetPassPct) ? "Pass" : "Fail",
      ]),
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(studentData), "Student Scores");
    XLSX.writeFile(wb, `${course?.code}_CO_Attainment.xlsx`);
  };

  const handlePDFExport = async () => {
    const { default: jsPDF } = await import("jspdf");
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(`CO Attainment Report — ${course?.name}`, 14, 20);
    doc.setFontSize(10);
    doc.text(`Course: ${course?.code} | AY: 2024-25`, 14, 30);
    let y = 45;
    doc.setFontSize(11);
    doc.text("CO Attainment Summary", 14, y); y += 8;
    Object.entries(finalAttainment).forEach(([co, data]) => {
      const cie   = cieAttainment[co]?.pct ?? 0;
      const see   = seeAttainment[co]?.pct ?? 0;
      const lvl   = getAttainmentLevel(data.pct, thresholds);
      doc.setFontSize(9);
      doc.text(`${co}: CIE=${cie}%  SEE=${see}%  Final=${data.pct}%  [${lvl.label}]`, 14, y);
      y += 7;
    });
    doc.save(`${course?.code}_CO_Attainment.pdf`);
  };

  const handleSaveRemedial = async (coId: string) => {
    setIsSaving(true);
    await new Promise(r => setTimeout(r, 500));
    const payload = {
      action: activeRemedial[coId] || "",
      savedAt: new Date().toISOString().split("T")[0],
    };
    saveRemedial(courseId, coId, JSON.stringify(payload));
    setIsSaving(false);
  };

  const coKeys = Object.keys(finalAttainment);

  const level1Cos = Object.entries(finalAttainment).filter(
    ([, d]) => d.pct < thresholds.level2,
  );

  return (
    <AccessGate feature="co_attainment" deny="lock">
      <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="flex flex-col gap-0 pb-32">

        {/* Header */}
        <motion.div variants={fadeSlideUp} className="flex justify-between items-end pb-8 border-b border-white/5">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-mono text-brand uppercase tracking-widest mb-3">
              <span className="w-8 h-[1px] bg-brand" /> Attainment Intelligence
            </div>
            <h1 className="text-4xl font-display text-white">Course Attainment Report</h1>
            <p className="text-white/40 font-light mt-1">{course?.name} · {course?.code} · AY 2024-25</p>
          </div>
          <div className="flex gap-3">
            <button onClick={handleExcelExport}
              className="px-5 py-2.5 border border-white/10 text-white/60 text-[10px] font-mono uppercase tracking-widest hover:border-white/30 hover:text-white transition-colors flex items-center gap-2">
              <Download className="w-3.5 h-3.5" /> Export Excel
            </button>
            <button onClick={handlePDFExport}
              className="px-5 py-2.5 bg-brand text-white text-[10px] font-mono uppercase tracking-widest hover:bg-brand/90 transition-colors flex items-center gap-2">
              <Download className="w-3.5 h-3.5" /> NBA Report (PDF)
            </button>
          </div>
        </motion.div>

        {/* No data state */}
        {allMarks.length === 0 && (
          <div className="py-20 text-center text-white/20">
            <p className="text-sm italic">No approved marks found. CO attainment will appear after marks are approved by the Course Lead.</p>
          </div>
        )}

        {allMarks.length > 0 && (
          <>
            {/* Exam tabs */}
            <div className="flex border-b border-white/5">
              {[
                { id: "all", label: "Final (All)" },
                { id: "cie", label: "CIE Combined" },
                { id: "see", label: "SEE Combined" },
                ...examConfigs.filter(e => examAttainments[e.id]).map(e => ({ id: e.id, label: e.name.split("—")[0].trim() })),
              ].map(tab => (
                <button key={tab.id} onClick={() => setActiveExamTab(tab.id)}
                  className={`px-5 py-3 text-[10px] font-mono uppercase tracking-widest border-b-2 transition-all ${
                    activeExamTab === tab.id ? "border-brand text-brand" : "border-transparent text-white/30 hover:text-white"
                  }`}>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* CO Summary table with CIE / SEE / Final / Level / Status */}
            <motion.section variants={fadeSlideUp} className="border-b border-white/5">
              {level1Cos.length > 0 && (
                <p className="px-6 pt-4 text-sm text-alert font-mono">
                  Action required:{" "}
                  {level1Cos.map(([co]) => co).join(", ")}{" "}
                  {level1Cos.length === 1 ? "is" : "are"} at Level 1. Enter
                  remedial action below.
                </p>
              )}
              <table className="w-full text-left border-collapse mt-2">
                <thead>
                  <tr className="border-b border-white/10 bg-white/[0.02]">
                    {[
                      "CO",
                      "Statement",
                      "CIE Att%",
                      "SEE Att%",
                      "Final Att%",
                      "Level",
                      "Status",
                    ].map(h => (
                      <th key={h} className="px-6 py-4 text-[9px] font-mono text-white/30 uppercase tracking-widest">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(finalAttainment).map(([co, data]) => {
                    const cie   = cieAttainment[co]?.pct ?? 0;
                    const see   = seeAttainment[co]?.pct ?? 0;
                    const final = computeFinalAttainment(cie, see);
                    const lvl   = getAttainmentLevel(final, thresholds);
                    const desc  = courseCOs.find(c => c.co === co)?.desc || "";
                    const override = coOverrides[co];
                    const isLevel1 = final < thresholds.level2;
                    const status =
                      override
                        ? "Overridden"
                        : isLevel1
                        ? "Remedial Required"
                        : "Normal";
                    const statusColor =
                      status === "Overridden"
                        ? "text-amber-300"
                        : status === "Remedial Required"
                        ? "text-alert"
                        : "text-attain";
                    const levelLabel = lvl.label;
                    return (
                      <tr key={co} className="border-b border-white/5 hover:bg-white/[0.01] transition-colors">
                        <td className="px-6 py-4 font-mono text-sm text-brand">{co}</td>
                        <td className="px-6 py-4 text-xs text-white/70 max-w-md">
                          <span title={desc}>
                            {desc.length > 80 ? `${desc.slice(0, 80)}…` : desc}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-mono text-sm text-white/60">{cie}%</td>
                        <td className="px-6 py-4 font-mono text-sm text-white/60">{see}%</td>
                        <td className="px-6 py-4 font-mono text-sm text-white font-bold">{final}%</td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1 text-[9px] font-mono uppercase px-2 py-0.5 border ${lvl.badgeColor}`}
                            title={
                              override
                                ? `Original: Level ${override.original} — Overridden to Level ${override.overridden} by ${override.by} on ${override.at}`
                                : undefined
                            }
                          >
                            {override && <span className="text-amber-300">*</span>}
                            {levelLabel}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-[11px] font-mono ${statusColor}`}>
                            {status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div className="px-6 py-3 text-xs text-white/40 flex flex-col gap-1">
                <p className="italic">
                  Final Attainment = CIE × {Math.round(CIE_WEIGHT * 100)}% + SEE ×{" "}
                  {Math.round(SEE_WEIGHT * 100)}%.
                  <button
                    type="button"
                    onClick={() => setShowFormula(true)}
                    className="ml-2 text-[11px] font-mono text-brand hover:text-white underline"
                  >
                    How is this calculated?
                  </button>
                </p>
                <p>
                  Thresholds: Level 3 ≥ {thresholds.level3}% | Level 2 ={" "}
                  {thresholds.level2}–{thresholds.level3 - 1}% | Level 1 &lt;{" "}
                  {thresholds.level2}%
                </p>
              </div>
            </motion.section>

            {/* Level 1 alerts + remedial */}
            {level1Cos.length > 0 && (
              <motion.section variants={fadeSlideUp} className="border-b border-white/5 py-6 px-8 flex flex-col gap-4">
                <h3 className="text-[10px] font-mono text-alert uppercase tracking-widest flex items-center gap-2">
                  <AlertTriangle className="w-3.5 h-3.5" /> Level 1 Alerts — Remedial Action Required
                </h3>
                {level1Cos.map(([co, data]) => (
                  <div key={co} className="border-b border-white/5 pb-4 last:border-0 last:pb-0">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-alert font-mono text-sm">{co} — {data.pct.toFixed(1)}% attainment</span>
                      <span className="text-[9px] font-mono text-alert/40 uppercase">Critical Deficit</span>
                    </div>
                    <textarea
                      value={activeRemedial[co] || ""}
                      onChange={e => setActiveRemedial({ ...activeRemedial, [co]: e.target.value })}
                      placeholder="Action description (mandatory before year-end lock)..."
                      className="w-full bg-white/[0.02] border border-white/10 p-3 text-xs text-white/70 outline-none focus:border-alert h-20 resize-none"
                    />
                    <button onClick={() => handleSaveRemedial(co)} disabled={isSaving}
                      className="mt-2 px-5 py-2 bg-alert text-white text-[10px] font-mono uppercase tracking-widest hover:bg-alert/90 transition-colors flex items-center gap-2 disabled:opacity-50">
                      {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} Commit Action
                    </button>
                  </div>
                ))}
              </motion.section>
            )}

            {/* Attainment chart with view toggle */}
            <motion.section variants={fadeSlideUp} className="py-8 px-8 border-b border-white/5">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-[10px] font-mono text-white/30 uppercase tracking-widest flex items-center gap-2">
                  <TrendingUp className="w-3.5 h-3.5" /> Attainment Visualization
                </h3>
                <div className="flex items-center gap-4 text-[10px] font-mono">
                  <button
                    type="button"
                    onClick={() => setChartView("bar")}
                    className={chartView === "bar" ? "text-brand underline" : "text-white/40 hover:text-white"}
                  >
                    Bar Chart
                  </button>
                  <span className="text-white/20">|</span>
                  <button
                    type="button"
                    onClick={() => setChartView("radar")}
                    className={chartView === "radar" ? "text-brand underline" : "text-white/40 hover:text-white"}
                  >
                    Radar Chart
                  </button>
                  <span className="text-white/20">|</span>
                  <button
                    type="button"
                    onClick={() => setChartView("table")}
                    className={chartView === "table" ? "text-brand underline" : "text-white/40 hover:text-white"}
                  >
                    Table View
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between mb-3 text-[9px] font-mono text-white/20 uppercase">
                <div className="flex items-center gap-6">
                  <span className="flex items-center gap-1.5"><span className="w-3 h-1 bg-brand inline-block" /> CIE</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-1 bg-amber-400 inline-block" /> SEE</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-1 bg-white/40 inline-block" /> Final</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-[1px] border-t border-dashed border-white/30 inline-block" /> Target ({thresholds.targetPassPct}%)</span>
                </div>
              </div>
              {chartView === "bar" && (
                <div className="h-48 flex items-end gap-4 px-4 relative">
                  <div className="absolute left-4 right-4 border-t border-dashed border-white/10 pointer-events-none"
                    style={{ bottom: `${thresholds.targetPassPct * 1.6}px` }} />
                  {Object.entries(activeAttainment).map(([co, data]) => {
                    const cie   = cieAttainment[co]?.pct ?? 0;
                    const see   = seeAttainment[co]?.pct ?? 0;
                    const final = data.pct;
                    const lvl   = getAttainmentLevel(final, thresholds);
                    return (
                      <div key={co} className="flex-1 flex flex-col items-center gap-2 group">
                        <span className="text-[9px] font-mono text-white/40 opacity-0 group-hover:opacity-100 transition-opacity">
                          {final}% ({data.attained}/{data.total})
                        </span>
                        <div className="w-full flex justify-center items-end gap-0.5" style={{ height: "160px" }}>
                          {/* CIE bar — blue */}
                          <motion.div initial={{ height: 0 }} animate={{ height: `${cie * 1.6}px` }}
                            title={`CIE: ${cie}% | Attained: ${cieAttainment[co]?.attained ?? 0}/${cieAttainment[co]?.total ?? 0}`}
                            className="w-3 bg-brand/70 hover:bg-brand transition-colors" />
                          {/* SEE bar — orange */}
                          <motion.div initial={{ height: 0 }} animate={{ height: `${see * 1.6}px` }}
                            title={`SEE: ${see}% | Attained: ${seeAttainment[co]?.attained ?? 0}/${seeAttainment[co]?.total ?? 0}`}
                            className="w-3 bg-amber-400/70 hover:bg-amber-400 transition-colors" />
                          {/* Final bar — level color */}
                          <motion.div initial={{ height: 0 }} animate={{ height: `${final * 1.6}px` }}
                            title={`Final: ${final}% | Attained: ${data.attained}/${data.total}`}
                            className={`w-3 transition-colors ${lvl.level === 3 ? "bg-attain/60 hover:bg-attain" : lvl.level === 2 ? "bg-white/30 hover:bg-white/50" : "bg-alert/60 hover:bg-alert"}`} />
                        </div>
                        <span className="text-[10px] font-mono text-white/40">{co}</span>
                      </div>
                    );
                  })}
                </div>
              )}
              {chartView === "radar" && (
                <div className="mt-4 flex flex-col items-center gap-2 text-[10px] text-white/40">
                  <p className="mb-2">
                    Radar approximation: each CO plotted at radius proportional to Final%.
                  </p>
                  <div className="relative w-56 h-56 rounded-full border border-white/10">
                    {Object.entries(activeAttainment).map(([co, data], idx, arr) => {
                      const angle = (idx / arr.length) * 2 * Math.PI;
                      const r = (data.pct / 100) * 110;
                      const cx = 112 + r * Math.cos(angle);
                      const cy = 112 + r * Math.sin(angle);
                      return (
                        <div
                          key={co}
                          className="absolute w-2 h-2 rounded-full bg-brand"
                          style={{ left: cx, top: cy }}
                          title={`${co}: ${data.pct}% (${data.attained}/${data.total})`}
                        />
                      );
                    })}
                  </div>
                </div>
              )}
              {chartView === "table" && (
                <div className="overflow-x-auto mt-3">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="px-4 py-2">CO</th>
                        <th className="px-4 py-2 text-right">CIE%</th>
                        <th className="px-4 py-2 text-right">SEE%</th>
                        <th className="px-4 py-2 text-right">Final%</th>
                        <th className="px-4 py-2 text-right">Attained / Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(activeAttainment).map(([co, data]) => {
                        const cie = cieAttainment[co]?.pct ?? 0;
                        const see = seeAttainment[co]?.pct ?? 0;
                        return (
                          <tr key={co} className="border-b border-white/5">
                            <td className="px-4 py-2 font-mono text-brand">{co}</td>
                            <td className="px-4 py-2 text-right">{cie}%</td>
                            <td className="px-4 py-2 text-right">{see}%</td>
                            <td className="px-4 py-2 text-right">{data.pct}%</td>
                            <td className="px-4 py-2 text-right">
                              {data.attained}/{data.total}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.section>

            {/* Student-wise CO table (real scores) with sort/filter */}
            <motion.section variants={fadeSlideUp} className="flex flex-col gap-0">
              <div className="flex items-center justify-between py-5 px-8 border-b border-white/5">
                <h3 className="text-[10px] font-mono text-white/30 uppercase tracking-widest flex items-center gap-2">
                  <Users className="w-3.5 h-3.5" /> Student CO Performance
                </h3>
                <div className="flex items-center gap-4">
                  <span className="text-[9px] font-mono text-white/20 uppercase">
                    {studentCOScores.length} Students
                  </span>
                  <select
                    value={studentFilterCo}
                    onChange={e => setStudentFilterCo(e.target.value)}
                    className="bg-transparent border-b border-white/15 text-[10px] text-white/60 outline-none pb-0.5"
                  >
                    <option value="all" className="bg-[#050509]">
                      Show all
                    </option>
                    {coKeys.map(co => (
                      <option key={co} value={co} className="bg-[#050509]">
                        Show only students who did not attain {co}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/[0.02]">
                      <th className="px-6 py-4 text-[9px] font-mono text-white/30 uppercase tracking-widest">Roll</th>
                      <th className="px-6 py-4 text-[9px] font-mono text-white/30 uppercase tracking-widest">Name</th>
                      {coKeys.map(co => (
                        <th
                          key={co}
                          onClick={() => {
                            if (studentSortCo === co) {
                              setStudentSortDir(d => (d === "asc" ? "desc" : "asc"));
                            } else {
                              setStudentSortCo(co);
                              setStudentSortDir("desc");
                            }
                          }}
                          className="px-6 py-4 text-[9px] font-mono text-white/30 uppercase tracking-widest text-center cursor-pointer hover:text-white"
                        >
                          {co}
                          {studentSortCo === co && (
                            <span className="ml-1">
                              {studentSortDir === "asc" ? "↑" : "↓"}
                            </span>
                          )}
                        </th>
                      ))}
                      <th className="px-6 py-4 text-[9px] font-mono text-white/30 uppercase tracking-widest text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedFilteredStudents.map(s => {
                      const allPass = coKeys.every(co => (s.coScores[co] ?? 0) >= thresholds.targetPassPct);
                      return (
                        <tr key={s.roll} className="border-b border-white/5 hover:bg-white/[0.01] transition-colors">
                          <td className="px-6 py-4 font-mono text-xs text-white/50">{s.roll}</td>
                          <td className="px-6 py-4 text-xs text-white/40 italic">{s.name}</td>
                          {coKeys.map(co => {
                            const score = s.coScores[co] ?? 0;
                            const pass  = score >= thresholds.targetPassPct;
                            return (
                              <td key={co} className="px-6 py-4 text-center">
                                <span className={`font-mono text-xs ${pass ? "text-attain" : "text-alert"}`}>{score}%</span>
                              </td>
                            );
                          })}
                          <td className="px-6 py-4 text-center">
                            {allPass
                              ? <CheckCircle2 className="w-4 h-4 text-attain mx-auto" />
                              : <AlertTriangle className="w-4 h-4 text-alert mx-auto" />
                            }
                          </td>
                        </tr>
                      );
                    })}
                    {coKeys.length > 0 && (
                      <tr className="border-t border-white/10 bg-white/[0.02]">
                        <td className="px-6 py-3 text-[10px] font-mono text-white/40" colSpan={2}>
                          Summary
                        </td>
                        {coKeys.map(co => {
                          const d = finalAttainment[co];
                          if (!d) {
                            return (
                              <td key={co} className="px-6 py-3 text-[10px] font-mono text-white/30 text-center">
                                —
                              </td>
                            );
                          }
                          const pct = d.pct;
                          return (
                            <td key={co} className="px-6 py-3 text-[10px] font-mono text-white/40 text-center">
                              {co}: {d.attained}/{d.total} ({pct}%)
                            </td>
                          );
                        })}
                        <td />
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="px-8 py-3 text-[10px] text-brand underline cursor-pointer">
                <button type="button" onClick={handleExcelExport}>
                  Export to Excel
                </button>
              </div>
            </motion.section>
          </>
        )}

        {/* Calculation method modal */}
        {showFormula && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60">
            <div className="max-w-md w-full bg-[#060610] border border-white/10 rounded-xl p-6 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-mono text-white/80 uppercase tracking-widest flex items-center gap-2">
                  <Info className="w-4 h-4 text-brand" /> Attainment Formula
                </h2>
                <button
                  onClick={() => setShowFormula(false)}
                  className="text-white/40 hover:text-white text-sm"
                >
                  ✕
                </button>
              </div>
              <p className="text-xs text-white/70">
                For each Course Outcome, we compute separate attainment percentages from
                CIE and SEE assessments, then combine them as:
              </p>
              <p className="text-xs text-white font-mono bg-white/[0.05] px-3 py-2 rounded">
                Final Attainment = CIE% × {Math.round(CIE_WEIGHT * 100)}% + SEE% ×{" "}
                {Math.round(SEE_WEIGHT * 100)}%
              </p>
              <p className="text-[11px] text-white/50">
                CIE% is derived from all internal tests mapped to the CO, SEE% from end‑semester
                questions mapped to the CO. Thresholds (Level 1/2/3) are applied to this final
                percentage.
              </p>
            </div>
          </div>
        )}
      </motion.div>
    </AccessGate>
  );
}
