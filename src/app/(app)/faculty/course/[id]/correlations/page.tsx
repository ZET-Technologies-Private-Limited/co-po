"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  Star,
  Pencil,
} from "lucide-react";
import {
  CO_PO_MAPPING,
  PROGRAM_OUTCOMES,
  PROGRAM_SPECIFIC_OUTCOMES,
  useDataStore,
} from "@/lib/dataStore";
import { AccessGate } from "@/components/auth/AccessGate";
import { staggerContainer, fadeSlideUp } from "@/lib/animations";
import { useUIStore } from "@/lib/uiStore";

const PO_LIST = PROGRAM_OUTCOMES.map((p) => p.id);
const PSO_LIST = PROGRAM_SPECIFIC_OUTCOMES.map((p) => p.id);

type CellSource = "ai" | "manual";

type Matrix = Record<string, Record<string, { value: number; source: CellSource }>>;

export default function COPOMatrixPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;

  const courses = useDataStore((s) => s.courses);
  const cos = useDataStore((s) => s.cos[courseId] || []);
  const storedMappings = useDataStore((s) => s.coPOMappings[courseId]);
  const setCOPOMapping = useDataStore((s) => s.setCOPOMapping);
  const { addToast } = useUIStore();

  const course = useMemo(
    () => courses.find((c) => c.id === courseId),
    [courses, courseId],
  );

  const coIds = useMemo(
    () => (cos.length ? cos.map((c) => c.co) : ["CO1", "CO2", "CO3", "CO4", "CO5", "CO6"]),
    [cos],
  );

  const [matrix, setMatrix] = useState<Matrix>(() => {
    const init: Matrix = {};
    coIds.forEach((co) => {
      const ai = CO_PO_MAPPING[co] || {};
      const stored = storedMappings?.[co] || {};
      const row: Record<string, { value: number; source: CellSource }> = {};
      [...PO_LIST, ...PSO_LIST].forEach((k) => {
        const aiVal = ai[k] ?? 0;
        const storedVal = stored[k];
        if (typeof storedVal === "number") {
          row[k] = { value: storedVal, source: storedVal === aiVal ? "ai" : "manual" };
        } else {
          row[k] = { value: aiVal, source: "ai" };
        }
      });
      init[co] = row;
    });
    return init;
  });

  const [justification, setJustification] = useState("");

  const hasManual = useMemo(
    () =>
      Object.values(matrix).some((row, _, __) =>
        Object.values(row).some((cell, idx, arr) => cell.source === "manual"),
      ),
    [matrix],
  );

  const rowTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    coIds.forEach((co) => {
      const row = matrix[co];
      totals[co] = Object.values(row || {}).reduce((s, c) => s + c.value, 0);
    });
    return totals;
  }, [matrix, coIds]);

  const colTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    [...PO_LIST, ...PSO_LIST].forEach((k) => {
      totals[k] = coIds.reduce(
        (s, co) => s + (matrix[co]?.[k]?.value ?? 0),
        0,
      );
    });
    return totals;
  }, [matrix, coIds]);

  const handleChangeCell = (co: string, key: string, val: number) => {
    setMatrix((prev) => {
      const next: Matrix = { ...prev };
      const row = { ...(next[co] || {}) };
      const aiVal = (CO_PO_MAPPING[co] || {})[key] ?? 0;
      row[key] = {
        value: val,
        source: val === aiVal ? "ai" : "manual",
      };
      next[co] = row;
      return next;
    });
  };

  const handleResetRow = (co: string) => {
    const ai = CO_PO_MAPPING[co] || {};
    setMatrix((prev) => {
      const next: Matrix = { ...prev };
      const row: Record<string, { value: number; source: CellSource }> = {};
      [...PO_LIST, ...PSO_LIST].forEach((k) => {
        row[k] = { value: ai[k] ?? 0, source: "ai" };
      });
      next[co] = row;
      return next;
    });
  };

  const handleResetAll = () => {
    if (!confirm("Reset all correlations to AI‑suggested values?")) return;
    const init: Matrix = {};
    coIds.forEach((co) => {
      const ai = CO_PO_MAPPING[co] || {};
      const row: Record<string, { value: number; source: CellSource }> = {};
      [...PO_LIST, ...PSO_LIST].forEach((k) => {
        row[k] = { value: ai[k] ?? 0, source: "ai" };
      });
      init[co] = row;
    });
    setMatrix(init);
    setJustification("");
  };

  const handleSave = () => {
    if (hasManual && !justification.trim()) return;
    const payload: Record<string, Record<string, number>> = {};
    coIds.forEach((co) => {
      const row = matrix[co];
      payload[co] = {};
      [...PO_LIST, ...PSO_LIST].forEach((k) => {
        payload[co][k] = row?.[k]?.value ?? 0;
      });
    });
    setCOPOMapping(courseId, payload);
    addToast("CO–PO–PSO correlation matrix saved.", "success");
    router.push(`/faculty/course/${courseId}/co-generation`);
  };

  const tint = (v: number) =>
    v === 0
      ? "bg-white/5"
      : v === 1
      ? "bg-emerald-500/5"
      : v === 2
      ? "bg-emerald-500/10"
      : "bg-emerald-500/20";

  return (
    <AccessGate feature="co_generation" deny="lock">
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="flex flex-col h-[calc(100vh-64px)] bg-cosmic"
      >
        <motion.div
          variants={fadeSlideUp}
          className="px-6 py-3 border-b border-white/10 flex items-center justify-between bg-black/40"
        >
          <div className="flex items-center gap-3">
            <button
              onClick={() =>
                router.push(`/faculty/course/${courseId}/co-generation`)
              }
              className="inline-flex items-center gap-1.5 text-[10px] font-mono text-white/40 hover:text-white"
            >
              <ArrowLeft className="w-3 h-3" /> Back to CO Generation
            </button>
            <div>
              <p className="text-xs text-white/60">
                {course?.code || "Course"} · CO–PO–PSO Correlation Matrix
              </p>
              <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest">
                Adjust correlation strengths for each outcome
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {hasManual && (
              <span className="inline-flex items-center gap-1 text-[9px] font-mono text-amber-300">
                <AlertCircle className="w-3 h-3" /> Manual overrides present
              </span>
            )}
            <button
              onClick={handleResetAll}
              className="text-[10px] font-mono text-white/40 hover:text-white underline-offset-4 hover:underline"
            >
              Reset all to AI values
            </button>
            <button
              onClick={handleSave}
              disabled={hasManual && !justification.trim()}
              className="inline-flex items-center gap-1 rounded-md bg-brand px-4 py-1.5 text-[10px] font-mono uppercase tracking-widest text-white disabled:opacity-40"
            >
              <CheckCircle2 className="w-3 h-3" /> Save Matrix
            </button>
          </div>
        </motion.div>

        <div className="flex-1 overflow-auto px-4 py-4">
          <div className="overflow-x-auto rounded-xl border border-white/10 bg-black/40">
            <table className="min-w-[900px] w-full border-collapse text-xs">
              <thead className="bg-white/[0.03]">
                <tr>
                  <th className="px-3 py-2 text-[9px] font-mono text-white/40 uppercase tracking-widest">
                    CO
                  </th>
                  {PO_LIST.map((po) => (
                    <th
                      key={po}
                      className="px-2 py-2 text-[9px] font-mono text-white/40 uppercase tracking-widest"
                    >
                      {po}
                    </th>
                  ))}
                  {PSO_LIST.map((pso) => (
                    <th
                      key={pso}
                      className="px-2 py-2 text-[9px] font-mono text-white/40 uppercase tracking-widest"
                    >
                      {pso}
                    </th>
                  ))}
                  <th className="px-3 py-2 text-[9px] font-mono text-white/40 uppercase tracking-widest">
                    Total
                  </th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {coIds.map((co) => {
                  const row = matrix[co] || {};
                  return (
                    <tr
                      key={co}
                      className="border-t border-white/10 hover:bg-white/[0.02]"
                    >
                      <td className="px-3 py-2 font-mono text-xs text-white/60">
                        {co}
                      </td>
                      {[...PO_LIST, ...PSO_LIST].map((k) => {
                        const cell = row[k] || { value: 0, source: "ai" };
                        const prefix =
                          cell.source === "ai" ? (
                            <Star className="w-3 h-3 text-amber-300" />
                          ) : (
                            <Pencil className="w-3 h-3 text-brand" />
                          );
                        return (
                          <td key={k} className="px-1.5 py-1.5 text-center">
                            <div
                              className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 ${tint(cell.value)}`}
                            >
                              {prefix}
                              <select
                                value={cell.value}
                                onChange={(e) =>
                                  handleChangeCell(
                                    co,
                                    k,
                                    parseInt(e.target.value, 10),
                                  )
                                }
                                className="bg-transparent text-[10px] font-mono text-white/80 outline-none"
                              >
                                <option value={0}>0</option>
                                <option value={1}>1</option>
                                <option value={2}>2</option>
                                <option value={3}>3</option>
                              </select>
                            </div>
                          </td>
                        );
                      })}
                      <td className="px-3 py-2 text-center text-[10px] font-mono text-white/70">
                        {rowTotals[co] ?? 0}
                      </td>
                      <td className="px-2 py-2 text-right">
                        <button
                          onClick={() => handleResetRow(co)}
                          className="text-[9px] font-mono text-white/40 hover:text-white underline-offset-4 hover:underline"
                        >
                          Reset to AI values
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {/* Column totals */}
                <tr className="border-t border-white/20 bg-white/[0.03]">
                  <td className="px-3 py-2 text-[9px] font-mono text-white/50 uppercase tracking-widest">
                    Total
                  </td>
                  {[...PO_LIST, ...PSO_LIST].map((k) => (
                    <td
                      key={k}
                      className="px-1.5 py-2 text-center text-[10px] font-mono text-white/60"
                    >
                      {colTotals[k] ?? 0}
                    </td>
                  ))}
                  <td />
                  <td />
                </tr>
              </tbody>
            </table>
          </div>

          {hasManual && (
            <div className="mt-4 max-w-xl space-y-2">
              <p className="text-[10px] font-mono text-white/40 uppercase tracking-widest">
                Justification for manual overrides <span className="text-alert">*</span>
              </p>
              <textarea
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                placeholder="Explain why certain CO–PO/PSO correlations differ from the AI‑suggested matrix..."
                className="w-full rounded-md border border-white/15 bg-black/50 px-3 py-2 text-xs text-white outline-none focus:border-brand h-20 resize-none"
              />
              {hasManual && !justification.trim() && (
                <p className="text-[10px] text-alert">
                  A justification is required before saving manual correlation changes.
                </p>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </AccessGate>
  );
}

