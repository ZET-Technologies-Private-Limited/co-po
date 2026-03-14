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

        {/* ── PO SNAPSHOT (FLATTENED) ── */}
        <section className="flex items-center gap-12 border-b border-white/5 pb-16">
          <div className="flex items-center gap-8">
            <div className="w-20 h-20 rounded-full border border-white/5 flex flex-col items-center justify-center">
              <span className="text-[9px] font-mono text-brand uppercase">AVG</span>
              <span className="text-2xl font-display text-white">{poSnapshot}%</span>
            </div>
            <div className="space-y-2">
              <h2 className="text-sm font-bold text-white uppercase tracking-widest">PO/CO Attainment Profile</h2>
              <p className="text-[10px] text-white/30 font-mono italic max-w-sm leading-relaxed">
                Aggregated departmental health index for AY {activeAY}. 
                Multi-year trajectories will populate post-import.
              </p>
            </div>
          </div>
        </section>

        <div className="grid lg:grid-cols-3 gap-12">
          {/* ── LEFT: CO TABLE ── */}
          <div className="lg:col-span-2 space-y-12">
            <h2 className="text-xl font-display text-white border-b border-white/5 pb-6 flex items-center gap-4 uppercase tracking-widest">
               <BarChart3 className="w-5 h-5 text-orange-400" /> Outcome Sustainability
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="py-4 text-[9px] font-mono text-white/20 uppercase tracking-[0.3em]">Course Outcome Identity</th>
                    <th className="py-4 text-center text-[9px] font-mono text-white/20 uppercase tracking-[0.3em]">Attainment %</th>
                    <th className="py-4 text-right text-[9px] font-mono text-white/20 uppercase tracking-[0.3em]">Classification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.02]">
                  {trendTable.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="py-12 text-center text-xs text-white/10 italic font-mono">
                        No approved marks recorded for this academic cycle.
                      </td>
                    </tr>
                  ) : (
                    trendTable.map((item, i) => (
                      <tr key={`${item.code}-${item.co}-${i}`} className="hover:bg-white/[0.01] transition-colors">
                        <td className="py-8">
                          <p className="text-sm font-bold text-white tracking-tight">{item.code} · {item.co}</p>
                          <p className="text-[11px] text-white/30 mt-1 uppercase font-mono tracking-tighter">{item.name}</p>
                        </td>
                        <td className="py-8 text-center">
                          <span className={`text-lg font-display ${item.current < thresholds.level2 ? "text-alert" : "text-white"}`}>
                            {item.current}%
                          </span>
                        </td>
                        <td className="py-8 text-right">
                          <span className={`text-[10px] font-mono uppercase tracking-widest ${
                            item.current < thresholds.level2 ? "text-alert" : 
                            item.current < thresholds.level3 ? "text-amber-400" : "text-attain"
                          }`}>
                            Level {item.current < thresholds.level2 ? "1" : item.current < thresholds.level3 ? "2" : "3"}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-12">
            <h2 className="text-xl font-display text-white border-b border-white/5 pb-6 flex items-center gap-4 uppercase tracking-widest">
               <Sparkles className="w-5 h-5 text-orange-400" /> Gap Intelligence
            </h2>
            <div className="space-y-10">
              <div className="space-y-4">
                <span className="text-[9px] font-mono text-orange-400 uppercase tracking-[0.3em]">AI Synthesis</span>
                <p className="text-xl font-display text-white leading-relaxed italic">
                  "Level 1 outcomes indicate foundational gaps in prerequisites or assessment misalignment."
                </p>
              </div>

              <div className="space-y-8 pt-8 border-t border-white/5">
                <div className="space-y-6">
                  <p className="text-[10px] font-mono text-white/20 uppercase tracking-widest leading-none">Primary Bottlenecks</p>
                  <ul className="space-y-4">
                    {[
                      "Misalignment between CO level and question Bloom's depth.",
                      "Prerequisite degradation in foundational course branches."
                    ].map((txt, i) => (
                      <li key={i} className="flex gap-4 items-start">
                        <div className="w-1 h-1 rounded-full bg-brand mt-1.5" />
                        <p className="text-xs text-white/60 leading-relaxed font-light">{txt}</p>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="space-y-6">
                  <p className="text-[10px] font-mono text-white/20 uppercase tracking-widest leading-none">Intervention Plan</p>
                  <div className="space-y-4">
                    {[
                      "Deploy bridge modules for repeated Level 1 course branches.",
                      "Calibrate internal assessment weights with NBA thresholds."
                    ].map((txt, i) => (
                      <div key={i} className="flex gap-4 items-center bg-white/[0.01] border border-white/5 p-4 rounded-xl">
                        <div className="text-[10px] font-mono text-white/20">0{i+1}</div>
                        <p className="text-[11px] text-white/70 font-medium">{txt}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <button className="w-full py-4 text-[10px] font-mono text-orange-400 hover:text-white border border-orange-400/20 hover:border-white transition-all uppercase tracking-widest flex items-center justify-center gap-3">
                Download Audit Summary <Calendar className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AccessGate>
  );
}
