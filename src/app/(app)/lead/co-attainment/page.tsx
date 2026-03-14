"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  BarChart2, Filter, Download, AlertCircle, Edit3, Save, 
  CheckCircle2, XCircle, Search, Clock
} from "lucide-react";
import { fadeSlideUp, staggerContainer } from "@/lib/animations";

// ─── MOCK DATA ───────────────────────────────────────────────────────────
const COURSES = [
  { id: "cs301", name: "Database Engineering" },
  { id: "cs302", name: "Operating Systems" },
  { id: "cs305", name: "Computer Networks" },
];

const CO_DATA = [
  { id: 1, course: "cs301", co: "CO1", statement: "Design ER models", cie: 72, see: 68, final: 70, level: "L3", remedial: false },
  { id: 2, course: "cs301", co: "CO2", statement: "Apply normalization", cie: 55, see: 45, final: 49, level: "L2", remedial: false },
  { id: 3, course: "cs301", co: "CO3", statement: "Execute complex queries", cie: 38, see: 35, final: 36, level: "L1", remedial: true },
  { id: 4, course: "cs302", co: "CO1", statement: "Analyze process scheduling", cie: 65, see: 70, final: 68, level: "L3", remedial: false },
  { id: 5, course: "cs302", co: "CO2", statement: "Evaluate deadlock avoidance", cie: 42, see: 38, final: 40, level: "L2", remedial: false },
  { id: 6, course: "cs305", co: "CO1", statement: "Configure routing protocols", cie: 80, see: 75, final: 77, level: "L3", remedial: false },
];

export default function LeadCOAttainmentPage() {
  const [selectedCourse, setSelectedCourse] = useState("all");
  const [search, setSearch] = useState("");
  const [overrideTarget, setOverrideTarget] = useState<number | null>(null);
  const [overrideLevel, setOverrideLevel] = useState("L3");
  const [overrideReason, setOverrideReason] = useState("");

  const filteredData = CO_DATA.filter(d => 
    (selectedCourse === "all" || d.course === selectedCourse) &&
    (d.course.toLowerCase().includes(search.toLowerCase()) || d.statement.toLowerCase().includes(search.toLowerCase()))
  );

  const handleOverride = () => {
    // In a real app, this would dispatch an API call and log the override.
    setOverrideTarget(null);
    setOverrideReason("");
  };

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="max-w-7xl mx-auto pb-32">
      
      {/* ── HEADER ── */}
      <motion.div variants={fadeSlideUp} className="mb-12 flex justify-between items-end flex-wrap gap-6">
        <div>
          <h1 className="text-4xl font-display text-white mb-2">CO Attainment (All Courses)</h1>
          <p className="text-white/40 font-light italic">Aggregated Course Outcome visibility across assigned portfolio</p>
        </div>
        <div className="flex gap-4">
           <button className="px-6 py-2.5 bg-white/[0.03] border border-white/10 text-white/50 hover:text-white transition-colors text-[10px] font-mono uppercase tracking-widest flex items-center gap-2">
             <Download className="w-3.5 h-3.5" /> Export Portfolio Report
           </button>
        </div>
      </motion.div>

      {/* ── FILTERS ── */}
      <motion.div variants={fadeSlideUp} className="mb-8 flex gap-4 bg-white/[0.02] border border-white/5 p-4 rounded-lg">
         <div className="flex-1 max-w-sm relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
            <input 
              type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by course code or CO statement..."
              className="w-full bg-cosmic border border-white/10 pl-10 pr-4 py-2 text-sm text-white outline-none focus:border-white/30 transition-colors rounded"
            />
         </div>
         <select 
           value={selectedCourse} onChange={e => setSelectedCourse(e.target.value)}
           className="bg-cosmic border border-white/10 px-4 py-2 text-sm text-white outline-none focus:border-white/30 transition-colors rounded"
         >
           <option value="all">All Assigned Courses</option>
           {COURSES.map(c => <option key={c.id} value={c.id}>{c.id.toUpperCase()} - {c.name}</option>)}
         </select>
      </motion.div>

      {/* ── ATTAINMENT TABLE ── */}
      <motion.div variants={fadeSlideUp} className="border border-white/10 bg-white/[0.01] overflow-hidden rounded-xl">
         <table className="w-full text-left font-mono text-sm">
           <thead className="bg-white/[0.03] border-b border-white/10">
              <tr>
                 <th className="px-6 py-4 text-white/30 uppercase tracking-widest text-[10px] font-normal">Course / CO</th>
                 <th className="px-6 py-4 text-white/30 uppercase tracking-widest text-[10px] font-normal">CIE %</th>
                 <th className="px-6 py-4 text-white/30 uppercase tracking-widest text-[10px] font-normal">SEE %</th>
                 <th className="px-6 py-4 text-white/30 uppercase tracking-widest text-[10px] font-normal">Final Attainment</th>
                 <th className="px-6 py-4 text-white/30 uppercase tracking-widest text-[10px] font-normal">Level Status</th>
                 <th className="px-6 py-4 text-white/30 uppercase tracking-widest text-[10px] font-normal text-right">Actions</th>
              </tr>
           </thead>
           <tbody className="divide-y divide-white/5">
              {filteredData.length === 0 ? (
                <tr>
                   <td colSpan={6} className="py-24 text-center text-white/20 italic">No course data matches filters.</td>
                </tr>
              ) : (
                filteredData.map((row) => (
                  <tr key={row.id} className="hover:bg-white/[0.02] transition-colors group">
                     <td className="px-6 py-6 font-light text-white/60">
                        <div className="flex flex-col gap-1">
                           <span className="text-white font-medium uppercase">{row.course} <span className="text-brand">[{row.co}]</span></span>
                           <span className="text-xs italic whitespace-nowrap overflow-hidden text-ellipsis max-w-[250px]">{row.statement}</span>
                        </div>
                     </td>
                     <td className="px-6 py-6 text-white/40">{row.cie}%</td>
                     <td className="px-6 py-6 text-white/40">{row.see}%</td>
                     <td className="px-6 py-6 text-white font-bold">{row.final}%</td>
                     <td className="px-6 py-6">
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className={`px-2.5 py-1 text-[10px] uppercase font-bold tracking-widest border flex items-center gap-1.5
                            ${row.level === "L3" ? "border-attain/30 text-attain bg-attain/10" :
                              row.level === "L2" ? "border-amber-500/30 text-amber-500 bg-amber-500/10" :
                                "border-alert/30 text-alert bg-alert/10"}`}>
                             {row.level === "L1" && <AlertCircle className="w-3 h-3" />}
                             Level {row.level.replace('L','')}
                          </span>
                          {row.level === "L1" && (
                            <span className={`text-[10px] uppercase tracking-widest ${row.remedial ? 'text-attain border border-attain/20 px-2 py-0.5' : 'text-alert border border-alert/20 px-2 py-0.5'}`}>
                               {row.remedial ? 'Remedial Filed' : 'Pending Remedial'}
                            </span>
                          )}
                        </div>
                     </td>
                     <td className="px-6 py-6 text-right">
                        <button 
                          onClick={() => setOverrideTarget(row.id)}
                          className="opacity-0 group-hover:opacity-100 text-[9px] font-mono text-white/20 hover:text-brand uppercase tracking-widest transition-all flex items-center justify-end gap-1.5 ml-auto"
                        >
                           <Edit3 className="w-3 h-3" /> Override
                        </button>
                     </td>
                  </tr>
                ))
              )}
           </tbody>
         </table>
      </motion.div>

      {/* ── OVERRIDE MODAL ── */}
      <AnimatePresence>
         {overrideTarget !== null && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
               <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-cosmic border border-white/10 p-8 w-full max-w-lg shadow-2xl relative"
               >
                  <button onClick={() => setOverrideTarget(null)} className="absolute top-4 right-4 text-white/20 hover:text-white"><XCircle className="w-5 h-5" /></button>
                  <h3 className="text-xl font-display text-white mb-2">Override CO Attainment</h3>
                  <p className="text-sm font-light text-white/40 mb-6 italic">This action will strictly be logged in the system Audit Trail and notifies the HOD.</p>
                  
                  <div className="flex flex-col gap-6 font-mono text-sm">
                     <div className="flex flex-col gap-2">
                        <label className="text-[10px] text-white/30 uppercase tracking-widest">New Attainment Level</label>
                        <select value={overrideLevel} onChange={e => setOverrideLevel(e.target.value)} className="bg-white/5 border border-white/10 px-4 py-3 text-white outline-none focus:border-brand transition-colors">
                           <option value="L3" className="bg-cosmic text-attain">Level 3 (>=60%)</option>
                           <option value="L2" className="bg-cosmic text-amber-500">Level 2 (40-59%)</option>
                           <option value="L1" className="bg-cosmic text-alert">Level 1 (<40%)</option>
                        </select>
                     </div>
                     <div className="flex flex-col gap-2">
                        <label className="text-[10px] text-white/30 uppercase tracking-widest">Justification / Reason</label>
                        <textarea 
                           value={overrideReason} onChange={e => setOverrideReason(e.target.value)}
                           className="bg-white/5 border border-white/10 px-4 py-3 text-white outline-none focus:border-brand transition-colors h-32 resize-none"
                           placeholder="Provide a detailed academic justification for this manual override..."
                        />
                     </div>
                  </div>

                  <div className="mt-8 flex justify-end gap-4">
                     <button onClick={() => setOverrideTarget(null)} className="px-6 py-2 border border-white/10 text-white/40 hover:text-white text-[10px] font-mono uppercase tracking-widest transition-colors">Cancel</button>
                     <button 
                        onClick={handleOverride} disabled={!overrideReason.trim()}
                        className="px-6 py-2 bg-brand text-white text-[10px] font-mono uppercase tracking-widest hover:bg-brand/80 disabled:opacity-50 transition-colors flex items-center gap-2"
                     >
                        <Save className="w-3.5 h-3.5" /> Confirm Override
                     </button>
                  </div>
               </motion.div>
            </div>
         )}
      </AnimatePresence>

    </motion.div>
  );
}
