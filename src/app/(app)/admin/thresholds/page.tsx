"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Settings2, Save, RotateCcw, Info } from "lucide-react";
import { fadeSlideUp, staggerContainer } from "@/lib/animations";
import { useDataStore } from "@/lib/dataStore";
import { useUIStore } from "@/lib/uiStore";
import { useAuthStore } from "@/lib/authStore";
import { AccessGate } from "@/components/auth/AccessGate";

export default function AdminThresholdsPage() {
  const { addToast }  = useUIStore();
  const { user }      = useAuthStore();
  const thresholds    = useDataStore(s => s.thresholds);
  const setThresholds = useDataStore(s => s.setThresholds);
  const addAuditEntry = useDataStore(s => s.addAuditEntry);

  const [local, setLocal] = useState({ ...thresholds });

  const hasChanges = JSON.stringify(local) !== JSON.stringify(thresholds);

  const handleSave = () => {
    if (local.level2 >= local.level3) { addToast("Level 2 threshold must be less than Level 3.", "warning"); return; }
    if (local.cieWeight + local.seeWeight !== 100) { addToast("CIE + SEE weights must sum to 100%.", "warning"); return; }
    if (local.minCOs >= local.maxCOs) { addToast("Min COs must be less than Max COs.", "warning"); return; }
    setThresholds(local);
    addAuditEntry({ type: "system", userId: user?.id || "system", role: "admin",
      action: `Thresholds updated — L3:${local.level3}%, L2:${local.level2}%, PassPct:${local.targetPassPct}%, CIE:${local.cieWeight}%, Absent:${local.absentPolicy}, MinCO:${local.minCOs}, MaxCO:${local.maxCOs}`,
      ip: "127.0.0.1" });
    addToast("Thresholds saved. CO levels will recompute on next page load.", "success");
  };

  const handleReset = () => {
    setLocal({ level3: 60, level2: 40, level1: 0, targetPassPct: 50, cieWeight: 40, seeWeight: 60, absentPolicy: "include", minCOs: 4, maxCOs: 6 });
    addToast("Reset to system defaults.", "info");
  };

  const slider = (label: string, key: keyof typeof local, desc: string, min: number, max: number) => (
    <div key={key} className="py-6 border-b border-white/5">
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-sm font-mono text-white uppercase tracking-widest">{label}</p>
          <p className="text-xs text-white/30 font-light mt-0.5">{desc}</p>
        </div>
        <span className="text-3xl font-display font-bold text-brand">{local[key]}{typeof local[key] === "number" && key !== "minCOs" && key !== "maxCOs" ? "%" : ""}</span>
      </div>
      <input type="range" min={min} max={max} step={1} value={local[key] as number}
        onChange={e => setLocal(prev => ({ ...prev, [key]: Number(e.target.value) }))}
        className="w-full accent-brand cursor-pointer" />
      <div className="flex justify-between text-[9px] text-white/20 font-mono mt-1">
        <span>{min}{key !== "minCOs" && key !== "maxCOs" ? "%" : ""}</span>
        <span>{max}{key !== "minCOs" && key !== "maxCOs" ? "%" : ""}</span>
      </div>
    </div>
  );

  return (
    <AccessGate feature="threshold_config" deny="lock">
      <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="max-w-4xl mx-auto pb-32">

        {/* Header */}
        <motion.div variants={fadeSlideUp} className="flex justify-between items-end pb-8 border-b border-white/5">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-mono text-brand uppercase tracking-widest mb-3">
              <span className="w-8 h-[1px] bg-brand" /> System Configuration
            </div>
            <h1 className="text-4xl font-display text-white flex items-center gap-4">
              <Settings2 className="w-8 h-8 text-brand" /> Attainment Thresholds
            </h1>
            <p className="text-white/40 font-light mt-1">Changes take effect immediately across all CO, PO, and PSO calculations.</p>
          </div>
          <div className="flex gap-3">
            <button onClick={handleReset}
              className="px-5 py-2.5 border border-white/10 text-white/40 hover:text-white hover:border-white/30 text-[10px] font-mono uppercase tracking-widest flex items-center gap-2 transition-colors">
              <RotateCcw className="w-3.5 h-3.5" /> Reset Defaults
            </button>
            <button onClick={handleSave} disabled={!hasChanges}
              className="px-5 py-2.5 bg-brand text-white text-[10px] font-mono uppercase tracking-widest hover:bg-brand/90 transition-colors flex items-center gap-2 disabled:opacity-40">
              <Save className="w-3.5 h-3.5" /> Save Changes
            </button>
          </div>
        </motion.div>

        {/* Info */}
        <motion.div variants={fadeSlideUp} className="flex items-start gap-3 py-5 border-b border-white/5">
          <Info className="w-4 h-4 text-brand shrink-0 mt-0.5" />
          <p className="text-xs text-white/50 font-light leading-relaxed">
            These thresholds govern CO attainment level classification. <strong className="text-white/80">CIE + SEE must sum to 100%.</strong> Changes apply university-wide.
          </p>
        </motion.div>

        {/* Level preview */}
        <motion.div variants={fadeSlideUp} className="grid grid-cols-3 gap-0 divide-x divide-white/5 border-b border-white/5 py-6">
          {[
            { label: "Level 3 — Attained",     threshold: `≥ ${local.level3}%`,                            color: "text-attain",    border: "border-l-2 border-attain/30" },
            { label: "Level 2 — Partial",       threshold: `${local.level2}% – ${local.level3 - 1}%`,      color: "text-amber-400", border: "border-l-2 border-amber-400/30" },
            { label: "Level 1 — Not Attained",  threshold: `< ${local.level2}%`,                           color: "text-alert",     border: "border-l-2 border-alert/30" },
          ].map(({ label, threshold, color, border }) => (
            <div key={label} className={`px-6 flex flex-col gap-1 ${border}`}>
              <p className={`text-[9px] font-mono uppercase tracking-widest ${color}`}>{label}</p>
              <p className={`text-2xl font-display font-bold ${color}`}>{threshold}</p>
            </div>
          ))}
        </motion.div>

        {/* Sliders */}
        <motion.div variants={fadeSlideUp} className="flex flex-col">
          {slider("Level 3 Threshold",  "level3",       "Students scoring ≥ this % on a CO question count as attaining that CO.", 50, 90)}
          {slider("Level 2 Threshold",  "level2",       "Minimum score to be classified as Level 2 attainment (partial).", 20, 59)}
          {slider("Target Pass %",      "targetPassPct","Minimum % of max marks a student must score per question to attain the mapped CO.", 30, 75)}
          {slider("CIE Weightage",      "cieWeight",    "Weight of Continuous Internal Evaluation in final CO attainment score.", 20, 80)}
          {slider("SEE Weightage",      "seeWeight",    "Weight of Semester End Examination in final CO attainment score.", 20, 80)}
          {slider("Min COs per Course", "minCOs",       "Minimum number of COs required per course. System warns if fewer.", 2, 4)}
          {slider("Max COs per Course", "maxCOs",       "Maximum COs the system will generate per course.", 5, 8)}
        </motion.div>

        {/* Absent student policy */}
        <motion.div variants={fadeSlideUp} className="py-6 border-b border-white/5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-mono text-white uppercase tracking-widest">Absent Student Policy</p>
              <p className="text-xs text-white/30 font-light mt-0.5">Whether absent students count in the denominator for CO attainment calculation.</p>
            </div>
            <div className="flex border border-white/10">
              {(["include", "exclude"] as const).map(opt => (
                <button key={opt} onClick={() => setLocal(p => ({ ...p, absentPolicy: opt }))}
                  className={`px-5 py-2.5 text-[10px] font-mono uppercase tracking-widest transition-colors ${
                    local.absentPolicy === opt ? "bg-brand text-white" : "text-white/30 hover:text-white"
                  }`}>
                  {opt}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Validation warning */}
        {local.cieWeight + local.seeWeight !== 100 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="mt-4 p-3 bg-alert/10 border border-alert/20 text-alert text-xs font-mono">
            ⚠ CIE ({local.cieWeight}%) + SEE ({local.seeWeight}%) = {local.cieWeight + local.seeWeight}% — must equal 100%.
          </motion.div>
        )}

      </motion.div>
    </AccessGate>
  );
}
