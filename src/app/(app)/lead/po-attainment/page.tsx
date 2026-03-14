"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, ChevronRight, TrendingUp, Target, Info } from "lucide-react";
import { useDataStore, CO_PO_MAPPING, PROGRAM_OUTCOMES, PROGRAM_SPECIFIC_OUTCOMES } from "@/lib/dataStore";
import { computeCOAttainmentFromMarks, computePOAttainment } from "@/lib/computations";
import { AccessGate } from "@/components/auth/AccessGate";
import { staggerContainer, fadeSlideUp } from "@/lib/animations";
import { useAuthStore } from "@/lib/authStore";
import { useUIStore } from "@/lib/uiStore";
import { formatAttainmentValue, formatCalculationTimestamp, formatThresholdLine, getAttainmentFormula } from "@/lib/dataDisplay";
import { getAttainmentColor, getAttainmentLevel, getCOLevelColor, getCOLevelLabel } from "@/lib/statusIndicators";

export default function LeadPOAttainmentPage() {
  const courses     = useDataStore(s => s.courses);
  const submissions = useDataStore(s => s.submissions);
  const examConfigs = useDataStore(s => s.examConfigs);
  const coPOMappings = useDataStore(s => s.coPOMappings);
  const thresholds  = useDataStore(s => s.thresholds);
  const { activeAY } = useAuthStore();
  const { addToast } = useUIStore();

  const [selectedPO, setSelectedPO] = useState<string | null>(null);

  // Compute real CO attainment across all courses, then aggregate to PO
  const { poResults, psoResults } = useMemo(() => {
    const allCOPcts: { co: string; pct: number }[] = [];

    courses.forEach(c => {
      const subs    = (submissions[c.id] || []).filter(s => s.status === "approved");
      const exams   = examConfigs[c.id] || [];
      const allMarks = subs.flatMap(s => s.students);
      const allQs    = exams.flatMap(e => e.questions);
      if (!allMarks.length || !allQs.length) return;
      const att = computeCOAttainmentFromMarks(allMarks, allQs, thresholds.targetPassPct);
      Object.entries(att).forEach(([co, d]) => allCOPcts.push({ co, pct: d.pct }));
    });

    // Use course-specific mappings if available, else global CO_PO_MAPPING
    const mapping = Object.keys(coPOMappings).length > 0
      ? Object.values(coPOMappings).reduce((acc, m) => ({ ...acc, ...m }), {})
      : CO_PO_MAPPING;

    const po  = allCOPcts.length ? computePOAttainment(allCOPcts, mapping) : {};
    // PSO subset
    const pso: Record<string, { pct: number }> = {};
    PROGRAM_SPECIFIC_OUTCOMES.forEach(p => {
      if (po[p.id]) pso[p.id] = po[p.id];
    });
    return { poResults: po, psoResults: pso };
  }, [courses, submissions, examConfigs, coPOMappings, thresholds]);

  const latestCalculation = useMemo(() => {
    const timestamps = Object.values(submissions)
      .flat()
      .filter(item => item.status === "approved")
      .map(item => item.approvedAt || item.submittedAt)
      .filter(Boolean)
      .map(value => new Date(value as string));

    if (!timestamps.length) return null;
    return new Date(Math.max(...timestamps.map(value => value.getTime())));
  }, [submissions]);

  const poList = PROGRAM_OUTCOMES.map(p => p.id);

  return (
    <AccessGate feature="po_attainment" deny="lock">
      <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="flex flex-col gap-0 pb-32">

        {/* Header */}
        <motion.div variants={fadeSlideUp} className="flex justify-between items-end pb-8 border-b border-white/5">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-mono text-brand uppercase tracking-widest mb-3">
              <span className="w-8 h-[1px] bg-brand" /> Institutional Benchmarks
            </div>
            <h1 className="text-4xl font-display text-white">Program Outcome Analysis</h1>
            <p className="text-white/40 font-light mt-1">Cumulative weighted attainment from all mapped courses for AY {activeAY}.</p>
          </div>
          <button onClick={async () => {
            const XLSX = await import("xlsx");
            const rows = poList.map(po => {
              const d = poResults[po];
              return { PO: po, "Attainment %": d?.pct || 0, Level: (d?.pct || 0) >= 60 ? "Level 3" : (d?.pct || 0) >= 40 ? "Level 2" : "Level 1", Status: (d?.pct || 0) >= 60 ? "Target Met" : "Gap" };
            });
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), "PO Attainment");
            XLSX.writeFile(wb, `PO_Attainment_${activeAY}.xlsx`);
            addToast("PO attainment report exported.", "success");
          }} className="px-5 py-2.5 border border-white/10 text-white/60 text-[10px] font-mono uppercase tracking-widest hover:border-white/30 hover:text-white transition-colors flex items-center gap-2">
            <Download className="w-3.5 h-3.5" /> Export Excel
          </button>
        </motion.div>

        <motion.div variants={fadeSlideUp} className="grid gap-6 border-b border-white/5 py-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.8fr)]">
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
            <div className="flex flex-wrap items-center gap-4 text-[10px] font-mono uppercase tracking-widest text-white/35">
              <span>{formatThresholdLine()}</span>
              <span>{latestCalculation ? formatCalculationTimestamp(latestCalculation) : "Awaiting approved marks"}</span>
              <span>{poList.length} POs tracked</span>
            </div>
            <p className="mt-4 text-sm text-white/55 leading-relaxed">Outcome status uses text-only colour logic so exported and printed reports stay readable without relying on filled chips or bar colours.</p>
          </div>
          <details className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
            <summary className="cursor-pointer list-none text-[10px] font-mono uppercase tracking-widest text-brand">View PO Attainment Formula</summary>
            <pre className="mt-4 whitespace-pre-wrap text-xs leading-6 text-white/55 font-sans">{getAttainmentFormula("PO")}</pre>
          </details>
        </motion.div>

        <div className="flex gap-0 divide-x divide-white/5">

          {/* Left: PO table */}
          <div className="flex-1 flex flex-col">
            <div className="flex items-center justify-between px-0 py-4 border-b border-white/5">
              <h3 className="text-[10px] font-mono text-white/30 uppercase tracking-widest flex items-center gap-2">
                <Target className="w-3.5 h-3.5" /> PO1 – PO12 Summary
              </h3>
              {Object.keys(poResults).length === 0 && (
                <span className="text-[10px] font-mono text-white/20 italic">No approved marks — attainment pending</span>
              )}
            </div>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.02]">
                  {["Program Outcome", "Attainment %", "Level", "Status", "Trace"].map(h => (
                    <th key={h} className="px-6 py-4 text-[9px] font-mono text-white/30 uppercase tracking-widest">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {poList.map(po => {
                  const data = poResults[po];
                  const att  = data?.pct || 0;
                  const levelCode = getAttainmentLevel(att);
                  const poName = PROGRAM_OUTCOMES.find(p => p.id === po)?.name || po;
                  return (
                    <tr key={po} className={`border-b border-white/5 hover:bg-white/[0.01] transition-colors ${selectedPO === po ? "bg-brand/[0.03]" : ""}`}>
                      <td className="px-6 py-4">
                        <p className="text-sm font-mono text-white">{po}</p>
                        <p className="text-[10px] text-white/30 mt-0.5">{poName}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`font-mono text-sm font-bold ${getAttainmentColor(att)}`}>{formatAttainmentValue(att)}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-[10px] font-mono uppercase ${getCOLevelColor(levelCode)}`}>
                          {levelCode} · {getCOLevelLabel(levelCode)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-[10px] font-mono uppercase ${getAttainmentColor(att)}`}>
                          {levelCode === "L3" ? "Target Met" : levelCode === "L2" ? "Monitor" : "Intervention"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button onClick={() => setSelectedPO(po === selectedPO ? null : po)}
                          className="p-1.5 text-white/10 hover:text-brand transition-colors">
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Right: drill-down + PSO */}
          <div className="w-80 shrink-0 flex flex-col divide-y divide-white/5">

            {/* CO contribution trace */}
            <div className="flex-1 p-6 flex flex-col gap-4 overflow-y-auto">
              <h3 className="text-[10px] font-mono text-white/30 uppercase tracking-widest flex items-center gap-2">
                <TrendingUp className="w-3.5 h-3.5" /> {selectedPO ? `${selectedPO} Trace` : "Select a PO to trace"}
              </h3>
              <AnimatePresence mode="wait">
                {selectedPO && poResults[selectedPO] ? (
                  <motion.div key={selectedPO} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="flex flex-col gap-3">
                    {poResults[selectedPO].contributions.map((cont, i) => (
                      <div key={i} className="border-b border-white/5 pb-3 last:border-0">
                        <div className="flex justify-between text-[10px] font-mono mb-1.5">
                          <span className="text-white">{cont.co}</span>
                          <span className="text-brand">Weight: {cont.weight}</span>
                        </div>
                        <div className="flex justify-between text-[9px] font-mono text-white/30 mb-1">
                          <span>Attained: {cont.coAtt}%</span>
                          <span>Influence: {((cont.weight / 3) * 100).toFixed(0)}%</span>
                        </div>
                        <div className="flex gap-0.5 h-1">
                          {Array.from({ length: 3 }).map((_, j) => (
                            <div key={j} className={`flex-1 ${j < cont.weight ? "bg-brand" : "bg-white/5"}`} />
                          ))}
                        </div>
                      </div>
                    ))}
                    {poResults[selectedPO].contributions.length === 0 && (
                      <p className="text-[10px] text-white/20 italic">No CO mappings found for {selectedPO}.</p>
                    )}
                    <div className="border-t border-white/5 pt-3 flex justify-between text-[10px] font-mono">
                      <span className="text-white/30 uppercase">Weighted Avg</span>
                      <span className={`font-bold ${getAttainmentColor(poResults[selectedPO].pct)}`}>{formatAttainmentValue(poResults[selectedPO].pct)}</span>
                    </div>
                  </motion.div>
                ) : (
                  <p className="text-[10px] text-white/20 italic">Click a row to trace CO contributions.</p>
                )}
              </AnimatePresence>
            </div>

            {/* PSO section */}
            <div className="p-6 flex flex-col gap-4">
              <h3 className="text-[10px] font-mono text-white/30 uppercase tracking-widest">PSO Performance</h3>
              {PROGRAM_SPECIFIC_OUTCOMES.map(pso => {
                const att = psoResults[pso.id]?.pct || 0;
                const levelCode = getAttainmentLevel(att);
                return (
                  <div key={pso.id} className="flex flex-col gap-2 border-b border-white/5 pb-3 last:border-0">
                    <div className="flex justify-between text-[10px] font-mono">
                      <span className="text-white">{pso.id}</span>
                      <span className={getAttainmentColor(att)}>{formatAttainmentValue(att)}</span>
                    </div>
                    <p className="text-[9px] text-white/20">{pso.name}</p>
                    <div className="flex items-center gap-2 text-[9px] font-mono uppercase tracking-widest">
                      <span className={getCOLevelColor(levelCode)}>{levelCode}</span>
                      <span className="text-white/25">{getCOLevelLabel(levelCode)}</span>
                    </div>
                  </div>
                );
              })}
              {Object.keys(psoResults).length === 0 && (
                <p className="text-[10px] text-white/20 italic">No data yet.</p>
              )}
            </div>
          </div>
        </div>

      </motion.div>
    </AccessGate>
  );
}
