"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Settings2, Save, RotateCcw, Info } from "lucide-react";
import { fadeSlideUp, staggerContainer } from "@/lib/animations";
import { useDataStore } from "@/lib/dataStore";
import { useUIStore } from "@/lib/uiStore";
import { useAuthStore } from "@/lib/authStore";

export default function AdminThresholdsPage() {
  const { addToast }   = useUIStore();
  const { user }       = useAuthStore();
  const thresholds     = useDataStore(s => s.thresholds);
  const setThresholds  = useDataStore(s => s.setThresholds);
  const addAuditEntry  = useDataStore(s => s.addAuditEntry);

  // Local editable state seeded from store
  const [local, setLocal] = useState({ ...thresholds });

  const hasChanges =
    local.level3 !== thresholds.level3 ||
    local.level2 !== thresholds.level2 ||
    local.level1 !== thresholds.level1 ||
    local.targetPassPct !== thresholds.targetPassPct ||
    local.cieWeight !== thresholds.cieWeight ||
    local.seeWeight !== thresholds.seeWeight;

  const handleSave = () => {
    if (local.level2 >= local.level3) {
      addToast("Level 2 threshold must be less than Level 3.", "warning"); return;
    }
    if (local.cieWeight + local.seeWeight !== 100) {
      addToast("CIE + SEE weights must sum to 100%.", "warning"); return;
    }
    setThresholds(local);
    addAuditEntry({
      type: "system", userId: user?.id || "system", role: "admin",
      action: `Thresholds updated — Level3:${local.level3}%, Level2:${local.level2}%, PassPct:${local.targetPassPct}%, CIE:${local.cieWeight}%`,
      ip: "127.0.0.1"
    });
    addToast("Attainment thresholds saved. CO levels will recompute on next page load.", "success");
  };

  const handleReset = () => {
    setLocal({ level3: 60, level2: 40, level1: 0, targetPassPct: 50, cieWeight: 40, seeWeight: 60 });
    addToast("Thresholds reset to system defaults.", "info");
  };

  const field = (label: string, key: keyof typeof local, desc: string, min: number, max: number) => (
    <div className="border border-white/10 bg-white/[0.02] rounded-lg p-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-sm font-mono text-white uppercase tracking-widest">{label}</p>
          <p className="text-xs text-white/40 font-light mt-1">{desc}</p>
        </div>
        <span className="text-3xl font-display font-bold text-brand">{local[key]}%</span>
      </div>
      <input
        type="range" min={min} max={max} step={1}
        value={local[key]}
        onChange={e => setLocal(prev => ({ ...prev, [key]: Number(e.target.value) }))}
        className="w-full accent-brand cursor-pointer"
      />
      <div className="flex justify-between text-[9px] text-white/20 font-mono mt-1">
        <span>{min}%</span><span>{max}%</span>
      </div>
    </div>
  );

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="max-w-4xl mx-auto pb-32">
      <motion.div variants={fadeSlideUp} className="mb-12 flex justify-between items-end flex-wrap gap-6">
        <div>
          <h1 className="text-4xl font-display text-white mb-2 flex items-center gap-4">
            <Settings2 className="w-8 h-8 text-brand" /> Attainment Thresholds
          </h1>
          <p className="text-white/40 font-light italic">Changes take effect immediately across all CO, PO, and PSO calculations.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleReset}
            className="px-5 py-2.5 border border-white/10 text-white/50 hover:text-white hover:border-white/30 text-[10px] font-mono uppercase tracking-widest flex items-center gap-2 transition-colors rounded">
            <RotateCcw className="w-3.5 h-3.5" /> Reset Defaults
          </button>
          <button onClick={handleSave} disabled={!hasChanges}
            className="px-6 py-2.5 bg-brand text-white text-[10px] font-mono uppercase tracking-widest hover:bg-brand/90 transition-colors flex items-center gap-2 disabled:opacity-40 shadow-[0_0_15px_rgba(30,174,219,0.2)] rounded">
            <Save className="w-3.5 h-3.5" /> Save Changes
          </button>
        </div>
      </motion.div>

      {/* Info Banner */}
      <motion.div variants={fadeSlideUp} className="mb-8 flex items-start gap-3 p-4 bg-brand/5 border border-brand/20 rounded-lg">
        <Info className="w-4 h-4 text-brand shrink-0 mt-0.5" />
        <p className="text-xs text-white/60 font-light leading-relaxed">
          These thresholds govern how CO attainment percentages are classified into Levels 1, 2, and 3.
          The <strong className="text-white/80">Target Pass %</strong> determines what score a student needs on each question to count as "attaining" that CO.
          <strong className="text-white/80"> CIE + SEE weights must sum to 100%.</strong>
        </p>
      </motion.div>

      {/* Live Preview */}
      <motion.div variants={fadeSlideUp} className="mb-8 grid grid-cols-3 gap-4">
        {[
          { label: "Level 3 (Attained)", threshold: `≥ ${local.level3}%`, color: "border-attain/30 bg-attain/10 text-attain" },
          { label: "Level 2 (Partially Attained)", threshold: `${local.level2}% – ${local.level3 - 1}%`, color: "border-brand/30 bg-brand/10 text-brand" },
          { label: "Level 1 (Not Attained)", threshold: `< ${local.level2}%`, color: "border-alert/30 bg-alert/10 text-alert" },
        ].map(({ label, threshold, color }) => (
          <div key={label} className={`p-4 border rounded-lg ${color}`}>
            <p className="text-[9px] font-mono uppercase tracking-widest mb-1">{label}</p>
            <p className="text-xl font-display font-bold">{threshold}</p>
          </div>
        ))}
      </motion.div>

      {/* Sliders */}
      <motion.div variants={fadeSlideUp} className="grid grid-cols-1 gap-5">
        {field("Level 3 Threshold", "level3", "Students scoring ≥ this % on a CO question are counted as attaining that CO.", 50, 90)}
        {field("Level 2 Threshold", "level2", "Minimum score to be classified as Level 2 attainment (partial).", 20, 59)}
        {field("Target Pass %", "targetPassPct", "Minimum % of max marks a student must score on a question to 'attain' the mapped CO.", 30, 75)}
        {field("CIE Weightage", "cieWeight", "Weight of Continuous Internal Evaluation in final CO attainment score.", 20, 80)}
        {field("SEE Weightage", "seeWeight", "Weight of Semester End Examination in final CO attainment score.", 20, 80)}
      </motion.div>

      {local.cieWeight + local.seeWeight !== 100 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 p-3 bg-alert/10 border border-alert/20 text-alert text-xs font-mono rounded">
          ⚠ CIE ({local.cieWeight}%) + SEE ({local.seeWeight}%) = {local.cieWeight + local.seeWeight}% — must equal 100%.
        </motion.div>
      )}
    </motion.div>
  );
}
