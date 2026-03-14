"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  FileText,
  Download,
  Share2,
  Printer,
  Sparkles,
  BarChart,
  ShieldCheck,
} from "lucide-react";
import { AccessGate } from "@/components/auth/AccessGate";
import { staggerContainer, fadeSlideUp } from "@/lib/animations";
import { useUIStore } from "@/lib/uiStore";
import { useDataStore, PROGRAM_OUTCOMES, CO_PO_MAPPING } from "@/lib/dataStore";
import {
  computeCOAttainmentFromMarks,
  computePOAttainment,
} from "@/lib/computations";
import { useAuthStore } from "@/lib/authStore";

export default function HODDeptReportPage() {
  const [isGenerating, setIsGenerating] = useState(false);
  const { addToast } = useUIStore();
  const { user, activeAY } = useAuthStore();
  const reportDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const courses = useDataStore((s) => s.courses);
  const submissions = useDataStore((s) => s.submissions);
  const examConfigs = useDataStore((s) => s.examConfigs);
  const thresholds = useDataStore((s) => s.thresholds);

  const deptCourses = useMemo(
    () =>
      courses.filter((c) =>
        user?.department ? c.dept === user.department : true
      ),
    [courses, user]
  );

  const {
    poRows,
    avgCO,
    syllabusIndex,
    facultyRows,
  } = useMemo(() => {
    const allCOPcts: { co: string; pct: number }[] = [];
    let coAccum = 0;
    let coCount = 0;
    let totalExams = 0;
    let examsWithApproved = 0;

    const facultyMap: Record<
      string,
      { name: string; courses: Set<string>; submitted: number; approved: number }
    > = {};

    deptCourses.forEach((course) => {
      const subs = submissions[course.id] || [];
      const exams = examConfigs[course.id] || [];
      const approvedSubs = subs.filter((s) => s.status === "approved");
      const allMarks = approvedSubs.flatMap((s) => s.students);
      const allQs = exams.flatMap((e) => e.questions);

      totalExams += exams.length;
      if (approvedSubs.length > 0) examsWithApproved += exams.length;

      if (course.facultyId) {
        if (!facultyMap[course.facultyId]) {
          facultyMap[course.facultyId] = {
            name: course.code,
            courses: new Set<string>(),
            submitted: 0,
            approved: 0,
          };
        }
        facultyMap[course.facultyId].courses.add(course.code);
        facultyMap[course.facultyId].submitted += subs.length;
        facultyMap[course.facultyId].approved += approvedSubs.length;
      }

      if (!allMarks.length || !allQs.length) return;

      const att = computeCOAttainmentFromMarks(
        allMarks,
        allQs,
        thresholds.targetPassPct
      );
      Object.entries(att).forEach(([co, d]) => {
        allCOPcts.push({ co, pct: d.pct });
        coAccum += d.pct;
        coCount += 1;
      });
    });

    const po = allCOPcts.length
      ? computePOAttainment(allCOPcts, CO_PO_MAPPING)
      : {};

    const poRowsLocal = PROGRAM_OUTCOMES.slice(0, 6).map((p) => {
      const d = po[p.id];
      const pct = d?.pct ?? 0;
      const status =
        pct >= thresholds.level3
          ? "Met"
          : pct >= thresholds.level2
          ? "Monitor"
          : "Critical";
      return {
        id: p.id,
        name: p.name,
        pct,
        status,
      };
    });

    const avgCO = coCount > 0 ? Math.round(coAccum / coCount) : 0;
    const syIndex =
      totalExams > 0
        ? Math.round((examsWithApproved / totalExams) * 100)
        : 0;

    const facultyRowsLocal = Object.entries(facultyMap).map(
      ([id, f]) => {
        const statusPct =
          f.submitted > 0
            ? Math.round((f.approved / f.submitted) * 100)
            : 0;
        const time =
          statusPct === 100
            ? "Excellent"
            : statusPct >= 80
            ? "Good"
            : "Delayed";
        return {
          name: id,
          courses: Array.from(f.courses).join(", "),
          status: `${statusPct}%`,
          time,
        };
      }
    );

    return {
      poRows: poRowsLocal,
      avgCO,
      syllabusIndex: syIndex,
      facultyRows: facultyRowsLocal,
    };
  }, [deptCourses, submissions, examConfigs, thresholds]);

  const handlePDFExport = async () => {
    setIsGenerating(true);
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });
      const W = doc.internal.pageSize.getWidth();

      doc.setFillColor(10, 10, 15);
      doc.rect(0, 0, W, 297, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.setFont("helvetica", "bold");
      doc.text(
        "Consolidated OBE Performance Report",
        W / 2,
        60,
        { align: "center" }
      );
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(160, 160, 180);
      doc.text(
        `${user?.department || "Department"} Department`,
        W / 2,
        72,
        { align: "center" }
      );
      doc.text(
        `Academic Year: ${activeAY}   ·   Prepared: ${reportDate}`,
        W / 2,
        82,
        { align: "center" }
      );

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("01. PO Attainment Summary", 20, 110);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(180, 180, 200);
      let y = 120;
      poRows.forEach((row) => {
        const statusColor =
          row.status === "Met"
            ? { r: 34, g: 197, b: 94 }
            : row.status === "Monitor"
            ? { r: 245, g: 158, b: 11 }
            : { r: 239, g: 68, b: 68 };
        doc.setTextColor(
          statusColor.r,
          statusColor.g,
          statusColor.b
        );
        doc.text(row.id, 20, y);
        doc.setTextColor(200, 200, 220);
        doc.text(row.name, 40, y);
        doc.text(`${row.pct}%`, 140, y);
        doc.text(row.status, 165, y);
        y += 8;
      });

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("02. Average CO Attainment", 20, y + 12);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(180, 180, 200);
      doc.text(
        `Dept-wide average CO attainment: ${avgCO}%  ·  Syllabus completion index: ${syllabusIndex}%`,
        20,
        y + 24
      );

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("03. Strategic Notes", 20, y + 40);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(160, 160, 180);
      const recs = [
        `1. Maintain Level 3 attainment (>=${thresholds.level3}%) for all core POs.`,
        `2. Monitor POs currently in Level 2 band (>=${thresholds.level2}% and <${thresholds.level3}%).`,
        "3. For any Level 1 COs, ensure remedial journals are recorded and closed before AY lock.",
      ];
      recs.forEach((r, i) => {
        doc.text(r, 20, y + 52 + i * 8);
      });

      doc.save(`Dept_OBE_Report_AY${activeAY}.pdf`);
      addToast("PDF report downloaded.", "success");
    } catch {
      addToast("PDF generation failed.", "error");
    }
    setIsGenerating(false);
  };

  const handleExcelExport = async () => {
    const XLSX = await import("xlsx");
    const poSheet = XLSX.utils.json_to_sheet(
      poRows.map((p) => ({
        PO: p.id,
        Name: p.name,
        "Attainment %": p.pct,
        Status: p.status,
      }))
    );
    const summarySheet = XLSX.utils.aoa_to_sheet([
      ["Metric", "Value"],
      ["Average CO Attainment %", avgCO],
      ["Syllabus Completion Index %", syllabusIndex],
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, poSheet, "PO Attainment");
    XLSX.utils.book_append_sheet(wb, summarySheet, "Summary");
    XLSX.writeFile(wb, `Dept_OBE_Report_AY${activeAY}.xlsx`);
    addToast("Excel report downloaded.", "success");
  };

  return (
    <AccessGate feature="dept_summary" deny="lock">
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="flex flex-col gap-12 pb-32 max-w-6xl mx-auto"
      >
        {/* ── REPORT CONTROLS ── */}
        <header className="flex justify-between items-center py-6 border-b border-white/10 sticky top-0 bg-black/80 backdrop-blur-xl z-10 px-4 -mx-4">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-brand/10 rounded-xl">
              <FileText className="w-6 h-6 text-brand" />
            </div>
            <div>
              <h1 className="text-xl font-display text-white">
                Departmental Summary Report
              </h1>
              <p className="text-[10px] font-mono text-white/30 uppercase tracking-[0.2em] mt-1">
                AY {activeAY} · Calculated from approved marks
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => window.print()}
              className="p-3 bg-white/5 border border-white/5 rounded-xl text-white/40 hover:text-white transition-all"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={handleExcelExport}
              className="p-3 bg-white/5 border border-white/5 rounded-xl text-white/40 hover:text-white transition-all"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button
              onClick={handlePDFExport}
              disabled={isGenerating}
              className="px-6 py-3 bg-brand text-white rounded-xl text-[10px] font-mono uppercase tracking-widest flex items-center gap-3 hover:bg-brand/80 transition-all shadow-xl shadow-brand/20 disabled:opacity-50"
            >
              <Download className="w-4 h-4" />{" "}
              {isGenerating ? "Generating…" : "Download PDF"}
            </button>
          </div>
        </header>

        {/* ── REPORT DOCUMENT BODY ── */}
        <div className="bg-white/[0.01] border border-white/10 p-16 rounded-[3rem] shadow-3xl space-y-24">
          {/* Section 1: Cover Page */}
          <section className="flex flex-col items-center text-center gap-12 border-b border-white/5 pb-24">
            <div className="w-24 h-24 rounded-full bg-brand/5 border border-brand/20 flex items-center justify-center p-6">
              <div className="w-full h-full bg-brand/40 rounded-full blur-xl animate-pulse" />
            </div>
            <div className="space-y-4">
              <h2 className="text-4xl font-display text-white">
                Consolidated OBE Performance Report
              </h2>
              <p className="text-lg font-light text-white/40 max-w-xl mx-auto italic">
                {user?.department || "Department"} · Institutional Quality Cell
              </p>
            </div>
            <div className="grid grid-cols-3 gap-12 pt-8 w-full max-w-3xl border-t border-white/5 mt-12">
              {[
                { label: "Academic Year", val: activeAY },
                { label: "Total Courses", val: deptCourses.length },
                { label: "Prepared Date", val: reportDate },
              ].map((stat, i) => (
                <div key={i} className="flex flex-col gap-2">
                  <span className="text-[10px] font-mono text-white/20 uppercase tracking-widest">
                    {stat.label}
                  </span>
                  <span className="text-sm font-bold text-white uppercase">
                    {stat.val}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* Section 2: Executive Attainment Summary */}
          <section className="space-y-12">
            <div className="flex items-center gap-4">
              <span className="text-2xl font-mono text-white/10 italic">
                01.
              </span>
              <h3 className="text-2xl font-display text-white uppercase tracking-widest">
                Attainment Summary
              </h3>
            </div>
            <div className="grid lg:grid-cols-2 gap-12">
              <div className="p-8 border border-white/10 bg-white/[0.01] rounded-[2rem] space-y-8">
                <h4 className="text-xs font-mono text-white/30 uppercase tracking-[0.2em] flex items-center gap-2">
                  <BarChart className="w-4 h-4 text-attain" /> Dept-Wide PO
                  Attainment
                </h4>
                <div className="space-y-6">
                  {poRows.map((row) => (
                    <div key={row.id} className="space-y-2">
                      <div className="flex justify-between text-[10px] font-mono text-white/60">
                        <span>
                          {row.id} Attainment · {row.name}
                        </span>
                        <span>{row.pct}%</span>
                      </div>
                      <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${
                            row.status === "Met"
                              ? "bg-attain"
                              : row.status === "Monitor"
                              ? "bg-amber-400"
                              : "bg-alert"
                          }`}
                          style={{ width: `${row.pct}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-8 border border-white/10 bg-white/[0.01] rounded-[2rem] space-y-8">
                <h4 className="text-xs font-mono text-white/30 uppercase tracking-[0.2em] flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-brand" /> Institutional
                  Benchmarks
                </h4>
                <div className="space-y-8">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-full border-4 border-attain/20 border-t-attain flex items-center justify-center font-display text-white text-lg">
                      {avgCO}%
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">
                        Average CO Attainment
                      </p>
                      <p className="text-[10px] text-white/30 mt-1 uppercase">
                        Based on approved CIE+SEE marks
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-full border-4 border-amber-400/20 border-t-amber-400 flex items-center justify-center font-display text-white text-lg">
                      {syllabusIndex}%
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">
                        Syllabus Completion Index
                      </p>
                      <p className="text-[10px] text-white/30 mt-1 uppercase">
                        Exams with approved marks vs configured
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Section 3: Faculty Performance & Operations */}
          <section className="space-y-12">
            <div className="flex items-center gap-4">
              <span className="text-2xl font-mono text-white/10 italic">
                02.
              </span>
              <h3 className="text-2xl font-display text-white uppercase tracking-widest">
                Faculty Audit
              </h3>
            </div>
            <div className="border border-white/10 rounded-2xl overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead className="bg-white/5 text-[10px] font-mono text-white/20 uppercase tracking-widest">
                  <tr>
                    <th className="p-6">Faculty</th>
                    <th className="p-6">Courses</th>
                    <th className="p-6 text-center">Submission Status</th>
                    <th className="p-6 text-center">Timeliness</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-xs text-white/60">
                  {facultyRows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="p-6 text-center text-white/30 italic"
                      >
                        No faculty records found for this department.
                      </td>
                    </tr>
                  ) : (
                    facultyRows.map((f, i) => (
                      <tr key={i}>
                        <td className="p-6 font-bold text-white uppercase">
                          {f.name}
                        </td>
                        <td className="p-6">{f.courses}</td>
                        <td className="p-6 text-center">
                          <span
                            className={`px-2 py-1 rounded-full text-[9px] font-mono ${
                              f.status === "100%"
                                ? "bg-attain/10 text-attain"
                                : "bg-amber-400/10 text-amber-400"
                            }`}
                          >
                            {f.status}
                          </span>
                        </td>
                        <td className="p-6 text-center">
                          <span
                            className={`text-[10px] font-mono uppercase ${
                              f.time === "Delayed"
                                ? "text-alert"
                                : "text-white/40"
                            }`}
                          >
                            {f.time}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* Section 4: AI Analysis & Recommendations */}
          <section className="space-y-12 bg-white/5 -mx-16 p-16 border-y border-white/5">
            <div className="flex items-center gap-4">
              <span className="text-2xl font-mono text-white/10 italic">
                03.
              </span>
              <h3 className="text-2xl font-display text-white uppercase tracking-widest flex items-center gap-4">
                <Sparkles className="w-6 h-6 text-brand" /> Strategic
                Recommendations
              </h3>
            </div>
            <div className="grid lg:grid-cols-3 gap-12">
              <div className="space-y-4">
                <div className="bg-brand/10 w-10 h-10 rounded-xl flex items-center justify-center text-brand font-bold font-mono">
                  1
                </div>
                <h4 className="text-sm font-bold text-white uppercase">
                  Consolidate Level 3 Outcomes
                </h4>
                <p className="text-xs text-white/40 leading-relaxed font-light italic">
                  Prioritize sustaining PO/COs already in Level 3 by documenting
                  successful pedagogy patterns and assessment designs.
                </p>
              </div>
              <div className="space-y-4">
                <div className="bg-brand/10 w-10 h-10 rounded-xl flex items-center justify-center text-brand font-bold font-mono">
                  2
                </div>
                <h4 className="text-sm font-bold text-white uppercase">
                  Lift Level 2 Bands
                </h4>
                <p className="text-xs text-white/40 leading-relaxed font-light italic">
                  For POs and COs in Level 2, align internal evaluation weight
                  and question design with the configured thresholds to avoid
                  borderline cases.
                </p>
              </div>
              <div className="space-y-4">
                <div className="bg-brand/10 w-10 h-10 rounded-xl flex items-center justify-center text-brand font-bold font-mono">
                  3
                </div>
                <h4 className="text-sm font-bold text-white uppercase">
                  Close Level 1 Gaps
                </h4>
                <p className="text-xs text-white/40 leading-relaxed font-light italic">
                  Ensure every Level 1 CO has a remedial journal entry and a
                  closure note before triggering the year-end lock workflow.
                </p>
              </div>
            </div>
          </section>
        </div>
      </motion.div>
    </AccessGate>
  );
}
