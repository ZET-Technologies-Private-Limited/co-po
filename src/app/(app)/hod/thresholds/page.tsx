"use client";

import { motion } from "framer-motion";
import { Settings2, Info } from "lucide-react";
import { fadeSlideUp, staggerContainer } from "@/lib/animations";
import { useDataStore } from "@/lib/dataStore";
import { AccessGate } from "@/components/auth/AccessGate";

export default function HODThresholdsViewPage() {
  const thresholds = useDataStore(s => s.thresholds);

  const rows = [
    { label: "Level 3 Threshold", value: `≥ ${thresholds.level3}%`, desc: "CO attainment classified as Level 3 (Attained)" },
    { label: "Level 2 Threshold", value: `${thresholds.level2}% – ${thresholds.level3 - 1}%`, desc: "CO attainment classified as Level 2 (Partially Attained)" },
    { label: "Level 1 Threshold", value: `< ${thresholds.level2}%`, desc: "CO attainment classified as Level 1 (Not Attained)" },
    { label: "Target Pass %", value: `${thresholds.targetPassPct}%`, desc: "Minimum score per question for a student to attain that CO" },
    { label: "CIE Weightage", value: `${thresholds.cieWeight}%`, desc: "Weight of Continuous Internal Evaluation in final CO score" },
    { label: "SEE Weightage", value: `${thresholds.seeWeight}%`, desc: "Weight of Semester End Examination in final CO score" },
  ];

  return (
    <AccessGate feature="threshold_config" deny="lock">
      <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="max-w-3xl mx-auto pb-32">

        <motion.div variants={fadeSlideUp} className="pb-8 border-b border-white/5">
          <div className="flex items-center gap-2 text-[10px] font-mono text-brand uppercase tracking-widest mb-3">
            <span className="w-8 h-[1px] bg-brand" /> System Configuration
          </div>
          <h1 className="text-4xl font-display text-white flex items-center gap-4">
            <Settings2 className="w-8 h-8 text-brand" /> Attainment Thresholds
          </h1>
          <p className="text-white/40 font-light mt-1">View-only. Contact Admin to modify thresholds.</p>
        </motion.div>

        <motion.div variants={fadeSlideUp} className="flex items-start gap-3 py-5 border-b border-white/5">
          <Info className="w-4 h-4 text-brand shrink-0 mt-0.5" />
          <p className="text-xs text-white/50 font-light leading-relaxed">
            These thresholds govern CO attainment level classification and are applied across all CO, PO, and PSO calculations department-wide.
            Only the System Administrator can modify these values.
          </p>
        </motion.div>

        {/* Level preview */}
        <motion.div variants={fadeSlideUp} className="grid grid-cols-3 gap-0 divide-x divide-white/5 border-b border-white/5 py-6">
          {[
            { label: "Level 3 — Attained",           threshold: `≥ ${thresholds.level3}%`,                              color: "text-attain",   border: "border-attain/20" },
            { label: "Level 2 — Partial",             threshold: `${thresholds.level2}% – ${thresholds.level3 - 1}%`,   color: "text-amber-400", border: "border-amber-400/20" },
            { label: "Level 1 — Not Attained",        threshold: `< ${thresholds.level2}%`,                             color: "text-alert",    border: "border-alert/20" },
          ].map(({ label, threshold, color, border }) => (
            <div key={label} className={`px-6 flex flex-col gap-1 border-l-2 ${border}`}>
              <p className={`text-[9px] font-mono uppercase tracking-widest ${color}`}>{label}</p>
              <p className={`text-2xl font-display font-bold ${color}`}>{threshold}</p>
            </div>
          ))}
        </motion.div>

        {/* Detail rows */}
        <motion.div variants={fadeSlideUp} className="flex flex-col divide-y divide-white/5">
          {rows.map(({ label, value, desc }) => (
            <div key={label} className="flex items-center justify-between py-5">
              <div>
                <p className="text-sm font-mono text-white uppercase tracking-widest">{label}</p>
                <p className="text-[10px] text-white/30 font-light mt-0.5">{desc}</p>
              </div>
              <span className="text-2xl font-display font-bold text-brand">{value}</span>
            </div>
          ))}
        </motion.div>

      </motion.div>
    </AccessGate>
  );
}
