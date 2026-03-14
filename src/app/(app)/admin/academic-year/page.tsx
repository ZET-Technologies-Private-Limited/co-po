"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { CalendarClock, Save, Lock, Copy, AlertCircle, CheckCircle2 } from "lucide-react";
import { fadeSlideUp, staggerContainer } from "@/lib/animations";
import { useDataStore } from "@/lib/dataStore";
import { useAuthStore } from "@/lib/authStore";
import { useUIStore } from "@/lib/uiStore";

export default function AcademicYearConfigPage() {
  const { user }      = useAuthStore();
  const { addToast }  = useUIStore();
  const ay            = useDataStore(s => s.ay);
  const setAY         = useDataStore(s => s.setAY);
  const lockAY        = useDataStore(s => s.lockAY);
  const addAuditEntry = useDataStore(s => s.addAuditEntry);

  const [local, setLocal]         = useState({ ...ay });
  const [confirmLock, setConfLock] = useState(false);

  const hasChanges =
    local.startDate !== ay.startDate ||
    local.endDate   !== ay.endDate   ||
    local.marksDeadline  !== ay.marksDeadline ||
    local.coLockDeadline !== ay.coLockDeadline ||
    local.poDeadline     !== ay.poDeadline;

  const handleSave = () => {
    setAY(local);
    addAuditEntry({
      type: "system", userId: user?.id || "admin", role: "admin",
      action: `AY ${local.ay} configuration updated — marks deadline: ${local.marksDeadline}, CO lock: ${local.coLockDeadline}`,
      ip: "127.0.0.1"
    });
    addToast(`Academic Year ${local.ay} configuration saved.`, "success");
  };

  const handleLock = () => {
    if (!confirmLock) { setConfLock(true); addToast("Click **Confirm Lock** again to permanently lock this AY.", "warning"); return; }
    lockAY(user?.id || "admin");
    setConfLock(false);
    addToast(`Academic Year ${ay.ay} has been locked and archived. All data is now read-only.`, "success");
  };

  const handleClone = () => {
    const [year1, year2] = ay.ay.split("-").map(Number);
    const nextAY = `${year1 + 1}-${String(year2 + 1).slice(-2)}`;
    setAY({ ay: nextAY, status: "active", startDate: "", endDate: "", marksDeadline: "", coLockDeadline: "", poDeadline: "" });
    setLocal({ ay: nextAY, status: "active", startDate: "", endDate: "", marksDeadline: "", coLockDeadline: "", poDeadline: "" });
    addToast(`New AY ${nextAY} cloned and set as active. Configure dates and save.`, "info");
  };

  const isLocked = ay.status === "locked" || ay.status === "archived";

  const fields: [string, keyof typeof local, string][] = [
    ["AY Start Date",        "startDate",       "First day of the academic year"],
    ["AY End Date",          "endDate",         "Last day of the academic year"],
    ["Marks Submission Deadline", "marksDeadline", "Faculty must submit all marks by this date"],
    ["CO Lock Deadline",    "coLockDeadline",   "All COs must be finalized and locked by this date"],
    ["PO Report Deadline",  "poDeadline",       "PO/PSO attainment reports must be filed by this date"],
  ];

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="max-w-3xl mx-auto pb-32">
      
      <motion.div variants={fadeSlideUp} className="mb-12 flex justify-between items-end flex-wrap gap-6">
        <div>
          <h1 className="text-4xl font-display text-white mb-2 flex items-center gap-4">
            <CalendarClock className="w-8 h-8 text-brand" /> Academic Year Config
          </h1>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-xl font-display text-white/60">{ay.ay}</span>
            <span className={`px-2.5 py-1 text-[9px] font-mono uppercase tracking-widest border rounded ${
              ay.status === "active"   ? "border-attain/30 text-attain bg-attain/10" :
              ay.status === "locked"   ? "border-alert/30 text-alert bg-alert/10" :
              "border-white/20 text-white/40"
            }`}>{ay.status}</span>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={handleClone}
            className="px-5 py-2.5 border border-white/10 text-white/60 hover:text-white hover:border-white/30 text-[10px] font-mono uppercase tracking-widest flex items-center gap-2 transition-colors rounded">
            <Copy className="w-3.5 h-3.5" /> Clone to Next AY
          </button>
          <button onClick={handleSave} disabled={!hasChanges || isLocked}
            className="px-5 py-2.5 bg-brand text-white text-[10px] font-mono uppercase tracking-widest hover:bg-brand/90 transition-colors flex items-center gap-2 disabled:opacity-40 rounded shadow-[0_0_15px_rgba(30,174,219,0.2)]">
            <Save className="w-3.5 h-3.5" /> Save Config
          </button>
          <button onClick={handleLock} disabled={isLocked}
            className={`px-5 py-2.5 text-[10px] font-mono uppercase tracking-widest flex items-center gap-2 transition-colors rounded disabled:opacity-40 ${
              confirmLock ? "bg-alert text-white hover:bg-alert/90" : "border border-alert/30 text-alert hover:bg-alert/10"
            }`}>
            <Lock className="w-3.5 h-3.5" /> {confirmLock ? "Confirm Lock" : "Lock & Archive AY"}
          </button>
        </div>
      </motion.div>

      {isLocked && (
        <motion.div variants={fadeSlideUp} className="mb-8 p-4 bg-alert/5 border border-alert/20 flex items-center gap-3 rounded-lg">
          <AlertCircle className="w-5 h-5 text-alert shrink-0" />
          <p className="text-sm text-white/60 font-light">This Academic Year is <strong className="text-alert">locked</strong>. All configuration and data is now read-only.</p>
        </motion.div>
      )}

      <div className="flex flex-col gap-5">
        {fields.map(([label, key, desc]) => (
          <motion.div key={key} variants={fadeSlideUp} className="border border-white/10 bg-white/[0.02] rounded-lg p-6">
            <label className="text-xs font-mono text-white/40 uppercase tracking-widest flex items-center gap-2 mb-1">
              <CalendarClock className="w-3 h-3" /> {label}
            </label>
            <p className="text-[10px] text-white/25 font-light mb-3">{desc}</p>
            <input
              type="date"
              value={local[key]}
              disabled={isLocked}
              onChange={e => setLocal(p => ({ ...p, [key]: e.target.value }))}
              className="bg-black/30 border border-white/10 px-4 py-2.5 text-white text-sm outline-none focus:border-brand/50 transition-colors rounded disabled:opacity-40 disabled:cursor-not-allowed"
            />
          </motion.div>
        ))}
      </div>

      {hasChanges && !isLocked && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 flex items-center gap-3 text-amber-400 text-xs font-mono">
          <AlertCircle className="w-4 h-4 shrink-0" /> Unsaved changes — click Save Config to persist.
        </motion.div>
      )}
    </motion.div>
  );
}
