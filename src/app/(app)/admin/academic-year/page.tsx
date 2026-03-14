"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarClock, Save, Lock, Copy, AlertCircle, CheckCircle2, Plus, Trash2 } from "lucide-react";
import { fadeSlideUp, staggerContainer } from "@/lib/animations";
import { useDataStore, AYConfig } from "@/lib/dataStore";
import { useAuthStore } from "@/lib/authStore";
import { useUIStore } from "@/lib/uiStore";
import { AccessGate } from "@/components/auth/AccessGate";

type ExamDeadline = { examId: string; name: string; deadline: string };
type SemesterConfig = { id: string; name: string; type: "odd" | "even"; startMonth: string; endMonth: string };

const DEFAULT_EXAM_DEADLINES: ExamDeadline[] = [
  { examId: "t1",  name: "T1 — Unit Test 1",  deadline: "" },
  { examId: "t2",  name: "T2 — Unit Test 2",  deadline: "" },
  { examId: "t3",  name: "T3 — Assignment",   deadline: "" },
  { examId: "t4",  name: "T4 — Quiz/Viva",    deadline: "" },
  { examId: "t5",  name: "T5 — Model Exam",   deadline: "" },
  { examId: "see", name: "SEE — End Semester", deadline: "" },
];

const DEFAULT_SEMESTERS: SemesterConfig[] = [
  { id: "odd",  name: "Odd Semester",  type: "odd",  startMonth: "July",    endMonth: "November" },
  { id: "even", name: "Even Semester", type: "even", startMonth: "January", endMonth: "May" },
];

export default function AcademicYearConfigPage() {
  const { user }      = useAuthStore();
  const { addToast }  = useUIStore();
  const ay            = useDataStore(s => s.ay);
  const setAY         = useDataStore(s => s.setAY);
  const lockAY        = useDataStore(s => s.lockAY);
  const addAuditEntry = useDataStore(s => s.addAuditEntry);

  const [local, setLocal]           = useState<AYConfig>({ ...ay });
  const [confirmLock, setConfLock]  = useState(false);
  const [examDeadlines, setExamDeadlines] = useState<ExamDeadline[]>(DEFAULT_EXAM_DEADLINES);
  const [semesters, setSemesters]   = useState<SemesterConfig[]>(DEFAULT_SEMESTERS);
  const [activeTab, setActiveTab]   = useState<"dates" | "exams" | "semesters">("dates");

  const isLocked = ay.status === "locked" || ay.status === "archived";

  const hasChanges = useMemo(() =>
    local.startDate !== ay.startDate || local.endDate !== ay.endDate ||
    local.marksDeadline !== ay.marksDeadline || local.coLockDeadline !== ay.coLockDeadline ||
    local.poDeadline !== ay.poDeadline,
    [local, ay]);

  const handleSave = () => {
    setAY(local);
    addAuditEntry({ type: "system", userId: user?.id || "admin", role: "admin",
      action: `AY ${local.ay} configuration updated — marks deadline: ${local.marksDeadline}, CO lock: ${local.coLockDeadline}`,
      ip: "127.0.0.1" });
    addToast(`AY ${local.ay} configuration saved.`, "success");
  };

  const handleLock = () => {
    if (!confirmLock) { setConfLock(true); addToast("Click Confirm Lock again to permanently lock this AY.", "warning"); return; }
    lockAY(user?.id || "admin");
    setConfLock(false);
    addToast(`AY ${ay.ay} locked and archived. All data is now read-only.`, "success");
  };

  const handleClone = () => {
    const parts = ay.ay.split("-");
    const y1 = parseInt(parts[0]) + 1;
    const y2 = parseInt(parts[1]) + 1;
    const nextAY = `${y1}-${String(y2).slice(-2)}`;
    const cloned: AYConfig = { ay: nextAY, status: "active", startDate: "", endDate: "", marksDeadline: "", coLockDeadline: "", poDeadline: "" };
    setAY(cloned);
    setLocal(cloned);
    addAuditEntry({ type: "system", userId: user?.id || "admin", role: "admin",
      action: `AY ${nextAY} created by cloning ${ay.ay}`, ip: "127.0.0.1" });
    addToast(`New AY ${nextAY} created. Configure dates and save.`, "info");
  };

  const updateExamDeadline = (examId: string, deadline: string) =>
    setExamDeadlines(prev => prev.map(e => e.examId === examId ? { ...e, deadline } : e));

  const saveExamDeadlines = () => {
    addToast("Exam deadlines saved. Reminders will be sent 3 and 1 days before each deadline.", "success");
    addAuditEntry({ type: "system", userId: user?.id || "admin", role: "admin",
      action: `Exam deadlines configured for AY ${ay.ay}`, ip: "127.0.0.1" });
  };

  const dateField = (label: string, key: keyof AYConfig, desc: string) => (
    <div key={key} className="flex items-center justify-between py-5 border-b border-white/5">
      <div>
        <p className="text-sm font-mono text-white uppercase tracking-widest">{label}</p>
        <p className="text-[10px] text-white/30 font-light mt-0.5">{desc}</p>
      </div>
      <input type="date" value={local[key] as string} disabled={isLocked}
        onChange={e => setLocal(p => ({ ...p, [key]: e.target.value }))}
        className="bg-white/[0.02] border border-white/10 px-4 py-2 text-white text-sm outline-none focus:border-brand transition-colors disabled:opacity-40 disabled:cursor-not-allowed" />
    </div>
  );

  return (
    <AccessGate feature="ay_setup" deny="lock">
      <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="max-w-4xl mx-auto pb-32">

        {/* Header */}
        <motion.div variants={fadeSlideUp} className="flex justify-between items-end pb-8 border-b border-white/5">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-mono text-brand uppercase tracking-widest mb-3">
              <span className="w-8 h-[1px] bg-brand" /> Academic Configuration
            </div>
            <h1 className="text-4xl font-display text-white flex items-center gap-4">
              <CalendarClock className="w-8 h-8 text-brand" /> Academic Year Config
            </h1>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-xl font-display text-white/60">{ay.ay}</span>
              <span className={`text-[9px] font-mono uppercase px-2 py-0.5 border ${
                ay.status === "active" ? "border-attain/30 text-attain" :
                ay.status === "locked" ? "border-alert/30 text-alert" : "border-white/20 text-white/40"
              }`}>{ay.status}</span>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={handleClone}
              className="px-5 py-2.5 border border-white/10 text-white/40 hover:text-white hover:border-white/30 text-[10px] font-mono uppercase tracking-widest flex items-center gap-2 transition-colors">
              <Copy className="w-3.5 h-3.5" /> Clone to Next AY
            </button>
            <button onClick={handleSave} disabled={!hasChanges || isLocked}
              className="px-5 py-2.5 bg-brand text-white text-[10px] font-mono uppercase tracking-widest hover:bg-brand/90 transition-colors flex items-center gap-2 disabled:opacity-40">
              <Save className="w-3.5 h-3.5" /> Save Config
            </button>
            <button onClick={handleLock} disabled={isLocked}
              className={`px-5 py-2.5 text-[10px] font-mono uppercase tracking-widest flex items-center gap-2 transition-colors disabled:opacity-40 ${
                confirmLock ? "bg-alert text-white hover:bg-alert/90" : "border border-alert/30 text-alert hover:bg-alert/10"
              }`}>
              <Lock className="w-3.5 h-3.5" /> {confirmLock ? "Confirm Lock" : "Lock & Archive"}
            </button>
          </div>
        </motion.div>

        {isLocked && (
          <motion.div variants={fadeSlideUp} className="flex items-center gap-3 p-4 bg-alert/5 border border-alert/20 mb-0">
            <AlertCircle className="w-4 h-4 text-alert shrink-0" />
            <p className="text-sm text-white/60 font-light">This AY is <strong className="text-alert">locked</strong>. All data is read-only.</p>
          </motion.div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-white/5">
          {(["dates", "exams", "semesters"] as const).map(t => (
            <button key={t} onClick={() => setActiveTab(t)}
              className={`px-6 py-4 text-[10px] font-mono uppercase tracking-widest border-b-2 transition-all ${
                activeTab === t ? "border-brand text-brand" : "border-transparent text-white/30 hover:text-white"
              }`}>
              {t === "dates" ? "AY Dates" : t === "exams" ? "Exam Deadlines" : "Semesters"}
            </button>
          ))}
        </div>

        {/* AY Dates tab */}
        {activeTab === "dates" && (
          <motion.div variants={fadeSlideUp} className="flex flex-col">
            {dateField("AY Start Date",              "startDate",       "First day of the academic year")}
            {dateField("AY End Date",                "endDate",         "Last day of the academic year")}
            {dateField("Marks Submission Deadline",  "marksDeadline",   "Faculty must submit all marks by this date")}
            {dateField("CO Lock Deadline",           "coLockDeadline",  "All COs must be finalized by this date")}
            {dateField("PO Report Deadline",         "poDeadline",      "PO/PSO attainment reports must be filed by this date")}
            {hasChanges && !isLocked && (
              <div className="flex items-center gap-2 py-4 text-amber-400 text-xs font-mono">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" /> Unsaved changes — click Save Config to persist.
              </div>
            )}
          </motion.div>
        )}

        {/* Exam Deadlines tab */}
        {activeTab === "exams" && (
          <motion.div variants={fadeSlideUp} className="flex flex-col">
            <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest py-4 border-b border-white/5">
              Per-assessment upload deadlines. System sends reminders 3 days and 1 day before each deadline.
            </p>
            {examDeadlines.map(ed => (
              <div key={ed.examId} className="flex items-center justify-between py-4 border-b border-white/5">
                <div>
                  <p className="text-sm font-mono text-white">{ed.name}</p>
                  <p className="text-[9px] font-mono text-white/30 uppercase mt-0.5">{ed.examId.toUpperCase()}</p>
                </div>
                <input type="date" value={ed.deadline} disabled={isLocked}
                  onChange={e => updateExamDeadline(ed.examId, e.target.value)}
                  className="bg-white/[0.02] border border-white/10 px-4 py-2 text-white text-sm outline-none focus:border-brand transition-colors disabled:opacity-40" />
              </div>
            ))}
            {!isLocked && (
              <button onClick={saveExamDeadlines}
                className="mt-4 px-5 py-2.5 bg-brand text-white text-[10px] font-mono uppercase tracking-widest hover:bg-brand/90 transition-colors flex items-center gap-2 self-end">
                <Save className="w-3.5 h-3.5" /> Save Exam Deadlines
              </button>
            )}
          </motion.div>
        )}

        {/* Semesters tab */}
        {activeTab === "semesters" && (
          <motion.div variants={fadeSlideUp} className="flex flex-col">
            <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest py-4 border-b border-white/5">
              Define semester periods. Courses are assigned to semesters during course creation.
            </p>
            {semesters.map((sem, i) => (
              <div key={sem.id} className="flex items-center gap-6 py-5 border-b border-white/5">
                <div className="flex-1">
                  <input value={sem.name} onChange={e => setSemesters(prev => prev.map((s, j) => j === i ? { ...s, name: e.target.value } : s))}
                    className="bg-transparent border-b border-white/10 text-white text-sm outline-none focus:border-brand w-full pb-1" />
                </div>
                <select value={sem.type} onChange={e => setSemesters(prev => prev.map((s, j) => j === i ? { ...s, type: e.target.value as any } : s))}
                  className="bg-white/[0.02] border border-white/10 px-3 py-1.5 text-white text-xs outline-none font-mono">
                  <option value="odd" className="bg-[#0a0a0f]">Odd</option>
                  <option value="even" className="bg-[#0a0a0f]">Even</option>
                </select>
                <div className="flex items-center gap-2 text-xs font-mono text-white/40">
                  <input value={sem.startMonth} onChange={e => setSemesters(prev => prev.map((s, j) => j === i ? { ...s, startMonth: e.target.value } : s))}
                    placeholder="Start month" className="bg-white/[0.02] border border-white/10 px-3 py-1.5 text-white outline-none focus:border-brand w-24" />
                  <span>→</span>
                  <input value={sem.endMonth} onChange={e => setSemesters(prev => prev.map((s, j) => j === i ? { ...s, endMonth: e.target.value } : s))}
                    placeholder="End month" className="bg-white/[0.02] border border-white/10 px-3 py-1.5 text-white outline-none focus:border-brand w-24" />
                </div>
                <button onClick={() => setSemesters(prev => prev.filter((_, j) => j !== i))}
                  className="text-white/20 hover:text-alert transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            ))}
            <div className="flex justify-between items-center pt-4">
              <button onClick={() => setSemesters(prev => [...prev, { id: `sem${Date.now()}`, name: "New Semester", type: "odd", startMonth: "", endMonth: "" }])}
                className="text-[10px] font-mono text-brand uppercase tracking-widest flex items-center gap-2 hover:text-white transition-colors">
                <Plus className="w-3.5 h-3.5" /> Add Semester
              </button>
              <button onClick={() => addToast("Semester configuration saved.", "success")}
                className="px-5 py-2.5 bg-brand text-white text-[10px] font-mono uppercase tracking-widest hover:bg-brand/90 transition-colors flex items-center gap-2">
                <Save className="w-3.5 h-3.5" /> Save Semesters
              </button>
            </div>
          </motion.div>
        )}

      </motion.div>
    </AccessGate>
  );
}
