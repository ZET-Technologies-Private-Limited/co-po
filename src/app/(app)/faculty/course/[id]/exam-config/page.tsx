"use client";

import { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Settings, Save, Plus, Trash2, ArrowRight, Layers, AlertTriangle, Link2 } from "lucide-react";
import { useDataStore, ExamConfig, QuestionDef } from "@/lib/dataStore";
import { AccessGate } from "@/components/auth/AccessGate";
import { fadeSlideUp } from "@/lib/animations";
import { useUIStore } from "@/lib/uiStore";

const UNITS = ["Unit 1", "Unit 2", "Unit 3", "Unit 4", "Unit 5"];
const PARTS = ["None", "Part A", "Part B", "Part C"];
const Q_TYPES: Array<"compulsory" | "either-or" | "optional"> = ["compulsory", "either-or", "optional"];
const ASSESSMENT_CODES = ["T1", "T2", "T3", "T4", "T5", "SEE"];

export default function ExamConfigPage() {
  const { id }    = useParams();
  const router    = useRouter();
  const courseId  = id as string;

  const courses       = useDataStore(s => s.courses);
  const course        = useMemo(() => courses.find(c => c.id === courseId), [courses, courseId]);
  const cos           = useDataStore(s => s.cos[courseId] || []);
  const addExamConfig = useDataStore(s => s.addExamConfig);
  const setExamConfig = useDataStore(s => s.setExamConfig);
  const setQuestions  = useDataStore(s => s.setQuestions);
  const deleteExam    = useDataStore(s => s.deleteExamConfig);
  const submissions   = useDataStore(s => s.submissions[courseId] || []);
  const examConfigs   = useDataStore(s => s.examConfigs[courseId] || []);
  const ay            = useDataStore(s => s.ay);
  const { addToast }  = useUIStore();

  const existingExams = examConfigs;

  const [activeTab, setActiveTab] = useState<string>(existingExams[0]?.id || "new");
  const [config, setConfig]       = useState<Partial<ExamConfig>>(
    existingExams.find(e => e.id === activeTab) ||
    { id: "t1", name: "T1 - Unit Test 1", maxMarks: 20, status: "draft", questions: [], group: "CIE", weightage: 25 }
  );
  const [questions, setQuestionsLocal] = useState<QuestionDef[]>(config.questions || []);

  const switchTab = (examId: string) => {
    setActiveTab(examId);
    const exam = existingExams.find(e => e.id === examId);
    if (exam) { setConfig(exam); setQuestionsLocal(exam.questions || []); }
    else { setConfig({ id: `t${existingExams.length + 1}`, group: "CIE", status: "draft", weightage: 25 }); setQuestionsLocal([]); }
  };

  const handleSave = () => {
    if (!config.id || !config.name || !config.maxMarks || !config.group) {
      addToast("Please fill all required exam fields before saving.", "error");
      return;
    }
    if (config.group === "SEE") {
      config.maxMarks = 100;
    }
    if (activeTab === "new") {
      addExamConfig(courseId, { ...(config as ExamConfig), questions });
      addToast("Assessment added.", "success");
    } else {
      setExamConfig(courseId, activeTab, config);
      setQuestions(courseId, activeTab, questions);
      addToast("Assessment updated.", "success");
    }
  };

  const addQuestion = () => {
    const nextQ = `Q${questions.length + 1}`;
    setQuestionsLocal([...questions, { qno: nextQ, co: cos[0]?.co || "CO1", maxMarks: 5, type: "compulsory", part: "None" } as any]);
  };

  const updateQuestion = (idx: number, patch: Partial<QuestionDef & { part?: string }>) => {
    const updated = [...questions];
    updated[idx] = { ...updated[idx], ...patch };
    setQuestionsLocal(updated);
  };

  const removeQuestion = (idx: number) => setQuestionsLocal(questions.filter((_, i) => i !== idx));

  // Either-Or groups: questions with same eitherOrGroup are paired
  const eitherOrGroups = useMemo(() => {
    const groups: Record<string, number[]> = {};
    questions.forEach((q, i) => {
      if (q.type === "either-or" && q.eitherOrGroup) {
        if (!groups[q.eitherOrGroup]) groups[q.eitherOrGroup] = [];
        groups[q.eitherOrGroup].push(i);
      }
    });
    return groups;
  }, [questions]);

  const getGroupColor = (group: string) => {
    const colors = ["border-l-brand", "border-l-insight", "border-l-aurora", "border-l-attain"];
    const keys = Object.keys(eitherOrGroups);
    return colors[keys.indexOf(group) % colors.length];
  };

  const cieTotal = useMemo(
    () => examConfigs.filter(e => e.group === "CIE").reduce((s, e) => s + (e.weightage || 0), 0),
    [examConfigs],
  );

  const hasMarksForExam = (examId: string) =>
    submissions.some(s => s.examId === examId && s.students.length > 0);

  const handleDeleteExam = (examId: string) => {
    if (hasMarksForExam(examId)) return;
    if (!confirm("Delete this assessment? This cannot be undone.")) return;
    deleteExam(courseId, examId);
    addToast("Assessment deleted.", "success");
  };

  return (
    <AccessGate feature="exam_config" deny="lock">
      <div className="max-w-6xl mx-auto flex flex-col gap-0 pb-32">

        {/* Header */}
        <div className="flex justify-between items-end pb-8 border-b border-white/5">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-mono text-brand uppercase tracking-widest mb-3">
              <span className="w-8 h-[1px] bg-brand" /> Assessment Architecture
            </div>
            <h1 className="text-4xl font-display text-white">{course?.name}</h1>
            <p className="text-white/40 font-light mt-1">
              Configure exam structure, CO mapping, and question weighting.
            </p>
          </div>
          <button onClick={() => router.push(`/faculty/course/${courseId}/question-analyser`)}
            className="px-5 py-2.5 border border-white/10 text-white/60 text-xs font-mono uppercase tracking-widest hover:border-white/30 hover:text-white transition-colors flex items-center gap-2">
            AI Question Analyser <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Exam list overview */}
        <div className="px-0 pt-6">
          <div className="flex items-center justify-between mb-3 px-0">
            <h2 className="text-[10px] font-mono text-white/30 uppercase tracking-widest">
              Assessments Summary
            </h2>
            <button
              onClick={() => switchTab("new")}
              className="text-[10px] font-mono text-brand hover:text-white flex items-center gap-1"
            >
              <Plus className="w-3 h-3" /> Add Assessment
            </button>
          </div>
          <div className="overflow-x-auto border border-white/10 rounded-lg mb-6">
            <table className="w-full border-collapse text-xs">
              <thead className="bg-white/[0.02]">
                <tr>
                  {[
                    "Exam Code",
                    "Exam Name",
                    "Type",
                    "Max Marks",
                    "Weightage %",
                    "Exam Date",
                    "Questions Configured",
                    "Marks Status",
                    "Actions",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-3 py-2 text-[9px] font-mono text-white/30 uppercase tracking-widest text-left"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {examConfigs.map((e) => {
                  const code = e.id.toUpperCase();
                  const cieOrSee = e.group === "SEE" ? "SEE" : "CIE";
                  const qsCount = e.questions.length;
                  const sub = submissions.find((s) => s.examId === e.id);
                  let statusText = "Not Configured";
                  let statusColor = "text-white/30";
                  if (qsCount > 0) {
                    statusText = "Configured";
                  }
                  if (sub) {
                    if (sub.status === "draft") {
                      statusText = "Marks Uploaded";
                      statusColor = "text-amber-400";
                    } else if (sub.status === "approved") {
                      statusText = "Approved";
                      statusColor = "text-attain";
                    } else if (sub.status === "returned") {
                      statusText = "Returned";
                      statusColor = "text-alert";
                    }
                  }
                  const marksStatusLabel = statusText;
                  const canDelete = !hasMarksForExam(e.id);
                  return (
                    <tr key={e.id} className="border-t border-white/10">
                      <td className="px-3 py-2 font-mono text-white/60">
                        {code}
                      </td>
                      <td className="px-3 py-2 text-white/70">{e.name}</td>
                      <td className="px-3 py-2 text-white/50">{cieOrSee}</td>
                      <td className="px-3 py-2 text-white/50">
                        {e.maxMarks}
                      </td>
                      <td className="px-3 py-2 text-white/50">
                        {e.weightage ?? 0}
                      </td>
                      <td className="px-3 py-2 text-white/40">
                        {(e as any).date || "—"}
                      </td>
                      <td className="px-3 py-2 text-white/50">{qsCount}</td>
                      <td className="px-3 py-2">
                        <span
                          className={`text-[10px] font-mono ${statusColor}`}
                        >
                          {marksStatusLabel}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-wrap gap-2 text-[10px] font-mono">
                          <button
                            onClick={() => switchTab(e.id)}
                            className="text-brand hover:text-white"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() =>
                              router.push(
                                `/faculty/course/${courseId}/question-analyser`,
                              )
                            }
                            className="text-aurora hover:text-white"
                          >
                            Analyse Questions
                          </button>
                          <button
                            disabled={!canDelete}
                            onClick={() => handleDeleteExam(e.id)}
                            className={`flex items-center gap-1 ${
                              canDelete
                                ? "text-alert hover:text-white"
                                : "text-white/20 cursor-not-allowed"
                            }`}
                          >
                            <Trash2 className="w-3 h-3" />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {examConfigs.length === 0 && (
                  <tr>
                    <td
                      colSpan={9}
                      className="px-3 py-6 text-center text-xs text-white/30"
                    >
                      No assessments configured yet. Use &quot;Add Assessment&quot;
                      to create one.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between text-[10px] font-mono text-white/40 mb-4 px-1">
            <span>
              CIE Weightage Total:{" "}
              <span
                className={
                  cieTotal === 100 ? "text-attain" : "text-alert font-medium"
                }
              >
                {cieTotal}%
              </span>{" "}
              (Target: 100%)
            </span>
            <span className="text-white/30">
              {examConfigs
                .filter((e) => (e as any).date)
                .sort(
                  (a, b) =>
                    new Date((a as any).date || "").getTime() -
                    new Date((b as any).date || "").getTime(),
                )
                .map((e) => {
                  const label = e.id.toUpperCase();
                  const dateStr = (e as any).date
                    ? new Date((e as any).date).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                      })
                    : "";
                  return `${label} (${dateStr})`;
                })
                .join("  →  ")}
            </span>
          </div>
        </div>

        {/* Exam tabs */}
        <div className="flex border-b border-white/5">
          {existingExams.map(e => (
            <button key={e.id} onClick={() => switchTab(e.id)}
              className={`px-6 py-4 text-[10px] font-mono uppercase tracking-widest border-b-2 transition-all ${
                activeTab === e.id ? "border-brand text-brand" : "border-transparent text-white/30 hover:text-white"
              }`}>
              {e.name.split("—")[0].trim()}
            </button>
          ))}
          <button onClick={() => switchTab("new")}
            className="px-6 py-4 text-[10px] font-mono uppercase tracking-widest text-white/20 hover:text-white flex items-center gap-2 border-b-2 border-transparent">
            <Plus className="w-3 h-3" /> New
          </button>
        </div>

        <div className="flex gap-0 divide-x divide-white/5 mt-0">

          {/* ── LEFT: METADATA ── */}
          <div className="w-72 shrink-0 flex flex-col divide-y divide-white/5">

            {/* General */}
            <div className="p-6 flex flex-col gap-4">
              <h3 className="text-[10px] font-mono text-white/30 uppercase tracking-widest flex items-center gap-2">
                <Settings className="w-3 h-3" /> General Setup
              </h3>
              <div className="flex flex-col gap-1">
                <label className="text-[9px] uppercase font-mono text-white/20">Assessment Code</label>
                <select value={(config as any).code || ""} onChange={e => setConfig({ ...config, id: e.target.value.toLowerCase(), ...(({ code: e.target.value }) as any) })}
                  className="bg-transparent border-b border-white/10 text-white text-xs outline-none py-1.5 font-mono">
                  <option value="" className="bg-[#0a0a0f]">Select code</option>
                  {ASSESSMENT_CODES.map(c => <option key={c} value={c} className="bg-[#0a0a0f]">{c}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[9px] uppercase font-mono text-white/20">Assessment Name</label>
                <input value={config.name || ""} onChange={e => setConfig({ ...config, name: e.target.value })}
                  className="bg-transparent border-b border-white/10 text-white text-sm outline-none py-1.5 focus:border-brand transition-colors" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] uppercase font-mono text-white/20">Group</label>
                  <select value={config.group || "CIE"} onChange={e => setConfig({ ...config, group: e.target.value as any })}
                    className="bg-transparent border-b border-white/10 text-white text-xs outline-none py-1.5">
                    <option value="CIE" className="bg-[#0a0a0f]">Internal (CIE)</option>
                    <option value="SEE" className="bg-[#0a0a0f]">External (SEE)</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] uppercase font-mono text-white/20">Max Marks</label>
                  <input type="number" value={config.maxMarks || ""} onChange={e => setConfig({ ...config, maxMarks: parseInt(e.target.value) })}
                    className="bg-transparent border-b border-white/10 text-white text-sm outline-none py-1.5 focus:border-brand transition-colors" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] uppercase font-mono text-white/20">No. of Questions</label>
                  <input type="number" value={(config as any).numQuestions || ""}
                    onChange={e => setConfig({ ...config, ...({ numQuestions: parseInt(e.target.value) } as any) })}
                    className="bg-transparent border-b border-white/10 text-white text-sm outline-none py-1.5 focus:border-brand transition-colors" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] uppercase font-mono text-white/20">Weightage %</label>
                  <input type="number" value={config.weightage || ""} onChange={e => setConfig({ ...config, weightage: parseInt(e.target.value) })}
                    className="bg-transparent border-b border-white/10 text-white text-sm outline-none py-1.5 focus:border-brand transition-colors" />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[9px] uppercase font-mono text-white/20">Exam Date</label>
                <input type="date" value={(config as any).date || ""} onChange={e => setConfig({ ...config, ...({ date: e.target.value } as any) })}
                  className="bg-transparent border-b border-white/10 text-white text-xs outline-none py-1.5 focus:border-brand transition-colors" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[9px] uppercase font-mono text-white/20">Units Covered</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {UNITS.map(u => {
                    const units: string[] = (config as any).unitsCovered || [];
                    const active = units.includes(u);
                    return (
                      <button key={u} onClick={() => {
                        const cur: string[] = (config as any).unitsCovered || [];
                        setConfig({ ...config, ...(({ unitsCovered: active ? cur.filter(x => x !== u) : [...cur, u] }) as any) });
                      }}
                        className={`px-2 py-0.5 text-[9px] font-mono uppercase border transition-colors ${
                          active ? "border-brand/40 text-brand bg-brand/5" : "border-white/10 text-white/30 hover:border-white/30"
                        }`}>
                        {u}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* CO Coverage */}
            <div className="p-6 flex flex-col gap-4">
              <h3 className="text-[10px] font-mono text-white/30 uppercase tracking-widest flex items-center gap-2">
                <AlertTriangle className="w-3 h-3 text-alert/40" /> CO Coverage
              </h3>
              {cos.map(co => {
                const allocated = questions.filter(q => q.co === co.co).reduce((s, q) => s + q.maxMarks, 0);
                const pct = config.maxMarks ? (allocated / config.maxMarks) * 100 : 0;
                return (
                  <div key={co.co} className="flex flex-col gap-1">
                    <div className="flex justify-between text-[9px] font-mono uppercase">
                      <span className="text-white/30">{co.co}</span>
                      <span className={allocated === 0 ? "text-alert" : "text-attain"}>{allocated}M ({pct.toFixed(0)}%)</span>
                    </div>
                    <div className="h-0.5 bg-white/5">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                        className={`h-full ${allocated === 0 ? "bg-alert" : "bg-brand"}`} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Save */}
            <div className="p-6">
              <button onClick={handleSave}
                className="w-full py-3 bg-brand text-white text-xs font-mono uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-brand/90 transition-colors">
                <Save className="w-3.5 h-3.5" /> Save Configuration
              </button>
            </div>
          </div>

          {/* ── RIGHT: QUESTION BUILDER ── */}
          <div className="flex-1 flex flex-col">
            <div className="flex items-center justify-between px-8 py-5 border-b border-white/5">
              <h3 className="text-sm font-display text-white">Question Paper Mapping</h3>
              <button onClick={addQuestion}
                className="px-4 py-2 border border-brand/20 text-brand text-[10px] font-mono uppercase tracking-widest hover:bg-brand/5 transition-colors flex items-center gap-2">
                <Plus className="w-3 h-3" /> Add Question
              </button>
            </div>

            {/* Table header */}
            <div className="grid grid-cols-[60px_80px_1fr_100px_100px_80px_80px_80px_40px] gap-0 px-8 py-3 border-b border-white/5 bg-white/[0.01]">
              {["Q No.", "Part", "CO", "BT Level", "Type", "Marks", "Either-Or Group", "Q Text", ""].map(h => (
                <span key={h} className="text-[9px] font-mono text-white/20 uppercase tracking-widest">{h}</span>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-white/5">
              {questions.map((q, i) => {
                const group = q.eitherOrGroup;
                const isEO  = q.type === "either-or";
                return (
                  <motion.div key={i} variants={fadeSlideUp}
                    className={`grid grid-cols-[60px_80px_1fr_100px_100px_80px_80px_80px_40px] gap-0 px-8 py-3 items-center hover:bg-white/[0.01] transition-colors ${
                      isEO && group ? `border-l-2 ${getGroupColor(group)}` : ""
                    }`}>
                    {/* Q No */}
                    <input value={q.qno} onChange={e => updateQuestion(i, { qno: e.target.value })}
                      className="bg-transparent text-brand font-mono text-xs outline-none border-b border-transparent focus:border-white/10 w-full" />
                    {/* Part */}
                    <select value={(q as any).part || "None"} onChange={e => updateQuestion(i, { part: e.target.value } as any)}
                      className="bg-transparent text-white/50 text-[10px] font-mono outline-none border-b border-white/5 pb-0.5">
                      {PARTS.map(p => <option key={p} value={p} className="bg-[#0a0a0f]">{p}</option>)}
                    </select>
                    {/* CO */}
                    <select value={q.co} onChange={e => updateQuestion(i, { co: e.target.value })}
                      className="bg-transparent text-white text-xs outline-none border-b border-white/5 pb-0.5">
                      {cos.map(c => <option key={c.co} value={c.co} className="bg-[#0a0a0f]">{c.co}</option>)}
                    </select>
                    {/* BT */}
                    <select value={q.bloomCode || "L1"} onChange={e => updateQuestion(i, { bloomCode: e.target.value })}
                      className="bg-transparent text-white/60 text-[10px] font-mono outline-none border-b border-white/5 pb-0.5">
                      {["L1","L2","L3","L4","L5","L6"].map(l => <option key={l} value={l} className="bg-[#0a0a0f]">{l}</option>)}
                    </select>
                    {/* Type */}
                    <select value={q.type || "compulsory"} onChange={e => updateQuestion(i, { type: e.target.value as any })}
                      className="bg-transparent text-white/60 text-[10px] font-mono outline-none border-b border-white/5 pb-0.5">
                      {Q_TYPES.map(t => <option key={t} value={t} className="bg-[#0a0a0f]">{t}</option>)}
                    </select>
                    {/* Marks */}
                    <input type="number" value={q.maxMarks} onChange={e => updateQuestion(i, { maxMarks: parseInt(e.target.value) || 0 })}
                      className="bg-transparent text-white text-xs outline-none border-b border-white/5 pb-0.5 w-full" />
                    {/* Either-Or Group */}
                    <input
                      value={q.eitherOrGroup || ""}
                      onChange={e => updateQuestion(i, { eitherOrGroup: e.target.value, isEitherOr: !!e.target.value })}
                      placeholder={isEO ? "e.g. Q3" : "—"}
                      disabled={q.type !== "either-or"}
                      className="bg-transparent text-white/40 text-[10px] font-mono outline-none border-b border-white/5 pb-0.5 w-full disabled:opacity-20"
                    />
                    {/* Q Text */}
                    <input value={q.text || ""} onChange={e => updateQuestion(i, { text: e.target.value })}
                      placeholder="Question text..."
                      className="bg-transparent text-white/30 text-[10px] outline-none border-b border-white/5 pb-0.5 w-full truncate" />
                    {/* Delete */}
                    <button onClick={() => removeQuestion(i)} className="text-white/10 hover:text-alert transition-colors flex justify-center">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </motion.div>
                );
              })}

              {questions.length === 0 && (
                <div className="py-20 flex flex-col items-center gap-4 text-white/10">
                  <Layers className="w-10 h-10 opacity-10" />
                  <p className="text-sm italic">No questions defined. Click "Add Question" to start.</p>
                </div>
              )}
            </div>

            {/* Either-Or pair summary */}
            {Object.keys(eitherOrGroups).length > 0 && (
              <div className="px-8 py-4 border-t border-white/5 flex flex-wrap gap-4">
                <span className="text-[9px] font-mono text-white/20 uppercase tracking-widest flex items-center gap-1.5">
                  <Link2 className="w-3 h-3" /> Either-Or Pairs:
                </span>
                {Object.entries(eitherOrGroups).map(([group, indices]) => (
                  <span key={group} className="text-[9px] font-mono text-brand border border-brand/20 px-2 py-0.5">
                    {group}: {indices.map(i => questions[i]?.qno).join(" OR ")}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AccessGate>
  );
}
