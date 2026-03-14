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
      <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="pb-32">
 
        <motion.div variants={fadeSlideUp} className="flex flex-col gap-6 pb-12 border-b border-white/5">
          <div className="flex items-center gap-3 text-[10px] font-mono text-orange-400 uppercase tracking-widest">
            <span className="w-8 h-[1px] bg-orange-400" /> Administrative Policy
          </div>
          <h1 className="text-5xl font-display text-white tracking-tight">
            Attainment <span className="text-white/20">Thresholds</span>
          </h1>
          <p className="text-lg font-light text-white/40 italic">
             Operational benchmarks for CO, PO, and PSO health classification.
          </p>
        </motion.div>
 
        {/* Level preview (FLATTENED) */}
        <motion.div variants={fadeSlideUp} className="grid grid-cols-3 gap-16 py-16 border-b border-white/5">
          {[
            { label: "Level 3 · Attained",           threshold: `≥ ${thresholds.level3}%`,                              color: "text-attain" },
            { label: "Level 2 · Partial",             threshold: `${thresholds.level2}% – ${thresholds.level3 - 1}%`,   color: "text-amber-400" },
            { label: "Level 1 · Critical",        threshold: `< ${thresholds.level2}%`,                             color: "text-alert" },
          ].map(({ label, threshold, color }) => (
            <div key={label} className="space-y-4">
              <p className={`text-[9px] font-mono uppercase tracking-[0.3em] ${color}`}>{label}</p>
              <p className={`text-4xl font-display ${color}`}>{threshold}</p>
              <div className={`h-0.5 w-full bg-white/5 relative overflow-hidden`}>
                <div className={`absolute inset-y-0 left-0 w-1/3 ${color.replace("text", "bg")}`} />
              </div>
            </div>
          ))}
        </motion.div>
 
        {/* Detail rows (FLATTENED) */}
        <motion.section variants={fadeSlideUp} className="mt-16 space-y-12">
          <h3 className="text-xl font-display text-white uppercase tracking-widest flex items-center gap-4">
             <Settings2 className="w-5 h-5 text-orange-400" /> Operational weights
          </h3>
          <div className="flex flex-col">
            {rows.map(({ label, value, desc }) => (
              <div key={label} className="flex items-baseline justify-between py-10 border-b border-white/[0.02] last:border-0 group">
                <div className="space-y-2">
                  <p className="text-xs font-mono text-white/60 uppercase tracking-widest group-hover:text-white transition-colors">{label}</p>
                  <p className="text-[11px] text-white/20 font-light italic max-w-md">{desc}</p>
                </div>
                <span className="text-4xl font-display text-white tracking-widest">{value}</span>
              </div>
            ))}
          </div>
          
          <div className="flex items-center gap-4 py-8 text-[10px] font-mono text-white/20 uppercase tracking-[0.2em] italic">
            <Info className="w-4 h-4" /> Locked Registry · Only Admin can modify system policies
          </div>
        </motion.section>
 
      </motion.div>
    </AccessGate>
  );
}
