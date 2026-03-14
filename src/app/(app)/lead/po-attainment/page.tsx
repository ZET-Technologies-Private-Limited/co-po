"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, Download, FileText, Layers, Target } from "lucide-react";
import jsPDF from "jspdf";
import * as XLSX from "xlsx";
import { useDataStore, CO_PO_MAPPING, PROGRAM_OUTCOMES, PROGRAM_SPECIFIC_OUTCOMES } from "@/lib/dataStore";
import { computeCOAttainmentFromMarks, computePOAttainment, getAttainmentLevel } from "@/lib/computations";
import { AccessGate } from "@/components/auth/AccessGate";
import { staggerContainer, fadeSlideUp } from "@/lib/animations";
import { useAuthStore } from "@/lib/authStore";

type POItem = {
  code: string;
  statement: string;
  mappedCOs: string[];
  weighted: number;
  level: number;
  target: number;
  gap: number;
  contributions: { co: string; weight: number; coAtt: number }[];
};

export default function LeadPOAttainmentPage() {
  const { activeAY } = useAuthStore();
  const courses = useDataStore(s => s.courses);
  const submissions = useDataStore(s => s.submissions);
  const examConfigs = useDataStore(s => s.examConfigs);
  const coPOMappings = useDataStore(s => s.coPOMappings);
  const thresholds = useDataStore(s => s.thresholds);
  const poDefinitions = useDataStore(s => s.poDefinitions);
  const psoDefinitions = useDataStore(s => s.psoDefinitions);

  const [expandedPO, setExpandedPO] = useState<string | null>(null);
  const [expandedPSO, setExpandedPSO] = useState<string | null>(null);
  const [showWorkedExample, setShowWorkedExample] = useState(false);

  const target = thresholds.level3;

  const { poRows, psoRows } = useMemo(() => {
    const allCOPcts: { co: string; pct: number }[] = [];

    courses.forEach(c => {
      const approvedSubs = (submissions[c.id] || []).filter(s => s.status === "approved");
      const exams = examConfigs[c.id] || [];
      const marks = approvedSubs.flatMap(s => s.students);
      const questions = exams.flatMap(e => e.questions);
      if (!marks.length || !questions.length) return;

      const att = computeCOAttainmentFromMarks(marks, questions, thresholds.targetPassPct);
      Object.entries(att).forEach(([co, data]) => {
        allCOPcts.push({ co, pct: data.pct });
      });
    });

    const mergedMapping = Object.keys(coPOMappings).length
      ? Object.values(coPOMappings).reduce((acc, m) => ({ ...acc, ...m }), {})
      : CO_PO_MAPPING;

    const poResult = allCOPcts.length ? computePOAttainment(allCOPcts, mergedMapping) : {};

    const poItems: POItem[] = PROGRAM_OUTCOMES.map(po => {
      const d = poResult[po.id];
      const statement = poDefinitions.find(def => def.id === po.id)?.statement || po.name;
      const mappedCOs = Array.from(new Set((d?.contributions || []).map(c => c.co)));
      const weighted = d?.pct || 0;
      const level = getAttainmentLevel(weighted, thresholds).level;
      const gap = Math.round((weighted - target) * 10) / 10;
      return {
        code: po.id,
        statement,
        mappedCOs,
        weighted,
        level,
        target,
        gap,
        contributions: d?.contributions || [],
      };
    });

    const psoItems: POItem[] = PROGRAM_SPECIFIC_OUTCOMES.map(pso => {
      const d = poResult[pso.id];
      const statement = psoDefinitions.find(def => def.id === pso.id)?.statement || pso.name;
      const mappedCOs = Array.from(new Set((d?.contributions || []).map(c => c.co)));
      const weighted = d?.pct || 0;
      const level = getAttainmentLevel(weighted, thresholds).level;
      const gap = Math.round((weighted - target) * 10) / 10;
      return {
        code: pso.id,
        statement,
        mappedCOs,
        weighted,
        level,
        target,
        gap,
        contributions: d?.contributions || [],
      };
    });

    return { poRows: poItems, psoRows: psoItems };
  }, [courses, submissions, examConfigs, coPOMappings, thresholds, poDefinitions, psoDefinitions, target]);

  const exportExcel = () => {
    const wb = XLSX.utils.book_new();

    const poSheet = poRows.map(r => ({
      Code: r.code,
      Statement: r.statement,
      MappedCOs: r.mappedCOs.join(", "),
      WeightedAttainment: r.weighted,
      Level: `L${r.level}`,
      Target: r.target,
      Gap: r.gap,
    }));

    const psoSheet = psoRows.map(r => ({
      Code: r.code,
      Statement: r.statement,
      MappedCOs: r.mappedCOs.join(", "),
      WeightedAttainment: r.weighted,
      Level: `L${r.level}`,
      Target: r.target,
      Gap: r.gap,
    }));

    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(poSheet), "PO");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(psoSheet), "PSO");
    XLSX.writeFile(wb, `lead-po-pso-${activeAY}.xlsx`);
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text(`PO/PSO Attainment Report - AY ${activeAY}`, 14, 16);
    doc.setFontSize(10);
    doc.text(`Target threshold: ${target}%`, 14, 24);

    let y = 34;
    doc.setFontSize(11);
    doc.text("PO Summary", 14, y);
    y += 8;
    poRows.forEach(row => {
      if (y > 280) {
        doc.addPage();
        y = 20;
      }
      doc.setFontSize(9);
      doc.text(`${row.code}: ${row.weighted}% | L${row.level} | Gap ${row.gap >= 0 ? "+" : ""}${row.gap}%`, 14, y);
      y += 6;
    });

    y += 4;
    doc.setFontSize(11);
    doc.text("PSO Summary", 14, y);
    y += 8;
    psoRows.forEach(row => {
      if (y > 280) {
        doc.addPage();
        y = 20;
      }
      doc.setFontSize(9);
      doc.text(`${row.code}: ${row.weighted}% | L${row.level} | Gap ${row.gap >= 0 ? "+" : ""}${row.gap}%`, 14, y);
      y += 6;
    });

    doc.save(`lead-po-pso-${activeAY}.pdf`);
  };

  const exportNBA = () => {
    const rows = [...poRows, ...psoRows].map(r => ({
      OutcomeCode: r.code,
      OutcomeStatement: r.statement,
      MappedCOs: r.mappedCOs.join(", "),
      WeightedAttainment: r.weighted,
      Level: `L${r.level}`,
      Target: r.target,
      Gap: r.gap,
      AcademicYear: activeAY,
    }));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), "NBA_Format");
    XLSX.writeFile(wb, `nba-format-po-pso-${activeAY}.xlsx`);
  };

  const renderContributionRows = (rows: { co: string; weight: number; coAtt: number }[]) => {
    return (
      <table className="w-full border-collapse text-xs mt-2">
        <thead>
          <tr className="border-b border-white/10 bg-white/[0.02]">
            <th className="px-3 py-2 text-left text-[9px] font-mono text-white/30 uppercase">CO</th>
            <th className="px-3 py-2 text-left text-[9px] font-mono text-white/30 uppercase">Weight</th>
            <th className="px-3 py-2 text-left text-[9px] font-mono text-white/30 uppercase">CO Att%</th>
            <th className="px-3 py-2 text-left text-[9px] font-mono text-white/30 uppercase">Weighted Contribution</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((c, idx) => (
            <tr key={`${c.co}-${idx}`} className="border-b border-white/5">
              <td className="px-3 py-2 text-brand font-mono">{c.co}</td>
              <td className="px-3 py-2 text-white/60">{c.weight}</td>
              <td className="px-3 py-2 text-white/60">{c.coAtt}%</td>
              <td className="px-3 py-2 text-white/60">{Math.round(c.coAtt * c.weight * 10) / 10}</td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={4} className="px-3 py-3 text-white/35 italic">No contributing CO mappings found.</td>
            </tr>
          )}
        </tbody>
      </table>
    );
  };

  return (
    <AccessGate feature="po_attainment" deny="lock">
      <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="flex flex-col gap-0 pb-32">
        <motion.div variants={fadeSlideUp} className="flex justify-between items-end pb-8 border-b border-white/5">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-mono text-brand uppercase tracking-widest mb-3">
              <span className="w-8 h-[1px] bg-brand" /> Institutional Benchmarks
            </div>
            <h1 className="text-4xl font-display text-white">PO and PSO Attainment</h1>
            <p className="text-white/40 font-light mt-1">Weighted outcome analysis with contribution trace and target-gap tracking.</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={exportPDF} className="px-4 py-2 border border-white/15 text-white/60 text-[10px] font-mono uppercase tracking-widest hover:text-white inline-flex items-center gap-2">
              <FileText className="w-3.5 h-3.5" /> PDF
            </button>
            <button onClick={exportExcel} className="px-4 py-2 border border-white/15 text-white/60 text-[10px] font-mono uppercase tracking-widest hover:text-white inline-flex items-center gap-2">
              <Download className="w-3.5 h-3.5" /> Excel
            </button>
            <button onClick={exportNBA} className="px-4 py-2 bg-brand text-white text-[10px] font-mono uppercase tracking-widest hover:bg-brand/90 inline-flex items-center gap-2">
              <Layers className="w-3.5 h-3.5" /> NBA Format
            </button>
          </div>
        </motion.div>

        <motion.div variants={fadeSlideUp} className="py-5 border-b border-white/5 flex items-center justify-between">
          <p className="text-xs text-white/55">Formula: Weighted Attainment = sum(CO Attainment x Mapping Weight) / sum(Mapping Weights).</p>
          <button
            onClick={() => setShowWorkedExample(true)}
            className="text-[11px] font-mono uppercase tracking-widest text-brand hover:text-white"
          >
            See worked example
          </button>
        </motion.div>

        <motion.div variants={fadeSlideUp} className="py-6 border-b border-white/5">
          <p className="text-[10px] font-mono uppercase tracking-widest text-white/35 mb-3">PO Vertical Chart</p>
          <div className="relative h-56 border border-white/10 p-4">
            <div className="absolute left-0 right-0" style={{ bottom: `${target}%` }}>
              <div className="border-t border-dashed border-amber-300/60" />
              <p className="text-[10px] font-mono text-amber-300 mt-1 px-2">Threshold {target}%</p>
            </div>
            <div className="h-full flex items-end gap-2">
              {poRows.map(row => (
                <div key={row.code} className="flex-1 flex flex-col items-center gap-1">
                  <div className={`w-full ${row.gap >= 0 ? "bg-attain/70" : "bg-alert/70"}`} style={{ height: `${Math.max(2, row.weighted)}%` }} />
                  <p className="text-[9px] font-mono text-white/40">{row.code}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        <motion.div variants={fadeSlideUp} className="py-6 border-b border-white/5">
          <p className="text-[10px] font-mono uppercase tracking-widest text-white/35 mb-3">Program Outcomes</p>
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.02]">
                {["Code", "Statement", "Mapped COs", "Weighted Att%", "Level", "Target", "Gap", "Expand"].map(h => (
                  <th key={h} className="px-3 py-2 text-left text-[9px] font-mono text-white/30 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {poRows.map(row => (
                <>
                  <tr key={row.code} className="border-b border-white/5">
                    <td className="px-3 py-2 font-mono text-brand">{row.code}</td>
                    <td className="px-3 py-2 text-white/60">{row.statement}</td>
                    <td className="px-3 py-2 text-white/60">{row.mappedCOs.join(", ") || "-"}</td>
                    <td className="px-3 py-2 text-white">{row.weighted}%</td>
                    <td className="px-3 py-2 text-white/60">L{row.level}</td>
                    <td className="px-3 py-2 text-white/60">{row.target}%</td>
                    <td className={`px-3 py-2 font-mono ${row.gap >= 0 ? "text-attain" : "text-alert"}`}>
                      {row.gap >= 0 ? "+" : ""}
                      {row.gap}%
                    </td>
                    <td className="px-3 py-2">
                      <button onClick={() => setExpandedPO(prev => (prev === row.code ? null : row.code))} className="text-white/50 hover:text-white">
                        {expandedPO === row.code ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </td>
                  </tr>

                  {expandedPO === row.code && (
                    <tr>
                      <td colSpan={8} className="px-3 py-3 bg-white/[0.01] border-b border-white/10">
                        {renderContributionRows(row.contributions)}
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </motion.div>

        <motion.div variants={fadeSlideUp} className="py-6">
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-4 h-4 text-brand" />
            <p className="text-[10px] font-mono uppercase tracking-widest text-white/35">Program Specific Outcomes</p>
          </div>

          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.02]">
                {["Code", "Statement", "Mapped COs", "Weighted Att%", "Level", "Target", "Gap", "Expand"].map(h => (
                  <th key={h} className="px-3 py-2 text-left text-[9px] font-mono text-white/30 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {psoRows.map(row => (
                <>
                  <tr key={row.code} className="border-b border-white/5">
                    <td className="px-3 py-2 font-mono text-brand">{row.code}</td>
                    <td className="px-3 py-2 text-white/60">{row.statement}</td>
                    <td className="px-3 py-2 text-white/60">{row.mappedCOs.join(", ") || "-"}</td>
                    <td className="px-3 py-2 text-white">{row.weighted}%</td>
                    <td className="px-3 py-2 text-white/60">L{row.level}</td>
                    <td className="px-3 py-2 text-white/60">{row.target}%</td>
                    <td className={`px-3 py-2 font-mono ${row.gap >= 0 ? "text-attain" : "text-alert"}`}>
                      {row.gap >= 0 ? "+" : ""}
                      {row.gap}%
                    </td>
                    <td className="px-3 py-2">
                      <button onClick={() => setExpandedPSO(prev => (prev === row.code ? null : row.code))} className="text-white/50 hover:text-white">
                        {expandedPSO === row.code ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </td>
                  </tr>

                  {expandedPSO === row.code && (
                    <tr>
                      <td colSpan={8} className="px-3 py-3 bg-white/[0.01] border-b border-white/10">
                        {renderContributionRows(row.contributions)}
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </motion.div>

        <AnimatePresence>
          {showWorkedExample && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-6">
              <motion.div initial={{ scale: 0.97 }} animate={{ scale: 1 }} className="max-w-xl w-full bg-[#0a0a0f] border border-white/10 p-6">
                <h2 className="text-lg font-display text-white mb-3">Worked Example</h2>
                <p className="text-sm text-white/60 leading-relaxed">
                  Example for PO1: CO1 at 70% with weight 3, CO2 at 60% with weight 2, CO3 at 50% with weight 1. Weighted attainment = (70x3 + 60x2 + 50x1) / (3+2+1) = 63.3%. Level = L3 if threshold is 60%.
                </p>
                <div className="mt-5 flex justify-end">
                  <button onClick={() => setShowWorkedExample(false)} className="px-4 py-2 bg-brand text-white text-[10px] font-mono uppercase tracking-widest">
                    Close
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AccessGate>
  );
}
