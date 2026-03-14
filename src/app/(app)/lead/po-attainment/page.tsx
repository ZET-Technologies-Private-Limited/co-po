"use client";

import { motion } from "framer-motion";
import { 
  BarChart2, Target, Award, Download, DownloadCloud
} from "lucide-react";
import { fadeSlideUp, staggerContainer } from "@/lib/animations";

// ─── MOCK DATA (As per Spec) ──────────────────────────────────────────────
const PO_DATA = [
  { id: "PO1", name: "Engineering Knowledge", value: 85, target: 80, level: "L3" },
  { id: "PO2", name: "Problem Analysis", value: 72, target: 75, level: "L2" },
  { id: "PO3", name: "Design / Development", value: 68, target: 70, level: "L2" },
  { id: "PO4", name: "Conduct Investigations", value: 45, target: 60, level: "L1" },
  { id: "PO5", name: "Modern Tool Usage", value: 88, target: 80, level: "L3" },
  { id: "PO6", name: "The Engineer and Society", value: 65, target: 60, level: "L3" },
  { id: "PO7", name: "Environment and Sustainability", value: 55, target: 60, level: "L2" },
  { id: "PO8", name: "Ethics", value: 92, target: 85, level: "L3" },
  { id: "PO9", name: "Individual and Team Work", value: 81, target: 75, level: "L3" },
  { id: "PO10", name: "Communication", value: 79, target: 80, level: "L2" },
  { id: "PO11", name: "Project Management and Finance", value: 60, target: 60, level: "L2" },
  { id: "PO12", name: "Life-long Learning", value: 74, target: 75, level: "L2" },
];

const PSO_DATA = [
  { id: "PSO1", name: "Software Systems Design", value: 82, target: 80, level: "L3" },
  { id: "PSO2", name: "Network & Security Engineering", value: 64, target: 70, level: "L2" },
];

export default function LeadPOAttainmentPage() {
  
  const renderTable = (data: any[], type: string) => (
    <div className="border border-white/10 bg-white/[0.01] overflow-hidden rounded-xl">
       <table className="w-full text-left font-mono text-sm">
         <thead className="bg-white/[0.03] border-b border-white/10">
            <tr>
               <th className="px-6 py-4 text-white/30 uppercase tracking-widest text-[10px] font-normal w-24">{type}</th>
               <th className="px-6 py-4 text-white/30 uppercase tracking-widest text-[10px] font-normal">Statement / Descriptor</th>
               <th className="px-6 py-4 text-white/30 uppercase tracking-widest text-[10px] font-normal">Target %</th>
               <th className="px-6 py-4 text-white/30 uppercase tracking-widest text-[10px] font-normal">Actual %</th>
               <th className="px-6 py-4 text-white/30 uppercase tracking-widest text-[10px] font-normal">Pacing</th>
            </tr>
         </thead>
         <tbody className="divide-y divide-white/5">
            {data.map((row) => (
              <tr key={row.id} className="hover:bg-white/[0.02] transition-colors group">
                 <td className="px-6 py-6 font-bold text-white">{row.id}</td>
                 <td className="px-6 py-6 text-white/60 font-light italic max-w-sm truncate">{row.name}</td>
                 <td className="px-6 py-6 text-white/30">{row.target}%</td>
                 <td className="px-6 py-6 text-white font-medium flex items-center gap-3">
                    {row.value}%
                    <span className={`px-2 py-0.5 text-[9px] border uppercase tracking-widest
                        ${row.level === "L3" ? "border-attain/30 text-attain bg-attain/10" :
                          row.level === "L2" ? "border-amber-500/30 text-amber-500 bg-amber-500/10" :
                            "border-alert/30 text-alert bg-alert/10"}`}>
                       Level {row.level.replace('L','')}
                    </span>
                 </td>
                 <td className="px-6 py-6">
                    <div className="flex items-center gap-3 w-full">
                       <div className="flex-1 h-1.5 bg-white/5 overflow-hidden rounded-full">
                          <motion.div 
                             initial={{ width: 0 }} whileInView={{ width: `${Math.min(row.value, 100)}%` }} viewport={{ once: true }} transition={{ duration: 1, delay: 0.2 }}
                             className={`h-full ${row.value >= row.target ? 'bg-attain' : row.value >= row.target - 10 ? 'bg-amber-500' : 'bg-alert'}`}
                          />
                       </div>
                       <span className="text-[10px] text-white/20 whitespace-nowrap min-w-[60px]">
                          {row.value >= row.target ? "Target Met" : `${row.target - row.value}% Gap`}
                       </span>
                    </div>
                 </td>
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
          <h1 className="text-4xl font-display text-white mb-2">PO & PSO Attainment</h1>
          <p className="text-white/40 font-light italic">Program-level tracking derived from aggregated Course Outcomes</p>
        </div>
        <div className="flex gap-4">
           <button className="px-6 py-2.5 bg-brand text-white hover:bg-brand/90 transition-colors text-[10px] font-mono uppercase tracking-widest flex items-center gap-2 rounded">
             <DownloadCloud className="w-3.5 h-3.5" /> NBA/NAAC Export
           </button>
        </div>
      </motion.div>

      {/* ── PROGRAM OUTCOMES (POs) ── */}
      <motion.section variants={fadeSlideUp} className="mb-16">
        <div className="flex items-center gap-3 text-sm font-mono text-white/50 uppercase tracking-widest mb-6 border-b border-white/10 pb-4">
          <Target className="w-4 h-4 text-brand" /> Program Outcomes (PO1 - PO12)
        </div>
        
        {/* PO Bar Chart Preview */}
        <div className="h-64 mb-8 flex items-end gap-1 sm:gap-4 justify-between border-b border-white/10 pb-4 px-2">
           {PO_DATA.map((po, i) => (
              <div key={po.id} className="relative flex flex-col items-center justify-end h-full w-full group">
                 {/* Visual Target Line */}
                 <div className="absolute w-full border-t border-dashed border-white/20 z-0" style={{ bottom: `${po.target}%` }} />
                 
                 {/* Bar */}
                 <motion.div 
                    initial={{ height: 0 }} animate={{ height: `${po.value}%` }} transition={{ duration: 0.8, delay: i * 0.05 }}
                    className={`relative z-10 w-full max-w-[40px] rounded-t-sm opacity-80 group-hover:opacity-100 transition-opacity
                      ${po.value >= po.target ? 'bg-attain' : po.value >= po.target - 10 ? 'bg-amber-500' : 'bg-alert'}`}
                 />
                 
                 {/* Label */}
                 <span className="mt-4 text-[9px] font-mono text-white/40 uppercase tracking-widest -rotate-45 sm:rotate-0 origin-left">{po.id}</span>
                 
                 {/* Tooltip */}
                 <div className="absolute top-0 opacity-0 group-hover:opacity-100 transition-opacity pb-2 mb-[100%] pointer-events-none">
                    <div className="bg-cosmic/90 border border-white/10 px-3 py-1.5 text-[9px] font-mono text-white whitespace-nowrap shadow-xl">
                      Attained: {po.value}%<br/>Target: {po.target}%
                    </div>
                 </div>
              </div>
           ))}
        </div>

        {renderTable(PO_DATA, "PO")}
      </motion.section>

      {/* ── PROGRAM SPECIFIC OUTCOMES (PSOs) ── */}
      <motion.section variants={fadeSlideUp}>
        <div className="flex items-center gap-3 text-sm font-mono text-white/50 uppercase tracking-widest mb-6 border-b border-white/10 pb-4">
          <Award className="w-4 h-4 text-aurora" /> Program Specific Outcomes (PSOs)
        </div>
        {renderTable(PSO_DATA, "PSO")}
      </motion.section>

    </motion.div>
  );
}
