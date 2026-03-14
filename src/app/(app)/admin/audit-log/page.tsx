"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Activity, Search, Filter, ShieldAlert, Cpu, Lock, UserCheck, RefreshCw, Download, CheckCircle2
} from "lucide-react";
import { fadeSlideUp, staggerContainer } from "@/lib/animations";

// ─── MOCK FULL AUDIT LOG ───
const AUDIT_DATA = [
  { id: 1, type: 'login', user: 'FAC2024001', role: 'subject_lead', action: 'User authenticated successfully', ip: '192.168.1.100', timestamp: '2024-11-20 09:15:22' },
  { id: 2, type: 'co_generate', user: 'FAC2024003', role: 'faculty', action: 'AI Generated COs for CS302 (5 outcomes)', ip: '192.168.1.105', timestamp: '2024-11-20 09:42:10' },
  { id: 3, type: 'marks', user: 'FAC2024004', role: 'faculty', action: 'Submitted T2 Marks for ME101 (65 records)', ip: '10.0.0.52', timestamp: '2024-11-20 10:05:01' },
  { id: 4, type: 'approval', user: 'FAC2024001', role: 'subject_lead', action: 'Approved T2 Marks for CS301', ip: '192.168.1.100', timestamp: '2024-11-20 10:15:33' },
  { id: 5, type: 'override', user: 'FAC2024002', role: 'department_head', action: 'Overrode CO2 Attainment for EE205 (L1 -> L2)', ip: '192.168.1.42', timestamp: '2024-11-20 11:30:00' },
  { id: 6, type: 'system', user: 'SYSADMIN01', role: 'admin', action: 'Modified System Threshold: Level 3 configured to 65%', ip: '127.0.0.1', timestamp: '2024-11-20 12:00:15' },
  { id: 7, type: 'login_fail', user: 'UNKNOWN', role: 'unknown', action: 'Failed login attempt (Invalid Password)', ip: '45.12.33.91', timestamp: '2024-11-20 13:45:00' },
];

export default function AdminAuditLogPage() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  const filteredData = AUDIT_DATA.filter(d => 
    (typeFilter === "all" || d.type === typeFilter) &&
    (d.user.toLowerCase().includes(search.toLowerCase()) || d.action.toLowerCase().includes(search.toLowerCase()) || d.ip.includes(search))
  );

  const getTypeIcon = (type: string) => {
    switch(type) {
      case 'login': return <UserCheck className="w-3.5 h-3.5 text-attain" />;
      case 'login_fail': return <ShieldAlert className="w-3.5 h-3.5 text-alert" />;
      case 'co_generate': return <Cpu className="w-3.5 h-3.5 text-brand" />;
      case 'approval': return <CheckCircle2 className="w-3.5 h-3.5 text-attain" />;
      case 'override': return <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />;
      case 'system': return <Lock className="w-3.5 h-3.5 text-insight" />;
      default: return <Activity className="w-3.5 h-3.5 text-white/50" />;
    }
  };

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="max-w-7xl mx-auto pb-32">
      
      {/* ── HEADER ── */}
      <motion.div variants={fadeSlideUp} className="mb-12 flex justify-between items-end flex-wrap gap-6">
        <div>
           <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-alert animate-pulse" />
              <span className="text-[10px] font-mono text-alert uppercase tracking-widest">Live Surveillance Active</span>
           </div>
          <h1 className="text-4xl font-display text-white mb-2">System Audit Trail</h1>
          <p className="text-white/40 font-light italic">Immutable cryptographic log of all administrative and academic data mutations</p>
        </div>
        <div className="flex gap-4">
           <button className="px-6 py-2.5 bg-white/[0.05] border border-white/10 text-white hover:bg-white/10 transition-colors text-[10px] font-mono uppercase tracking-widest flex items-center gap-2 rounded">
             <RefreshCw className="w-3.5 h-3.5" /> Force Sync
           </button>
           <button className="px-6 py-2.5 bg-brand text-white hover:bg-brand/90 transition-colors text-[10px] font-mono uppercase tracking-widest flex items-center gap-2 rounded">
             <Download className="w-3.5 h-3.5" /> Export Log Dump
           </button>
        </div>
      </motion.div>

      {/* ── FILTERS ── */}
      <motion.div variants={fadeSlideUp} className="mb-8 flex gap-4 bg-white/[0.02] border border-white/5 p-4 rounded-lg">
         <div className="flex-1 max-w-sm relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
            <input 
              type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Query by UserID, IP, or Event Signature..."
              className="w-full bg-cosmic border border-white/10 pl-10 pr-4 py-2 text-sm text-white outline-none focus:border-white/30 transition-colors rounded font-mono"
            />
         </div>
         <select 
           value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
           className="bg-cosmic border border-white/10 px-4 py-2 text-sm text-white outline-none focus:border-white/30 transition-colors rounded uppercase tracking-widest text-[10px] font-mono"
         >
           <option value="all">Any Event Type</option>
           <option value="login">Authentications</option>
           <option value="co_generate">AI Generations</option>
           <option value="override">Manual Overrides</option>
           <option value="system">System Configs</option>
         </select>
      </motion.div>

      {/* ── LOG FEED ── */}
      <motion.div variants={fadeSlideUp} className="border border-white/10 bg-white/[0.01] rounded-xl overflow-hidden shadow-2xl">
         <div className="flex items-center gap-4 bg-[#0a0c10] border-b border-white/10 px-6 py-3 font-mono text-[10px] uppercase tracking-widest text-white/30">
            <div className="w-16">Status</div>
            <div className="w-48">Timestamp (UTC)</div>
            <div className="w-32">Identity</div>
            <div className="flex-1">Event Signature</div>
            <div className="w-32 text-right">Source IP</div>
         </div>
         
         <div className="flex flex-col h-[600px] overflow-y-auto font-mono text-sm divide-y divide-white/[0.05]">
            <AnimatePresence>
               {filteredData.map((log) => (
                 <motion.div 
                    key={log.id} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-4 px-6 py-4 hover:bg-white/[0.02] transition-colors"
                 >
                    <div className="w-16 flex justify-center">
                       {getTypeIcon(log.type)}
                    </div>
                    <div className="w-48 text-white/30 text-[11px]">{log.timestamp}</div>
                    <div className="w-32">
                       <span className="text-white font-bold">{log.user}</span><br />
                       <span className={`text-[9px] uppercase tracking-widest ${log.role === 'admin' ? 'text-brand' : 'text-white/40'}`}>{log.role}</span>
                    </div>
                    <div className="flex-1 text-white/70 tracking-tight">{log.action}</div>
                    <div className="w-32 text-right text-white/40 text-xs">{log.ip}</div>
                 </motion.div>
               ))}
            </AnimatePresence>
            {filteredData.length === 0 && (
               <div className="flex-1 flex items-center justify-center text-white/20 uppercase tracking-widest text-[10px]">
                 No telemetry matching query criteria.
               </div>
            )}
         </div>
      </motion.div>

    </motion.div>
  );
}
