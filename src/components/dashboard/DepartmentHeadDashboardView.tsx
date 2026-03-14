"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Building2,
  Activity,
  PieChart,
  AlertTriangle,
  FileText,
  Lock,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  Users,
  Flag,
  ArrowUpRight,
} from "lucide-react";
import { useAuthStore } from "@/lib/authStore";
import { useDataStore, PROGRAM_OUTCOMES, CO_PO_MAPPING } from "@/lib/dataStore";
import { computeCOAttainmentFromMarks, computePOAttainment } from "@/lib/computations";
import { staggerContainer, fadeSlideUp } from "@/lib/animations";
import { DataTable } from "@/components/ui/DataTable";

export function DepartmentHeadDashboardView() {
  const { user, activeAY } = useAuthStore();
  const courses = useDataStore((s) => s.courses);
  const submissions = useDataStore((s) => s.submissions);
  const examConfigs = useDataStore((s) => s.examConfigs);
  const thresholds = useDataStore((s) => s.thresholds);
  const ay = useDataStore((s) => s.ay);
  const users = useDataStore((s) => s.users);
  const reportDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const deptCourses = useMemo(
    () =>
      courses.filter((c) =>
        user?.department ? c.dept === user.department : true
      ),
    [courses, user]
  );

  const {
    totalCourses,
    totalCOs,
    approvedSubs,
    pendingSubs,
    level1COs,
    avgDeptCO,
    poAttainment,
  } = useMemo(() => {
    let totalCOsLocal = 0;
    let level1Count = 0;
    const allCOPcts: { co: string; pct: number }[] = [];
    let overallCOAccum = 0;
    let overallCOCount = 0;
    let approvedCount = 0;
    let pendingCount = 0;

    deptCourses.forEach((course) => {
      const subs = submissions[course.id] || [];
      const exams = examConfigs[course.id] || [];
      const approved = subs.filter((s) => s.status === "approved");
      const allMarks = approved.flatMap((s) => s.students);
      const allQs = exams.flatMap((e) => e.questions);

      approvedCount += approved.length;
      pendingCount += subs.filter(
        (s) => s.status === "pending" || s.status === "draft"
      ).length;

      if (!allMarks.length || !allQs.length) {
        return;
      }

      const att = computeCOAttainmentFromMarks(
        allMarks,
        allQs,
        thresholds.targetPassPct
      );

      Object.entries(att).forEach(([co, d]) => {
        totalCOsLocal += 1;
        allCOPcts.push({ co, pct: d.pct });
        overallCOAccum += d.pct;
        overallCOCount += 1;
        if (d.pct < thresholds.level2) level1Count += 1;
      });
    });

    const po =
      allCOPcts.length > 0
        ? computePOAttainment(allCOPcts, CO_PO_MAPPING)
        : {};

    return {
      totalCourses: deptCourses.length,
      totalCOs: totalCOsLocal,
      approvedSubs: approvedCount,
      pendingSubs: pendingCount,
      level1COs: level1Count,
      avgDeptCO:
        overallCOCount > 0
          ? Math.round(overallCOAccum / overallCOCount)
          : 0,
      poAttainment: po,
    };
  }, [deptCourses, submissions, examConfigs, thresholds]);

  const facultyProgress = useMemo(() => {
    const facultyInDept = users.filter(
      (u) =>
        u.dept === user?.department &&
        u.roles.includes("faculty")
    );

    return facultyInDept.map((f) => {
      const facCourses = deptCourses.filter(
        (c) => c.facultyId === f.id
      );
      let submitted = 0;
      let approved = 0;
      let pending = 0;

      facCourses.forEach((course) => {
        const subs = submissions[course.id] || [];
        subs.forEach((s) => {
          if (s.status === "approved") approved += 1;
          else if (s.status === "pending") pending += 1;
          else if (s.status === "draft") submitted += 1;
        });
      });

      return {
        name: f.name,
        courses: facCourses.length,
        submitted: submitted + approved + pending,
        approved,
        pending: pending + submitted,
      };
    });
  }, [users, deptCourses, submissions, user]);

  const heatMapData = useMemo(() => {
    return deptCourses.slice(0, 6).map((course) => {
      const subs = (submissions[course.id] || []).filter(
        (s) => s.status === "approved"
      );
      const exams = examConfigs[course.id] || [];
      const allMarks = subs.flatMap((s) => s.students);
      const allQs = exams.flatMap((e) => e.questions);

      if (!allMarks.length || !allQs.length) {
        return { course: course.code, cos: [] as string[] };
      }

      const att = computeCOAttainmentFromMarks(
        allMarks,
        allQs,
        thresholds.targetPassPct
      );

      const cos: string[] = ["CO1", "CO2", "CO3", "CO4", "CO5", "CO6"].map(
        (co) => {
          const d = att[co];
          if (!d) return "";
          const lvl = d.pct >= thresholds.level3 ? "L3" : d.pct >= thresholds.level2 ? "L2" : "L1";
          return lvl;
        }
      );

      return { course: course.code, cos };
    });
  }, [deptCourses, submissions, examConfigs, thresholds]);

  const poCards = useMemo(() => {
    return PROGRAM_OUTCOMES.slice(0, 4).map((po) => {
      const d = poAttainment[po.id];
      return {
        id: po.id,
        name: po.name,
        value: d?.pct ?? 0,
      };
    });
  }, [poAttainment]);

  const ayLabel =
    ay.ay || activeAY;
  const isLocked = ay.status === "locked" || ay.status === "archived";

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="flex flex-col gap-16 pb-32"
    >
      {/* ── HEADER ── */}
      <motion.section variants={fadeSlideUp} className="flex flex-col gap-4">
        <div className="flex items-center gap-3 text-[10px] font-mono text-orange-400 uppercase tracking-widest">
          <span className="w-8 h-[1px] bg-orange-400" /> Executive Oversight
        </div>
        <div className="flex justify-between items-end border-b border-white/5 pb-8">
          <div>
            <h1 className="text-5xl font-display text-white tracking-tight">
              OBE <span className="text-white/20">Executive</span> Dashboard
            </h1>
            <p className="text-white/40 font-light mt-3 text-lg">
              {user?.name || "Department Head"} ·{" "}
              <span className="text-orange-400/60">{user?.department}</span>
            </p>
            <div className="flex gap-6 mt-4">
              <p className="text-[10px] font-mono text-white/20 uppercase tracking-[0.2em]">
                AY {ayLabel}
              </p>
              <p className="text-[10px] font-mono text-white/20 uppercase tracking-[0.2em]">
                Status: {ay.status}
              </p>
            </div>
          </div>
          <Link
            href="/hod/year-end-lock"
            className={`px-8 py-4 text-[10px] font-mono uppercase tracking-[0.2em] flex items-center gap-3 transition-all ${
              isLocked
                ? "text-white/20 border border-white/10"
                : "bg-orange-400 text-black hover:bg-orange-500 shadow-2xl shadow-orange-400/20"
            }`}
          >
            <Lock className="w-3.5 h-3.5" />{" "}
            {isLocked ? "Year-End Locked" : "Year-End Sign-Off"}
          </Link>
        </div>
      </motion.section>

      {/* ── DEPT SUMMARY (FLATTENED) ── */}
      <motion.section
        variants={fadeSlideUp}
        className="flex flex-col gap-12"
      >
        <div className="flex justify-between items-start gap-12">
          <div className="flex-1 space-y-2">
            <span className="text-[9px] font-mono text-white/20 uppercase tracking-[0.3em]">Total Courses</span>
            <p className="text-4xl font-display text-white">{totalCourses}</p>
            <p className="text-[10px] text-white/30 font-mono tracking-tight">{totalCOs} outcomes mapped</p>
          </div>
          <div className="w-[1px] h-16 bg-white/5" />
          <div className="flex-1 space-y-2">
            <span className="text-[9px] font-mono text-white/20 uppercase tracking-[0.3em]">Approval Progress</span>
            <p className="text-4xl font-display text-attain">{approvedSubs}</p>
            <p className="text-[10px] text-white/30 font-mono tracking-tight">{pendingSubs} current queue</p>
          </div>
          <div className="w-[1px] h-16 bg-white/5" />
          <div className="flex-1 space-y-2">
            <span className="text-[9px] font-mono text-white/20 uppercase tracking-[0.3em]">Critical Risks (L1)</span>
            <p className="text-4xl font-display text-alert">{level1COs}</p>
            <p className="text-[10px] text-white/30 font-mono tracking-tight">Below {thresholds.level2}% band</p>
          </div>
          <div className="w-[1px] h-16 bg-white/5" />
          <div className="flex-1 space-y-2">
            <span className="text-[9px] font-mono text-white/20 uppercase tracking-[0.3em]">Dept Health Index</span>
            <p className={`text-4xl font-display ${avgDeptCO >= thresholds.level3 ? "text-attain" : "text-brand"}`}>{avgDeptCO}%</p>
            <p className="text-[10px] text-white/30 font-mono tracking-tight">Target: {thresholds.level3}%</p>
          </div>
        </div>
      </motion.section>

      <div className="flex flex-col gap-24">
        {/* ── CO HEALTH HEAT MAP (FLATTENED) ── */}
        <motion.section variants={fadeSlideUp} className="space-y-8">
          <div className="flex justify-between items-end border-b border-white/5 pb-6">
            <h2 className="text-xl font-display text-white uppercase tracking-widest flex items-center gap-4">
              <Activity className="w-5 h-5 text-orange-400" /> CO Health heat map
            </h2>
            <div className="flex gap-6">
              {["L3", "L2", "L1"].map(l => (
                <div key={l} className="flex items-center gap-2 text-[9px] font-mono text-white/20 uppercase">
                  <div className={`w-1.5 h-1.5 rounded-full ${l === "L3" ? "bg-attain" : l === "L2" ? "bg-amber-400" : "bg-alert"}`} /> {l} band
                </div>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="py-4 text-[9px] font-mono text-white/20 uppercase tracking-[0.3em]">Course Code</th>
                  {["CO1", "CO2", "CO3", "CO4", "CO5", "CO6"].map(c => (
                    <th key={c} className="py-4 text-center text-[9px] font-mono text-white/20 uppercase tracking-[0.3em]">{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.02]">
                {heatMapData.map((row) => (
                  <tr key={row.course} className="hover:bg-white/[0.01] transition-colors">
                    <td className="py-6 font-mono text-xs text-white/40 uppercase">{row.course}</td>
                    {row.cos.map((level, i) => (
                      <td key={i} className="py-6">
                        <div className="flex justify-center">
                          <div className={`w-10 h-10 rounded border flex items-center justify-center text-[10px] font-mono transition-all ${
                            level === "L3" ? "bg-attain/10 text-attain border-attain/20" :
                            level === "L2" ? "bg-amber-400/10 text-amber-400 border-amber-400/20" :
                            level === "L1" ? "bg-alert/10 text-alert border-alert/20 font-bold" :
                            "text-white/5 bg-white/[0.01] border-transparent"
                          }`}>
                            {level || "—"}
                          </div>
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.section>

        {/* ── PO PERFORMANCE & GAP ANALYSIS (FLATTENED) ── */}
        <div className="grid lg:grid-cols-2 gap-24">
          <motion.section variants={fadeSlideUp} className="space-y-8">
            <h2 className="text-xl font-display text-white uppercase tracking-widest flex items-center gap-4 border-b border-white/5 pb-6">
              <BarChart3 className="w-5 h-5 text-orange-400" /> PO Attainment
            </h2>
            <div className="space-y-10">
              {poCards.map((p) => (
                <div key={p.id} className="space-y-4">
                  <div className="flex justify-between items-end">
                    <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">{p.id} · {p.name}</span>
                    <span className={`text-lg font-display ${p.value < thresholds.level2 ? "text-alert" : "text-white"}`}>{p.value}%</span>
                  </div>
                  <div className="h-0.5 bg-white/5 w-full">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${p.value}%` }}
                      className={`h-full ${p.value < thresholds.level2 ? "bg-alert" : "bg-brand"}`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.section>

          <motion.section variants={fadeSlideUp} className="space-y-8">
            <h3 className="text-xl font-display text-alert uppercase tracking-widest flex items-center gap-4 border-b border-white/5 pb-6">
              <Flag className="w-5 h-5" /> Gap Analysis
            </h3>
            <div className="space-y-8">
              {level1COs === 0 ? (
                <div className="flex gap-4 items-start py-4">
                  <CheckCircle2 className="w-6 h-6 text-attain shrink-0 mt-1" />
                  <div className="space-y-2">
                    <p className="text-sm font-bold text-white uppercase">Compliance Stabilized</p>
                    <p className="text-xs text-white/40 leading-relaxed font-light">All outcomes currently meet or exceed the minimum Level 2 band. No intervention required.</p>
                  </div>
                </div>
              ) : (
                <div className="flex gap-4 items-start py-4 border-b border-white/5">
                  <AlertCircle className="w-6 h-6 text-alert shrink-0 mt-1" />
                  <div className="space-y-3">
                    <p className="text-sm font-bold text-white uppercase">{level1COs} Critical Bottlenecks</p>
                    <p className="text-xs text-white/40 leading-relaxed font-light">Remedial journals required for all courses hovering below the {thresholds.level2}% attainment threshold.</p>
                    <Link href="/hod/co-attainment" className="text-[9px] font-mono text-orange-400 hover:text-white uppercase tracking-[0.2em] flex items-center gap-2">
                      Open Audit Logs <ArrowUpRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </motion.section>
        </div>

        {/* ── FACULTY PROGRESS (FLATTENED) ── */}
        <motion.section variants={fadeSlideUp} className="space-y-10">
          <div className="flex justify-between items-end border-b border-white/5 pb-6">
            <h3 className="text-xl font-display text-white uppercase tracking-widest flex items-center gap-4">
              <Users className="w-5 h-5 text-orange-400" /> Faculty Operations
            </h3>
          </div>
          <DataTable
            data={facultyProgress}
            pageSize={5}
            columns={[
              { id: "name", header: "Faculty", accessor: f => f.name, sortable: true, width: 250 },
              { id: "courses", header: "Courses", accessor: f => f.courses, sortable: true, width: 150 },
              { 
                id: "progress", 
                header: "Sub / App / Pend", 
                accessor: f => `${f.submitted}/${f.approved}/${f.pending}`,
                sortable: true,
                render: (_, f) => (
                  <div className="flex items-center gap-8 font-mono">
                    <span className="text-white/40">{f.submitted}</span>
                    <span className="text-attain">{f.approved}</span>
                    <span className="text-alert">{f.pending}</span>
                  </div>
                )
              }
            ]}
          />
        </motion.section>
      </div>

      {/* ── FOOTER ── */}
      <motion.section
        variants={fadeSlideUp}
        className="pt-16 border-t border-white/5 flex justify-between items-center"
      >
        <div className="flex items-center gap-4 text-[10px] font-mono text-white/20 uppercase tracking-[0.2em]">
          <FileText className="w-4 h-4" /> System Calculated Audit · {reportDate}
        </div>
        <div className="text-[9px] font-mono text-white/10 italic">
          v1.4 SECURE OBE ENGINE
        </div>
      </motion.section>
    </motion.div>
  );
}
