"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Database, Plus, ChevronLeft, Search, 
  Filter, MoreVertical, Edit3, Trash2,
  BookOpen, Target, Award, Download, Upload,
  CheckCircle2, Info, Archive, GitCommit
} from "lucide-react";
import Link from "next/link";
import { fadeSlideUp, staggerContainer } from "@/lib/animations";
import { useUIStore } from "@/lib/uiStore";

// ─── MOCK CO LIBRARY (Spec-aligned) ──────────────────────────────────────
const MOCK_LIBRARY = [
  { 
    courseCode: "CS301", courseName: "Database Management Systems", dept: "CSE", 
    regulation: "R21", status: "Active",
    cos: [
      { co: "CO1", desc: "Design ER models and normal forms", bt: "L4", maps: "PO1, PO2" },
      { co: "CO2", desc: "Write complex SQL queries", bt: "L3", maps: "PO1, PO3" },
      { co: "CO3", desc: "Explain storage and B+ trees", bt: "L2", maps: "PO1" },
      { co: "CO4", desc: "Analyze concurrency control", bt: "L4", maps: "PO2, PO4" },
    ],
    version: "v2.1", updated: "12 Oct 2024"
  },
  { 
    courseCode: "CS302", courseName: "Design and Analysis of Algorithms", dept: "CSE", 
    regulation: "R21", status: "Active",
    cos: [
      { co: "CO1", desc: "Analyze asymptotic complexity", bt: "L4", maps: "PO1" },
      { co: "CO2", desc: "Design greedy algorithms", bt: "L4", maps: "PO2" },
      { co: "CO3", desc: "Implement dynamic programming solutions", bt: "L5", maps: "PO3, PSO1" },
      { co: "CO4", desc: "Evaluate NP-completeness proofs", bt: "L6", maps: "PO4" },
    ],
    version: "v1.0", updated: "05 Sept 2024"
  },
  { 
    courseCode: "CS301", courseName: "Database Management Systems", dept: "CSE", 
    regulation: "R18", status: "Archived",
    cos: [
      { co: "CO1", desc: "Design ER models", bt: "L3", maps: "PO1" },
      { co: "CO2", desc: "Write SQL queries", bt: "L3", maps: "PO1" },
      { co: "CO3", desc: "Explain storage", bt: "L2", maps: "PO1" },
      { co: "CO4", desc: "List concurrency issues", bt: "L1", maps: "PO2" },
    ],
    version: "v1.2", updated: "10 Aug 2021"
  }
];

export default function AdminCOLibraryPage() {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("Active");
  const { addToast } = useUIStore();

  const filteredLibrary = MOCK_LIBRARY.filter(course => 
    course.status === activeTab &&
    (course.courseCode.toLowerCase().includes(search.toLowerCase()) || 
     course.courseName.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="max-w-6xl mx-auto pb-32">
      
      {/* ── HEADER ── */}
      <motion.div variants={fadeSlideUp} className="mb-12">
        <Link href="/dashboard" className="flex items-center gap-2 text-white/40 hover:text-white transition-colors text-xs font-mono uppercase tracking-widest mb-8">
          <ChevronLeft className="w-4 h-4" /> Back to Hub
        </Link>
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-display text-white mb-2 italic">Standard <span className="text-brand">CO Repository</span></h1>
            <p className="text-white/40 font-light mt-2">Master Library for University-wide Default Outcomes</p>
          </div>
          <div className="flex gap-4">
             <button 
               onClick={() => addToast("Bulk import initiated. Waiting for file...", "info")}
               className="px-6 py-3 border border-white/10 text-white hover:bg-white/5 text-[10px] font-mono uppercase tracking-widest transition-all flex items-center gap-2">
               <Upload className="w-3.5 h-3.5" /> Bulk Import
             </button>
             <button 
               onClick={() => addToast("Prepared environment for new CO Set Registration", "info")}
               className="px-8 py-3 bg-brand text-white font-mono text-[10px] uppercase tracking-widest hover:bg-brand/90 transition-all flex items-center gap-2">
               <Plus className="w-4 h-4" /> Register New Set
             </button>
          </div>
        </div>
      </motion.div>

      {/* ── SEARCH & FILTER ── */}
      <motion.div variants={fadeSlideUp} className="flex gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
          <input 
            type="text" placeholder="Search by Course Code or Name..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full bg-white/[0.02] border border-white/10 pl-12 pr-6 py-4 text-white text-sm outline-none focus:border-brand/40 transition-colors placeholder:text-white/10 font-light"
          />
        </div>
        <div className="flex bg-black/50 border border-white/10 p-1">
          {["Active", "Archived"].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-8 py-3 text-[10px] font-mono uppercase tracking-widest transition-all ${
                activeTab === tab ? "bg-white/10 text-white" : "text-white/40 hover:text-white/80"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        <button className="px-6 border border-white/10 bg-white/5 text-white/40 font-mono text-[10px] uppercase tracking-widest flex items-center gap-3">
          <Filter className="w-3.5 h-3.5" /> Dept: CSE
        </button>
      </motion.div>

      {/* ── LIBRARY GRID (Spec: Admin Page 5) ── */}
      <div className="grid gap-12">
        <AnimatePresence mode="popLayout">
          {filteredLibrary.map((course, idx) => (
            <motion.section 
              key={`${course.courseCode}-${course.version}-${idx}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-6"
            >
              <div className="flex justify-between items-end border-b border-white/5 pb-4">
                 <div>
                   <div className="flex items-center gap-4 mb-2">
                     <h3 className="text-2xl font-display text-white">{course.courseCode}: {course.courseName}</h3>
                     <span className="text-[10px] font-mono border border-brand/30 bg-brand/10 text-brand px-2 py-0.5 uppercase flex items-center gap-1.5">
                       <GitCommit className="w-3 h-3" /> {course.version}
                     </span>
                     <span className="text-[10px] font-mono border border-white/10 bg-cosmic text-white/40 px-2 py-0.5 uppercase">
                       {course.regulation}
                     </span>
                   </div>
                   <p className="text-[10px] font-mono text-white/20 uppercase tracking-[0.2em] flex items-center gap-2">
                     Dept: {course.dept} <span className="w-1 h-1 rounded-full bg-white/10" /> Last Updated: {course.updated}
                   </p>
                 </div>
                 <div className="flex gap-3">
                    <button 
                      onClick={() => addToast(`Editing definitions for ${course.courseCode}`, "info")}
                      className="px-4 py-2 border border-white/10 text-[10px] font-mono uppercase tracking-widest text-white/60 hover:text-white hover:border-white/30 transition-all flex items-center gap-2">
                      <Edit3 className="w-3.5 h-3.5" /> Edit Set
                    </button>
                    {course.status === 'Active' ? (
                      <button 
                        onClick={() => addToast(`${course.courseCode} locked and moved to archive.`, "success")}
                        className="px-4 py-2 border border-alert/30 bg-alert/5 text-[10px] font-mono uppercase tracking-widest text-alert hover:bg-alert hover:text-white transition-all flex items-center gap-2">
                        <Archive className="w-3.5 h-3.5" /> Archive
                      </button>
                    ) : (
                      <button 
                        onClick={() => addToast(`${course.courseCode} restored to active library.`, "success")}
                        className="px-4 py-2 border border-attain/30 bg-attain/5 text-[10px] font-mono uppercase tracking-widest text-attain hover:bg-attain hover:text-white transition-all flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Restore
                      </button>
                    )}
                 </div>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                 {course.cos.map(co => (
                   <div key={co.co} className="p-6 border border-white/10 bg-white/[0.01] hover:bg-white/[0.03] transition-colors group">
                      <div className="flex justify-between items-center mb-4">
                         <span className="text-xs font-bold text-brand">{co.co}</span>
                         <span className="text-[9px] font-mono text-white/40 border border-white/10 px-1.5 py-0.5">{co.bt}</span>
                      </div>
                      <p className="text-xs text-white/60 font-light leading-relaxed mb-6 italic h-12 overflow-hidden text-ellipsis">
                        {co.desc}
                      </p>
                      <div className="flex items-center justify-between">
                         <div className="flex items-center gap-2 text-[8px] font-mono text-white/20 uppercase tracking-widest">
                            <Target className="w-2.5 h-2.5" /> {co.maps}
                         </div>
                      </div>
                   </div>
                 ))}
                 
                 {/* Only allow appending on active sets */}
                 {course.status === 'Active' && (
                   <button 
                     onClick={() => addToast(`Opened editor to append new outcome to ${course.courseCode}`, "info")}
                     className="p-6 border border-dashed border-white/10 hover:border-brand/40 flex flex-col items-center justify-center gap-2 text-white/10 hover:text-brand transition-all">
                      <Plus className="w-5 h-5" />
                      <span className="text-[9px] font-mono uppercase tracking-widest">Append Outcome</span>
                   </button>
                 )}
              </div>
            </motion.section>
          ))}
          {filteredLibrary.length === 0 && (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="py-24 flex flex-col items-center justify-center text-center gap-4 border border-dashed border-white/10 mt-8"
            >
              <Database className="w-8 h-8 text-white/10" />
              <p className="text-white/30 font-mono text-xs uppercase tracking-widest">No definitions found in this view</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </motion.div>
  );
}
