"use client";

import { use, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronLeft, Settings, ListPlus, Calendar, 
  Plus, Trash2, Save, Info, AlertCircle, 
  Layers, CheckCircle2, ChevronRight, LayoutGrid
} from "lucide-react";
import Link from "next/link";
import { fadeSlideUp, staggerContainer } from "@/lib/animations";
import { useDataStore, ExamConfig, ExamQuestion } from "@/lib/dataStore";
import { useAuthStore } from "@/lib/authStore";
import { useUIStore } from "@/lib/uiStore";
import { BLOOMS_LEVELS } from "@/lib/computations";

const ASSESSMENT_TYPES = [
  { id: "t1",  name: "Term Exam 1", max: 20 },
  { id: "t2",  name: "Term Exam 2", max: 20 },
  { id: "t3",  name: "Term Exam 3", max: 20 },
  { id: "lab", name: "Internal Lab", max: 30 },
  { id: "see", name: "Semester End Exam", max: 100 },
];

export default function ExamConfigPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: courseId } = use(params);
  const { addToast }      = useUIStore();
  const { user }          = useAuthStore();
  const courses           = useDataStore(s => s.courses);
  const cos               = useDataStore(s => s.cos[courseId] || []);
  const examConfigs       = useDataStore(s => s.examConfigs[courseId] || []);
  const addExamConfig     = useDataStore(s => s.addExamConfig);

  const course = courses.find(c => c.id === courseId);

  // Local State
  const [step, setStep] = useState(1);
  const [config, setConfig] = useState<Partial<ExamConfig>>({
    id: "",
    name: "",
    maxMarks: 0,
    weightage: 0,
    date: "",
    questions: []
  });

  // Derived
  const totalQMarks = useMemo(() => 
    config.questions?.reduce((sum, q) => sum + q.maxMarks, 0) || 0, 
    [config.questions]);

  const handleAddQuestion = () => {
    const qCount = (config.questions?.length || 0) + 1;
    const newQ: ExamQuestion = {
      qno: `Q${qCount}`,
      maxMarks: 5,
      co: cos[0]?.co || "CO1",
      bloomCode: "L1",
      type: "compulsory"
    };
    setConfig(p => ({ ...p, questions: [...(p.questions || []), newQ] }));
  };

  const handleRemoveQuestion = (idx: number) => {
    setConfig(p => ({ ...p, questions: p.questions?.filter((_, i) => i !== idx) }));
  };

  const updateQuestion = (idx: number, patch: Partial<ExamQuestion>) => {
    setConfig(p => ({
      ...p,
      questions: p.questions?.map((q, i) => i === idx ? { ...q, ...patch } : q)
    }));
  };

  const saveConfig = () => {
    if (!config.id || !config.name || (config.questions?.length || 0) === 0) {
      addToast("Please complete all required fields and add at least one question.", "warning");
      return;
    }
    if (totalQMarks !== config.maxMarks) {
      addToast(`Sum of question marks (${totalQMarks}) must match exam maximum (${config.maxMarks}).`, "error");
      return;
    }

    addExamConfig(courseId, config as ExamConfig);
    addToast(`${config.name} configured successfully!`, "success");
    setStep(1);
    setConfig({ id: "", name: "", maxMarks: 0, weightage: 0, date: "", questions: [] });
  };

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="max-w-6xl mx-auto pb-32">
      
      {/* Header */}
      <motion.div variants={fadeSlideUp} className="mb-10">
        <Link href={`/courses/${courseId}`} className="flex items-center gap-2 text-white/30 hover:text-white transition-colors text-[10px] font-mono uppercase tracking-widest mb-4">
          <ChevronLeft className="w-3.5 h-3.5" /> Back to Dashboard
        </Link>
        <div className="flex justify-between items-end gap-6 flex-wrap">
          <div>
            <h1 className="text-4xl font-display text-white mb-2">Exam Configuration</h1>
            <p className="text-white/40 font-light italic">{course?.name} · {examConfigs.length} exams configured</p>
          </div>
          <div className="flex gap-4">
             <div className="flex items-center gap-1">
                {[1, 2].map(i => (
                  <div key={i} className={`h-1.5 rounded-full transition-all ${step >= i ? "w-8 bg-brand" : "w-2 bg-white/10"}`} />
                ))}
             </div>
          </div>
        </div>
      </motion.div>

      {/* Step Container */}
      <div className="bg-white/[0.01] border border-white/10 rounded-2xl overflow-hidden p-8">
        
        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.div key="step1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
              className="flex flex-col gap-10">
              <div className="flex items-center gap-3 border-b border-white/5 pb-6">
                <Settings className="w-5 h-5 text-brand" />
                <h2 className="text-xl font-display text-white">Section A: Assessment Setup</h2>
              </div>
              
              <div className="grid md:grid-cols-2 gap-10">
                <div className="flex flex-col gap-6">
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Assessment Type</label>
                    <div className="grid grid-cols-3 gap-2">
                      {ASSESSMENT_TYPES.map(t => (
                        <button key={t.id} 
                          onClick={() => setConfig(p => ({ ...p, id: t.id, name: t.name, maxMarks: t.max }))}
                          className={`px-3 py-2.5 rounded text-[10px] font-mono uppercase transition-all border ${
                            config.id === t.id ? "bg-brand/20 border-brand text-white" : "bg-white/5 border-white/10 text-white/40 hover:border-white/30"
                          }`}>
                          {t.id}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Exam Name</label>
                    <input type="text" value={config.name} onChange={e => setConfig(p => ({ ...p, name: e.target.value }))}
                      placeholder="e.g. Unit Test 1"
                      className="bg-black/40 border border-white/10 p-3 text-white text-sm outline-none focus:border-brand/50 rounded transition-all" />
                  </div>
                </div>

                <div className="flex flex-col gap-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Max Marks</label>
                      <input type="number" value={config.maxMarks || ""} onChange={e => setConfig(p => ({ ...p, maxMarks: parseInt(e.target.value) || 0 }))}
                        className="bg-black/40 border border-white/10 p-3 text-white text-sm outline-none focus:border-brand/50 rounded transition-all" />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Weightage %</label>
                      <input type="number" value={config.weightage || ""} onChange={e => setConfig(p => ({ ...p, weightage: parseInt(e.target.value) || 0 }))}
                        className="bg-black/40 border border-white/10 p-3 text-white text-sm outline-none focus:border-brand/50 rounded transition-all" />
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Date of Examination</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                      <input type="date" value={config.date} onChange={e => setConfig(p => ({ ...p, date: e.target.value }))}
                        className="w-full bg-black/40 border border-white/10 pl-10 pr-3 py-3 text-white text-sm outline-none focus:border-brand/50 rounded transition-all" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-6 border-t border-white/5">
                <button onClick={() => setStep(2)} disabled={!config.id || !config.name}
                  className="px-8 py-3 bg-brand text-white text-[11px] font-mono uppercase tracking-widest rounded flex items-center gap-3 hover:bg-brand/90 transition-all disabled:opacity-30">
                  Configure Questions <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="flex flex-col gap-10">
              <div className="flex items-center justify-between border-b border-white/5 pb-6">
                <div className="flex items-center gap-3">
                  <ListPlus className="w-5 h-5 text-brand" />
                  <h2 className="text-xl font-display text-white">Section B: Question Mapping</h2>
                </div>
                <div className={`px-4 py-1.5 rounded-full text-[10px] font-mono uppercase ${totalQMarks === config.maxMarks ? "bg-attain/10 text-attain border border-attain/30" : "bg-white/5 text-white/40 border border-white/10"}`}>
                   Total: {totalQMarks} / {config.maxMarks} Marks
                </div>
              </div>

              {/* Question Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="text-[10px] font-mono text-white/20 uppercase tracking-widest">
                    <tr>
                      <th className="pb-4 pr-4">Q No.</th>
                      <th className="pb-4 pr-4">Marks</th>
                      <th className="pb-4 pr-4">Type</th>
                      <th className="pb-4 pr-4">Map CO</th>
                      <th className="pb-4 pr-4">BT Level</th>
                      <th className="pb-4 shrink-0"></th>
                    </tr>
                  </thead>
                  <tbody className="space-y-3">
                    {config.questions?.map((q, i) => (
                      <tr key={i} className="group hover:bg-white/[0.02] transition-all">
                        <td className="py-2 pr-4">
                          <input type="text" value={q.qno} onChange={e => updateQuestion(i, { qno: e.target.value })}
                            className="w-16 bg-black/40 border border-white/10 p-2 text-white text-xs rounded outline-none focus:border-brand/40" />
                        </td>
                        <td className="py-2 pr-4">
                          <input type="number" value={q.maxMarks} onChange={e => updateQuestion(i, { maxMarks: parseInt(e.target.value) || 0 })}
                            className="w-16 bg-black/40 border border-white/10 p-2 text-white text-xs rounded outline-none focus:border-brand/40" />
                        </td>
                        <td className="py-2 pr-4">
                          <select value={q.type} onChange={e => updateQuestion(i, { type: e.target.value as any })}
                            className="bg-black/40 border border-white/10 p-2 text-white text-xs rounded outline-none w-32">
                            <option value="compulsory">Compulsory</option>
                            <option value="either-or">Either-Or</option>
                            <option value="optional">Optional</option>
                          </select>
                        </td>
                        <td className="py-2 pr-4">
                          <select value={q.co} onChange={e => updateQuestion(i, { co: e.target.value })}
                            className="bg-black/40 border border-white/10 p-2 text-white text-xs rounded outline-none w-24">
                            {cos.map(c => <option key={c.co} value={c.co}>{c.co}</option>)}
                          </select>
                        </td>
                        <td className="py-2 pr-4">
                          <select value={q.bloomCode} onChange={e => updateQuestion(i, { bloomCode: e.target.value })}
                            className="bg-black/40 border border-white/10 p-2 text-white text-xs rounded outline-none w-24">
                            {BLOOMS_LEVELS.map(b => <option key={b.code} value={b.code}>{b.code}</option>)}
                          </select>
                        </td>
                        <td className="py-2 text-right">
                          <button onClick={() => handleRemoveQuestion(i)} className="p-2 text-white/20 hover:text-alert transition-all">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <button onClick={handleAddQuestion}
                  className="mt-6 flex items-center gap-2 text-brand text-[10px] font-mono uppercase tracking-widest hover:underline">
                  <Plus className="w-3.5 h-3.5" /> Add Question
                </button>
              </div>

              <div className="flex justify-between pt-10 border-t border-white/5">
                <button onClick={() => setStep(1)}
                  className="px-6 py-3 border border-white/10 text-white/40 hover:text-white transition-all text-[11px] font-mono uppercase tracking-widest rounded">
                  Back to Section A
                </button>
                <button onClick={saveConfig}
                  className="px-8 py-3 bg-brand text-white text-[11px] font-mono uppercase tracking-widest rounded flex items-center gap-3 hover:bg-brand/90 transition-all shadow-xl">
                  <Save className="w-4 h-4" /> Finalize Exam Paper
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Already Configured Exams */}
      {examConfigs.length > 0 && (
        <motion.div variants={fadeSlideUp} className="mt-20">
           <h2 className="text-[10px] font-mono text-white/20 uppercase tracking-widest mb-6">Existing Configurations</h2>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {examConfigs.map(ex => (
                <div key={ex.id} className="p-6 bg-white/[0.02] border border-white/5 rounded-xl flex items-center justify-between">
                   <div>
                      <p className="text-xs font-bold text-white mb-1">{ex.name}</p>
                      <p className="text-[10px] text-white/30 font-mono tracking-tight">{ex.questions.length} Questions · {ex.maxMarks} Marks</p>
                   </div>
                   <div className="p-2 rounded bg-white/5 text-brand"><LayoutGrid className="w-4 h-4" /></div>
                </div>
              ))}
           </div>
        </motion.div>
      )}

    </motion.div>
  );
}
