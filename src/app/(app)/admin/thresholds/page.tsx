"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Settings, Save, Info, AlertTriangle, 
  ChevronLeft, ArrowRight, Shield, CheckCircle2
} from "lucide-react";
import Link from "next/link";
import { fadeSlideUp, staggerContainer } from "@/lib/animations";

export default function AdminThresholdConfigPage() {
  const [thresholds, setThresholds] = useState({
    targetPass: 60,
    level3: 60,
    level2: 40,
    cieWeight: 40,
    seeWeight: 60,
    absentPolicy: "include",
    minCOs: 4,
    maxCOs: 6
  });

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }, 1000);
  };

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="max-w-4xl mx-auto pb-32">
      
      {/* ── HEADER ── */}
      <motion.div variants={fadeSlideUp} className="mb-12">
        <Link href="/dashboard" className="flex items-center gap-2 text-white/40 hover:text-white transition-colors text-xs font-mono uppercase tracking-widest mb-8">
          <ChevronLeft className="w-4 h-4" /> Back to Hub
        </Link>
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-display text-white mb-2">Threshold Configuration</h1>
            <p className="text-white/40 font-light italic">University-wide OBE Regulation Settings</p>
          </div>
          <button 
            onClick={handleSave}
            disabled={saving}
            className="px-8 py-3 bg-alert text-white font-mono text-[10px] uppercase tracking-widest hover:bg-alert/90 transition-all flex items-center gap-3"
          >
            {saving ? "Saving..." : saved ? <><CheckCircle2 className="w-4 h-4" /> System Locked</> : <><Save className="w-4 h-4" /> Save Architecture</>}
          </button>
        </div>
      </motion.div>

      <div className="flex flex-col gap-8">
        
        {/* ── ATTAINMENT TRIGGERS (Spec: Admin Page 4) ── */}
        <motion.section variants={fadeSlideUp} className="p-8 border border-white/10 bg-white/[0.02]">
           <h3 className="text-sm font-mono text-alert uppercase tracking-widest mb-8 flex items-center gap-2">
             <Shield className="w-4 h-4" /> Attainment Triggers
           </h3>
           <div className="grid md:grid-cols-2 gap-12">
              <div className="flex flex-col gap-6">
                 <div>
                   <label className="text-[10px] font-mono text-white/30 uppercase tracking-widest block mb-3">Target Pass % per CO</label>
                   <div className="flex items-center gap-4">
                      <input 
                        type="range" min="0" max="100" value={thresholds.targetPass}
                        onChange={e => setThresholds({...thresholds, targetPass: parseInt(e.target.value)})}
                        className="flex-1 accent-alert"
                      />
                      <span className="text-xl font-mono text-white w-12">{thresholds.targetPass}%</span>
                   </div>
                   <p className="text-[9px] text-white/20 mt-3 font-mono">Students must score ≥ this % of CO max marks to attain.</p>
                 </div>
                 
                 <div className="grid grid-cols-2 gap-8">
                    <div>
                      <label className="text-[10px] font-mono text-white/30 uppercase tracking-widest block mb-2">Level 3 (High)</label>
                      <input 
                        type="number" value={thresholds.level3}
                        onChange={e => setThresholds({...thresholds, level3: parseInt(e.target.value)})}
                        className="bg-cosmic border border-white/10 p-3 text-white text-sm w-full outline-none focus:border-attain"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-mono text-white/30 uppercase tracking-widest block mb-2">Level 2 (Med)</label>
                      <input 
                        type="number" value={thresholds.level2}
                        onChange={e => setThresholds({...thresholds, level2: parseInt(e.target.value)})}
                        className="bg-cosmic border border-white/10 p-3 text-white text-sm w-full outline-none focus:border-amber-500"
                      />
                    </div>
                 </div>
              </div>

              <div className="p-6 bg-alert/5 border border-alert/10 flex flex-col gap-4">
                 <div className="flex items-start gap-3">
                    <Info className="w-4 h-4 text-alert mt-0.5" />
                    <p className="text-[10px] text-white/50 leading-relaxed font-mono">
                      Level 1 is automatically flagged if attainment falls below <span className="text-alert">{thresholds.level2}%</span>. 
                      Remedial action becomes mandatory for faculty at this stage.
                    </p>
                 </div>
                 <div className="border-t border-white/5 pt-4">
                    <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest mb-3">Absent Student Policy</p>
                    <div className="flex gap-4">
                       {['include', 'exclude'].map(policy => (
                         <button 
                           key={policy}
                           onClick={() => setThresholds({...thresholds, absentPolicy: policy})}
                           className={`px-4 py-2 text-[9px] font-mono uppercase tracking-widest border transition-all ${
                             thresholds.absentPolicy === policy ? 'border-alert bg-alert/10 text-white' : 'border-white/10 text-white/20'
                           }`}
                         >
                           {policy}
                         </button>
                       ))}
                    </div>
                 </div>
              </div>
           </div>
        </motion.section>

        {/* ── ASSESSMENT WEIGHTAGE (Spec: Admin Page 4 CIE:SEE) ── */}
        <motion.section variants={fadeSlideUp} className="p-8 border border-white/10 bg-white/[0.02]">
           <h3 className="text-sm font-mono text-white/30 uppercase tracking-widest mb-8">Assessment Weightage (CIE:SEE)</h3>
           <div className="flex items-center gap-12">
              <div className="flex-1 h-3 bg-white/5 rounded-full overflow-hidden flex">
                 <div className="bg-brand transition-all" style={{ width: `${thresholds.cieWeight}%` }} />
                 <div className="bg-aurora transition-all flex-1" />
              </div>
              <div className="flex gap-8">
                 <div className="flex flex-col items-end">
                    <span className="text-[9px] font-mono text-white/20 uppercase">CIE %</span>
                    <input 
                      type="number" value={thresholds.cieWeight}
                      onChange={e => {
                        const val = Math.min(100, Math.max(0, parseInt(e.target.value) || 0));
                        setThresholds({...thresholds, cieWeight: val, seeWeight: 100 - val});
                      }}
                      className="bg-transparent text-2xl font-mono text-brand w-12 text-right outline-none"
                    />
                 </div>
                 <div className="flex flex-col items-end">
                    <span className="text-[9px] font-mono text-white/20 uppercase">SEE %</span>
                    <span className="text-2xl font-mono text-aurora">{thresholds.seeWeight}</span>
                 </div>
              </div>
           </div>
        </motion.section>

        {/* ── CO GENERATION CONSTRAINTS ── */}
        <motion.section variants={fadeSlideUp} className="grid md:grid-cols-2 gap-4">
           <div className="p-8 border border-white/10 bg-white/[0.02]">
              <label className="text-[10px] font-mono text-white/30 uppercase tracking-widest block mb-4">Min COs per Course</label>
              <div className="flex gap-2">
                 {[3,4,5,6].map(v => (
                   <button 
                     key={v} onClick={() => setThresholds({...thresholds, minCOs: v})}
                     className={`w-10 h-10 border font-mono text-xs ${thresholds.minCOs === v ? 'border-alert bg-alert/10 text-white' : 'border-white/5 text-white/20'}`}
                   >
                     {v}
                   </button>
                 ))}
              </div>
           </div>
           <div className="p-8 border border-white/10 bg-white/[0.02]">
              <label className="text-[10px] font-mono text-white/30 uppercase tracking-widest block mb-4">Max COs per Course</label>
              <div className="flex gap-2">
                 {[4,5,6,7,8].map(v => (
                   <button 
                     key={v} onClick={() => setThresholds({...thresholds, maxCOs: v})}
                     className={`w-10 h-10 border font-mono text-xs ${thresholds.maxCOs === v ? 'border-alert bg-alert/10 text-white' : 'border-white/5 text-white/20'}`}
                   >
                     {v}
                   </button>
                 ))}
              </div>
           </div>
        </motion.section>

      </div>
    </motion.div>
  );
}
