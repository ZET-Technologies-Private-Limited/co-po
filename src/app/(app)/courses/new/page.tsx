"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { CheckCircle2, ArrowRight, BookOpen, Building2, Hash, GraduationCap } from "lucide-react";
import { fadeSlideUp, staggerContainer } from "@/lib/animations";

const EXAM_TYPES = ["Theory", "Practical", "Theory + Practical"];
const SEMESTERS = Array.from({ length: 8 }, (_, i) => i + 1);
const DEPTS = ["Computer Science", "Electronics", "Mechanical", "Civil", "Information Technology"];
const STEPS = ["Details", "Configuration", "Confirm"];

export default function NewCoursePage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ name: "", code: "", dept: "", semester: 1, credits: 4, examType: "Theory", coCount: 5 });

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const submit = () => {
    // In a real app, would call the API here
    router.push("/courses");
  };

  return (
    <div className="w-full min-h-screen pb-24">
      <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="max-w-2xl mx-auto px-6 pt-12">

        {/* Step Indicator */}
        <motion.div variants={fadeSlideUp} className="flex items-center gap-0 mb-16">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center">
              <div className={`flex items-center gap-2 text-sm font-mono uppercase tracking-widest transition-colors ${i === step ? "text-white" : i < step ? "text-brand" : "text-white/30"}`}>
                {i < step ? <CheckCircle2 className="w-4 h-4" /> : <span className="w-4 h-4 rounded-full border border-current flex items-center justify-center text-[10px]">{i + 1}</span>}
                {s}
              </div>
              {i < STEPS.length - 1 && <div className={`w-12 h-[1px] mx-4 ${i < step ? "bg-brand" : "bg-white/10"}`} />}
            </div>
          ))}
        </motion.div>

        <AnimatePresence mode="wait">
          {/* Step 0: Course Details */}
          {step === 0 && (
            <motion.div key="s0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col gap-10">
              <div>
                <h1 className="text-4xl font-display text-white mb-2">Course Details</h1>
                <p className="text-white/50 font-light">Define the basic course identity.</p>
              </div>

              <div className="flex flex-col gap-8">
                <label className="flex flex-col gap-2">
                  <span className="text-xs font-mono text-white/50 uppercase tracking-widest flex items-center gap-2"><BookOpen className="w-3 h-3" /> Course Name</span>
                  <input value={form.name} onChange={e => set("name", e.target.value)} placeholder="Database Management Systems" className="bg-transparent border-b border-white/20 focus:border-white py-3 text-white placeholder-white/30 outline-none transition-colors text-xl" />
                </label>

                <label className="flex flex-col gap-2">
                  <span className="text-xs font-mono text-white/50 uppercase tracking-widest flex items-center gap-2"><Hash className="w-3 h-3" /> Course Code</span>
                  <input value={form.code} onChange={e => set("code", e.target.value)} placeholder="CS301" className="bg-transparent border-b border-white/20 focus:border-white py-3 text-white placeholder-white/30 outline-none transition-colors text-xl font-mono" />
                </label>

                <label className="flex flex-col gap-2">
                  <span className="text-xs font-mono text-white/50 uppercase tracking-widest flex items-center gap-2"><Building2 className="w-3 h-3" /> Department</span>
                  <select value={form.dept} onChange={e => set("dept", e.target.value)} className="bg-cosmic border-b border-white/20 focus:border-white py-3 text-white outline-none transition-colors text-xl cursor-pointer">
                    <option value="">Select department...</option>
                    {DEPTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </label>

                <label className="flex flex-col gap-2">
                  <span className="text-xs font-mono text-white/50 uppercase tracking-widest flex items-center gap-2"><GraduationCap className="w-3 h-3" /> Semester</span>
                  <div className="flex gap-3 flex-wrap mt-2">
                    {SEMESTERS.map(s => (
                      <button key={s} onClick={() => set("semester", s)}
                        className={`w-12 h-12 border font-mono text-lg transition-colors ${form.semester === s ? "border-brand text-brand" : "border-white/10 text-white/40 hover:border-white/40 hover:text-white"}`}>
                        {s}
                      </button>
                    ))}
                  </div>
                </label>
              </div>

              <button onClick={() => setStep(1)} className="flex items-center gap-3 text-white/80 hover:text-white group mt-4 transition-colors">
                Configure Exams <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </motion.div>
          )}

          {/* Step 1: Configuration */}
          {step === 1 && (
            <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col gap-10">
              <div>
                <h1 className="text-4xl font-display text-white mb-2">Configuration</h1>
                <p className="text-white/50 font-light">Set credits, exam type and expected CO count.</p>
              </div>

              <div className="flex flex-col gap-8">
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-mono text-white/50 uppercase tracking-widest">Exam Type</span>
                  <div className="flex flex-col gap-3 mt-2">
                    {EXAM_TYPES.map(t => (
                      <button key={t} onClick={() => set("examType", t)}
                        className={`flex items-center justify-between px-6 py-4 border text-left transition-all text-lg ${form.examType === t ? "border-brand text-white" : "border-white/10 text-white/50 hover:border-white/30 hover:text-white"}`}>
                        {t}
                        {form.examType === t && <CheckCircle2 className="w-5 h-5 text-brand" />}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-16">
                  <label className="flex flex-col gap-2">
                    <span className="text-xs font-mono text-white/50 uppercase tracking-widest">Credits</span>
                    <div className="flex gap-3 mt-2">
                      {[1,2,3,4,5,6].map(n => (
                        <button key={n} onClick={() => set("credits", n)} className={`w-12 h-12 border font-mono text-lg transition-colors ${form.credits === n ? "border-brand text-brand" : "border-white/10 text-white/40 hover:border-white/40"}`}>{n}</button>
                      ))}
                    </div>
                  </label>

                  <label className="flex flex-col gap-2">
                    <span className="text-xs font-mono text-white/50 uppercase tracking-widest">Expected COs</span>
                    <div className="flex gap-3 mt-2">
                      {[3,4,5,6,7].map(n => (
                        <button key={n} onClick={() => set("coCount", n)} className={`w-12 h-12 border font-mono text-lg transition-colors ${form.coCount === n ? "border-aurora text-aurora" : "border-white/10 text-white/40 hover:border-white/40"}`}>{n}</button>
                      ))}
                    </div>
                  </label>
                </div>
              </div>

              <div className="flex gap-8">
                <button onClick={() => setStep(0)} className="text-white/40 hover:text-white transition-colors text-sm">← Back</button>
                <button onClick={() => setStep(2)} className="flex items-center gap-3 text-white/80 hover:text-white group transition-colors">
                  Review <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 2: Confirm */}
          {step === 2 && (
            <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col gap-10">
              <div>
                <h1 className="text-4xl font-display text-white mb-2">Confirm Course</h1>
                <p className="text-white/50 font-light">Review your course before creating it.</p>
              </div>

              <div className="flex flex-col gap-0 border-t border-white/10">
                {[
                  ["Name", form.name || "—"],
                  ["Code", form.code || "—"],
                  ["Department", form.dept || "—"],
                  ["Semester", `Semester ${form.semester}`],
                  ["Credits", `${form.credits} credits`],
                  ["Exam Type", form.examType],
                  ["Expected COs", `${form.coCount} outcomes`],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between py-5 border-b border-white/10">
                    <span className="text-white/40 font-mono uppercase tracking-widest text-sm">{k}</span>
                    <span className="text-white font-medium">{v}</span>
                  </div>
                ))}
              </div>

              <div className="flex gap-8 items-center">
                <button onClick={() => setStep(1)} className="text-white/40 hover:text-white transition-colors text-sm">← Edit</button>
                <button onClick={submit} className="px-8 py-4 bg-white text-black font-medium text-sm hover:bg-white/90 transition-colors">
                  Create Course →
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
