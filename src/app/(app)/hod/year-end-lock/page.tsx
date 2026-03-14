"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Lock,
  CheckSquare,
  AlertTriangle,
  Archive,
  Fingerprint,
  RefreshCcw,
  CheckCircle2,
} from "lucide-react";
import { AccessGate } from "@/components/auth/AccessGate";
import { staggerContainer, fadeSlideUp } from "@/lib/animations";
import { useDataStore } from "@/lib/dataStore";
import { useAuthStore } from "@/lib/authStore";

export default function HODYearEndLockPage() {
  const [step, setStep] = useState(1);
  const [digitalSign, setDigitalSign] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  const { activeAY } = useAuthStore();
  const ay = useDataStore((s) => s.ay);
  const submissions = useDataStore((s) => s.submissions);
  const remedialActions = useDataStore((s) => s.remedialActions);
  const lockAY = useDataStore((s) => s.lockAY);

  const { allApproved, allRemedialFiled } = useMemo(() => {
    let pendingMarks = 0;
    Object.values(submissions).forEach((courseSubs) => {
      courseSubs.forEach((s) => {
        if (s.status !== "approved") pendingMarks += 1;
      });
    });

    const hasLevel1WithoutRemedial = Object.values(remedialActions).some(
      (coMap) =>
        Object.values(coMap).some((txt) => !txt || txt.trim().length === 0)
    );

    return {
      allApproved: pendingMarks === 0,
      allRemedialFiled: !hasLevel1WithoutRemedial,
    };
  }, [submissions, remedialActions]);

  const checklist = [
    {
      id: 1,
      label: "All course marks approved by Subject Leads",
      status: allApproved,
    },
    {
      id: 2,
      label: "All Level 1 CO remedial actions filed",
      status: allRemedialFiled,
    },
    {
      id: 3,
      label: "Institutional PO/PSO reports generated",
      status: true,
    },
  ];

  const isAlreadyLocked = ay.status === "locked" || ay.status === "archived";

  const handleSeal = () => {
    if (!digitalSign || isAlreadyLocked) return;
    lockAY(digitalSign);
    setShowSuccess(true);
  };

  return (
    <AccessGate feature="year_end_lock" deny="lock">
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="flex flex-col gap-24 pb-40"
      >
        <header className="flex flex-col gap-8 pb-16 border-b border-white/5">
          <div className="flex items-center gap-3 text-[10px] font-mono text-orange-400 uppercase tracking-widest">
            <span className="w-8 h-[1px] bg-orange-400" /> Final Compliance
          </div>
          <div className="flex justify-between items-end">
            <div>
              <h1 className="text-5xl font-display text-white tracking-tight underline decoration-orange-400/20 decoration-8">
                 Year-End <span className="text-white/20">Archive</span>
              </h1>
              <p className="text-lg font-light text-white/40 italic mt-3 max-w-xl">
                 Permanent data freeze and archival sequence for AY {ay.ay}.
                 {isAlreadyLocked && " Records are currently immutable."}
              </p>
            </div>
            {isAlreadyLocked ? (
               <div className="flex items-center gap-4 text-alert font-mono text-[10px] uppercase tracking-widest">
                  <Lock className="w-4 h-4" /> Registry Sealed
               </div>
            ) : (
               <Archive className="w-12 h-12 text-white/10" />
            )}
          </div>
        </header>

        <div className="flex flex-col gap-32">
          {/* Steps Indicator (FLATTENED) */}
          <div className="grid grid-cols-3 gap-24 border-b border-white/5 pb-16">
            {[
              { s: 1, label: "Compliance Checklist" },
              { s: 2, label: "Institutional Audit" },
              { s: 3, label: "Registry Sealing" }
            ].map((item) => (
              <div key={item.s} className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className={`text-[10px] font-mono px-2 py-0.5 ${step === item.s ? "bg-orange-400 text-black" : "text-white/20 border border-white/5"}`}>
                    0{item.s}
                  </div>
                  <span className={`text-[10px] font-mono uppercase tracking-[0.2em] ${step === item.s ? "text-white" : "text-white/10"}`}>
                    {item.label}
                  </span>
                </div>
                <div className={`h-[2px] w-full transition-all duration-700 ${step >= item.s ? "bg-orange-400" : "bg-white/5"}`} />
              </div>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.section key="step1" variants={fadeSlideUp} className="space-y-16">
                <div className="space-y-12">
                  <div className="flex justify-between items-end">
                    <h3 className="text-2xl font-display text-white uppercase tracking-widest">Pre-Lock Registry Audit</h3>
                    <span className="text-[10px] font-mono text-white/20 tracking-[0.3em] uppercase">
                      {checklist.filter((c) => c.status).length} / {checklist.length} Passed
                    </span>
                  </div>
                  <div className="divide-y divide-white/[0.02]">
                    {checklist.map((item) => (
                      <div key={item.id} className="py-10 flex items-center justify-between group">
                        <div className="flex gap-8 items-start">
                          <div className={`mt-1.5 ${item.status ? "text-attain" : "text-alert animate-pulse"}`}>
                            {item.status ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                          </div>
                          <div className="space-y-2">
                            <p className={`text-lg font-display ${item.status ? "text-white/60" : "text-white tracking-tight"}`}>
                               {item.label}
                            </p>
                            <p className="text-[10px] text-white/20 font-mono uppercase tracking-widest">
                               {item.status ? "Validation Succesful" : "Action Required"}
                            </p>
                          </div>
                        </div>
                        {!item.status && (
                          <span className="text-[9px] font-mono text-alert border border-alert/20 px-3 py-1 uppercase tracking-widest">Blocked</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => setStep(2)}
                  className="w-full py-6 border border-white/10 text-[10px] font-mono uppercase tracking-[0.4em] text-white hover:bg-orange-400 hover:text-black hover:border-orange-400 transition-all"
                >
                  Confirm Compliance & Proceed →
                </button>
              </motion.section>
            )}

            {step === 2 && (
              <motion.section key="step2" variants={fadeSlideUp} className="flex flex-col items-start gap-16 py-16">
                <div className="space-y-8">
                  <h3 className="text-4xl font-display text-white tracking-tight">Institutional <span className="text-white/20 text-3xl">Sign-Off</span></h3>
                  <p className="text-lg text-white/40 leading-relaxed font-light max-w-2xl italic">
                    The following action seals all departmental records for <strong>AY {ay.ay}</strong>. 
                    This freeze is permanent and satisfies criterion-based accreditation requirements for data integrity.
                  </p>
                </div>
                
                <div className="flex gap-12 pt-8">
                  <button onClick={() => setStep(1)} className="text-[10px] font-mono text-white/20 uppercase tracking-widest hover:text-white transition-colors">
                    Return to Checklist
                  </button>
                  <button 
                    onClick={() => !isAlreadyLocked && setStep(3)} 
                    disabled={isAlreadyLocked}
                    className="px-12 py-5 bg-orange-400 text-black text-[10px] font-mono uppercase tracking-[0.4em] font-bold hover:bg-orange-500 transition-all disabled:opacity-20"
                  >
                    Initiate Sealing Sequence
                  </button>
                </div>
              </motion.section>
            )}

            {step === 3 && (
              <motion.section key="step3" variants={fadeSlideUp} className="flex flex-col gap-16">
                <div className="space-y-12">
                  <div className="flex items-center gap-8">
                     <Fingerprint className="w-20 h-20 text-white/10" />
                     <div className="space-y-2">
                        <h3 className="text-3xl font-display text-white">Digital Signature</h3>
                        <p className="text-[10px] font-mono text-white/20 uppercase tracking-[0.3em]">Identity Authentication Required</p>
                     </div>
                  </div>
                  <div className="border-b border-white/10 pb-8">
                    <input
                      type="text"
                      placeholder="HOD-ID-FAC2024..."
                      className="w-full bg-transparent text-5xl font-display text-white outline-none placeholder:text-white/5 uppercase tracking-tighter"
                      value={digitalSign}
                      onChange={(e) => setDigitalSign(e.target.value)}
                    />
                  </div>
                </div>
                <button
                  disabled={!digitalSign || isAlreadyLocked}
                  onClick={handleSeal}
                  className={`w-full py-8 text-[10px] font-mono uppercase tracking-[0.5em] font-bold transition-all ${
                    !digitalSign || isAlreadyLocked
                      ? "bg-white/5 text-white/10"
                      : "bg-red-600 text-white hover:bg-red-700 shadow-2xl shadow-red-600/20"
                  }`}
                >
                  Seal & Archive Academic Year
                </button>
              </motion.section>
            )}
          </AnimatePresence>
        </div>

        {/* ── SUCCESS MODAL (Overlay) ── */}
        <AnimatePresence>
          {showSuccess && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-8 backdrop-blur-2xl"
            >
              <motion.div
                initial={{ scale: 0.9, y: 30 }}
                animate={{ scale: 1, y: 0 }}
                className="max-w-xl w-full text-center space-y-12"
              >
                <div className="relative">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring" }}
                    className="w-32 h-32 bg-attain/10 rounded-full border border-attain/30 flex items-center justify-center mx-auto relative z-10"
                  >
                    <CheckSquare className="w-16 h-16 text-attain" />
                  </motion.div>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-attain/20 rounded-full blur-[100px] -z-10" />
                </div>
                <div className="space-y-4">
                  <h2 className="text-4xl font-display text-white">
                    AY {ay.ay} Locked
                  </h2>
                  <p className="text-white/40 italic font-light">
                    The academic data has been securely archived. Current
                    visibility is set to read-only for all faculty members.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-6 bg-white/5 rounded-2xl border border-white/5">
                    <Archive className="w-6 h-6 text-brand mx-auto mb-4" />
                    <span className="text-[10px] font-mono text-white/20 uppercase">
                      Archive ID
                    </span>
                    <p className="text-sm text-white font-mono mt-2">
                      {`${ay.ay.replace("/", "")}-SEC1`}
                    </p>
                  </div>
                  <div className="p-6 bg-white/5 rounded-2xl border border-white/5">
                    <RefreshCcw className="w-6 h-6 text-orange-400 mx-auto mb-4" />
                    <span className="text-[10px] font-mono text-white/20 uppercase">
                      Next Cycle
                    </span>
                    <p className="text-sm text-white font-mono mt-2">
                      AY {activeAY}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => (window.location.href = "/dashboard")}
                  className="px-12 py-4 bg-white/10 text-white rounded-xl text-[10px] font-mono uppercase tracking-[0.3em] hover:bg-white/20 transition-all font-bold"
                >
                  Return to Dashboard
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AccessGate>
  );
}
