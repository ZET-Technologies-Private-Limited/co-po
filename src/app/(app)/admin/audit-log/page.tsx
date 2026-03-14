"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { 
  Activity, Search, ShieldAlert, Cpu, Lock, 
  UserCheck, RefreshCw, Download, CheckCircle2
} from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { fadeSlideUp, staggerContainer } from "@/lib/animations";
import { useDataStore } from "@/lib/dataStore";
import { useUIStore } from "@/lib/uiStore";
import { useAuthStore } from "@/lib/authStore";

export default function AdminAuditLogPage() {
  const auditLog      = useDataStore(s => s.auditLog);
  const addAuditEntry = useDataStore(s => s.addAuditEntry);
  const { addToast }  = useUIStore();
  const { user }      = useAuthStore();

  const [search, setSearch]         = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  const filteredData = useMemo(() =>
    auditLog.filter(d =>
      (typeFilter === "all" || d.type === typeFilter) &&
      (
        d.userId.toLowerCase().includes(search.toLowerCase()) ||
        d.action.toLowerCase().includes(search.toLowerCase()) ||
        d.ip.includes(search)
      )
    ), [auditLog, search, typeFilter]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "login":      return <UserCheck  className="w-3.5 h-3.5 text-attain" />;
      case "login_fail": return <ShieldAlert className="w-3.5 h-3.5 text-alert" />;
      case "co_generate":return <Cpu        className="w-3.5 h-3.5 text-brand" />;
      case "approval":   return <CheckCircle2 className="w-3.5 h-3.5 text-attain" />;
      case "override":   return <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />;
      case "system":     return <Lock       className="w-3.5 h-3.5 text-insight" />;
      case "user":       return <UserCheck  className="w-3.5 h-3.5 text-brand" />;
      case "ay_lock":    return <Lock       className="w-3.5 h-3.5 text-aurora" />;
      default:           return <Activity   className="w-3.5 h-3.5 text-white/50" />;
    }
  };

  const handleForceSync = () => {
    addAuditEntry({
      type: "system", userId: user?.id || "admin", role: "admin",
      action: "Manual audit sync triggered by administrator", ip: "127.0.0.1"
    });
    addToast("Audit trail synchronized.", "success");
  };

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="max-w-7xl mx-auto pb-32">
      
      <motion.div variants={fadeSlideUp} className="mb-10 flex justify-between items-end flex-wrap gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-alert animate-pulse" />
            <span className="text-[10px] font-mono text-alert uppercase tracking-widest">Live Surveillance Active</span>
          </div>
          <h1 className="text-4xl font-display text-white mb-2">System Audit Trail</h1>
          <p className="text-white/40 font-light italic">
            {auditLog.length} events logged &nbsp;·&nbsp; last: {auditLog[0]?.timestamp || "No events yet"}
          </p>
        </div>
        <div className="flex gap-4">
          <button onClick={handleForceSync}
            className="px-6 py-2.5 bg-white/[0.05] border border-white/10 text-white hover:bg-white/10 transition-colors text-[10px] font-mono uppercase tracking-widest flex items-center gap-2 rounded">
            <RefreshCw className="w-3.5 h-3.5" /> Force Sync
          </button>
          <button onClick={() => addToast("Exporting full audit log as CSV…", "info")}
            className="px-6 py-2.5 bg-brand text-white hover:bg-brand/90 transition-colors text-[10px] font-mono uppercase tracking-widest flex items-center gap-2 rounded">
            <Download className="w-3.5 h-3.5" /> Export Log Dump
          </button>
        </div>
      </motion.div>

      {/* ── Filters ── */}
      <motion.div variants={fadeSlideUp} className="mb-6 flex gap-4 bg-white/[0.02] border border-white/5 p-4 rounded-lg flex-wrap">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by UserID, IP, or Event Signature…"
            className="w-full bg-cosmic border border-white/10 pl-10 pr-4 py-2 text-sm text-white outline-none focus:border-white/30 transition-colors rounded font-mono" />
        </div>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
          className="bg-cosmic border border-white/10 px-4 py-2 text-sm text-white outline-none rounded uppercase tracking-widest text-[10px] font-mono">
          <option value="all">Any Event Type</option>
          <option value="login">Authentications</option>
          <option value="co_generate">CO Generations</option>
          <option value="marks">Marks Entries</option>
          <option value="approval">Approvals</option>
          <option value="override">Overrides</option>
          <option value="system">System Config</option>
          <option value="user">User Management</option>
          <option value="ay_lock">AY Locks</option>
        </select>
      </motion.div>

      {/* ── Log Feed ── */}
      <motion.div variants={fadeSlideUp} className="border border-white/10 bg-white/[0.01] rounded-xl overflow-hidden shadow-2xl">
        <div className="flex items-center gap-4 bg-[#0a0c10] border-b border-white/10 px-6 py-3 font-mono text-[10px] uppercase tracking-widest text-white/30">
          <div className="w-10">Event</div>
          <div className="w-44">Timestamp (UTC)</div>
          <div className="w-32">User ID</div>
          <div className="flex-1">Event Signature</div>
          <div className="w-32 text-right">Source IP</div>
        </div>
        <div className="flex flex-col h-[600px] overflow-y-auto font-mono text-sm divide-y divide-white/[0.05]">
          <AnimatePresence>
            {filteredData.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-white/20 uppercase tracking-widest text-[10px]">
                {auditLog.length === 0 ? "No events yet. Perform actions to generate audit entries." : "No events match query criteria."}
              </div>
            ) : filteredData.map(log => (
              <motion.div key={log.id} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-4 px-6 py-4 hover:bg-white/[0.02] transition-colors">
                <div className="w-10 flex justify-center">{getTypeIcon(log.type)}</div>
                <div className="w-44 text-white/30 text-[11px]">{log.timestamp}</div>
                <div className="w-32">
                  <span className="text-white font-bold">{log.userId}</span><br />
                  <span className={`text-[9px] uppercase tracking-widest ${log.role === "admin" ? "text-brand" : "text-white/40"}`}>{log.role}</span>
                </div>
                <div className="flex-1 text-white/70 tracking-tight text-xs leading-relaxed">{log.action}</div>
                <div className="w-32 text-right text-white/40 text-xs">{log.ip}</div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}
