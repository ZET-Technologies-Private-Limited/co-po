"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { BookOpen, Search, GitCommit, Target } from "lucide-react";
import { useDataStore } from "@/lib/dataStore";
import { AccessGate } from "@/components/auth/AccessGate";
import { staggerContainer, fadeSlideUp } from "@/lib/animations";

export default function COLibraryViewPage() {
  const coLibrary = useDataStore(s => s.coLibrary);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"active" | "archived">("active");

  const filtered = useMemo(() =>
    coLibrary.filter(lib =>
      lib.status === statusFilter &&
      (lib.name.toLowerCase().includes(search.toLowerCase()) ||
       lib.dept.toLowerCase().includes(search.toLowerCase()))
    ), [coLibrary, search, statusFilter]);

  return (
    <AccessGate feature="co_library_view" deny="lock">
      <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="max-w-6xl mx-auto pb-32">

        {/* Header */}
        <motion.div variants={fadeSlideUp} className="pb-8 border-b border-white/5">
          <div className="flex items-center gap-2 text-[10px] font-mono text-brand uppercase tracking-widest mb-3">
            <span className="w-8 h-[1px] bg-brand" /> Standard Repository
          </div>
          <div className="flex justify-between items-end">
            <div>
              <h1 className="text-4xl font-display text-white flex items-center gap-4">
                <BookOpen className="w-8 h-8 text-brand" /> Default CO Library
              </h1>
              <p className="text-white/40 font-light mt-1">University-wide standard Course Outcome sets. Read-only view.</p>
            </div>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div variants={fadeSlideUp} className="flex gap-4 py-5 border-b border-white/5">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by name or department..."
              className="w-full bg-white/[0.02] border border-white/10 pl-10 pr-4 py-2.5 text-sm text-white outline-none focus:border-brand transition-colors" />
          </div>
          <div className="flex border border-white/10">
            {(["active", "archived"] as const).map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`px-5 py-2.5 text-[10px] font-mono uppercase tracking-widest transition-colors ${
                  statusFilter === s ? "bg-brand text-white" : "text-white/30 hover:text-white"
                }`}>
                {s}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Library grid */}
        <motion.div variants={fadeSlideUp} className="flex flex-col divide-y divide-white/5">
          {filtered.length === 0 ? (
            <div className="py-24 text-center text-white/20">
              <BookOpen className="w-10 h-10 mx-auto mb-4 opacity-20" />
              <p className="text-sm font-mono uppercase tracking-widest">No CO sets found</p>
            </div>
          ) : filtered.map(lib => (
            <div key={lib.id} className="py-8">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-xl font-display text-white">{lib.name}</h3>
                    <span className="text-[9px] font-mono border border-brand/30 text-brand px-2 py-0.5 uppercase flex items-center gap-1">
                      <GitCommit className="w-2.5 h-2.5" /> {lib.version}
                    </span>
                  </div>
                  <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest">
                    Dept: {lib.dept} · Created: {lib.createdAt} · {lib.cos.length} Outcomes
                  </p>
                </div>
                <span className={`text-[9px] font-mono uppercase px-2 py-0.5 border ${
                  lib.status === "active" ? "border-attain/30 text-attain" : "border-white/20 text-white/30"
                }`}>{lib.status}</span>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {lib.cos.map(co => (
                  <div key={co.co} className="p-5 border border-white/10 bg-white/[0.01] hover:bg-white/[0.02] transition-colors">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-xs font-bold text-brand">{co.co}</span>
                      <span className="text-[9px] font-mono text-white/40 border border-white/10 px-1.5 py-0.5">{co.bloomCode}</span>
                    </div>
                    <p className="text-xs text-white/60 font-light leading-relaxed">{co.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </motion.div>

      </motion.div>
    </AccessGate>
  );
}
