"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Lock,
  ShieldCheck,
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
  const thresholds = useDataStore((s) => s.thresholds);
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
        className="flex flex-col gap-12 pb-40 max-w-4xl mx-auto"
      >
        <header className="flex flex-col gap-6 text-center items-center">
          <div
            className={`p-5 rounded-3xl transition-all duration-1000 ${
              isAlreadyLocked
                ? "bg-alert/10 border border-alert/20"
                : "bg-orange-400/10 border border-orange-400/20"
            }`}
          >
            <Lock
              className={`w-12 h-12 ${
                isAlreadyLocked ? "text-alert" : "text-orange-400"
              }`}
            />
          </div>
          <div>
            <h1 className="text-4xl font-display text-white italic">
              Year-End Academic Lock
            </h1>
            <p className="text-white/40 font-light mt-3 italic">
              {isAlreadyLocked
                ? `AY ${ay.ay} is locked. Data is read-only.`
                : `Freezing data for AY ${ay.ay} and initiating archival sequences.`}
            </p>
          </div>
        </header>

        <div className="relative">
          {/* Steps Indicator */}
          <div className="flex justify-between mb-12">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex flex-col items-center gap-3">
                <div
                  className={`w-12 h-12 rounded-full border flex items-center justify-center text-xs font-mono transition-all ${
                    step === s
                      ? "border-orange-400 bg-orange-400 text-black shadow-lg shadow-orange-400/20"
                      : step > s
                      ? "border-attain bg-attain text-white"
                      : "border-white/10 text-white/30"
                  }`}
                >
                  {step > s ? <ShieldCheck className="w-5 h-5" /> : s}
                </div>
                <span
                  className={`text-[10px] font-mono uppercase tracking-tighter ${
                    step === s ? "text-white" : "text-white/20"
                  }`}
                >
                  {s === 1 ? "Checklist" : s === 2 ? "Audit" : "Seal"}
                </span>
              </div>
            ))}
            <div className="absolute top-6 left-0 w-full h-[1px] bg-white/5 -z-10" />
          </div>

          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.section
                key="step1"
                variants={fadeSlideUp}
                className="space-y-8"
              >
                <div className="p-10 border border-white/10 bg-white/[0.01] rounded-[2.5rem] space-y-8">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-display text-white">
                      Pre-Lock Checklist
                    </h3>
                    <span className="text-[10px] font-mono text-white/20 uppercase">
                      {checklist.filter((c) => c.status).length}/
                      {checklist.length} Complete
                    </span>
                  </div>
                  <div className="space-y-4">
                    {checklist.map((item) => (
                      <div
                        key={item.id}
                        className="p-5 border border-white/5 bg-white/5 rounded-2xl flex items-center justify-between group"
                      >
                        <div className="flex items-center gap-6">
                          {item.status ? (
                            <CheckCircle2 className="w-5 h-5 text-attain" />
                          ) : (
                            <AlertTriangle className="w-5 h-5 text-alert animate-pulse" />
                          )}
                          <span
                            className={`text-sm ${
                              item.status
                                ? "text-white/60"
                                : "text-white font-bold"
                            }`}
                          >
                            {item.label}
                          </span>
                        </div>
                        {!item.status && (
                          <span className="px-3 py-1 bg-alert/10 text-alert rounded-lg text-[10px] font-mono uppercase tracking-widest">
                            Pending
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => setStep(2)}
                  className="w-full py-5 bg-orange-400 text-black rounded-[2rem] text-[10px] font-mono uppercase tracking-widest font-bold hover:bg-orange-500 transition-all shadow-2xl shadow-orange-400/10"
                >
                  Continue to Audit →
                </button>
              </motion.section>
            )}

            {step === 2 && (
              <motion.section
                key="step2"
                variants={fadeSlideUp}
                className="space-y-8 text-center"
              >
                <div className="p-20 border border-dashed border-white/10 rounded-[2.5rem] bg-white/[0.01] flex flex-col items-center gap-6">
                  <ShieldCheck className="w-16 h-16 text-brand" />
                  <h3 className="text-2xl font-display text-white">
                    Institutional Sign-Off Required
                  </h3>
                  <p className="text-sm text-white/30 max-w-sm leading-relaxed">
                    The following action will make all departmental data for{" "}
                    <strong>AY {ay.ay}</strong> read-only. This process is
                    irreversible without System Administrator override.
                  </p>
                  {isAlreadyLocked && (
                    <p className="text-[10px] font-mono text-alert uppercase tracking-widest">
                      This academic year is already locked.
                    </p>
                  )}
                  <div className="flex gap-4 mt-8">
                    <button
                      onClick={() => setStep(1)}
                      className="px-8 py-4 bg-white/5 text-white/40 rounded-xl text-[10px] font-mono uppercase tracking-widest hover:text-white transition-all"
                    >
                      Back to Checklist
                    </button>
                    <button
                      onClick={() => !isAlreadyLocked && setStep(3)}
                      disabled={isAlreadyLocked}
                      className="px-8 py-4 bg-brand text-white rounded-xl text-[10px] font-mono uppercase tracking-widest hover:bg-brand/80 transition-all font-bold disabled:opacity-40"
                    >
                      Initiate Sealing Sequence
                    </button>
                  </div>
                </div>
              </motion.section>
            )}

            {step === 3 && (
              <motion.section
                key="step3"
                variants={fadeSlideUp}
                className="space-y-8"
              >
                <div className="p-10 border border-white/10 bg-white/[0.02] rounded-[2.5rem] space-y-12">
                  <div className="flex flex-col items-center gap-6">
                    <Fingerprint className="w-16 h-16 text-orange-400 animate-pulse" />
                    <div className="text-center">
                      <h3 className="text-2xl font-display text-white">
                        Digital Signature Authentication
                      </h3>
                      <p className="text-[10px] font-mono text-white/20 uppercase tracking-widest mt-2">
                        Sign with Designation + Emp ID
                      </p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <input
                      type="text"
                      placeholder="HOD-CSE-FAC2024001"
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-6 px-8 text-xl font-display text-center text-white outline-none focus:border-orange-400 placeholder:text-white/10 font-mono tracking-widest uppercase"
                      value={digitalSign}
                      onChange={(e) => setDigitalSign(e.target.value)}
                    />
                    <p className="text-[9px] text-white/20 text-center uppercase tracking-widest italic">
                      Equated to physical signature for regulatory compliance
                      (Criterion 1-10)
                    </p>
                  </div>
                  <button
                    disabled={!digitalSign || isAlreadyLocked}
                    onClick={handleSeal}
                    className={`w-full py-6 rounded-[2rem] text-[10px] font-mono uppercase tracking-[0.4em] font-bold transition-all shadow-2xl ${
                      !digitalSign || isAlreadyLocked
                        ? "bg-white/5 text-white/10 cursor-not-allowed"
                        : "bg-red-600 text-white hover:bg-red-700 shadow-red-600/20"
                    }`}
                  >
                    Seal Academic Year & Archive
                  </button>
                </div>
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
