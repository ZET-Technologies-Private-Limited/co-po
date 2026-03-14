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
        <section className="grid grid-cols-5 gap-4 p-4 border border-white/10 bg-white/[0.02] rounded-2xl">
          <div className="col-span-2 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
            <input
              type="text"
              placeholder="Search by course code or name..."
              className="w-full bg-white/5 border border-white/5 rounded-xl py-3 pl-12 pr-4 text-sm text-white outline-none focus:border-brand"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {["All Semesters", "All Regulations", `AY ${activeAY}`].map(
            (f, i) => (
              <div key={i} className="relative group">
                <select className="w-full bg-white/5 border border-white/5 rounded-xl py-3 px-4 text-xs text-white/60 appearance-none outline-none focus:border-brand cursor-default">
                  <option>{f}</option>
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-3 h-3 text-white/20 pointer-events-none" />
              </div>
            )
          )}
        </section>

        {/* ── MAIN TABLE ── */}
        <section className="border border-white/10 bg-white/[0.01] rounded-3xl overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.02]">
                <th className="p-6 text-[10px] font-mono text-white/20 uppercase tracking-widest">
                  Course Detail
                </th>
                <th className="p-6 text-center text-[10px] font-mono text-white/20 uppercase tracking-widest">
                  CO Attainment (L1-L3)
                </th>
                <th className="p-6 text-center text-[10px] font-mono text-white/20 uppercase tracking-widest">
                  Remedial
                </th>
                <th className="p-6 text-right text-[10px] font-mono text-white/20 uppercase tracking-widest">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredCourses.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="p-10 text-center text-sm text-white/30 italic"
                  >
                    No courses with approved marks found for the selected
                    department / filters.
                  </td>
                </tr>
              ) : (
                filteredCourses.map((c) => (
                  <tr
                    key={c.id}
                    className="group hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="p-6">
                      <p className="text-sm font-bold text-white uppercase">
                        {c.code}
                      </p>
                      <p className="text-[11px] text-white/40 mt-1">
                        {c.name}
                      </p>
                      <div className="flex gap-2 mt-2">
                        <span className="text-[8px] px-1.5 py-0.5 bg-white/5 rounded text-white/30 font-mono uppercase">
                          Sem {c.sem}
                        </span>
                        {c.regulation && (
                          <span className="text-[8px] px-1.5 py-0.5 bg-white/5 rounded text-white/30 font-mono uppercase">
                            {c.regulation}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-6 align-middle">
                      <div className="flex justify-center gap-1.5">
                        {CO_KEYS.map((_, idx) => {
                          const lvl = c.levels[idx];
                          if (!lvl) {
                            return (
                              <div
                                key={idx}
                                className="w-8 h-8 rounded border border-dashed border-white/10 text-[10px] font-mono text-white/15 flex items-center justify-center"
                              >
                                —
                              </div>
                            );
                          }
                          return (
                            <div
                              key={idx}
                              className={`w-8 h-8 rounded flex items-center justify-center text-[10px] font-mono font-bold ${
                                lvl === 3
                                  ? "bg-attain/20 text-attain border border-attain/30"
                                  : lvl === 2
                                  ? "bg-amber-400/20 text-amber-400 border border-amber-400/30"
                                  : "bg-alert/20 text-alert border border-alert/30"
                              }`}
                            >
                              L{lvl}
                            </div>
                          );
                        })}
                      </div>
                    </td>
                    <td className="p-6 text-center">
                      {c.remedial ? (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-400/10 text-amber-400 rounded-full text-[9px] font-mono uppercase">
                          <AlertCircle className="w-3 h-3" /> Has Level 1 COs
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-attain/10 text-attain rounded-full text-[9px] font-mono uppercase">
                          <CheckCircle2 className="w-3 h-3" /> All &gt;=
                          {thresholds.level2}%
                        </div>
                      )}
                    </td>
                    <td className="p-6 text-right">
                      <button className="p-2.5 bg-white/5 border border-white/10 rounded-xl text-white/40 hover:text-alert hover:border-alert/30 transition-all">
                        <Flag className="w-4 h-4" />
                        <span className="sr-only">Flag for Review</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </section>

        {/* ── OVERRIDE AUDIT LOG ── */}
        <section className="flex flex-col gap-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand/10 rounded-lg">
              <History className="w-5 h-5 text-brand" />
            </div>
            <h2 className="text-xl font-display text-white">
              Attainment Override Log
            </h2>
          </div>
          <div className="border border-white/10 bg-white/[0.01] rounded-3xl overflow-hidden shadow-2xl">
            <table className="w-full text-left border-collapse">
              <thead className="bg-white/5 border-b border-white/10">
                <tr>
                  <th className="p-6 text-[10px] font-mono text-white/20 uppercase tracking-widest">
                    Action
                  </th>
                  <th className="p-6 text-[10px] font-mono text-white/20 uppercase tracking-widest">
                    Role
                  </th>
                  <th className="p-6 text-[10px] font-mono text-white/20 uppercase tracking-widest">
                    Timestamp
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono text-[11px]">
                {overrideEntries.length === 0 ? (
                  <tr>
                    <td
                      colSpan={3}
                      className="p-8 text-center text-[11px] text-white/30 italic"
                    >
                      No manual attainment overrides have been recorded yet for
                      this academic year.
                    </td>
                  </tr>
                ) : (
                  overrideEntries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-white/[0.02]">
                      <td className="p-6 text-white/70">{entry.action}</td>
                      <td className="p-6 text-white/40 uppercase">
                        {entry.role}
                      </td>
                      <td className="p-6 text-white/40">{entry.timestamp}</td>
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
