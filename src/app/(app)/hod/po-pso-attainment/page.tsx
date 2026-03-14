"use client";

import { motion } from "framer-motion";
import { 
  Building2, Target, Award, DownloadCloud, Activity
} from "lucide-react";
import { fadeSlideUp, staggerContainer } from "@/lib/animations";

// ─── MOCK AGGREGATED DATA ───
const PO_MATRIX_DATA = [
  { po: "PO1", courses: { cs301: 85, cs302: 78, cs305: 82, cs201: 90 }, avg: 83.7, target: 80 },
  { po: "PO2", courses: { cs301: 72, cs302: 65, cs305: 75, cs201: 60 }, avg: 68.0, target: 75 },
  { po: "PO3", courses: { cs301: 68, cs302: 70, cs305: null, cs201: 65 }, avg: 67.6, target: 70 },
  { po: "PO4", courses: { cs301: null, cs302: 45, cs305: 50, cs201: null }, avg: 47.5, target: 60 },
  { po: "PO5", courses: { cs301: 88, cs302: null, cs305: 92, cs201: 80 }, avg: 86.6, target: 80 },
];

const PSO_MATRIX_DATA = [
  { pso: "PSO1", courses: { cs301: 82, cs302: 75, cs305: 80, cs201: 85 }, avg: 80.5, target: 80 },
  { pso: "PSO2", courses: { cs301: null, cs302: null, cs305: 90, cs201: null }, avg: 90.0, target: 70 },
];

const COURSE_KEYS = ["cs201", "cs301", "cs302", "cs305"];

export default function HODPOAttainmentPage() {
  
  const getCellColor = (val: number | null, target: number) => {
     if (val === null) return "text-white/10";
     if (val >= target) return "text-attain";
     if (val >= target - 10) return "text-amber-500";
     return "text-alert";
  };

  const renderMatrix = (data: any[], type: string) => (
    <div className="border border-white/10 bg-white/[0.01] overflow-hidden rounded-xl overflow-x-auto">
       <table className="w-full text-left font-mono text-sm min-w-[800px]">
         <thead className="bg-white/[0.03] border-b border-white/10">
            <tr>
               <th className="px-6 py-4 text-white/50 uppercase tracking-widest text-[10px] font-bold sticky left-0 bg-cosmic w-24 border-r border-white/10 z-10">{type} Code</th>
               <th className="px-6 py-4 text-white/30 uppercase tracking-widest text-[10px] font-normal w-24">Target %</th>
               <th className="px-6 py-4 text-brand uppercase tracking-widest text-[10px] font-bold border-r border-white/10">Dept Avg</th>
               {COURSE_KEYS.map(k => (
                 <th key={k} className="px-4 py-4 text-white/30 uppercase tracking-widest text-[10px] font-normal text-center">{k}</th>
               ))}
            </tr>
         </thead>
         <tbody className="divide-y divide-white/5">
            {data.map((row) => (
              <tr key={row.po || row.pso} className="hover:bg-white/[0.02] transition-colors group">
                 <td className="px-6 py-4 font-bold text-white sticky left-0 bg-cosmic border-r border-white/10 z-10 group-hover:bg-[#0f1115] transition-colors">{row.po || row.pso}</td>
                 <td className="px-6 py-4 text-white/40">{row.target}%</td>
                 <td className="px-6 py-4 font-bold border-r border-white/10 flex items-center gap-2">
                    <span className={getCellColor(row.avg, row.target)}>{row.avg.toFixed(1)}%</span>
                    {row.avg < row.target && <Activity className={`w-3 h-3 ${getCellColor(row.avg, row.target)}`} />}
                 </td>
                 {COURSE_KEYS.map(k => {
                    const val = row.courses[k];
                    return (
                       <td key={k} className={`px-4 py-4 text-center font-medium ${getCellColor(val, row.target)}`}>
                          {val === null ? "—" : `${val}%`}
                       </td>
                    );
                 })}
              </tr>
            ))}
         </tbody>
       </table>
    </div>
  );

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="max-w-7xl mx-auto pb-32">
      
      {/* ── HEADER ── */}
      <motion.div variants={fadeSlideUp} className="mb-12 flex justify-between items-end flex-wrap gap-6">
        <div>
          <h1 className="text-4xl font-display text-white mb-2">Dept PO/PSO Matrix</h1>
          <p className="text-white/40 font-light italic">Aggregation matrix mapping all department courses to Program Outcomes</p>
        </div>
        <div className="flex gap-4">
           <button className="px-6 py-2.5 bg-brand text-white hover:bg-brand/90 transition-colors text-[10px] font-mono uppercase tracking-widest flex items-center gap-2 rounded">
             <DownloadCloud className="w-3.5 h-3.5" /> Export NBA Format Matrix
           </button>
        </div>
      </motion.div>

      {/* ── PROGRAM OUTCOMES (POs) MATRIX ── */}
      <motion.section variants={fadeSlideUp} className="mb-16">
        <div className="flex items-center gap-3 text-sm font-mono text-white/50 uppercase tracking-widest mb-6 border-b border-white/10 pb-4">
          <Target className="w-4 h-4 text-brand" /> PO Contribution Matrix (PO1 - PO12)
        </div>
        
        {/* Visual Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
           <div className="bg-white/[0.02] border border-white/10 p-6 rounded-xl flex items-center justify-between">
              <div>
                 <p className="text-[10px] font-mono text-white/40 uppercase tracking-widest mb-1">POs Meeting Target</p>
                 <p className="text-3xl font-display text-attain">2 <span className="text-lg text-white/20">/ 5</span></p>
              </div>
           </div>
           <div className="bg-white/[0.02] border border-white/10 p-6 rounded-xl flex items-center justify-between">
              <div>
                 <p className="text-[10px] font-mono text-white/40 uppercase tracking-widest mb-1">Critical Gaps (< 10%)</p>
                 <p className="text-3xl font-display text-alert">1 <span className="text-lg text-white/20">PO4</span></p>
              </div>
           </div>
           <div className="bg-white/[0.02] border border-white/10 p-6 rounded-xl flex items-center justify-between">
              <div>
                 <p className="text-[10px] font-mono text-white/40 uppercase tracking-widest mb-1">Dept PO Average</p>
                 <p className="text-3xl font-display text-brand">70.6%</p>
              </div>
           </div>
        </div>

        {renderMatrix(PO_MATRIX_DATA, "PO")}
      </motion.section>

      {/* ── PROGRAM SPECIFIC OUTCOMES (PSOs) MATRIX ── */}
      <motion.section variants={fadeSlideUp}>
        <div className="flex items-center gap-3 text-sm font-mono text-white/50 uppercase tracking-widest mb-6 border-b border-white/10 pb-4">
          <Award className="w-4 h-4 text-aurora" /> PSO Contribution Matrix
        </div>
        {renderMatrix(PSO_MATRIX_DATA, "PSO")}
      </motion.section>

    </motion.div>
  );
}
