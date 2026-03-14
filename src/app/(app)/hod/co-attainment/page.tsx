"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Download,
  Flag,
  AlertCircle,
  CheckCircle2,
  History,
  ChevronDown,
} from "lucide-react";
import { AccessGate } from "@/components/auth/AccessGate";
import { staggerContainer, fadeSlideUp } from "@/lib/animations";
import { useDataStore } from "@/lib/dataStore";
import { useAuthStore } from "@/lib/authStore";
import { computeCOAttainmentFromMarks, getAttainmentLevel } from "@/lib/computations";

const CO_KEYS = ["CO1", "CO2", "CO3", "CO4", "CO5", "CO6"] as const;

type CourseRow = {
  id: string;
  code: string;
  name: string;
  sem: number;
  regulation?: string;
  ay: string;
  levels: (1 | 2 | 3 | null)[];
  remedial: boolean;
};

export default function HODCOAttainmentPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const { user, activeAY } = useAuthStore();
  const courses = useDataStore((s) => s.courses);
  const submissions = useDataStore((s) => s.submissions);
  const examConfigs = useDataStore((s) => s.examConfigs);
  const thresholds = useDataStore((s) => s.thresholds);
  const coLibrary = useDataStore((s) => s.coLibrary);
  const auditLog = useDataStore((s) => s.auditLog);

  const deptCourses = useMemo(
    () =>
      courses.filter((c) =>
        user?.department ? c.dept === user.department : true
      ),
    [courses, user]
  );

  const rows: CourseRow[] = useMemo(() => {
    return deptCourses.map((course) => {
      const subs = (submissions[course.id] || []).filter(
        (s) => s.status === "approved"
      );
      const exams = examConfigs[course.id] || [];
      const allMarks = subs.flatMap((s) => s.students);
      const allQs = exams.flatMap((e) => e.questions);

      const attainment = allMarks.length && allQs.length
        ? computeCOAttainmentFromMarks(
            allMarks,
            allQs,
            thresholds.targetPassPct
          )
        : {};

      const levels: (1 | 2 | 3 | null)[] = CO_KEYS.map((co) => {
        const data = attainment[co];
        if (!data) return null;
        const lvl = getAttainmentLevel(data.pct, thresholds);
        return lvl.level as 1 | 2 | 3;
      });

      const remedial = Object.values(attainment).some(
        (d) => d.pct < thresholds.level2
      );

      const libSet = coLibrary.find(
        (s) =>
          s.courseCode === course.code &&
          s.dept === course.dept &&
          s.status === "active"
      );

      return {
        id: course.id,
        code: course.code,
        name: course.name,
        sem: course.semester,
        regulation: libSet?.regulation,
        ay: activeAY,
        levels,
        remedial,
      };
    });
  }, [deptCourses, submissions, examConfigs, thresholds, coLibrary, activeAY]);

  const filteredCourses = useMemo(
    () =>
      rows.filter(
        (c) =>
          c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.name.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [rows, searchTerm]
  );

  const overrideEntries = useMemo(
    () => auditLog.filter((e) => e.type === "override"),
    [auditLog]
  );

  const handleExportExcel = async () => {
    const XLSX = await import("xlsx");
    const rowsForExport = filteredCourses.map((c) => ({
      Code: c.code,
      Name: c.name,
      Semester: c.sem,
      Regulation: c.regulation || "—",
      AY: c.ay,
      ...Object.fromEntries(
        CO_KEYS.map((co, idx) => {
          const lvl = c.levels[idx];
          return [co, lvl ? `L${lvl}` : "N/A"];
        })
      ),
      Remedial: c.remedial ? "Has Level 1 COs" : "None",
    }));
    const ws = XLSX.utils.json_to_sheet(rowsForExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "CO Attainment");
    XLSX.writeFile(wb, "HOD_CO_Attainment_Report.xlsx");
  };

  return (
    <AccessGate feature="dept_summary" deny="lock">
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="flex flex-col gap-10 pb-32"
      >
        <header className="flex flex-col gap-6">
          <div className="flex items-center gap-2 text-[10px] font-mono text-brand uppercase tracking-widest">
            <span className="w-8 h-[1px] bg-brand" /> Institutional Reporting
          </div>
          <div className="flex justify-between items-end">
            <div>
              <h1 className="text-4xl font-display text-white">
                Dept CO Attainment
              </h1>
              <p className="text-white/40 font-light mt-2 italic">
                Consolidated attainment from approved marks across{" "}
                {deptCourses.length} course
                {deptCourses.length === 1 ? "" : "s"}.
              </p>
            </div>
            <button
              onClick={handleExportExcel}
              className="px-5 py-2.5 bg-white/5 border border-white/10 text-white rounded-xl text-[10px] font-mono uppercase tracking-widest flex items-center gap-3 hover:bg-white/10 transition-all"
            >
              <Download className="w-4 h-4" /> Export All (Excel)
            </button>
          </div>
        </header>

        {/* ── FILTERS ── */}
        <section className="flex items-center gap-8 py-8 border-b border-white/5">
          <div className="flex-1 relative">
            <Search className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
            <input
              type="text"
              placeholder="Filter by course code or name..."
              className="w-full bg-transparent py-3 pl-8 pr-4 text-sm text-white outline-none placeholder:text-white/10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-12">
            {["All Semesters", "All Regulations", `AY ${activeAY}`].map(
              (f, i) => (
                <div key={i} className="relative group min-w-[120px]">
                  <select className="w-full bg-transparent text-[10px] font-mono text-white/40 uppercase tracking-widest appearance-none outline-none cursor-pointer hover:text-white transition-colors">
                    <option>{f}</option>
                  </select>
                  <ChevronDown className="absolute -right-4 top-1/2 -translate-y-1/2 w-3 h-3 text-white/10 pointer-events-none" />
                </div>
              )
            )}
          </div>
        </section>

        {/* ── MAIN TABLE (FLATTENED) ── */}
        <section className="mt-8">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5">
                <th className="py-4 text-[9px] font-mono text-white/20 uppercase tracking-[0.3em]">
                  Course Identity
                </th>
                <th className="py-4 text-center text-[9px] font-mono text-white/20 uppercase tracking-[0.3em]">
                  Attainment Matrix
                </th>
                <th className="py-4 text-center text-[9px] font-mono text-white/20 uppercase tracking-[0.3em]">
                  Remedial Status
                </th>
                <th className="py-4 text-right text-[9px] font-mono text-white/20 uppercase tracking-[0.3em]">
                  Audit
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.02]">
              {filteredCourses.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="py-12 text-center text-xs text-white/10 italic font-mono"
                  >
                    No approved attainment records match the current filter set.
                  </td>
                </tr>
              ) : (
                filteredCourses.map((c) => (
                  <tr
                    key={c.id}
                    className="group hover:bg-white/[0.01] transition-colors"
                  >
                    <td className="py-8">
                      <p className="text-sm font-bold text-white tracking-tight">
                        {c.code}
                      </p>
                      <p className="text-[11px] text-white/30 mt-1 uppercase font-mono tracking-tighter">
                        {c.name}
                      </p>
                      <div className="flex gap-4 mt-3">
                        <span className="text-[9px] text-white/20 font-mono uppercase tracking-widest">
                          S{c.sem}
                        </span>
                        <span className="text-[9px] text-white/20 font-mono uppercase tracking-widest">
                          {c.regulation || "General"}
                        </span>
                      </div>
                    </td>
                    <td className="py-8">
                      <div className="flex justify-center gap-2">
                        {CO_KEYS.map((_, idx) => {
                          const lvl = c.levels[idx];
                          return (
                            <div
                              key={idx}
                              className={`w-9 h-9 border flex items-center justify-center text-[10px] font-mono transition-all ${
                                lvl === 3 ? "text-attain border-attain/20 bg-attain/[0.02]" :
                                lvl === 2 ? "text-amber-400 border-amber-400/20 bg-amber-400/[0.02]" :
                                lvl === 1 ? "text-alert border-alert/20 bg-alert/[0.02] font-bold" :
                                "text-white/5 border-white/5"
                              }`}
                            >
                              {lvl ? `L${lvl}` : "—"}
                            </div>
                          );
                        })}
                      </div>
                    </td>
                    <td className="py-8 text-center child:text-[10px] child:font-mono child:uppercase child:tracking-widest">
                      {c.remedial ? (
                        <span className="text-alert flex items-center justify-center gap-2">
                          <AlertCircle className="w-3 h-3" /> Flagged
                        </span>
                      ) : (
                        <span className="text-attain flex items-center justify-center gap-2">
                          <CheckCircle2 className="w-3 h-3" /> Qualified
                        </span>
                      )}
                    </td>
                    <td className="py-8 text-right">
                      <button className="text-[10px] font-mono text-white/20 hover:text-white uppercase tracking-widest flex items-center gap-2 ml-auto">
                        View Dossier <Flag className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </section>

        {/* ── OVERRIDE AUDIT LOG (FLATTENED) ── */}
        <section className="mt-24 flex flex-col gap-10">
          <div className="flex items-center gap-4 border-b border-white/5 pb-6">
            <History className="w-5 h-5 text-brand" />
            <h2 className="text-xl font-display text-white uppercase tracking-widest">
              Manual attainment overrides
            </h2>
          </div>
          <div className="overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="py-4 text-[9px] font-mono text-white/20 uppercase tracking-[0.3em]">
                    Log Entry
                  </th>
                  <th className="py-4 text-[9px] font-mono text-white/20 uppercase tracking-[0.3em]">
                    Executor Agent
                  </th>
                  <th className="py-4 text-[9px] font-mono text-white/20 uppercase tracking-[0.3em] text-right">
                    Timestamp
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.02] font-mono">
                {overrideEntries.length === 0 ? (
                  <tr>
                    <td
                      colSpan={3}
                      className="py-8 text-center text-[10px] text-white/10 italic"
                    >
                      No overrides recorded in registry.
                    </td>
                  </tr>
                ) : (
                  overrideEntries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-white/[0.01]">
                      <td className="py-6 text-[11px] text-white/50">{entry.action}</td>
                      <td className="py-6 text-[11px] text-white/30 uppercase tracking-widest">
                        {entry.role}
                      </td>
                      <td className="py-6 text-[11px] text-white/30 text-right">{entry.timestamp}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </motion.div>
    </AccessGate>
  );
}
