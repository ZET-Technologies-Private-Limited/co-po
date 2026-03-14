"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, TrendingDown } from "lucide-react";
import Link from "next/link";
import { useDataStore } from "@/lib/dataStore";
import { useAuthStore } from "@/lib/authStore";
import { computeCOAttainmentFromMarks, getAttainmentLevel } from "@/lib/computations";
import { AccessGate } from "@/components/auth/AccessGate";
import { staggerContainer, fadeSlideUp } from "@/lib/animations";

export default function LowCOAlertsPage() {
  const { activeRole } = useAuthStore();
  const courses        = useDataStore(s => s.courses);
  const submissions    = useDataStore(s => s.submissions);
  const examConfigs    = useDataStore(s => s.examConfigs);
  const remedialActions = useDataStore(s => s.remedialActions);
  const thresholds     = useDataStore(s => s.thresholds);

  const isReadOnly = activeRole === "faculty";

  const alerts = useMemo(() => {
    const result: Array<{
      courseId: string; courseCode: string; courseName: string;
      co: string; pct: number; level: number;
      hasRemedial: boolean; remedialText: string;
    }> = [];

    courses.forEach(c => {
      const subs    = (submissions[c.id] || []).filter(s => s.status === "approved");
      const exams   = examConfigs[c.id] || [];
      const allMarks = subs.flatMap(s => s.students);
      const allQs   = exams.flatMap(e => e.questions);
      if (!allMarks.length || !allQs.length) return;

      const att = computeCOAttainmentFromMarks(allMarks, allQs, thresholds.targetPassPct);
      Object.entries(att).forEach(([co, d]) => {
        const lvl = getAttainmentLevel(d.pct, thresholds);
        if (lvl.level === 1) {
          const remedialText = remedialActions[c.id]?.[co] || "";
          result.push({
            courseId: c.id, courseCode: c.code, courseName: c.name,
            co, pct: d.pct, level: lvl.level,
            hasRemedial: !!remedialText, remedialText,
          });
        }
      });
    });
    return result;
  }, [courses, submissions, examConfigs, thresholds, remedialActions]);

  return (
    <AccessGate feature="low_co_alerts" deny="lock">
      <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="max-w-5xl mx-auto pb-32">

        {/* Header */}
        <motion.div variants={fadeSlideUp} className="pb-8 border-b border-white/5">
          <div className="flex items-center gap-2 text-[10px] font-mono text-alert uppercase tracking-widest mb-3">
            <span className="w-8 h-[1px] bg-alert" /> Performance Alerts
          </div>
          <div className="flex justify-between items-end">
            <div>
              <h1 className="text-4xl font-display text-white flex items-center gap-4">
                <AlertTriangle className="w-8 h-8 text-alert" /> Low CO Alerts
              </h1>
              <p className="text-white/40 font-light mt-1">
                {alerts.length} Level 1 CO{alerts.length !== 1 ? "s" : ""} below {thresholds.level2}% attainment threshold.
                {isReadOnly && " View-only — contact your Course Lead for remedial actions."}
              </p>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-mono">
              <span className="text-white/20 uppercase tracking-widest">Threshold:</span>
              <span className="text-alert font-bold">&lt; {thresholds.level2}%</span>
            </div>
          </div>
        </motion.div>

        {alerts.length === 0 ? (
          <motion.div variants={fadeSlideUp} className="py-24 flex flex-col items-center gap-4 text-white/20">
            <CheckCircle2 className="w-12 h-12 text-attain/30" />
            <p className="text-sm font-mono uppercase tracking-widest">No Level 1 alerts — all COs above threshold</p>
          </motion.div>
        ) : (
          <motion.div variants={fadeSlideUp} className="flex flex-col divide-y divide-white/5">
            {alerts.map((alert, i) => (
              <div key={i} className="py-6 flex items-start gap-6">
                <div className="shrink-0 mt-1">
                  <TrendingDown className="w-5 h-5 text-alert" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="text-alert font-mono text-sm font-bold">{alert.co}</span>
                        <span className="text-[9px] font-mono border border-alert/30 text-alert px-2 py-0.5 uppercase">Level 1</span>
                        <span className="text-[9px] font-mono text-white/30 uppercase">{alert.courseCode}</span>
                      </div>
                      <p className="text-white/60 text-sm mt-0.5">{alert.courseName}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-2xl font-display text-alert">{alert.pct}%</p>
                      <p className="text-[9px] font-mono text-white/20 uppercase">Attainment</p>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="h-0.5 bg-white/5 mb-3">
                    <div className="h-full bg-alert/60" style={{ width: `${alert.pct}%` }} />
                  </div>

                  {/* Remedial action status */}
                  {alert.hasRemedial ? (
                    <div className="flex items-start gap-2 text-xs text-attain/70">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <p className="italic">{alert.remedialText}</p>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-mono text-alert/60 uppercase tracking-widest">No remedial action filed</span>
                      {!isReadOnly && (
                        <Link href={`/faculty/course/${alert.courseId}/co-attainment`}
                          className="text-[10px] font-mono text-brand uppercase tracking-widest hover:text-white transition-colors">
                          → File Action
                        </Link>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </motion.div>
        )}

      </motion.div>
    </AccessGate>
  );
}
