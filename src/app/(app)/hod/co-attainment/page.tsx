"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Building2, Filter, Download, AlertCircle, Edit3, Save, 
  Search, Flag, History, ChevronDown
} from "lucide-react";
import { fadeSlideUp, staggerContainer } from "@/lib/animations";

// ─── MOCK DATA ───
const COURSES = [
  { id: "cs301", name: "Database Engineering", sem: "S5", lead: "Dr. Smith" },
  { id: "cs302", name: "Operating Systems", sem: "S5", lead: "Prof. Johnson" },
  { id: "cs305", name: "Computer Networks", sem: "S5", lead: "Dr. Allen" },
  { id: "cs201", name: "Data Structures", sem: "S3", lead: "Dr. Smith" },
];

const CO_DATA = [
  { id: 1, course: "cs301", co: "CO1", final: 70, level: "L3", remedial: false, flagged: false },
  { id: 2, course: "cs301", co: "CO2", final: 49, level: "L2", remedial: false, flagged: true },
  { id: 3, course: "cs301", co: "CO3", final: 36, level: "L1", remedial: true, flagged: false },
  { id: 4, course: "cs302", co: "CO1", final: 68, level: "L3", remedial: false, flagged: false },
  { id: 5, course: "cs302", co: "CO2", final: 40, level: "L2", remedial: false, flagged: false },
  { id: 6, course: "cs305", co: "CO1", final: 77, level: "L3", remedial: false, flagged: false },
  { id: 7, course: "cs201", co: "CO1", final: 85, level: "L3", remedial: false, flagged: false },
  { id: 8, course: "cs201", co: "CO2", final: 39, level: "L1", remedial: false, flagged: true },
];

const OVERRIDE_LOG = [
  { id: 1, course: "cs301", co: "CO2", orig: "L1", newLevel: "L2", user: "Dr. Smith (Lead)", reason: "Question paper anomaly in T2 affecting specific cohort.", date: "2024-11-15 10:30" }
];

export default function HODCOAttainmentPage() {
  const [selectedSem, setSelectedSem] = useState("all");
  const [search, setSearch] = useState("");
  const [showLog, setShowLog] = useState(false);

  const filteredData = CO_DATA.filter(d => {
    const semMatch = selectedSem === "all" || COURSES.find(c => c.id === d.course)?.sem === selectedSem;
    const searchMatch = d.course.toLowerCase().includes(search.toLowerCase());
    return semMatch && searchMatch;
  });

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="max-w-7xl mx-auto pb-32">
      
      {/* ── HEADER ── */}
      <motion.div variants={fadeSlideUp} className="mb-12 flex justify-between items-end flex-wrap gap-6">
        <div>
          <h1 className="text-4xl font-display text-white mb-2">Department CO Attainment</h1>
          <p className="text-white/40 font-light italic">Consolidated view of all courses across the department</p>
        </div>
        <div className="flex gap-4">
           <button onClick={() => setShowLog(!showLog)} className={`px-6 py-2.5 transition-colors text-[10px] font-mono uppercase tracking-widest flex items-center gap-2 border ${showLog ? 'bg-white/10 text-white border-white/20' : 'bg-transparent text-white/50 border-white/10 hover:text-white'}`}>
             <History className="w-3.5 h-3.5" /> Override Log
           </button>
           <button className="px-6 py-2.5 bg-brand text-white hover:bg-brand/90 transition-colors text-[10px] font-mono uppercase tracking-widest flex items-center gap-2 rounded">
             <Download className="w-3.5 h-3.5" /> Export Department Report
           </button>
        </div>
      </motion.div>

      {/* ── OVERRIDE LOG PANEL (Toggleable) ── */}
      <AnimatePresence>
        {showLog && (
           <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-8 overflow-hidden">
              <div className="bg-white/[0.02] border border-white/10 p-6 rounded-xl">
                 <h3 className="text-xs font-mono text-white/50 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <History className="w-4 h-4 text-brand" /> Attainment Override History
                 </h3>
                 <table className="w-full text-left font-mono text-xs">
                    <thead className="text-white/30 border-b border-white/5">
                       <tr>
                          <th className="py-2">Course / CO</th>
                          <th className="py-2">Original</th>
                          <th className="py-2">Revised</th>
                          <th className="py-2">User</th>
                          <th className="py-2">Justification</th>
                          <th className="py-2 text-right">Timestamp</th>
                       </tr>
                    </thead>
                    <tbody className="text-white/70 divide-y divide-white/5">
                       {OVERRIDE_LOG.map(log => (
                          <tr key={log.id} className="hover:bg-white/[0.01]">
                             <td className="py-4 text-brand font-medium uppercase">{log.course} <span className="text-white/40">{log.co}</span></td>
                             <td className="py-4"><span className="text-alert">{log.orig}</span></td>
                             <td className="py-4"><span className="text-amber-500 font-bold">{log.newLevel}</span></td>
                             <td className="py-4">{log.user}</td>
                             <td className="py-4 italic text-white/50">{log.reason}</td>
                             <td className="py-4 text-right text-white/30">{log.date}</td>
                          </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
           </motion.div>
        )}
      </AnimatePresence>

      {/* ── FILTERS ── */}
      <motion.div variants={fadeSlideUp} className="mb-8 flex gap-4 bg-white/[0.02] border border-white/5 p-4 rounded-lg">
         <div className="flex-1 max-w-sm relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
            <input 
              type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by course code..."
              className="w-full bg-cosmic border border-white/10 pl-10 pr-4 py-2 text-sm text-white outline-none focus:border-white/30 transition-colors rounded"
            />
         </div>
         <select 
           value={selectedSem} onChange={e => setSelectedSem(e.target.value)}
           className="bg-cosmic border border-white/10 px-4 py-2 text-sm text-white outline-none focus:border-white/30 transition-colors rounded"
         >
           <option value="all">All Semesters</option>
           <option value="S3">Semester 3</option>
           <option value="S5">Semester 5</option>
           <option value="S7">Semester 7</option>
         </select>
      </motion.div>

      {/* ── CONSOLIDATED ATTAINMENT TABLE ── */}
      <motion.div variants={fadeSlideUp} className="border border-white/10 bg-white/[0.01] overflow-hidden rounded-xl">
         <table className="w-full text-left font-mono text-sm">
           <thead className="bg-white/[0.03] border-b border-white/10">
              <tr>
                 <th className="px-6 py-4 text-white/30 uppercase tracking-widest text-[10px] font-normal">Course Details</th>
                 <th className="px-6 py-4 text-white/30 uppercase tracking-widest text-[10px] font-normal">CO Number</th>
                 <th className="px-6 py-4 text-white/30 uppercase tracking-widest text-[10px] font-normal">Final Attainment</th>
                 <th className="px-6 py-4 text-white/30 uppercase tracking-widest text-[10px] font-normal">Level Status</th>
                 <th className="px-6 py-4 text-white/30 uppercase tracking-widest text-[10px] font-normal">Remedial</th>
                 <th className="px-6 py-4 text-white/30 uppercase tracking-widest text-[10px] font-normal text-right">HOD Action</th>
              </tr>
           </thead>
           <tbody className="divide-y divide-white/5">
              {filteredData.length === 0 ? (
                <tr>
                   <td colSpan={6} className="py-24 text-center text-white/20 italic">No course data matches filters.</td>
                </tr>
              ) : (
                filteredData.map((row) => {
                  const courseInfo = COURSES.find(c => c.id === row.course);
                  return (
                    <tr key={row.id} className={`hover:bg-white/[0.02] transition-colors group ${row.flagged ? 'bg-alert/5' : ''}`}>
                       <td className="px-6 py-6 font-light text-white/60">
                          <div className="flex flex-col gap-1">
                             <span className="text-white font-medium uppercase">{row.course}</span>
                             <span className="text-xs italic text-white/40">{courseInfo?.sem} • {courseInfo?.lead}</span>
                          </div>
                       </td>
                       <td className="px-6 py-6 text-brand font-bold">{row.co}</td>
                       <td className="px-6 py-6 text-white font-bold">{row.final}%</td>
                       <td className="px-6 py-6">
                          <span className={`px-2.5 py-1 text-[10px] uppercase font-bold tracking-widest border flex items-center gap-1.5 inline-flex
                              ${row.level === "L3" ? "border-attain/30 text-attain bg-attain/10" :
                                row.level === "L2" ? "border-amber-500/30 text-amber-500 bg-amber-500/10" :
                                  "border-alert/30 text-alert bg-alert/10"}`}>
                               {row.level === "L1" && <AlertCircle className="w-3 h-3" />}
                               Level {row.level.replace('L','')}
                          </span>
                       </td>
                       <td className="px-6 py-6">
                           {row.level === "L1" ? (
                              <span className={`text-[10px] uppercase tracking-widest ${row.remedial ? 'text-attain' : 'text-alert font-bold'}`}>
                                 {row.remedial ? 'Filed' : 'Missing'}
                              </span>
                           ) : <span className="text-white/20">—</span>}
                       </td>
                       <td className="px-6 py-6 text-right">
                          <button className={`p-2 rounded border transition-colors ${row.flagged ? 'bg-alert/20 border-alert text-alert' : 'bg-transparent border-white/10 text-white/20 hover:text-white hover:border-white/30'}`}>
                             <Flag className="w-4 h-4" />
                          </button>
                       </td>
                    </tr>
                  )
                })
              )}
           </tbody>
         </table>
      </motion.div>

    </motion.div>
  );
}
