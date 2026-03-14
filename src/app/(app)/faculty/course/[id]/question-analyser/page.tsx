"use client";

import { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  BrainCircuit,
  Trash2,
  ArrowRight,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Upload,
} from "lucide-react";
import { useDataStore, QuestionDef } from "@/lib/dataStore";
import { AccessGate } from "@/components/auth/AccessGate";
import { detectBloomsLevel, BLOOMS_LEVELS } from "@/lib/computations";
import { fadeSlideUp, staggerContainer } from "@/lib/animations";
import { useUIStore } from "@/lib/uiStore";

type AnalysedResult = {
  bt: string;
  btCode: string;
  verb: string;
  co: string;
  confidence: number;
  reason: string;
};

type QuestionType = "compulsory" | "either-or" | "optional";

type MappedQ = QuestionDef & {
  text: string;
  marks: number;
  overrideBT?: string;
  overrideCO?: string;
  overrideReason?: string;
  type: QuestionType;
};

export default function QuestionAnalyserPage() {
  const { id } = useParams();
  const router = useRouter();
  const courseId = id as string;

  const courses = useDataStore((s) => s.courses);
  const course = useMemo(
    () => courses.find((c) => c.id === courseId),
    [courses, courseId],
  );
  const cos = useDataStore((s) => s.cos[courseId] || []);
  const exams = useDataStore((s) => s.examConfigs[courseId] || []);
  const setQuestions = useDataStore((s) => s.setQuestions);
  const { addToast } = useUIStore();

  const [selectedExam, setSelectedExam] = useState<string>(
    exams[0]?.id || "",
  );
  const [inputText, setInputText] = useState("");
  const [isAnalysing, setIsAnalysing] = useState(false);
  const [result, setResult] = useState<AnalysedResult | null>(null);
  const [overrideBT, setOverrideBT] = useState("");
  const [overrideCO, setOverrideCO] = useState("");
  const [overrideReason, setOverrideReason] = useState("");
  const [qMarks, setQMarks] = useState(5);
  const [qType, setQType] = useState<QuestionType>("compulsory");
  const [mappedQs, setMappedQs] = useState<MappedQ[]>([]);

  const [bulkFile, setBulkFile] = useState<File | null>(null);

  const totalMarks = useMemo(
    () => mappedQs.reduce((s, q) => s + q.marks, 0),
    [mappedQs],
  );

  const coCoverage = useMemo(() => {
    const map: Record<string, number> = {};
    cos.forEach((c) => {
      map[c.co] = 0;
    });
    mappedQs.forEach((q) => {
      map[q.co] = (map[q.co] || 0) + q.marks;
    });
    return map;
  }, [mappedQs, cos]);

  const btDistribution = useMemo(() => {
    const dist: Record<string, number> = {
      L1: 0,
      L2: 0,
      L3: 0,
      L4: 0,
      L5: 0,
      L6: 0,
    };
    mappedQs.forEach((q) => {
      const code = q.bloomCode || "L2";
      dist[code] = (dist[code] || 0) + 1;
    });
    return dist;
  }, [mappedQs]);

  const handleAnalyse = async () => {
    if (!inputText.trim()) return;
    setIsAnalysing(true);
    setResult(null);
    setOverrideBT("");
    setOverrideCO("");
    setOverrideReason("");
    await new Promise((r) => setTimeout(r, 900));

    const detected = detectBloomsLevel(inputText);
    let suggestedCO = cos[0]?.co || "CO1";
    let bestScore = 0;
    cos.forEach((c) => {
      const words = c.desc.toLowerCase().split(/\s+/);
      const score = words.filter(
        (w) => inputText.toLowerCase().includes(w) && w.length > 4,
      ).length;
      if (score > bestScore) {
        bestScore = score;
        suggestedCO = c.co;
      }
    });
    const confidence = bestScore > 0 ? Math.min(95, 70 + bestScore * 5) : 75;
    setResult({
      bt: `${detected.code} — ${detected.name}`,
      btCode: detected.code,
      verb: detected.verb,
      co: suggestedCO,
      confidence,
      reason:
        bestScore > 0
          ? `Keyword match: verb "${detected.verb}" and topic phrases align with ${suggestedCO}.`
          : `Action verb "${detected.verb}" indicates ${detected.name} level. Default CO mapping applied.`,
    });
    setIsAnalysing(false);
  };

  const highlightVerb = (text: string, verb: string) => {
    if (!verb || !text) return text;
    const regex = new RegExp(`(${verb})`, "gi");
    const parts = text.split(regex);
    return parts.map((part, i) =>
      regex.test(part) ? (
        <mark
          key={i}
          className="bg-transparent underline decoration-brand decoration-2 underline-offset-2"
        >
          {part}
        </mark>
      ) : (
        part
      ),
    );
  };

  const addToPaper = () => {
    if (!result) return;
    if (!selectedExam) {
      addToast("Select an exam before adding questions.", "error");
      return;
    }
    const finalBT = overrideBT || result.btCode;
    const finalCO = overrideCO || result.co;
    if ((overrideBT || overrideCO) && !overrideReason.trim()) {
      addToast("Provide a reason for overriding AI suggestion.", "error");
      return;
    }
    const q: MappedQ = {
      qno: `Q${mappedQs.length + 1}`,
      co: finalCO,
      maxMarks: qMarks,
      marks: qMarks,
      bloomCode: finalBT,
      text: inputText,
      type: qType,
      overrideBT: overrideBT || undefined,
      overrideCO: overrideCO || undefined,
      overrideReason: overrideReason || undefined,
      isEitherOr: qType === "either-or",
    };
    setMappedQs((prev) => [...prev, q]);
    setInputText("");
    setResult(null);
    setOverrideBT("");
    setOverrideCO("");
    setOverrideReason("");
  };

  const handleUpdateRow = (index: number, patch: Partial<MappedQ>) => {
    setMappedQs((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], ...patch };
      return copy;
    });
  };

  const handleDeleteRow = (index: number) => {
    setMappedQs((prev) => prev.filter((_, i) => i !== index));
  };

  const handleConfirmSave = () => {
    if (!selectedExam) {
      addToast("Select an exam to save this paper.", "error");
      return;
    }
    if (!mappedQs.length) {
      addToast("No questions to save.", "error");
      return;
    }
    const questions: QuestionDef[] = mappedQs.map((q, idx) => ({
      qno: q.qno || `Q${idx + 1}`,
      co: q.co,
      maxMarks: q.marks,
      text: q.text,
      bloomCode: q.bloomCode,
      type: q.type,
      isEitherOr: q.type === "either-or",
      eitherOrGroup: q.eitherOrGroup,
    }));
    setQuestions(courseId, selectedExam, questions);
    addToast("Question paper mapping saved to exam.", "success");
    router.push(`/faculty/course/${courseId}/exam-config`);
  };

  const examMaxMarks =
    exams.find((e) => e.id === selectedExam)?.maxMarks ||
    exams.reduce(
      (s, e) => s + (e.group === "CIE" ? e.maxMarks : 0),
      0,
    ) ||
    100;

  const coCoverageLine = useMemo(() => {
    if (!cos.length || !totalMarks) return "";
    const parts = cos.map((c) => {
      const marks = coCoverage[c.co] || 0;
      const pct = Math.round((marks / totalMarks) * 100);
      return `${c.co}: ${pct}%`;
    });
    const zeroCos = cos.filter((c) => (coCoverage[c.co] || 0) === 0);
    const warning =
      zeroCos.length > 0
        ? ` — Warning: ${zeroCos.map((c) => c.co).join(", ")} have no questions`
        : "";
    return `${parts.join(" | ")}${warning}`;
  }, [cos, coCoverage, totalMarks]);

  const btLine = useMemo(() => {
    const parts = ["L1", "L2", "L3", "L4", "L5", "L6"].map(
      (code) => `${code}: ${btDistribution[code] || 0} question${btDistribution[code] === 1 ? "" : "s"}`,
    );
    return parts.join(" | ");
  }, [btDistribution]);

  return (
    <AccessGate feature="ai_question_mapping" deny="lock">
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="max-w-7xl mx-auto flex flex-col gap-0 pb-32"
      >
        {/* Header */}
        <motion.div
          variants={fadeSlideUp}
          className="pb-6 border-b border-white/5 flex items-end justify-between"
        >
          <div>
            <div className="flex items-center gap-2 text-[10px] font-mono text-brand uppercase tracking-widest mb-3">
              <span className="w-8 h-[1px] bg-brand" /> AI Question Analyser
            </div>
            <h1 className="text-4xl font-display text-white">
              {course?.name} · {course?.code}
            </h1>
          </div>
          <div className="flex flex-col items-end gap-2">
            <label className="text-[9px] font-mono text-white/40 uppercase tracking-widest">
              Exam
            </label>
            <select
              value={selectedExam}
              onChange={(e) => setSelectedExam(e.target.value)}
              className="min-w-[200px] bg-transparent border-b border-white/20 text-xs text-white/80 outline-none pb-1"
            >
              <option value="" className="bg-[#050509] text-white/60">
                Select exam
              </option>
              {exams.map((e) => (
                <option
                  key={e.id}
                  value={e.id}
                  className="bg-[#050509] text-white"
                >
                  {e.id.toUpperCase()} — {e.name}
                </option>
              ))}
            </select>
          </div>
        </motion.div>

        <div className="flex gap-0 mt-4 divide-x divide-white/10">
          {/* Left: single question analysis */}
          <div className="flex-1 flex flex-col divide-y divide-white/5">
            <div className="p-6 flex flex-col gap-5">
              <h3 className="text-[10px] font-mono text-white/30 uppercase tracking-widest">
                Single Question Analysis
              </h3>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Paste or type your question here..."
                className="w-full bg-white/[0.02] border border-white/10 p-5 text-white text-sm outline-none focus:border-brand h-32 resize-none leading-relaxed"
              />
              <div className="flex items-center gap-4 flex-wrap">
                <button
                  onClick={handleAnalyse}
                  disabled={isAnalysing || !inputText.trim()}
                  className="px-8 py-2.5 bg-brand text-white text-xs font-mono uppercase tracking-widest flex items-center gap-2 hover:bg-brand/90 transition-colors disabled:opacity-40"
                >
                  {isAnalysing ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Analysing
                    </>
                  ) : (
                    <>
                      <BrainCircuit className="w-3.5 h-3.5" />
                      Analyse
                    </>
                  )}
                </button>
                <div className="flex items-center gap-2">
                  <label className="text-[10px] font-mono text-white/30 uppercase tracking-widest">
                    Marks
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={qMarks}
                    onChange={(e) =>
                      setQMarks(parseInt(e.target.value) || 1)
                    }
                    className="w-16 bg-transparent border-b border-white/10 text-white text-sm outline-none text-center py-1 focus:border-brand"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-[10px] font-mono text-white/30 uppercase tracking-widest">
                    Question Type
                  </label>
                  <select
                    value={qType}
                    onChange={(e) =>
                      setQType(e.target.value as QuestionType)
                    }
                    className="bg-transparent border-b border-white/10 text-white/70 text-[11px] outline-none pb-1"
                  >
                    <option value="compulsory" className="bg-[#050509]">
                      Compulsory
                    </option>
                    <option value="either-or" className="bg-[#050509]">
                      Either-Or
                    </option>
                    <option value="optional" className="bg-[#050509]">
                      Optional
                    </option>
                  </select>
                </div>
              </div>
            </div>

            <AnimatePresence>
              {result && (
                <motion.div
                  variants={fadeSlideUp}
                  initial="hidden"
                  animate="visible"
                  exit={{ opacity: 0 }}
                  className="p-6 flex flex-col gap-5"
                >
                  <div className="space-y-2">
                    <p className="text-sm text-white/70 leading-relaxed border border-white/10 bg-white/[0.02] px-3 py-2 rounded">
                      {highlightVerb(inputText, result.verb)}
                    </p>
                    <p className="text-sm text-white font-semibold">
                      Bloom&apos;s Level: {result.bt}
                    </p>
                    <p className="text-sm text-white font-semibold">
                      Suggested CO: {result.co} ({result.confidence}% match)
                    </p>
                    <p className="text-xs text-white/50">
                      {result.reason}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-4">
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] font-mono text-white/30 uppercase tracking-widest">
                        BT Level Override
                      </label>
                      <select
                        value={overrideBT}
                        onChange={(e) => setOverrideBT(e.target.value)}
                        className="min-w-[160px] bg-transparent border-b border-white/10 text-white/70 text-xs outline-none pb-1"
                      >
                        <option value="" className="bg-[#050509]">
                          — Keep AI suggestion ({result.btCode}) —
                        </option>
                        {BLOOMS_LEVELS.map((b) => (
                          <option
                            key={b.code}
                            value={b.code}
                            className="bg-[#050509]"
                          >
                            {b.code} — {b.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] font-mono text-white/30 uppercase tracking-widest">
                        CO Override
                      </label>
                      <select
                        value={overrideCO}
                        onChange={(e) => setOverrideCO(e.target.value)}
                        className="min-w-[180px] bg-transparent border-b border-white/10 text-white/70 text-xs outline-none pb-1"
                      >
                        <option value="" className="bg-[#050509]">
                          — Keep AI suggestion ({result.co}) —
                        </option>
                        {cos.map((c) => (
                          <option
                            key={c.co}
                            value={c.co}
                            className="bg-[#050509]"
                          >
                            {c.co} — {c.desc.substring(0, 28)}...
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {(overrideBT || overrideCO) && (
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] font-mono text-white/30 uppercase tracking-widest">
                        Override reason <span className="text-alert">*</span>
                      </label>
                      <textarea
                        value={overrideReason}
                        onChange={(e) => setOverrideReason(e.target.value)}
                        rows={2}
                        className="w-full bg-transparent border-b border-white/10 text-xs text-white outline-none pb-1.5 focus:border-brand resize-none"
                        placeholder="Explain briefly why you changed the BT level / CO mapping..."
                      />
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={() => setResult(null)}
                      className="px-6 py-2 border border-white/10 text-white/50 text-xs font-mono uppercase tracking-widest hover:text-white transition-colors"
                    >
                      Discard
                    </button>
                    <button
                      onClick={addToPaper}
                      disabled={
                        (Boolean(overrideBT) || Boolean(overrideCO)) &&
                        !overrideReason.trim()
                      }
                      className="px-8 py-2 bg-brand text-white text-xs font-mono uppercase tracking-widest hover:bg-brand/90 transition-colors disabled:opacity-40"
                    >
                      Add to Paper
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Bulk upload section */}
            <div className="p-6 flex flex-col gap-3 border-t border-white/5">
              <h3 className="text-[10px] font-mono text-white/30 uppercase tracking-widest">
                Or upload full question paper
              </h3>
              <label className="inline-flex items-center gap-2 px-4 py-3 border border-white/15 text-white/40 text-[10px] font-mono uppercase tracking-widest cursor-pointer hover:border-brand/40 hover:text-white transition-colors">
                <Upload className="w-3.5 h-3.5" /> Upload Question Paper PDF
                <input
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    setBulkFile(f);
                  }}
                />
              </label>
              {bulkFile && (
                <div className="text-[10px] text-white/50">
                  Selected: {bulkFile.name} ({Math.round(bulkFile.size / 1024)} KB).{" "}
                  Use the analyser above to paste questions one‑by‑one; bulk PDF
                  auto‑parsing is not simulated.
                </div>
              )}
            </div>
          </div>

          {/* Right: running question list & coverage */}
          <div className="w-[380px] flex flex-col divide-y divide-white/5 shrink-0">
            <div className="p-6 flex flex-col gap-3">
              <h3 className="text-[10px] font-mono text-white/30 uppercase tracking-widest mb-1">
                Running Question List
              </h3>
              <div className="border border-white/10 rounded-lg overflow-hidden">
                <div className="grid grid-cols-[50px_60px_50px_50px_70px_40px] gap-0 bg-white/[0.02] px-3 py-2">
                  {["Q#", "CO", "BT", "Marks", "Type", ""].map((h) => (
                    <span
                      key={h}
                      className="text-[9px] font-mono text-white/30 uppercase tracking-widest"
                    >
                      {h}
                    </span>
                  ))}
                </div>
                <div className="max-h-64 overflow-y-auto divide-y divide-white/10">
                  {mappedQs.length === 0 ? (
                    <div className="py-6 text-center text-[11px] text-white/30">
                      No questions added yet.
                    </div>
                  ) : (
                    mappedQs.map((q, i) => (
                      <div
                        key={i}
                        className="grid grid-cols-[50px_60px_50px_50px_70px_40px] gap-0 px-3 py-2 items-center hover:bg-white/[0.02]"
                      >
                        <input
                          value={q.qno}
                          onChange={(e) =>
                            handleUpdateRow(i, { qno: e.target.value })
                          }
                          className="bg-transparent text-brand font-mono text-[11px] outline-none border-b border-transparent focus:border-white/20"
                        />
                        <select
                          value={q.co}
                          onChange={(e) =>
                            handleUpdateRow(i, { co: e.target.value })
                          }
                          className="bg-transparent text-white/80 text-[11px] outline-none border-b border-white/15"
                        >
                          {cos.map((c) => (
                            <option
                              key={c.co}
                              value={c.co}
                              className="bg-[#050509]"
                            >
                              {c.co}
                            </option>
                          ))}
                        </select>
                        <select
                          value={q.bloomCode || "L2"}
                          onChange={(e) =>
                            handleUpdateRow(i, { bloomCode: e.target.value })
                          }
                          className="bg-transparent text-white/70 text-[11px] font-mono outline-none border-b border-white/15"
                        >
                          {BLOOMS_LEVELS.map((b) => (
                            <option
                              key={b.code}
                              value={b.code}
                              className="bg-[#050509]"
                            >
                              {b.code}
                            </option>
                          ))}
                        </select>
                        <input
                          type="number"
                          value={q.marks}
                          onChange={(e) =>
                            handleUpdateRow(i, {
                              marks: parseInt(e.target.value) || 0,
                              maxMarks: parseInt(e.target.value) || 0,
                            })
                          }
                          className="bg-transparent text-white/80 text-[11px] outline-none border-b border-white/15 text-center"
                        />
                        <select
                          value={q.type || "compulsory"}
                          onChange={(e) =>
                            handleUpdateRow(i, {
                              type: e.target.value as QuestionType,
                              isEitherOr: e.target.value === "either-or",
                            })
                          }
                          className="bg-transparent text-white/70 text-[9px] font-mono outline-none border-b border-white/15"
                        >
                          <option value="compulsory" className="bg-[#050509]">
                            Compulsory
                          </option>
                          <option value="either-or" className="bg-[#050509]">
                            Either-Or
                          </option>
                          <option value="optional" className="bg-[#050509]">
                            Optional
                          </option>
                        </select>
                        <button
                          onClick={() => handleDeleteRow(i)}
                          className="flex items-center justify-center text-white/20 hover:text-alert"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
              {totalMarks > 0 && (
                <>
                  <p className="text-[10px] font-mono text-white/40 mt-3">
                    CO Coverage:{" "}
                    {coCoverageLine || "No questions mapped to COs yet."}
                  </p>
                  <p className="text-[10px] font-mono text-white/40">
                    Bloom&apos;s Distribution: {btLine}
                  </p>
                  <p className="text-[10px] font-mono text-white/40 mt-1">
                    Total: {totalMarks} / Max: {examMaxMarks}
                    {totalMarks !== examMaxMarks && (
                      <span className="text-alert"> — mismatch</span>
                    )}
                  </p>
                </>
              )}
            </div>

            <div className="p-6 flex flex-col gap-3 border-t border-white/5">
              <button
                onClick={handleConfirmSave}
                disabled={!mappedQs.length || !selectedExam}
                className="w-full py-2.5 bg-brand text-white text-xs font-mono uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-40"
              >
                Confirm All &amp; Save Paper
              </button>
              <p className="text-[10px] text-white/30">
                This will push the current question list and mappings to the
                selected exam&apos;s configuration.
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </AccessGate>
  );
}

