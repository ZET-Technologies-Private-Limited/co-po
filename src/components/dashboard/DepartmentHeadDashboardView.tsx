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
      className="flex flex-col gap-12 pb-32"
    >
      {/* ── HEADER ── */}
      <motion.section variants={fadeSlideUp} className="flex flex-col gap-4">
        <div className="flex items-center gap-3 text-[10px] font-mono text-orange-400 uppercase tracking-widest">
          <span className="w-8 h-[1px] bg-orange-400" /> Executive Oversight
        </div>
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-display text-white">
              Dept Engine <span className="text-white/40">Dashboard</span>
            </h1>
            <p className="text-white/40 font-light mt-2 italic">
              {user?.name || "Head of Department"} ·{" "}
              {user?.department || "Department"}
            </p>
            <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest mt-1">
              AY {ayLabel} ·{" "}
              {ay.status === "active"
                ? "Active"
                : ay.status === "locked"
                ? "Locked"
                : "Archived"}
            </p>
          </div>
          <Link
            href="/hod/year-end-lock"
            className={`px-6 py-3 text-[10px] font-mono uppercase tracking-widest flex items-center gap-2 rounded shadow-lg shadow-orange-400/10 ${
              isLocked
                ? "bg-white/5 text-white/40 cursor-not-allowed"
                : "bg-orange-400 text-black hover:bg-orange-500"
            }`}
          >
            <Lock className="w-3.5 h-3.5" />{" "}
            {isLocked ? "Year-End Locked" : "Year-End Sign-Off"}
          </Link>
        </div>
      </motion.section>

      {/* ── DEPT SUMMARY CARDS ── */}
      <motion.section
        variants={fadeSlideUp}
        className="grid md:grid-cols-4 gap-6"
      >
        <div className="p-8 border border-white/10 bg-white/[0.02] rounded-2xl flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <Building2 className="w-5 h-5 text-orange-400" />
            <div className="px-2 py-0.5 rounded-full bg-white/5 text-[8px] font-mono text-white/30 tracking-widest uppercase">
              Institutional
            </div>
          </div>
          <div>
            <p className="text-[10px] font-mono text-white/40 uppercase tracking-widest">
              Total Courses
            </p>
            <p className="text-4xl font-display mt-1 text-white">
              {totalCourses}
            </p>
            <p className="text-[9px] text-white/20 font-mono mt-1">
              {totalCOs} mapped COs in department
            </p>
          </div>
        </div>

        <div className="p-8 border border-white/10 bg-white/[0.02] rounded-2xl flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <CheckCircle2 className="w-5 h-5 text-attain" />
            <div className="px-2 py-0.5 rounded-full bg-white/5 text-[8px] font-mono text-white/30 tracking-widest uppercase">
              Marks
            </div>
          </div>
          <div>
            <p className="text-[10px] font-mono text-white/40 uppercase tracking-widest">
              Marks Approved
            </p>
            <p className="text-4xl font-display mt-1 text-white">
              {approvedSubs}
            </p>
            <p className="text-[9px] text-white/20 font-mono mt-1">
              {pendingSubs} submissions pending
            </p>
          </div>
        </div>

        <div className="p-8 border border-white/10 bg-white/[0.02] rounded-2xl flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <AlertCircle className="w-5 h-5 text-alert" />
            <div className="px-2 py-0.5 rounded-full bg-white/5 text-[8px] font-mono text-white/30 tracking-widest uppercase">
              Risk
            </div>
          </div>
          <div>
            <p className="text-[10px] font-mono text-white/40 uppercase tracking-widest">
              Level 1 COs
            </p>
            <p className="text-4xl font-display mt-1 text-alert">
              {level1COs}
            </p>
            <p className="text-[9px] text-white/20 font-mono mt-1">
              Below {thresholds.level2}% attainment threshold
            </p>
          </div>
        </div>

        <div className="p-8 border border-white/10 bg-white/[0.02] rounded-2xl flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <Activity className="w-5 h-5 text-brand" />
            <div className="px-2 py-0.5 rounded-full bg-white/5 text-[8px] font-mono text-white/30 tracking-widest uppercase">
              Health
            </div>
          </div>
          <div>
            <p className="text-[10px] font-mono text-white/40 uppercase tracking-widest">
              Dept Average CO Attainment
            </p>
            <p
              className={`text-4xl font-display mt-1 ${
                avgDeptCO >= thresholds.level3
                  ? "text-attain"
                  : avgDeptCO >= thresholds.level2
                  ? "text-brand"
                  : "text-alert"
              }`}
            >
              {avgDeptCO}%
            </p>
            <p className="text-[9px] text-white/20 font-mono mt-1">
              Target: {thresholds.level3}% for Level 3
            </p>
          </div>
        </div>
      </motion.section>

      <div className="grid lg:grid-cols-3 gap-12">
        {/* ── LEFT: HEATMAP & PO STRIP ── */}
        <div className="lg:col-span-2 flex flex-col gap-12">
          {/* CO HEALTH HEAT MAP */}
          <motion.section
            variants={fadeSlideUp}
            className="p-8 border border-white/10 bg-white/[0.01] rounded-3xl flex flex-col gap-8"
          >
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-display text-white flex items-center gap-3">
                <Activity className="w-5 h-5 text-orange-400" /> CO Health heat
                map
              </h2>
              <div className="flex gap-4">
                <div className="flex items-center gap-2 font-mono text-[9px] text-white/20 uppercase">
                  <div className="w-2 h-2 rounded-sm bg-attain" /> L3
                </div>
                <div className="flex items-center gap-2 font-mono text-[9px] text-white/20 uppercase">
                  <div className="w-2 h-2 rounded-sm bg-amber-400" /> L2
                </div>
                <div className="flex items-center gap-2 font-mono text-[9px] text-white/20 uppercase">
                  <div className="w-2 h-2 rounded-sm bg-alert" /> L1
                </div>
              </div>
            </div>

            <div className="overflow-x-auto pb-4">
              <div className="min-w-[600px] flex flex-col gap-2">
                <div className="flex pb-4 mb-2 border-b border-white/5 text-[10px] font-mono text-white/20 uppercase tracking-widest">
                  <div className="w-32 shrink-0">Course Code</div>
                  <div className="flex-1 flex justify-between px-4">
                    {["CO1", "CO2", "CO3", "CO4", "CO5", "CO6"].map((c) => (
                      <div key={c} className="w-12 text-center">
                        {c}
                      </div>
                    ))}
                  </div>
                </div>
                {heatMapData.map((row) => (
                  <div
                    key={row.course}
                    className="flex items-center py-1 group"
                  >
                    <div className="w-32 shrink-0 font-mono text-xs text-white/40 group-hover:text-white transition-colors uppercase">
                      {row.course}
                    </div>
                    <div className="flex-1 flex justify-between px-4">
                      {row.cos.map((level, i) => (
                        <div
                          key={i}
                          className={`w-12 h-8 rounded border border-white/5 flex items-center justify-center text-[9px] font-mono transition-all transform hover:scale-110 ${
                            level === "L3"
                              ? "bg-attain/20 text-attain border-attain/30"
                              : level === "L2"
                              ? "bg-amber-400/20 text-amber-400 border-amber-400/30"
                              : level === "L1"
                              ? "bg-alert/20 text-alert border-alert/30 font-bold"
                              : "text-white/5 bg-white/[0.01]"
                          }`}
                        >
                          {level}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.section>

          {/* PO ATTAINMENT STRIP */}
          <motion.section
            variants={fadeSlideUp}
            className="p-8 border border-white/10 bg-white/[0.01] rounded-3xl flex flex-col gap-6"
          >
            <h2 className="text-xl font-display text-white flex items-center gap-3">
              <BarChart3 className="w-5 h-5 text-orange-400" /> Dept-Wide PO
              Attainment
            </h2>
            <div className="grid gap-6">
              {poCards.map((p) => (
                <div key={p.id} className="space-y-3">
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs font-mono text-white/50 uppercase">
                      {p.id} · {p.name}
                    </span>
                    <span
                      className={`text-xs font-mono font-bold ${
                        p.value < thresholds.level2
                          ? "text-alert"
                          : p.value < thresholds.level3
                          ? "text-amber-400"
                          : "text-attain"
                      }`}
                    >
                      {p.value}%
                    </span>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${p.value}%` }}
                      className={`h-full ${
                        p.value < thresholds.level2
                          ? "bg-alert"
                          : p.value < thresholds.level3
                          ? "bg-amber-400"
                          : "bg-brand"
                      }`}
                    />
                  </div>
                  {p.value < thresholds.level2 && (
                    <div className="flex items-center gap-2 text-[8px] font-mono text-alert animate-pulse uppercase tracking-widest">
                      <AlertTriangle className="w-3 h-3" /> Below{" "}
                      {thresholds.level2}% threshold
                    </div>
                  )}
                </div>
              ))}
            </div>
          </motion.section>
        </div>

        {/* ── RIGHT: FACULTY, ALERTS & TRENDS ── */}
        <div className="flex flex-col gap-12">
          {/* CURRICULAR GAP ALERTS */}
          <motion.section
            variants={fadeSlideUp}
            className="p-8 border border-alert/20 bg-alert/[0.01] rounded-2xl flex flex-col gap-8"
          >
            <h3 className="text-lg font-display text-alert flex items-center gap-3 uppercase tracking-widest">
              <Flag className="w-5 h-5" /> Curricular Gap Alerts
            </h3>
            <div className="flex flex-col gap-4">
              {level1COs === 0 ? (
                <div className="p-5 border border-attain/20 bg-attain/5 rounded-xl flex flex-col gap-3">
                  <div className="flex justify-between items-start">
                    <span className="text-sm font-bold text-white">
                      No Level 1 COs flagged
                    </span>
                    <CheckCircle2 className="w-4 h-4 text-attain" />
                  </div>
                  <p className="text-[11px] text-white/40 leading-relaxed">
                    All outcomes currently meet or exceed the minimum Level 2
                    band. Continue monitoring as new marks are approved.
                  </p>
                </div>
              ) : (
                <div className="p-5 border border-alert/10 bg-alert/5 rounded-xl flex flex-col gap-3">
                  <div className="flex justify-between items-start">
                    <span className="text-sm font-bold text-white">
                      {level1COs} outcome
                      {level1COs === 1 ? "" : "s"} below threshold
                    </span>
                    <span className="text-[10px] font-mono text-alert font-bold">
                      &lt; {thresholds.level2}%
                    </span>
                  </div>
                  <p className="text-[11px] text-white/40 leading-relaxed">
                    Review departmental CO attainment and remedial journals to
                    ensure corrective measures are recorded for all Level 1
                    outcomes.
                  </p>
                  <Link
                    href="/hod/co-attainment"
                    className="text-[9px] font-mono text-white/30 hover:text-white uppercase mt-2 flex items-center gap-2"
                  >
                    Open Dept CO Attainment <ArrowUpRight className="w-3 h-3" />
                  </Link>
                </div>
              )}
            </div>
          </motion.section>

          {/* FACULTY PROGRESS TABLE */}
          <motion.section
            variants={fadeSlideUp}
            className="p-8 border border-white/10 bg-white/[0.01] rounded-2xl flex flex-col gap-6"
          >
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-display text-white uppercase tracking-widest flex items-center gap-3">
                <Users className="w-4 h-4 text-orange-400" /> Faculty Progress
              </h3>
            </div>
            <div className="flex flex-col gap-4">
              <DataTable
                data={facultyProgress}
                pageSize={3}
                columns={[
                  {
                    id: "name",
                    header: "Faculty",
                    accessor: (f) => f.name,
                    sortable: true,
                    width: 220,
                  },
                  {
                    id: "courses",
                    header: "Courses",
                    accessor: (f) => f.courses,
                    sortable: true,
                    width: 220,
                  },
                  {
                    id: "progress",
                    header: "Submission Hub (Sub/App/Pend)",
                    accessor: (f) =>
                      `${f.submitted}/${f.approved}/${f.pending}`,
                    sortable: true,
                    width: 500,
                    render: (_, f) => (
                      <div className="grid grid-cols-3 gap-2 w-full">
                        <div className="flex flex-col items-center p-2 bg-white/5 rounded">
                          <span className="text-[8px] font-mono text-white/20 uppercase mb-1">
                            Sub.
                          </span>
                          <span className="text-xs text-white">
                            {f.submitted}
                          </span>
                        </div>
                        <div className="flex flex-col items-center p-2 bg-attain/10 rounded">
                          <span className="text-[8px] font-mono text-attain/40 uppercase mb-1">
                            App.
                          </span>
                          <span className="text-xs text-attain">
                            {f.approved}
                          </span>
                        </div>
                        <div className="flex flex-col items-center p-2 bg-alert/10 rounded">
                          <span className="text-[8px] font-mono text-alert/40 uppercase mb-1">
                            Pend.
                          </span>
                          <span className="text-xs text-alert">
                            {f.pending}
                          </span>
                        </div>
                      </div>
                    ),
                  },
                ]}
              />
            </div>
          </motion.section>

          {/* AY COMPARISON MINI CHART (current AY only, text summary) */}
          <motion.section
            variants={fadeSlideUp}
            className="p-8 border border-white/10 bg-white/[0.02] rounded-2xl flex flex-col gap-6"
          >
            <h3 className="text-sm font-display text-white uppercase tracking-widest flex items-center gap-3">
              <PieChart className="w-4 h-4 text-orange-400" /> Academic Year
              Snapshot
            </h3>
            <div className="flex flex-col gap-3 text-[11px] text-white/50">
              <p>
                Official calculations use the active academic year (
                <span className="font-mono text-white/80">{ayLabel}</span>) and
                the currently configured thresholds for Level 2 (
                {thresholds.level2}%) and Level 3 ({thresholds.level3}%).
              </p>
              <p>
                Multi-year trajectories can be reconstructed once historic marks
                are imported into the system; until then this view reflects the
                latest approved data only.
              </p>
            </div>
          </motion.section>
        </div>
      </div>

      <motion.section
        variants={fadeSlideUp}
        className="p-6 border border-white/10 bg-white/[0.02] rounded-2xl flex items-center gap-3"
      >
        <FileText className="w-4 h-4 text-white/40" />
        <p className="text-[11px] text-white/40">
          All figures on this dashboard are computed from approved marks and
          CO/PO mappings in the system. Locked academic years are treated as
          read-only for auditability.
        </p>
      </motion.section>
    </motion.div>
  );
}
