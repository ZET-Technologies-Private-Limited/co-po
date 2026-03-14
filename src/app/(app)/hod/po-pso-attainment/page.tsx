"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Download,
  Layers,
  Info,
  Target,
  BarChart3,
  TrendingDown,
  Calculator,
} from "lucide-react";
import { AccessGate } from "@/components/auth/AccessGate";
import { staggerContainer, fadeSlideUp } from "@/lib/animations";
import { useUIStore } from "@/lib/uiStore";
import {
  useDataStore,
  PROGRAM_OUTCOMES,
  PROGRAM_SPECIFIC_OUTCOMES,
  CO_PO_MAPPING,
} from "@/lib/dataStore";
import { computeCOAttainmentFromMarks, computePOAttainment } from "@/lib/computations";
import { useAuthStore } from "@/lib/authStore";

export default function DeptPOPSOAttainmentPage() {
  const [activeView, setActiveView] = useState<"aggregation" | "table">("aggregation");
  const { addToast } = useUIStore();
  const { user, activeAY } = useAuthStore();

  const courses = useDataStore((s) => s.courses);
  const submissions = useDataStore((s) => s.submissions);
  const examConfigs = useDataStore((s) => s.examConfigs);
  const thresholds = useDataStore((s) => s.thresholds);

  const deptCourses = useMemo(
    () => courses.filter((c) => (user?.department ? c.dept === user.department : true)),
    [courses, user]
  );

  const { poTargets, contributionCourses, matrixRows, psoRows } = useMemo(() => {
    const allCOPcts: { co: string; pct: number }[] = [];
    const courseOrder: string[] = [];

    deptCourses.forEach((course) => {
      const subs = (submissions[course.id] || []).filter((s) => s.status === "approved");
      const exams = examConfigs[course.id] || [];
      const allMarks = subs.flatMap((s) => s.students);
      const allQs = exams.flatMap((e) => e.questions);
      if (!allMarks.length || !allQs.length) return;

      if (!courseOrder.includes(course.code)) courseOrder.push(course.code);
      const att = computeCOAttainmentFromMarks(allMarks, allQs, thresholds.targetPassPct);
      Object.entries(att).forEach(([co, d]) => allCOPcts.push({ co, pct: d.pct }));
    });

    const po = allCOPcts.length ? computePOAttainment(allCOPcts, CO_PO_MAPPING) : {};

    const poTargetsLocal = PROGRAM_OUTCOMES.map((p) => {
      const data = po[p.id];
      const actual = data?.pct ?? 0;
      const target = thresholds.level3;
      const status =
        actual >= thresholds.level3
          ? "Met"
          : actual >= thresholds.level2
          ? "Monitor"
          : "Critical";
      return { id: p.id, name: p.name, target, actual, status };
    });

    const matrixRowsLocal = poTargetsLocal.map((p) => {
      const contributions = (po[p.id]?.contributions || []).map((c) => c.co);
      const rowValues = courseOrder.map((code) => {
        const related = (po[p.id]?.contributions || []).filter((c) => c.co === code);
        if (!related.length) return 0;
        const avg = related.reduce((a, r) => a + r.coAtt, 0) / related.length;
        return Math.round(avg);
      });
      const combined =
        rowValues.length > 0
          ? Math.round(rowValues.reduce((a, b) => a + b, 0) / rowValues.length)
          : 0;
      return { po: p.id, contributions: rowValues, combined };
    });

    const psoRowsLocal = PROGRAM_SPECIFIC_OUTCOMES.map((p) => {
      const data = po[p.id];
      const att = data?.pct ?? 0;
      return {
        id: p.id,
        desc: p.name,
        att,
        courses: deptCourses.length,
      };
    });

    return {
      poTargets: poTargetsLocal,
      contributionCourses: courseOrder,
      matrixRows: matrixRowsLocal,
      psoRows: psoRowsLocal,
    };
  }, [deptCourses, submissions, examConfigs, thresholds, courses]);

  const handleNBAExport = async () => {
    const XLSX = await import("xlsx");
    const wb = XLSX.utils.book_new();

    const poSheet = XLSX.utils.json_to_sheet(
      poTargets.map((p) => ({
        "PO ID": p.id,
        "Program Outcome": p.name,
        "Target %": p.target,
        "Attained %": p.actual,
        Gap: p.actual - p.target,
        Status: p.status,
      }))
    );
    XLSX.utils.book_append_sheet(wb, poSheet, "PO Attainment");

    const matrixSheetRows = matrixRows.map((row) => {
      const obj: Record<string, any> = { PO: row.po };
      contributionCourses.forEach((c, i) => {
        obj[c] = row.contributions[i] ?? 0;
      });
      obj.Combined = row.combined;
      return obj;
    });
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(matrixSheetRows),
      "Contribution Matrix"
    );

    const psoSheet = XLSX.utils.json_to_sheet(
      psoRows.map((p) => ({
        PSO: p.id,
        Description: p.desc,
        "Attainment %": p.att,
        "Courses Mapped": p.courses,
      }))
    );
    XLSX.utils.book_append_sheet(wb, psoSheet, "PSO Attainment");

    XLSX.writeFile(wb, `NBA_PO_PSO_Report_AY${activeAY}.xlsx`);
    addToast("NBA format Excel exported.", "success");
  };

  return (
    <AccessGate feature="dept_summary" deny="lock">
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="flex flex-col gap-10 pb-32"
      >
        <header className="flex flex-col gap-6">
          <div className="flex items-center gap-2 text-[10px] font-mono text-orange-400 uppercase tracking-widest">
            <span className="w-8 h-[1px] bg-orange-400" /> Dept-Level Matrix
          </div>
          <div className="flex justify-between items-end">
            <div>
              <h1 className="text-4xl font-display text-white">
                Institutional PO/PSO Performance
              </h1>
              <p className="text-white/40 font-light mt-2 italic">
                Aggregated attainment calculations for departmental NBA compliance (AY {activeAY}).
              </p>
            </div>
            <button
              onClick={handleNBAExport}
              className="px-5 py-2.5 bg-orange-400 text-black rounded-xl text-[10px] font-mono uppercase tracking-widest flex items-center gap-3 hover:bg-orange-500 transition-all shadow-lg shadow-orange-400/10"
            >
              <Download className="w-4 h-4" /> NBA Format Export
            </button>
          </div>
        </header>

        {/* ── TARGET VS ACTUAL SUMMARY (FLATTENED) ── */}
        <section className="flex flex-col gap-12 border-b border-white/5 pb-16">
          <h2 className="text-xl font-display text-white uppercase tracking-widest flex items-center gap-4">
             <Target className="w-5 h-5 text-orange-400" /> Strategic Benchmarks
          </h2>
          <div className="flex justify-between items-start gap-12 overflow-x-auto pb-4">
            {poTargets.map((p) => (
              <div key={p.id} className="flex-1 min-w-[200px] flex flex-col gap-4">
                <div className="flex justify-between items-center border-b border-white/5 pb-2">
                  <span className="text-[10px] font-mono text-brand uppercase tracking-widest">{p.id}</span>
                  {p.status === "Critical" ? (
                    <TrendingDown className="w-3.5 h-3.5 text-alert" />
                  ) : (
                    <div className="w-1 h-1 rounded-full bg-attain" />
                  )}
                </div>
                <div>
                  <h3 className="text-[11px] font-bold text-white/60 truncate uppercase font-mono tracking-tight">{p.name}</h3>
                  <div className="flex items-baseline gap-2 mt-4">
                    <span className="text-4xl font-display text-white">{p.actual}%</span>
                    <span className="text-[10px] font-mono text-white/20">/ {p.target}%</span>
                  </div>
                </div>
                <div className="h-0.5 bg-white/5 w-full">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${p.actual}%` }}
                    className={`h-full ${p.status === "Critical" ? "bg-alert" : "bg-attain"}`}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── PO CONTRIBUTION MATRIX ── */}
        <section className="flex flex-col gap-8 p-10 border border-white/10 bg-white/[0.01] rounded-[2.5rem]">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/5 rounded-2xl">
                <Layers className="w-6 h-6 text-orange-400" />
              </div>
              <div>
                <h2 className="text-2xl font-display text-white">
                  PO Contribution Matrix
                </h2>
                <p className="text-xs text-white/40 mt-1 uppercase tracking-widest font-mono">
                  Weighted averages across all course mappings
                </p>
              </div>
            </div>
            <div className="flex bg-white/5 p-1 rounded-xl">
              <button
                onClick={() => setActiveView("aggregation")}
                className={`px-4 py-2 rounded-lg text-[10px] font-mono uppercase tracking-widest transition-all ${
                  activeView === "aggregation"
                    ? "bg-orange-400 text-black"
                    : "text-white/40 hover:text-white"
                }`}
              >
                Matrix View
              </button>
              <button
                onClick={() => setActiveView("table")}
                className={`px-4 py-2 rounded-lg text-[10px] font-mono uppercase tracking-widest transition-all ${
                  activeView === "table"
                    ? "bg-orange-400 text-black"
                    : "text-white/40 hover:text-white"
                }`}
              >
                Summary List
              </button>
            </div>
          </div>

          <div className="overflow-x-auto pb-4 custom-scrollbar">
            <table className="w-full text-left border-separate border-spacing-2">
              <thead>
                <tr>
                  <th className="p-4 text-[10px] font-mono text-white/20 uppercase">
                    PO ID
                  </th>
                  {contributionCourses.map((c) => (
                    <th
                      key={c}
                      className="p-4 text-center text-[10px] font-mono text-white/20 uppercase min-w-[100px]"
                    >
                      {c}
                    </th>
                  ))}
                  <th className="p-4 text-right text-[10px] font-mono text-orange-400 uppercase font-bold bg-orange-400/5 rounded-lg border border-orange-400/10">
                    Combined
                  </th>
                </tr>
              </thead>
              <tbody>
                {matrixRows.map((row) => (
                  <tr key={row.po} className="group">
                    <td className="p-4 font-display text-white group-hover:text-orange-400 transition-colors">
                      {row.po}
                    </td>
                    {row.contributions.map((att, j) => (
                      <td key={j} className="p-4">
                        <div className="relative group/cell text-center">
                          <span className="text-xs font-mono text-white/60 group-hover/cell:text-white">
                            {att}%
                          </span>
                          <div className="mt-2 h-1 bg-white/5 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-white/20 group-hover/cell:bg-orange-400/40"
                              style={{ width: `${att}%` }}
                            />
                          </div>
                        </div>
                      </td>
                    ))}
                    <td className="p-4 text-right font-display text-lg text-white bg-white/5 rounded-xl border border-white/5">
                      {row.combined}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-6 bg-brand/5 border border-brand/10 rounded-2xl flex items-start gap-4">
            <Info className="w-5 h-5 text-brand shrink-0 mt-1" />
            <div className="space-y-1">
              <p className="text-xs font-bold text-white uppercase tracking-widest font-mono">
                Aggregation Formula
              </p>
              <p className="text-xs text-white/40 leading-relaxed font-light italic">
                Dept PO Attainment% = Weighted Average of PO attainment% across all
                contributing courses that house COs mapped to that functional PO.
              </p>
            </div>
          </div>
        </section>

        {/* ── PSO ATTAINMENT TABLE ── */}
        <section className="grid lg:grid-cols-2 gap-8">
          <div className="p-8 border border-white/10 bg-white/[0.02] rounded-3xl space-y-8">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-display text-white flex items-center gap-3">
                <Calculator className="w-5 h-5 text-orange-400" /> Dept PSO
                Performance
              </h2>
            </div>
            <div className="space-y-6">
              {psoRows.map((p) => (
                <div
                  key={p.id}
                  className="p-6 bg-white/5 rounded-2xl border border-white/5 space-y-4"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-mono text-orange-400 uppercase tracking-widest">
                        {p.id}
                      </span>
                      <p className="text-xs text-white/70 mt-1 font-light">
                        {p.desc}
                      </p>
                    </div>
                    <span className="text-2xl font-display text-white">
                      {p.att}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-mono text-white/30 uppercase tracking-widest font-bold">
                      {p.courses} Courses Mapped
                    </span>
                    <div className="w-32 h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-brand"
                        style={{ width: `${p.att}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-8 border border-white/10 bg-white/[0.02] rounded-3xl flex flex-col justify-center items-center text-center gap-6 group cursor-help">
            <div className="w-20 h-20 rounded-full bg-orange-400/10 flex items-center justify-center border border-orange-400/20 group-hover:scale-110 transition-transform">
              <Download className="w-8 h-8 text-orange-400" />
            </div>
            <div>
              <h3 className="text-xl font-display text-white">
                Full Compliance Dossier
              </h3>
              <p className="text-sm text-white/40 mt-2 font-light max-w-xs mx-auto leading-relaxed">
                Generate the complete SAR (Self Assessment Report) data for PO/PSO
                Criterion 3 in one click, using the same attainment engine as
                this screen.
              </p>
            </div>
            <button className="text-[10px] font-mono text-white/20 uppercase tracking-[0.3em] hover:text-white transition-colors">
              Preview SAR Format →
            </button>
          </div>
        </section>
      </motion.div>
    </AccessGate>
  );
}

