"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { ClipboardList, CheckCircle2, AlertTriangle } from "lucide-react";
import { useDataStore } from "@/lib/dataStore";
import { computeCOAttainmentFromMarks, getAttainmentLevel } from "@/lib/computations";
import { AccessGate } from "@/components/auth/AccessGate";
import { staggerContainer, fadeSlideUp } from "@/lib/animations";

export default function LeadRemedialActionsPage() {
  const courses         = useDataStore(s => s.courses);
  const submissions     = useDataStore(s => s.submissions);
  const examConfigs     = useDataStore(s => s.examConfigs);
  const remedialActions = useDataStore(s => s.remedialActions);
  const thresholds      = useDataStore(s => s.thresholds);

  const rows = useMemo(() => {
    const result: Array<{
      courseCode: string; courseName: string; co: string;
      pct: number; level: number; action: string;
    }> = [];

    courses.forEach(c => {
      const subs    = (submissions[c.id] || []).filter(s => s.status === "approved");
      const exams   = examConfigs[c.id] || [];
      const allMarks = subs.flatMap(s => s.students);
      const allQs   = exams.flatMap(e => e.questions);
      if (!allMarks.length || !allQs.length) return;

      const att = computeCOAttainmentFromMarks(allMarks, allQs, thresholds.targetPassPct);
      Object.entries(att).forEach(([co, d]) => {
        const lvl    = getAttainmentLevel(d.pct, thresholds);
        const action = remedialActions[c.id]?.[co] || "";
        if (lvl.level === 1 || action) {
          result.push({ courseCode: c.code, courseName: c.name, co, pct: d.pct, level: lvl.level, action });
        }
      });
    });
    return result;
  }, [courses, submissions, examConfigs, thresholds, remedialActions]);

  return (
    <AccessGate feature="remedial_entry" deny="lock">
      <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="max-w-5xl mx-auto pb-32">

        <motion.div variants={fadeSlideUp} className="pb-8 border-b border-white/5">
          <div className="flex items-center gap-2 text-[10px] font-mono text-brand uppercase tracking-widest mb-3">
            <span className="w-8 h-[1px] bg-brand" /> Remedial Oversight
          </div>
          <h1 className="text-4xl font-display text-white flex items-center gap-4">
            <ClipboardList className="w-8 h-8 text-brand" /> Remedial Actions
          </h1>
          <p className="text-white/40 font-light mt-1">View-only. Actions are entered by the course faculty.</p>
        </motion.div>

        {rows.length === 0 ? (
          <div className="py-24 text-center text-white/20">
            <p className="text-sm italic">No Level 1 COs or remedial actions on record.</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.02]">
                {["Course", "CO", "Attainment", "Level", "Remedial Action Filed"].map(h => (
                  <th key={h} className="px-6 py-4 text-[9px] font-mono text-white/30 uppercase tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} className="border-b border-white/5 hover:bg-white/[0.01] transition-colors">
                  <td className="px-6 py-4">
                    <p className="text-xs font-mono text-white">{row.courseCode}</p>
                    <p className="text-[10px] text-white/30">{row.courseName}</p>
                  </td>
                  <td className="px-6 py-4 font-mono text-sm text-brand">{row.co}</td>
                  <td className="px-6 py-4 font-mono text-sm text-alert">{row.pct}%</td>
                  <td className="px-6 py-4">
                    <span className={`text-[9px] font-mono uppercase px-2 py-0.5 border ${
                      row.level === 1 ? "border-alert/30 text-alert bg-alert/10" :
                      row.level === 2 ? "border-amber-400/30 text-amber-400 bg-amber-400/10" :
                      "border-attain/30 text-attain bg-attain/10"
                    }`}>Level {row.level}</span>
                  </td>
                  <td className="px-6 py-4">
                    {row.action ? (
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-attain shrink-0 mt-0.5" />
                        <p className="text-xs text-white/50 italic">{row.action}</p>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-[10px] font-mono text-alert/60 uppercase">
                        <AlertTriangle className="w-3.5 h-3.5" /> Not filed
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

      </motion.div>
    </AccessGate>
  );
}
