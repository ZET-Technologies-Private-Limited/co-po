"use client";

import { useState, use } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UploadCloud, Download, Loader2, CheckCircle2, AlertTriangle, Target, ChevronDown } from "lucide-react";
import { staggerContainer, fadeSlideUp } from "@/lib/animations";
import { STUDENT_MARKS, getAttainmentLevel, StudentMark } from "@/lib/appData";

const EXAM_COLS = [
  { key: "T1",  label: "T1",  max: 20 },
  { key: "T2",  label: "T2",  max: 20 },
  { key: "T3",  label: "T3",  max: 10 },
  { key: "T4",  label: "T4",  max: 10 },
  { key: "T5",  label: "T5",  max: 100 },
  { key: "SEE", label: "SEE", max: 100 },
];

// Either/Or question pairs in T1
const EITHER_OR_PAIRS = [
  { key: "Q3", labelA: "Q3a → CO1", labelB: "Q3b → CO2", coA: "CO1", coB: "CO2" },
  { key: "Q4", labelA: "Q4a → CO3", labelB: "Q4b → CO3", coA: "CO3", coB: "CO3" },
];

function validateMark(val: number | "", max: number): "empty" | "over" | "ok" {
  if (val === "") return "empty";
  if (val > max) return "over";
  if (val < 0) return "over";
  return "ok";
}

// Compute live CIE attainment preview per CO (simplified for T1 only)
function computeLiveCIE(students: StudentMark[]): Record<string, number> {
  const enrolled = students.length;
  if (!enrolled) return {};

  // CO1 target: Q1(5) + Q3a if chosen, CO3 target: Q4a or Q4b
  const attained: Record<string, number> = { CO1: 0, CO2: 0, CO3: 0 };

  students.forEach(s => {
    const t1 = typeof s.marks["T1"] === "number" ? (s.marks["T1"] as number) : 0;
    const t1Pct = (t1 / 20) * 100;

    const co3Ch = s.eitherOrChoices?.["Q4"];
    const co1Ch = s.eitherOrChoices?.["Q3"];

    // Simplified: use overall T1 % as proxy for CO attainment
    if (t1Pct >= 60) {
      if (co1Ch === "a") attained["CO1"] += 1;
      else attained["CO2"] += 1;
      attained["CO3"] += 1;
    }
  });

  const result: Record<string, number> = {};
  Object.entries(attained).forEach(([co, count]) => {
    result[co] = Math.round((count / enrolled) * 100);
  });
  return result;
}

export default function MarksPage({ params }: { params: Promise<{ id: string; examId: string }> }) {
  const { id: courseId, examId } = use(params);
  const initialStudents = STUDENT_MARKS[courseId] ?? [];
  const [students, setStudents] = useState<StudentMark[]>(initialStudents);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [saved, setSaved] = useState(false);
  const [expandedStudent, setExpandedStudent] = useState<string | null>(null);

  const updateMark = (roll: string, key: string, val: string) => {
    setStudents(prev => prev.map(s =>
      s.roll === roll ? { ...s, marks: { ...s.marks, [key]: val === "" ? "" : +val } } : s
    ));
    setSaved(false);
  };

  const updateEitherOr = (roll: string, questionKey: string, choice: "a" | "b") => {
    setStudents(prev => prev.map(s =>
      s.roll === roll ? { ...s, eitherOrChoices: { ...(s.eitherOrChoices || {}), [questionKey]: choice } } : s
    ));
  };

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setCalculating(true);
      setTimeout(() => {
        setCalculating(false);
        setSaved(true);
      }, 1800);
    }, 1000);
  };

  const handleUpload = () => {
    setUploading(true);
    setTimeout(() => {
      setUploading(false);
      setStudents(initialStudents);
    }, 2200);
  };

  const liveCIE = computeLiveCIE(students);

  return (
    <div className="w-full min-h-screen pb-24">
      <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="max-w-6xl mx-auto px-6 pt-12">

        {/* Header */}
        <motion.div variants={fadeSlideUp} className="flex items-end justify-between mb-12 flex-wrap gap-6">
          <div>
            <div className="flex items-center gap-3 text-sm font-mono text-white/40 uppercase tracking-widest mb-4">
              <span className="w-8 h-[1px] bg-white/20"></span>
              {courseId.toUpperCase()} · {examId.toUpperCase()}
            </div>
            <h1 className="text-5xl font-display text-white">Student Marks</h1>
            <p className="text-white/40 font-light mt-3 text-sm">CIE contributes 40% · SEE contributes 60% · Final = CIE×0.4 + SEE×0.6</p>
          </div>
          <div className="flex gap-3">
            <button onClick={handleUpload} className="flex items-center gap-2 px-5 py-3 border border-white/20 text-white text-sm font-mono hover:border-white/50 transition-colors">
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
              Upload CSV / Excel
            </button>
            <button className="flex items-center gap-2 px-5 py-3 border border-white/10 text-white/40 text-sm font-mono hover:text-white hover:border-white/30 transition-colors">
              <Download className="w-4 h-4" /> Template
            </button>
          </div>
        </motion.div>

        {/* Max marks legend */}
        <motion.div variants={fadeSlideUp} className="flex flex-wrap gap-6 mb-8 pb-4 border-b border-white/10 text-sm font-mono text-white/40">
          {EXAM_COLS.map(col => (
            <span key={col.key}>
              <span className={`${col.key === "SEE" ? "text-aurora" : "text-brand"}`}>{col.label}</span>
              <span className="text-white/20"> /{col.max}</span>
              {col.key === "SEE" && <span className="ml-1 text-[10px] text-aurora/60 uppercase">(SEE)</span>}
            </span>
          ))}
        </motion.div>

        {/* Either/Or legend */}
        <motion.div variants={fadeSlideUp} className="bg-white/[0.03] border border-white/10 p-6 mb-8">
          <p className="text-xs font-mono text-white/40 uppercase tracking-widest mb-3">Either/Or Question Pairs (T1)</p>
          <div className="flex flex-wrap gap-6">
            {EITHER_OR_PAIRS.map(pair => (
              <div key={pair.key} className="flex items-center gap-3 text-sm">
                <span className="font-mono text-white/30">{pair.key}:</span>
                <span className="text-brand text-xs font-mono">{pair.labelA}</span>
                <span className="text-white/20">|</span>
                <span className="text-aurora text-xs font-mono">{pair.labelB}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Student table */}
        <motion.div variants={fadeSlideUp} className="overflow-x-auto">
          <table className="w-full border-b border-white/10">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-4 pl-2 text-xs font-mono text-white/40 uppercase tracking-widest pr-4 w-32">Roll No</th>
                <th className="text-left py-4 text-xs font-mono text-white/40 uppercase tracking-widest pr-8 min-w-[180px]">Student</th>
                {EXAM_COLS.map(col => (
                  <th key={col.key} className={`text-center py-4 text-xs font-mono uppercase tracking-widest px-3 ${col.key === "SEE" ? "text-aurora/60" : "text-white/40"}`}>
                    {col.label}
                  </th>
                ))}
                <th className="text-center py-4 text-xs font-mono text-white/40 uppercase tracking-widest px-4">Either/Or</th>
                <th className="text-center py-4 text-xs font-mono text-white/40 uppercase tracking-widest px-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s, si) => {
                const hasError = EXAM_COLS.some(col => validateMark(s.marks[col.key], col.max) === "over");
                const allFilled = EXAM_COLS.every(col => s.marks[col.key] !== "" && s.marks[col.key] !== undefined);
                return (
                  <motion.tr key={s.roll} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: si * 0.03 }}
                    className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group"
                  >
                    <td className="py-4 pl-2 font-mono text-sm text-white/50 pr-4">{s.roll}</td>
                    <td className="py-4 text-white text-sm pr-8">{s.name}</td>
                    {EXAM_COLS.map(col => {
                      const state = validateMark(s.marks[col.key], col.max);
                      return (
                        <td key={col.key} className="py-3 px-3">
                          <input
                            type="text"
                            value={s.marks[col.key] === "" ? "" : (s.marks[col.key] ?? "")}
                            onChange={e => updateMark(s.roll, col.key, e.target.value)}
                            placeholder="–"
                            className={`w-14 text-center bg-white/5 border py-2 text-white outline-none focus:ring-0 transition-colors font-mono text-sm focus:placeholder-transparent ${
                              state === "over" ? "border-alert text-alert" :
                              state === "ok" ? `border-white/10 focus:border-white/40 ${col.key === "SEE" ? "text-aurora" : ""}` :
                              "border-white/5 opacity-40 focus:opacity-100 placeholder-white/20"
                            }`}
                          />
                        </td>
                      );
                    })}
                    <td className="py-3 px-4">
                      <div className="flex flex-col gap-1.5">
                        {EITHER_OR_PAIRS.map(pair => {
                          const choice = s.eitherOrChoices?.[pair.key];
                          return (
                            <div key={pair.key} className="flex items-center gap-1.5 text-[10px] font-mono">
                              <span className="text-white/30 w-4">{pair.key}</span>
                              <button
                                onClick={() => updateEitherOr(s.roll, pair.key, "a")}
                                className={`px-2 py-1 transition-all ${choice === "a" ? "bg-brand text-white" : "text-white/30 hover:text-white bg-white/5"}`}
                              >a</button>
                              <button
                                onClick={() => updateEitherOr(s.roll, pair.key, "b")}
                                className={`px-2 py-1 transition-all ${choice === "b" ? "bg-aurora text-black" : "text-white/30 hover:text-white bg-white/5"}`}
                              >b</button>
                            </div>
                          );
                        })}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {hasError
                        ? <AlertTriangle className="w-4 h-4 text-alert mx-auto" />
                        : allFilled
                          ? <CheckCircle2 className="w-4 h-4 text-attain mx-auto" />
                          : <span className="w-4 h-4 rounded-full bg-white/10 block mx-auto" />
                      }
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </motion.div>

        {/* Live CO Attainment Preview */}
        <motion.div variants={fadeSlideUp} className="mt-8 p-6 bg-white/[0.03] border border-white/10">
          <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest mb-4">Live CO Attainment Preview (T1 CIE estimate · not final)</p>
          <div className="flex gap-8 flex-wrap">
            {Object.entries(liveCIE).map(([co, pct]) => {
              const level = getAttainmentLevel(pct);
              return (
                <div key={co} className="flex flex-col gap-1">
                  <span className="text-xs font-mono text-white/40">{co}</span>
                  <span className={`text-2xl font-mono font-light ${level.color}`}>{pct}%</span>
                  <span className={`text-[10px] font-mono uppercase ${level.color}`}>{level.label}</span>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Save + CO Calculation */}
        <div className="flex items-center gap-6 mt-8 pt-6 border-t border-white/10 flex-wrap">
          <button
            onClick={handleSave}
            className="px-8 py-4 bg-white text-black font-medium text-sm hover:bg-white/90 transition-colors flex items-center gap-3 font-mono uppercase tracking-widest"
          >
            {(saving || calculating) && <Loader2 className="w-4 h-4 animate-spin" />}
            {saving ? "Archiving Memo..." : calculating ? "Computing CO Attainment..." : saved ? "Memo Archived ✓" : "Commit Memo & Calculate COs"}
          </button>

          <AnimatePresence>
            {saved && (
              <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                className="flex items-center gap-4 bg-white/[0.03] border border-white/10 px-6 py-3"
              >
                <Target className="w-4 h-4 text-attain" />
                <div>
                  <p className="text-[10px] font-mono text-white/40 uppercase tracking-widest">CO Attainment Recomputed</p>
                  <p className="text-sm text-white font-light">
                    {students.length} students processed. CIE×0.4 + SEE×0.6 applied. Level 1 COs flagged for remedial action.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
