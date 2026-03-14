"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Lock, CheckCircle2, AlertTriangle, ChevronRight, 
  ArrowRight, ShieldCheck, FileText, Info,
  Unlock, Send
} from "lucide-react";
import { useAuthStore } from "@/lib/authStore";
import { fadeSlideUp, staggerContainer } from "@/lib/animations";
import { useUIStore } from "@/lib/uiStore";

// ─── MOCK CHECKLIST ──────────────────────────────────────────────────────
const CHECKLIST = [
  { id: 1, task: "All course marks approved?", status: "done", detail: "24/24 Courses Approved" },
  { id: 2, task: "All Level 1 remedial actions filed?", status: "warning", detail: "6 Pending (Force allowed with reason)" },
  { id: 3, task: "All CO attainments computed?", status: "done", detail: "Computed & Verified" },
  { id: 4, task: "Dept Summary report generated?", status: "done", detail: "Ready for Archive" },
];

export default function HODYearEndLockPage() {
  const { user } = useAuthStore();
  const { addToast } = useUIStore();
  const [step, setStep] = useState(1);
  const [designation, setDesignation] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [isLocking, setIsLocking] = useState(false);
  const [locked, setLocked] = useState(false);

  const handleLock = () => {
    setIsLocking(true);
    setTimeout(() => {
      setIsLocking(false);
      setLocked(true);
      addToast("AY 2024-25 records sealed and archived successfully.", "success");
    }, 2500);
  };

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="max-w-4xl mx-auto pb-32">
      
      {/* ── HEADER ── */}
      <motion.div variants={fadeSlideUp} className="mb-12">
        <h1 className="text-4xl font-display text-white mb-2">Year-End Lock & Sign-Off</h1>
        <p className="text-white/40 font-light">Academic Year 2024-25 Closure Workflow</p>
      </motion.div>

      {locked ? (
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="p-16 border border-attain/20 bg-attain/[0.02] flex flex-col items-center text-center gap-6"
        >
          <div className="w-20 h-20 rounded-full bg-attain/10 flex items-center justify-center text-attain mb-4">
             <ShieldCheck className="w-10 h-10" />
          </div>
          <h2 className="text-3xl font-display text-white italic">Academic Year Locked</h2>
          <p className="text-white/40 max-w-md font-light">
            All data for AY 2024-25 is now read-only. Curricular gaps and attainment records have been archived.
          </p>
          <div className="mt-8 pt-8 border-t border-white/5 w-full flex justify-between text-[10px] font-mono uppercase tracking-[0.2em] text-white/20">
             <span>Signed by: {user?.name}</span>
             <span>Ref: {Math.random().toString(36).substr(2, 9).toUpperCase()}</span>
          </div>
        </motion.div>
      ) : (
        <div className="flex flex-col gap-8">
          
          {/* ── STEP 1: PRE-LOCK CHECKLIST (Spec: HOD Page 6 Step 1) ── */}
          <motion.section variants={fadeSlideUp} className="p-8 border border-white/10 bg-white/[0.02]">
            <h3 className="text-sm font-mono text-white/30 uppercase tracking-widest mb-8 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> Pre-Lock Checklist
            </h3>
            <div className="flex flex-col gap-4">
              {CHECKLIST.map(item => (
                <div key={item.id} className="p-4 border border-white/5 flex items-center justify-between">
                   <div className="flex items-center gap-4">
                      {item.status === 'done' ? (
                        <CheckCircle2 className="w-5 h-5 text-attain" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-amber-500" />
                      )}
                      <div>
                        <p className="text-sm text-white font-medium">{item.task}</p>
                        <p className="text-[10px] text-white/30 mt-1 uppercase font-mono">{item.detail}</p>
                      </div>
                   </div>
                </div>
              ))}
            </div>
          </motion.section>

          {/* ── STEP 3: DIGITAL SIGN-OFF (Spec: HOD Page 6 Step 3) ── */}
          <motion.section variants={fadeSlideUp} className="p-8 border border-orange-400/20 bg-orange-400/[0.02] flex flex-col gap-8">
             <div>
               <h3 className="text-sm font-mono text-orange-400 uppercase tracking-widest mb-2">Digital Signature</h3>
               <p className="text-xs text-white/40 font-light">Enter your credentials to confirm closure. This action is irreversible.</p>
             </div>
             
             <div className="grid md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-mono text-white/20 uppercase tracking-widest">Designation</label>
                  <input 
                    type="text" value={designation} onChange={e => setDesignation(e.target.value)}
                    placeholder="e.g. Head of Department, CSE"
                    className="bg-cosmic border border-white/10 p-4 text-white text-sm outline-none focus:border-orange-400 transition-colors"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-mono text-white/20 uppercase tracking-widest">Employee ID / Code</label>
                  <input 
                    type="text" value={employeeId} onChange={e => setEmployeeId(e.target.value)}
                    placeholder="Enter Staff ID"
                    className="bg-cosmic border border-white/10 p-4 text-white text-sm outline-none focus:border-orange-400 transition-colors"
                  />
                </div>
             </div>

             <div className="pt-8 border-t border-white/5 flex flex-col gap-4">
                <div className="flex gap-3 items-start p-4 bg-orange-400/5 border border-orange-400/10">
                   <Info className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                   <p className="text-[10px] text-white/50 leading-relaxed font-mono">
                     Upon locking, all marks, CO generation, and attainment values will be permanently archived. Supporting evidence (PDFs) will be generated for NBA/NAAC evidence repositories.
                   </p>
                </div>
                
                <button 
                  onClick={handleLock}
                  disabled={!designation || !employeeId || isLocking}
                  className="w-full py-5 bg-orange-400 text-white font-mono text-sm uppercase tracking-[0.2em] hover:bg-orange-500 transition-all flex items-center justify-center gap-3 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  {isLocking ? "Sealing Records..." : <><Lock className="w-4 h-4" /> Confirm & Lock Academic Year</>}
                </button>
             </div>
          </motion.section>

        </div>
      )}

    </motion.div>
  );
}
