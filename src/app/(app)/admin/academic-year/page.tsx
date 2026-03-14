"use client";

import { motion } from "framer-motion";
import { fadeSlideUp, staggerContainer } from "@/lib/animations";
import { Calendar, Save, CheckCircle2, Clock, ShieldAlert, ArrowRight, Copy } from "lucide-react";
import { useState } from "react";

export default function AcademicYearConfigPage() {
  const [activeTab, setActiveTab] = useState("current");

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="max-w-6xl mx-auto pb-32">
      
      {/* ── HEADER ── */}
      <motion.div variants={fadeSlideUp} className="mb-12 flex justify-between items-end flex-wrap gap-6">
        <div>
           <div className="flex items-center gap-2 mb-2 font-mono text-[10px] uppercase tracking-widest text-brand">
             <Calendar className="w-3.5 h-3.5" /> Core Infrastructure
           </div>
          <h1 className="text-4xl font-display text-white mb-2">Academic Year Master</h1>
          <p className="text-white/40 font-light italic">Configure global timelines, deadlines, and regulation alignment.</p>
        </div>
        <div className="flex gap-4">
           <button className="px-6 py-2.5 bg-brand text-white hover:bg-brand/90 transition-colors text-[10px] font-mono uppercase tracking-widest flex items-center gap-2 rounded">
             <Save className="w-3.5 h-3.5" /> Save Configuration
           </button>
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-8">
         <motion.div variants={fadeSlideUp} className="lg:col-span-2 flex flex-col gap-6">
            
            {/* ── ACTIVE CONFIGURATION ── */}
            <div className="bg-white/[0.02] border border-white/10 rounded-xl p-8">
               <div className="flex items-center justify-between mb-8 border-b border-white/10 pb-4">
                  <h2 className="text-lg font-display text-white">Current Session: 2024-25</h2>
                  <span className="px-3 py-1 bg-attain/20 border border-attain/30 text-attain text-[10px] font-mono uppercase tracking-widest rounded-full flex items-center gap-1.5">
                     <span className="w-1.5 h-1.5 rounded-full bg-attain animate-pulse" /> Active
                  </span>
               </div>
               
               <div className="grid grid-cols-2 gap-8 font-mono text-sm mb-8">
                  <div className="flex flex-col gap-2">
                     <label className="text-[10px] text-white/30 uppercase tracking-widest">Start Date</label>
                     <input type="date" defaultValue="2024-07-01" className="bg-black/50 border border-white/10 px-4 py-3 text-white outline-none focus:border-brand transition-colors rounded" />
                  </div>
                  <div className="flex flex-col gap-2">
                     <label className="text-[10px] text-white/30 uppercase tracking-widest">End Date (Expected)</label>
                     <input type="date" defaultValue="2025-06-30" className="bg-black/50 border border-white/10 px-4 py-3 text-white outline-none focus:border-brand transition-colors rounded" />
                  </div>
                  <div className="flex flex-col gap-2">
                     <label className="text-[10px] text-white/30 uppercase tracking-widest">Applicable Regulation</label>
                     <select className="bg-black/50 border border-white/10 px-4 py-3 text-white outline-none focus:border-brand transition-colors rounded">
                        <option>R21 Framework</option>
                        <option>R18 Framework</option>
                     </select>
                  </div>
                  <div className="flex flex-col gap-2">
                     <label className="text-[10px] text-white/30 uppercase tracking-widest">Default PO Set</label>
                     <select className="bg-black/50 border border-white/10 px-4 py-3 text-white outline-none focus:border-brand transition-colors rounded">
                        <option>NBA Tier-II (12 POs)</option>
                     </select>
                  </div>
               </div>
               
               <h3 className="text-xs font-mono text-white/50 uppercase tracking-widest mb-4 border-b border-white/5 pb-2">Global Deadlines (Odd Semester)</h3>
               <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="p-4 border border-white/5 bg-black/20 rounded">
                     <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest mb-2 flex items-center gap-2"><Clock className="w-3 h-3" /> T1 Marks Upload</p>
                     <input type="date" defaultValue="2024-09-15" className="w-full bg-transparent border-b border-white/10 py-1 text-white text-sm outline-none focus:border-brand transition-colors" />
                  </div>
                  <div className="p-4 border border-white/5 bg-black/20 rounded">
                     <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest mb-2 flex items-center gap-2"><Clock className="w-3 h-3" /> T2 Marks Upload</p>
                     <input type="date" defaultValue="2024-11-20" className="w-full bg-transparent border-b border-white/10 py-1 text-white text-sm outline-none focus:border-brand transition-colors" />
                  </div>
                  <div className="p-4 border border-white/5 bg-black/20 rounded">
                     <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest mb-2 flex items-center gap-2"><Clock className="w-3 h-3" /> SEE Marks Upload</p>
                     <input type="date" defaultValue="2024-12-15" className="w-full bg-transparent border-b border-white/10 py-1 text-white text-sm outline-none focus:border-brand transition-colors" />
                  </div>
               </div>
               <p className="text-[10px] font-mono text-amber-500/70 italic flex items-center gap-2 mt-4 px-2">
                 <ShieldAlert className="w-3 h-3" /> Reminders are sent to Faculty 3 days and 1 day prior to deadlines.
               </p>
            </div>

            {/* ── ROLLOVER / COPY SETTINGS ── */}
            <div className="bg-white/[0.02] border border-white/10 rounded-xl p-8 flex items-start gap-6">
               <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center shrink-0">
                  <Copy className="w-5 h-5 text-white/40" />
               </div>
               <div>
                  <h3 className="text-lg font-display text-white mb-2">Import Previous Definitions</h3>
                  <p className="text-white/40 font-light text-sm mb-6">Clone Course-Faculty assignments, CO-PO mappings, and Department alignments from a locked Academic Year to accelerate initialization.</p>
                  <button className="px-6 py-2.5 border border-white/20 text-white hover:bg-white/5 transition-colors text-[10px] font-mono uppercase tracking-widest flex items-center gap-2 rounded">
                    Clone from 2023-24 <ArrowRight className="w-3.5 h-3.5" />
                  </button>
               </div>
            </div>
         </motion.div>

         {/* ── STATE MANAGEMENT RIGHT PANEL ── */}
         <motion.div variants={fadeSlideUp} className="flex flex-col gap-6">
            <div className="bg-alert/5 border border-alert/20 rounded-xl p-8">
               <h3 className="text-lg font-display text-alert mb-2 flex items-center gap-2">
                 <ShieldAlert className="w-5 h-5" /> Year-End Lock
               </h3>
               <p className="text-alert/60 font-light text-sm mb-8 leading-relaxed">
                 Initiating a Year-End Lock will instantly freeze all academic operations, marks entries, and calculations for 2024-25. 
                 This action requires full HOD digital sign-off across all departments and is irreversable via the standard UI.
               </p>
               <button className="w-full py-3 bg-alert/20 text-alert border border-alert/50 text-[10px] font-mono uppercase tracking-widest rounded hover:bg-alert hover:text-white transition-colors text-center">
                 Initiate Lock Sequence
               </button>
            </div>

            <div className="bg-white/[0.02] border border-white/10 rounded-xl p-8">
               <h3 className="text-sm font-mono text-white/30 uppercase tracking-widest mb-6">Historical Sessions</h3>
               <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between p-3 border border-white/5 bg-black/30 rounded">
                     <span className="font-mono text-sm text-white/60">2023-24</span>
                     <span className="text-[9px] font-mono uppercase tracking-widest text-alert border border-alert/30 px-2 py-0.5 rounded">Locked</span>
                  </div>
                  <div className="flex items-center justify-between p-3 border border-white/5 bg-black/30 rounded">
                     <span className="font-mono text-sm text-white/60">2022-23</span>
                     <span className="text-[9px] font-mono uppercase tracking-widest text-white/20 border border-white/10 px-2 py-0.5 rounded">Archived</span>
                  </div>
               </div>
            </div>
         </motion.div>
      </div>

    </motion.div>
  );
}
