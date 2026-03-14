"use client";

import { useState, use } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, ArrowRight, Plus, Trash2, BrainCircuit, Info, Zap } from "lucide-react";
import { fadeSlideUp, staggerContainer } from "@/lib/animations";
import { EXAM_TYPES as SPEC_EXAM_TYPES } from "@/lib/appData";

const EXAM_TYPES = [
  { id: "formative", label: "Formative Assessment", desc: "Internal assessment throughout the semester including T1, T2, T3, and continuous evaluation assignments." },
  { id: "summative", label: "Summative Assessment", desc: "Formal end-of-semester final examination measuring comprehensive course attainment." },
];

const STEPS = ["Categorization", "Instantiation", "Quantification", "Validation"];

export default function ExamsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: courseId } = use(params);
  const [step, setStep] = useState(0);
  const [examType, setExamType] = useState("formative");
  const [instances, setInstances] = useState([
    { id: 1, name: "T1", maxMarks: 30, questions: 5 },
    { id: 2, name: "T2", maxMarks: 30, questions: 5 },
    { id: 3, name: "T3", maxMarks: 40, questions: 7 },
  ]);

  const addInstance = () => setInstances(prev => [...prev, { id: Date.now(), name: `T${prev.length + 1}`, maxMarks: 30, questions: 5 }]);
  const removeInstance = (id: number) => setInstances(prev => prev.filter(i => i.id !== id));
  const updateInstance = (id: number, key: string, value: any) => setInstances(prev => prev.map(i => i.id === id ? { ...i, [key]: value } : i));

  return (
    <div className="w-full min-h-screen pb-32 pt-4">
      <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="max-w-5xl mx-auto flex flex-col gap-20">

        {/* ── HERO SECTION ── */}
        <motion.section variants={fadeSlideUp} className="flex flex-col gap-8">
          <div className="flex items-center gap-3 text-sm font-mono text-attain uppercase tracking-widest">
            <span className="w-8 h-[1px] bg-attain" /> Structural Design
          </div>
          <div className="flex items-end justify-between flex-wrap gap-8">
            <div className="flex-1 min-w-[300px]">
              <h1 className="text-6xl md:text-7xl font-display font-medium text-white leading-tight tracking-tight">
                Exam<br />
                <span className="text-white/30">Configuration.</span>
              </h1>
              <p className="text-xl text-white/50 font-light mt-6 max-w-xl">
                 Defining the assessment architecture for <span className="text-white">{courseId.toUpperCase()}</span>.
              </p>
            </div>
            <div className="shrink-0 flex items-center gap-4 bg-white/[0.03] border border-white/10 px-6 py-4">
               <Zap className="w-4 h-4 text-attain animate-pulse" />
               <span className="text-xs font-mono uppercase tracking-widest text-white/40">Blueprint Mode Active</span>
            </div>
          </div>
        </motion.section>

        {/* ── SPEC: CIE/SEE REFERENCE PANEL ── */}
        <motion.section variants={fadeSlideUp} className="flex flex-col gap-4 border-t border-white/10 pt-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-mono text-white/30 uppercase tracking-widest mb-1">Assessment Structure (Spec v2.1)</p>
              <p className="text-white/50 font-light text-sm">Final CO Attainment = CIE × 0.40 + SEE × 0.60</p>
            </div>
            <div className="flex items-center gap-6 text-xs font-mono">
              <span className="flex items-center gap-2"><span className="w-3 h-3 bg-brand"></span> CIE — 40%</span>
              <span className="flex items-center gap-2"><span className="w-3 h-3 bg-aurora"></span> SEE — 60%</span>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {SPEC_EXAM_TYPES.map(et => (
              <div key={et.code} className={`p-4 border ${
                et.group === "SEE" ? "border-aurora/20 bg-aurora/5" : "border-brand/20 bg-brand/5"
              }`}>
                <p className={`text-lg font-mono font-bold ${et.group === "SEE" ? "text-aurora" : "text-brand"}`}>{et.code}</p>
                <p className="text-white/60 text-xs font-light mt-1">{et.name}</p>
                <p className="text-[10px] font-mono text-white/30 mt-2">/{et.maxMarks} marks</p>
                {et.code === "T5" && <p className="text-[10px] font-mono text-white/20 mt-1">Scaled →{et.scaledMax}</p>}
              </div>
            ))}
          </div>
        </motion.section>

        {/* ── STEP INDICATOR (FLAT) ── */}
        <motion.section variants={fadeSlideUp} className="flex flex-wrap items-center gap-y-6">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center">
              <button onClick={() => i <= step && setStep(i)} 
                className={`flex items-center gap-3 text-[10px] font-mono uppercase tracking-widest transition-all ${i === step ? "text-white" : i < step ? "text-attain" : "text-white/20"}`}>
                {i < step ? <CheckCircle2 className="w-3 h-3" /> : <span className="w-4 h-4 rounded-full border border-current flex items-center justify-center text-[8px]">{i+1}</span>}
                {s}
              </button>
              {i < STEPS.length - 1 && <div className={`w-12 md:w-20 h-[1px] mx-6 ${i < step ? "bg-attain/30" : "bg-white/5"}`} />}
            </div>
          ))}
        </motion.section>

        <AnimatePresence mode="wait">
          {/* STEP 0: TYPE SELECTION */}
          {step === 0 && (
            <motion.section key="s0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col gap-12">
              <div className="flex flex-col gap-2">
                 <h2 className="text-3xl font-display text-white">Select Assessment Category</h2>
                 <p className="text-white/40 font-light">Determine the fundamental nature of this examination suite.</p>
              </div>
              <div className="flex flex-col border-t border-white/10">
                {EXAM_TYPES.map(t => (
                  <button key={t.id} onClick={() => setExamType(t.id)}
                    className={`flex flex-col md:flex-row md:items-center gap-6 md:gap-16 py-10 transition-all border-b border-white/10 group hover:pl-4 ${examType === t.id ? "bg-white/[0.02]" : ""}`}>
                    <div className="w-6 shrink-0 flex justify-center">
                       <div className={`w-4 h-4 rounded-full border-2 transition-all ${examType === t.id ? "border-attain bg-attain" : "border-white/20 group-hover:border-white/40"}`} />
                    </div>
                    <div className="flex-1">
                      <p className={`text-2xl font-display transition-colors ${examType === t.id ? "text-attain" : "text-white/70 group-hover:text-white"}`}>{t.label}</p>
                      <p className="text-white/30 text-sm mt-3 font-light leading-relaxed max-w-2xl">{t.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
              <div className="flex justify-start pt-6">
                 <button onClick={() => setStep(1)} className="group flex items-center gap-6 px-10 py-5 bg-white text-black font-medium text-sm hover:bg-white/90 transition-all uppercase tracking-widest font-mono">
                   Proceed to Instantiation <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
                 </button>
              </div>
            </motion.section>
          )}

          {/* STEP 1: INSTANCES */}
          {step === 1 && (
            <motion.section key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col gap-12">
              <div className="flex flex-col gap-2">
                 <h2 className="text-3xl font-display text-white">Define Instances</h2>
                 <p className="text-white/40 font-light">Categorize individual examinations within the {examType} framework.</p>
              </div>

              <div className="flex flex-col divide-y divide-white/10 border-t border-white/10">
                {instances.map((inst, i) => (
                  <div key={inst.id} className="flex flex-col md:flex-row md:items-center gap-8 py-10 group">
                    <div className="flex items-center gap-6 min-w-[150px]">
                       <span className="text-3xl font-mono text-white/10 group-hover:text-white/20 transition-colors">{i+1}</span>
                       <input value={inst.name} onChange={e => updateInstance(inst.id, "name", e.target.value)}
                         className="bg-transparent border-b border-white/10 text-white font-display text-2xl w-24 outline-none focus:border-attain transition-colors" />
                    </div>
                    <div className="flex-1 flex gap-10">
                      <div className="flex-1 flex flex-col gap-2">
                        <span className="text-[10px] text-white/25 font-mono uppercase tracking-widest">Upper Limit (Marks)</span>
                        <input type="number" value={inst.maxMarks} onChange={e => updateInstance(inst.id, "maxMarks", +e.target.value)}
                          className="bg-transparent border-b border-white/5 text-white font-mono text-lg outline-none w-full focus:border-white/30 transition-colors py-2" />
                      </div>
                      <div className="flex-1 flex flex-col gap-2">
                        <span className="text-[10px] text-white/25 font-mono uppercase tracking-widest">Question Quantity</span>
                        <input type="number" value={inst.questions} onChange={e => updateInstance(inst.id, "questions", +e.target.value)}
                          className="bg-transparent border-b border-white/5 text-white font-mono text-lg outline-none w-full focus:border-white/30 transition-colors py-2" />
                      </div>
                    </div>
                    <button onClick={() => removeInstance(inst.id)} className="w-12 h-12 flex items-center justify-center border border-white/5 text-white/10 hover:border-alert hover:text-alert transition-all">
                       <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex flex-col md:flex-row justify-between items-center gap-8 pt-6">
                <button onClick={addInstance} className="flex items-center gap-3 text-white/30 hover:text-white transition-all font-mono text-[10px] uppercase tracking-widest border border-white/10 px-6 py-3 hover:border-white/30">
                  <Plus className="w-3 h-3" /> Append New Instance
                </button>
                <div className="flex items-center gap-10">
                  <button onClick={() => setStep(0)} className="text-[10px] font-mono text-white/30 hover:text-white transition-colors uppercase tracking-widest">← Reverse</button>
                  <button onClick={() => setStep(2)} className="group flex items-center gap-6 px-10 py-5 bg-white text-black font-medium text-sm hover:bg-white/90 transition-all uppercase tracking-widest font-mono">
                    Compute Metrics <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
                  </button>
                </div>
              </div>
            </motion.section>
          )}

          {/* STEP 2: QUANTIFICATION (MARKS) */}
          {step === 2 && (
            <motion.section key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col gap-12">
              <div className="flex flex-col gap-2">
                 <h2 className="text-3xl font-display text-white">Quantification Matrix</h2>
                 <p className="text-white/40 font-light">Evaluating marks-per-question density across all instances.</p>
              </div>

              <div className="flex flex-col border-t border-white/10">
                {instances.map(inst => (
                  <div key={inst.id} className="flex items-center justify-between py-10 border-b border-white/10 group">
                    <span className="text-2xl font-display text-white group-hover:text-attain transition-colors">{inst.name}</span>
                    <div className="flex gap-12 font-mono text-xs uppercase tracking-widest">
                       <div className="flex flex-col gap-1 items-end">
                          <span className="text-white/20">Cap</span>
                          <span className="text-white">{inst.maxMarks}</span>
                       </div>
                       <div className="flex flex-col gap-1 items-end">
                          <span className="text-white/20">Questions</span>
                          <span className="text-white">{inst.questions}</span>
                       </div>
                       <div className="flex flex-col gap-1 items-end">
                          <span className="text-white/20">Density</span>
                          <span className="text-attain">{(inst.maxMarks / inst.questions).toFixed(1)} Pts/Q</span>
                       </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="flex items-center justify-between py-6 px-10 bg-white/[0.03] border border-white/10">
                 <span className="text-xs font-mono uppercase tracking-widest text-white/40">Total Cumulative Marks</span>
                 <span className="text-3xl font-mono text-white">{instances.reduce((a, i) => a + i.maxMarks, 0)}</span>
              </div>

              <div className="flex justify-between items-center pt-10">
                <button onClick={() => setStep(1)} className="text-[10px] font-mono text-white/30 hover:text-white transition-colors uppercase tracking-widest">← Reverse</button>
                <button onClick={() => setStep(3)} className="group flex items-center gap-6 px-10 py-5 bg-white text-black font-medium text-sm hover:bg-white/90 transition-all uppercase tracking-widest font-mono">
                  Final Validation <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
                </button>
              </div>
            </motion.section>
          )}

          {/* STEP 3: VALIDATION */}
          {step === 3 && (
            <motion.section key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col gap-12">
              <div className="flex flex-col gap-2">
                 <h2 className="text-3xl font-display text-white">Core Validation</h2>
                 <p className="text-white/40 font-light">Confirming final assessment architecture before system deployment.</p>
              </div>
              
              <div className="flex flex-col border-y border-white/10">
                <div className="flex justify-between py-10 border-b border-white/5">
                  <span className="text-white/30 font-mono text-[10px] uppercase tracking-widest">Design Category</span>
                  <span className="text-xl font-display text-white">{EXAM_TYPES.find(t => t.id === examType)?.label}</span>
                </div>
                <div className="flex justify-between py-10 border-b border-white/5">
                  <span className="text-white/30 font-mono text-[10px] uppercase tracking-widest">Active Instances</span>
                  <div className="flex gap-4">
                     {instances.map(i => (
                       <span key={i.id} className="px-3 py-1 bg-white/5 border border-white/10 text-white/60 font-mono text-xs">{i.name}</span>
                     ))}
                  </div>
                </div>
                <div className="flex justify-between py-10 border-b border-white/5">
                  <span className="text-white/30 font-mono text-[10px] uppercase tracking-widest">Cumulative Capacity</span>
                  <span className="text-2xl font-mono text-white">{instances.reduce((a, i) => a + i.maxMarks, 0)} Pts</span>
                </div>
              </div>
              
              <div className="flex items-start gap-6 py-10">
                 <div className="w-1.5 h-1.5 rounded-full bg-attain mt-2 shrink-0 animate-pulse" />
                 <p className="text-white/40 text-sm font-light leading-relaxed">
                    By confirming this configuration, the system will initialize CO mapping matrices for all {instances.length} instances. Individual question papers can be uploaded post-verification.
                 </p>
              </div>

              <div className="flex justify-between items-center pt-6">
                <button onClick={() => setStep(2)} className="text-[10px] font-mono text-white/30 hover:text-white transition-colors uppercase tracking-widest">← Reverse</button>
                <button className="group flex items-center gap-6 px-12 py-6 bg-attain text-white font-medium text-sm hover:bg-attain/90 transition-all uppercase tracking-widest font-mono shadow-[0_0_30px_rgba(5,150,105,0.2)]">
                  Confirm Architecture <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
                </button>
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
