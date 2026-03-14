"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Activity, Search, UserCheck, ShieldAlert, Cpu, CheckCircle2, Lock } from "lucide-react";
import { useDataStore } from "@/lib/dataStore";
import { AccessGate } from "@/components/auth/AccessGate";
import { staggerContainer, fadeSlideUp } from "@/lib/animations";

export default function AuditTrailViewPage() {
  const auditLog = useDataStore(s => s.auditLog);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  const filtered = useMemo(() =>
    auditLog.filter(d =>
      (typeFilter === "all" || d.type === typeFilter) &&
      (d.userId.toLowerCase().includes(search.toLowerCase()) ||
       d.action.toLowerCase().includes(search.toLowerCase()))
    ), [auditLog, search, typeFilter]);

  const getIcon = (type: string) => {
    switch (type) {
      case "login":       return <UserCheck className="w-3.5 h-3.5 text-attain" />;
      case "login_fail":  return <ShieldAlert className="w-3.5 h-3.5 text-alert" />;
      case "co_generate": return <Cpu className="w-3.5 h-3.5 text-brand" />;
      case "approval":    return <CheckCircle2 className="w-3.5 h-3.5 text-attain" />;
      case "override":    return <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />;
      case "ay_lock":     return <Lock className="w-3.5 h-3.5 text-aurora" />;
      default:            return <Activity className="w-3.5 h-3.5 text-white/40" />;
    }
  };

  return (
    <AccessGate feature="audit_trail" deny="lock">
      <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="max-w-7xl mx-auto pb-32">

        <motion.div variants={fadeSlideUp} className="pb-8 border-b border-white/5">
          <div className="flex items-center gap-2 text-[10px] font-mono text-brand uppercase tracking-widest mb-3">
            <span className="w-8 h-[1px] bg-brand" /> Governance
          </div>
          <h1 className="text-4xl font-display text-white flex items-center gap-4">
            <Activity className="w-8 h-8 text-brand" /> Audit Trail
          </h1>
          <p className="text-white/40 font-light mt-1">{auditLog.length} events · View-only</p>
        </motion.div>

        {/* Filters */}
        <motion.div variants={fadeSlideUp} className="flex gap-4 py-5 border-b border-white/5">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by user ID or action..."
              className="w-full bg-white/[0.02] border border-white/10 pl-10 pr-4 py-2.5 text-sm text-white outline-none focus:border-brand transition-colors" />
          </div>
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
            className="bg-white/[0.02] border border-white/10 px-4 py-2.5 text-sm text-white outline-none text-[10px] font-mono uppercase">
            <option value="all">All Events</option>
            <option value="login">Logins</option>
            <option value="approval">Approvals</option>
            <option value="co_generate">CO Generation</option>
            <option value="marks">Marks</option>
            <option value="override">Overrides</option>
            <option value="system">System</option>
            <option value="ay_lock">AY Lock</option>
          </select>
        </motion.div>

        {/* Log table */}
        <motion.div variants={fadeSlideUp} className="border border-white/10 bg-white/[0.01] overflow-hidden">
          <div className="flex items-center gap-4 bg-white/[0.02] border-b border-white/10 px-6 py-3 font-mono text-[9px] uppercase tracking-widest text-white/30">
            <div className="w-8">Type</div>
            <div className="w-40">Timestamp</div>
            <div className="w-28">User</div>
            <div className="flex-1">Action</div>
            <div className="w-28 text-right">IP</div>
          </div>
          <div className="flex flex-col divide-y divide-white/5 max-h-[600px] overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="py-16 text-center text-white/20 text-[10px] font-mono uppercase tracking-widest">
                {auditLog.length === 0 ? "No events yet." : "No events match query."}
              </div>
            ) : filtered.map(log => (
              <div key={log.id} className="flex items-center gap-4 px-6 py-4 hover:bg-white/[0.01] transition-colors">
                <div className="w-8 flex justify-center">{getIcon(log.type)}</div>
                <div className="w-40 text-white/30 text-[10px] font-mono">{log.timestamp}</div>
                <div className="w-28">
                  <p className="text-white text-xs font-mono">{log.userId}</p>
                  <p className="text-[9px] font-mono text-white/30 uppercase">{log.role}</p>
                </div>
                <div className="flex-1 text-white/60 text-xs font-light">{log.action}</div>
                <div className="w-28 text-right text-white/30 text-xs font-mono">{log.ip}</div>
              </div>
            ))}
          </div>
        </motion.div>

      </motion.div>
    </AccessGate>
  );
}
