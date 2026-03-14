"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  AlertTriangle,
  FileSearch,
  Sparkles,
  Calendar,
  BarChart3,
} from "lucide-react";
import { AccessGate } from "@/components/auth/AccessGate";
import { staggerContainer, fadeSlideUp } from "@/lib/animations";
import { useDataStore } from "@/lib/dataStore";
import { computeCOAttainmentFromMarks } from "@/lib/computations";
import { useAuthStore } from "@/lib/authStore";

export default function HODAYHistoryPage() {
  const { user, activeAY } = useAuthStore();
  const courses = useDataStore((s) => s.courses);
  const submissions = useDataStore((s) => s.submissions);
  const examConfigs = useDataStore((s) => s.examConfigs);
  const thresholds = useDataStore((s) => s.thresholds);

  const deptCourses = useMemo(
    () => courses.filter((c) => (user?.department ? c.dept === user.department : true)),
    [courses, user]
  );

  const trendTable = useMemo(() => {
    const rows: {
      code: string;
      name: string;
      co: string;
      current: number;
      consecutiveL1: boolean;
    }[] = [];

    deptCourses.forEach((course) => {
      const subs = (submissions[course.id] || []).filter((s) => s.status === "approved");
      const exams = examConfigs[course.id] || [];
      const allMarks = subs.flatMap((s) => s.students);
      const allQs = exams.flatMap((e) => e.questions);
      if (!allMarks.length || !allQs.length) return;

      const att = computeCOAttainmentFromMarks(allMarks, allQs, thresholds.targetPassPct);
      Object.entries(att).forEach(([co, d]) => {
        rows.push({
          code: course.code,
          name: course.name,
          co,
          current: d.pct,
          consecutiveL1: d.pct < thresholds.level2,
        });
      });
    });

    return rows.sort((a, b) => a.current - b.current).slice(0, 10);
  }, [deptCourses, submissions, examConfigs, thresholds]);

  const poSnapshot = useMemo(() => {
    const values = trendTable.map((r) => r.current);
    if (!values.length) return 0;
    return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
  }, [trendTable]);

  return (
    <AccessGate feature="dept_summary" deny="lock">
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="flex flex-col gap-10 pb-32"
      >
        <header className="flex flex-col gap-6">
          <div className="flex items-center gap-2 text-[10px] font-mono text-brand uppercase tracking-widest">
            <span className="w-8 h-[1px] bg-brand" /> Department Analytics
          </div>
          <div className="flex justify-between items-end">
            <div>
              <h1 className="text-4xl font-display text-white">Academic History (Current AY)</h1>
              <p className="text-white/40 font-light mt-2 italic">
                Snapshot of CO health for AY {activeAY}. Multi-year comparisons will populate once historic data is imported.
              </p>
            </div>
          </div>
        </header>

        {/* ── PO SNAPSHOT (SIMPLE BAR) ── */}
        <section className="p-10 border border-white/10 bg-white/[0.01] rounded-[2.5rem] flex flex-col gap-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/5 rounded-2xl">
                <TrendingUp className="w-6 h-6 text-brand" />
              </div>
              <h2 className="text-2xl font-display text-white">PO/CO Attainment Snapshot</h2>
            </div>
            <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest">
              AY {activeAY} · Computed from approved marks
            </p>
          </div>
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-full border-4 border-brand/20 border-t-brand flex items-center justify-center font-display text-white text-xl">
              {poSnapshot}%
            </div>
            <p className="text-xs text-white/50 max-w-xl">
              This value approximates overall CO health across the department. For detailed PO and PSO profiles, use the PO/PSO attainment screens.
            </p>
          </div>
        </section>

        <div className="grid lg:grid-cols-3 gap-12">
          {/* ── LEFT: CO TABLE ── */}
          <div className="lg:col-span-2 space-y-8">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-display text-white flex items-center gap-3">
                <BarChart3 className="w-5 h-5 text-brand" /> Outcome Sustainability (Current AY)
              </h2>
            </div>
            <div className="border border-white/10 bg-white/[0.01] rounded-3xl overflow-hidden shadow-2xl">
              <table className="w-full text-left border-collapse">
                <thead className="bg-white/5 border-b border-white/10 text-[10px] font-mono text-white/20 uppercase tracking-widest">
                  <tr>
                    <th className="p-6">Course Outcome</th>
                    <th className="p-6 text-center">Current AY %</th>
                    <th className="p-6 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {trendTable.length === 0 ? (
                    <tr>
                      <td
                        colSpan={3}
                        className="p-8 text-center text-[11px] text-white/30 italic"
                      >
                        No approved marks available yet to build an AY history.
                      </td>
                    </tr>
                  ) : (
                    trendTable.map((item, i) => (
                      <tr
                        key={`${item.code}-${item.co}-${i}`}
                        className={`hover:bg-white/[0.02] transition-colors ${
                          item.consecutiveL1 ? "bg-alert/[0.01]" : ""
                        }`}
                      >
                        <td className="p-6">
                          <div className="flex items-center gap-4">
                            {item.consecutiveL1 && (
                              <AlertTriangle className="w-4 h-4 text-alert animate-bounce" />
                            )}
                            <div>
                              <p className="text-xs font-bold text-white uppercase">
                                {item.code} · {item.co}
                              </p>
                              <p className="text-[10px] text-white/30 mt-0.5">
                                {item.name}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="p-6 text-center font-mono text-xs text-white/60">
                          {item.current}%
                        </td>
                        <td className="p-6 text-right">
                          <span
                            className={`text-[10px] font-mono uppercase ${
                              item.current < thresholds.level2
                                ? "text-alert"
                                : item.current < thresholds.level3
                                ? "text-amber-400"
                                : "text-attain"
                            }`}
                          >
                            {item.current < thresholds.level2
                              ? "Level 1"
                              : item.current < thresholds.level3
                              ? "Level 2"
                              : "Level 3"}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── RIGHT: GAP REPORT ── */}
          <div className="space-y-8">
            <h2 className="text-xl font-display text-white flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-brand" /> Curricular Gap Report
            </h2>
            <div className="p-8 border border-brand/20 bg-brand/[0.02] rounded-[2rem] space-y-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <FileSearch className="w-20 h-20 text-brand" />
              </div>

              <div className="space-y-4">
                <div className="px-3 py-1 bg-brand/10 border border-brand/20 rounded-full w-fit text-[8px] font-mono text-brand uppercase tracking-widest">
                  AI Intelligence Summary
                </div>
                <h3 className="text-lg font-display text-white italic">
                  "Level 1 Outcomes Require Closure"
                </h3>
                <p className="text-xs text-white/50 leading-relaxed">
                  This view highlights COs that are currently below the Level 2 threshold for the active AY.
                  Use the CO attainment and remedial journals to document and close each case before initiating the year-end lock.
                </p>
              </div>

              <div className="space-y-6 pt-6 border-t border-white/5">
                <div>
                  <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest mb-3">
                    Probable Root Causes (Generic)
                  </p>
                  <ul className="space-y-2">
                    <li className="text-[11px] text-white/70 flex items-start gap-2">
                      <div className="w-1 h-1 rounded-full bg-brand mt-1.5" />
                      Misalignment between CO level and question paper Bloom&apos;s level.
                    </li>
                    <li className="text-[11px] text-white/70 flex items-start gap-2">
                      <div className="w-1 h-1 rounded-full bg-brand mt-1.5" />
                      Prerequisite gaps in earlier courses or foundational subjects.
                    </li>
                  </ul>
                </div>
                <div>
                  <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest mb-3">
                    Recommendations
                  </p>
                  <div className="p-4 bg-white/5 rounded-xl border border-white/5 space-y-3">
                    <p className="text-[10px] text-white/80 font-medium">
                      1. Introduce bridge or revision modules for courses with repeated Level 1 outcomes.
                    </p>
                    <p className="text-[10px] text-white/80 font-medium">
                      2. Align question paper design and internal assessment weights with configured attainment thresholds.
                    </p>
                  </div>
                </div>
              </div>

              <button className="w-full py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-mono text-white/40 uppercase tracking-[0.2em] hover:bg-brand hover:text-white transition-all flex items-center justify-center gap-3">
                Download Current AY Gap Summary <Calendar className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AccessGate>
  );
}
