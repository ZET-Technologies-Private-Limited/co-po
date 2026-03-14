"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronDown, ChevronUp, ChevronRight } from "lucide-react";
import { useAuthStore } from "@/lib/authStore";
import { useDataStore } from "@/lib/dataStore";
import { computeCOAttainmentFromMarks } from "@/lib/computations";
import { staggerContainer, fadeSlideUp } from "@/lib/animations";

// ── helpers ──────────────────────────────────────────────────

function timeAgo(ts: string): string {
  const diff = Date.now() - new Date(ts.replace(" ", "T")).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins  < 1)  return "just now";
  if (mins  < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin", department_head: "HOD", subject_lead: "Lead",
  faculty: "Faculty", student: "Student",
};

const TYPE_COLOR: Record<string, string> = {
  login: "text-attain", login_fail: "text-alert", co_generate: "text-brand",
  marks: "text-white/50", approval: "text-aurora", override: "text-amber-400",
  system: "text-white/30", user: "text-insight", ay_lock: "text-amber-400",
  error: "text-alert",
};

const PAGE_SIZE = 20;

// ── component ────────────────────────────────────────────────

export function AdminDashboardView() {
  const { user } = useAuthStore();
  const users       = useDataStore(s => s.users);
  const courses     = useDataStore(s => s.courses);
  const submissions = useDataStore(s => s.submissions);
  const examConfigs = useDataStore(s => s.examConfigs);
  const cos         = useDataStore(s => s.cos);
  const ay          = useDataStore(s => s.ay);
  const ayHistory   = useDataStore(s => s.ayHistory);
  const auditLog    = useDataStore(s => s.auditLog);
  const thresholds  = useDataStore(s => s.thresholds);
  const grievances  = useDataStore(s => s.grievances);

  const [auditPage, setAuditPage]       = useState(0);
  const [errExpanded, setErrExpanded]   = useState(false);

  // ── A1-03: user count table ──
  const userStats = useMemo(() => {
    const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
    const roles = ["admin", "department_head", "subject_lead", "faculty", "student"] as const;
    return roles.map(role => {
      const group = users.filter(u => u.roles.includes(role));
      return {
        role: ROLE_LABELS[role],
        total:    group.length,
        active:   group.filter(u => u.status === "active").length,
        inactive: group.filter(u => u.status === "inactive").length,
        newThisWeek: group.filter(u => new Date(u.joinedAt) >= weekAgo).length,
      };
    });
  }, [users]);

  // ── A1-04: dept progress table ──
  const deptRows = useMemo(() => {
    const depts = [...new Set(courses.map(c => c.dept))];
    return depts.map(dept => {
      const dc = courses.filter(c => c.dept === dept);
      const withCOs = dc.filter(c => (cos[c.id] || []).length > 0).length;
      const coGenPct = dc.length ? Math.round((withCOs / dc.length) * 100) : 0;

      const allSubs = dc.flatMap(c => submissions[c.id] || []);
      const approved = allSubs.filter(s => s.status === "approved").length;
      const submitted = allSubs.filter(s => ["approved","pending","returned"].includes(s.status)).length;
      const marksApprPct = submitted ? Math.round((approved / submitted) * 100) : 0;

      let totalPct = 0, count = 0;
      dc.forEach(c => {
        const subs = (submissions[c.id] || []).filter(s => s.status === "approved");
        const exams = examConfigs[c.id] || [];
        const allMarks = subs.flatMap(s => s.students);
        const allQs = exams.flatMap(e => e.questions);
        if (allMarks.length && allQs.length) {
          const att = computeCOAttainmentFromMarks(allMarks, allQs, thresholds.targetPassPct);
          const vals = Object.values(att);
          if (vals.length) { totalPct += vals.reduce((a, v) => a + v.pct, 0) / vals.length; count++; }
        }
      });
      const poAvg = count ? Math.round(totalPct / count) : 0;

      // open alerts = courses with any L1 CO
      let openAlerts = 0;
      dc.forEach(c => {
        const subs = (submissions[c.id] || []).filter(s => s.status === "approved");
        const exams = examConfigs[c.id] || [];
        const allMarks = subs.flatMap(s => s.students);
        const allQs = exams.flatMap(e => e.questions);
        if (allMarks.length && allQs.length) {
          const att = computeCOAttainmentFromMarks(allMarks, allQs, thresholds.targetPassPct);
          openAlerts += Object.values(att).filter(v => v.pct < thresholds.level2).length;
        }
      });

      return { dept, courses: dc.length, coGenPct, marksApprPct, poAvg, openAlerts };
    });
  }, [courses, cos, submissions, examConfigs, thresholds]);

  // ── A1-05: pending actions ──
  const pendingActions = useMemo(() => {
    const items: { text: string; href: string }[] = [];

    // Threshold not set (all zeros)
    if (!thresholds.level3 && !thresholds.level2)
      items.push({ text: "Attainment thresholds not configured for current AY", href: "/admin/thresholds" });

    // AY near lock
    if (ay.coLockDeadline) {
      const days = Math.ceil((new Date(ay.coLockDeadline).getTime() - Date.now()) / 86400000);
      if (days >= 0 && days <= 14)
        items.push({ text: `AY ${ay.ay} CO lock deadline in ${days} day${days !== 1 ? "s" : ""} — review before locking`, href: "/admin/academic-year" });
    }

    // Courses with no COs
    const noCOCourses = courses.filter(c => !(cos[c.id] || []).length);
    if (noCOCourses.length)
      items.push({ text: `${noCOCourses.length} course${noCOCourses.length !== 1 ? "s" : ""} have no COs generated`, href: "/admin/co-library" });

    // Pending marks approvals
    const pendingCount = Object.values(submissions).flat().filter(s => s.status === "pending").length;
    if (pendingCount)
      items.push({ text: `${pendingCount} marks submission${pendingCount !== 1 ? "s" : ""} awaiting lead approval`, href: "/admin/audit-log" });

    // Inactive users
    const inactive = users.filter(u => u.status === "inactive").length;
    if (inactive)
      items.push({ text: `${inactive} user account${inactive !== 1 ? "s" : ""} are inactive — review access`, href: "/admin/users" });

    // Open grievances
    const openGrievances = grievances.filter(g => g.status === "pending" || g.status === "under_review").length;
    if (openGrievances)
      items.push({ text: `${openGrievances} student grievance${openGrievances !== 1 ? "s" : ""} pending resolution`, href: "/admin/audit-log" });

    // Open L1 alerts
    const totalAlerts = deptRows.reduce((a, d) => a + d.openAlerts, 0);
    if (totalAlerts)
      items.push({ text: `${totalAlerts} Level 1 CO alert${totalAlerts !== 1 ? "s" : ""} across departments require remedial action`, href: "/admin/audit-log" });

    return items;
  }, [thresholds, ay, courses, cos, submissions, users, grievances, deptRows]);

  // ── A1-06: events feed (paginated) ──
  const allEvents = useMemo(() =>
    [...auditLog].sort((a, b) => b.timestamp.localeCompare(a.timestamp)).slice(0, 200),
    [auditLog]
  );
  const totalPages = Math.ceil(allEvents.length / PAGE_SIZE);
  const pageEvents = allEvents.slice(auditPage * PAGE_SIZE, (auditPage + 1) * PAGE_SIZE);

  // ── A1-07: error log (last 24h) ──
  const errorEntries = useMemo(() => {
    const cutoff = Date.now() - 24 * 3600000;
    return auditLog.filter(e =>
      (e.type === "error" || e.result === "failure") &&
      new Date(e.timestamp.replace(" ", "T")).getTime() >= cutoff
    );
  }, [auditLog]);

  const errorGroups = useMemo(() => {
    const map = new Map<string, { type: string; count: number; first: string }>();
    errorEntries.forEach(e => {
      const key = e.errorType || e.type;
      const existing = map.get(key);
      if (!existing || e.timestamp < existing.first)
        map.set(key, { type: key, count: (existing?.count || 0) + 1, first: e.timestamp });
      else
        map.set(key, { ...existing, count: existing.count + 1 });
    });
    return [...map.values()];
  }, [errorEntries]);

  // ── AY table rows: current + history ──
  const ayRows = useMemo(() => [
    ay,
    ...ayHistory.sort((a, b) => b.ay.localeCompare(a.ay)).slice(0, 2),
  ], [ay, ayHistory]);

  const thCol = "text-[10px] font-mono text-white/30 uppercase tracking-widest py-3 px-4 text-left";
  const tdCol = "py-3 px-4 text-sm font-mono";

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="flex flex-col gap-0 pb-32">

      {/* ── PAGE HEADER ── */}
      <motion.section variants={fadeSlideUp} className="pb-8 border-b border-white/5">
        <p className="text-3xl font-display text-white mb-1">
          Admin Hub: <span className="text-white/40">{user?.name?.split(" ")[0]}</span>
        </p>

        {/* A1-01: system status line */}
        <p className="text-xs font-mono text-white/30 mt-3">
          <span className="text-attain">API: Healthy</span>
          {" | "}
          <span className="text-attain">DB: Connected</span>
          {" | "}
          <span className="text-white/50">Active Users: {users.filter(u => u.status === "active").length}</span>
          {" | "}
          <span className="text-white/30">Last Backup: 2 hours ago</span>
        </p>
      </motion.section>

      {/* ── A1-02: AY STATUS TABLE ── */}
      <motion.section variants={fadeSlideUp} className="py-8 border-b border-white/5">
        <h2 className="text-[10px] font-mono text-white/30 uppercase tracking-widest mb-5">Academic Year Status</h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-white/5">
                {["AY Code", "Status", "Start", "End", "Locked By", "Locked On"].map(h => (
                  <th key={h} className={thCol}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ayRows.map((row, i) => (
                <tr key={row.ay} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                  <td className={`${tdCol} text-white font-medium`}>{row.ay}{i === 0 && <span className="ml-2 text-[9px] text-brand uppercase tracking-widest">current</span>}</td>
                  <td className={`${tdCol} ${row.status === "active" ? "text-attain" : row.status === "locked" ? "text-amber-400" : "text-white/30"}`}>
                    {row.status.charAt(0).toUpperCase() + row.status.slice(1)}
                  </td>
                  <td className={`${tdCol} text-white/40`}>{row.startDate}</td>
                  <td className={`${tdCol} text-white/40`}>{row.endDate}</td>
                  <td className={`${tdCol} text-white/40`}>{row.lockedBy || "—"}</td>
                  <td className={`${tdCol} text-white/40`}>{row.lockedOn || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.section>

      {/* ── A1-03: USER COUNT TABLE ── */}
      <motion.section variants={fadeSlideUp} className="py-8 border-b border-white/5">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-[10px] font-mono text-white/30 uppercase tracking-widest">User Counts</h2>
          <Link href="/admin/users" className="text-[10px] font-mono text-brand hover:text-white transition-colors uppercase tracking-widest flex items-center gap-1">
            Manage Users <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-white/5">
                {["Role", "Total Users", "Active", "Inactive", "New This Week"].map(h => (
                  <th key={h} className={thCol}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {userStats.map(row => (
                <tr key={row.role} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                  <td className={`${tdCol} text-white/60`}>{row.role}</td>
                  <td className={`${tdCol} text-white`}>{row.total}</td>
                  <td className={`${tdCol} text-attain`}>{row.active}</td>
                  <td className={`${tdCol} ${row.inactive > 0 ? "text-alert" : "text-white/20"}`}>{row.inactive}</td>
                  <td className={`${tdCol} ${row.newThisWeek > 0 ? "text-brand" : "text-white/20"}`}>{row.newThisWeek}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.section>

      {/* ── A1-04: DEPT PROGRESS TABLE ── */}
      <motion.section variants={fadeSlideUp} className="py-8 border-b border-white/5">
        <h2 className="text-[10px] font-mono text-white/30 uppercase tracking-widest mb-5">Department Progress</h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-white/5">
                {["Dept", "Courses", "CO Gen %", "Marks Approved %", "Avg PO Att %", "Open Alerts"].map(h => (
                  <th key={h} className={thCol}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {deptRows.length === 0 ? (
                <tr><td colSpan={6} className="py-8 px-4 text-white/20 text-xs italic">No department data.</td></tr>
              ) : deptRows.map(row => (
                <tr key={row.dept} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                  <td className={`${tdCol} text-white/60`}>{row.dept}</td>
                  <td className={`${tdCol} text-white/40`}>{row.courses}</td>
                  <td className={`${tdCol} ${row.coGenPct === 100 ? "text-attain" : row.coGenPct >= 50 ? "text-amber-400" : "text-alert"}`}>{row.coGenPct}%</td>
                  <td className={`${tdCol} ${row.marksApprPct >= 80 ? "text-attain" : row.marksApprPct >= 50 ? "text-amber-400" : row.marksApprPct > 0 ? "text-alert" : "text-white/20"}`}>{row.marksApprPct}%</td>
                  <td className={`${tdCol} ${row.poAvg >= 60 ? "text-attain" : row.poAvg >= 40 ? "text-amber-400" : row.poAvg > 0 ? "text-alert" : "text-white/20"}`}>{row.poAvg > 0 ? `${row.poAvg}%` : "—"}</td>
                  <td className={`${tdCol} ${row.openAlerts > 0 ? "text-alert font-bold" : "text-white/20"}`}>{row.openAlerts}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.section>

      {/* ── A1-05: PENDING ACTIONS ── */}
      <motion.section variants={fadeSlideUp} className="py-8 border-b border-white/5">
        <h2 className="text-[10px] font-mono text-white/30 uppercase tracking-widest mb-5">Pending Actions</h2>
        {pendingActions.length === 0 ? (
          <p className="text-sm text-white/20 italic">No pending system actions. All tasks are complete.</p>
        ) : (
          <ol className="flex flex-col divide-y divide-white/5">
            {pendingActions.map((item, i) => (
              <li key={i} className="flex items-center justify-between py-3 gap-4">
                <div className="flex items-center gap-4 min-w-0">
                  <span className="text-xs font-mono text-white/20 w-5 shrink-0">{i + 1}.</span>
                  <span className="text-sm text-white/60">{item.text}</span>
                </div>
                <Link href={item.href}
                  className="text-xs font-mono text-brand hover:text-white transition-colors uppercase tracking-widest shrink-0 flex items-center gap-1">
                  Go <ChevronRight className="w-3 h-3" />
                </Link>
              </li>
            ))}
          </ol>
        )}
      </motion.section>

      {/* ── A1-06: EVENTS FEED ── */}
      <motion.section variants={fadeSlideUp} className="py-8 border-b border-white/5">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-[10px] font-mono text-white/30 uppercase tracking-widest">System Events</h2>
          <span className="text-[10px] font-mono text-white/20">
            Page {auditPage + 1} of {Math.max(totalPages, 1)} · {allEvents.length} events
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-white/5">
                {["Timestamp", "User", "Action", "Result"].map(h => (
                  <th key={h} className={thCol}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageEvents.length === 0 ? (
                <tr><td colSpan={4} className="py-8 px-4 text-white/20 text-xs italic">No events recorded yet.</td></tr>
              ) : pageEvents.map(entry => (
                <tr key={entry.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                  <td className="py-3 px-4 text-[10px] font-mono text-white/30 whitespace-nowrap">{entry.timestamp}</td>
                  <td className="py-3 px-4 text-xs font-mono text-white/40 whitespace-nowrap">{entry.userId}</td>
                  <td className={`py-3 px-4 text-xs ${TYPE_COLOR[entry.type] ?? "text-white/40"}`}>{entry.action}</td>
                  <td className="py-3 px-4 text-[10px] font-mono">
                    {entry.result === "failure"
                      ? <span className="text-alert">Failure</span>
                      : entry.result === "success"
                        ? <span className="text-attain">Success</span>
                        : <span className="text-white/20">—</span>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center gap-4 mt-4">
            <button
              onClick={() => setAuditPage(p => Math.max(0, p - 1))}
              disabled={auditPage === 0}
              className="text-xs font-mono text-white/30 hover:text-white disabled:opacity-20 transition-colors uppercase tracking-widest"
            >
              ← Prev
            </button>
            <span className="text-[10px] font-mono text-white/20">{auditPage + 1} / {totalPages}</span>
            <button
              onClick={() => setAuditPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={auditPage >= totalPages - 1}
              className="text-xs font-mono text-white/30 hover:text-white disabled:opacity-20 transition-colors uppercase tracking-widest"
            >
              Next →
            </button>
          </div>
        )}
      </motion.section>

      {/* ── A1-07: ERROR LOG ── */}
      {errorGroups.length > 0 && (
        <motion.section variants={fadeSlideUp} className="py-8">
          <button
            onClick={() => setErrExpanded(e => !e)}
            className="flex items-center gap-3 w-full text-left"
          >
            <h2 className="text-[10px] font-mono text-alert uppercase tracking-widest">
              System Errors (Last 24h) — {errorEntries.length} event{errorEntries.length !== 1 ? "s" : ""}
            </h2>
            {errExpanded
              ? <ChevronUp className="w-3.5 h-3.5 text-alert" />
              : <ChevronDown className="w-3.5 h-3.5 text-alert" />
            }
          </button>

          {errExpanded && (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-white/5">
                    {["Error Type", "Count", "First Occurrence"].map(h => (
                      <th key={h} className={thCol}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {errorGroups.map(eg => (
                    <tr key={eg.type} className="border-b border-white/5">
                      <td className="py-3 px-4 text-sm font-mono text-alert">{eg.type}</td>
                      <td className="py-3 px-4 text-sm font-mono text-white/60">{eg.count}</td>
                      <td className="py-3 px-4 text-xs font-mono text-white/30">{eg.first}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.section>
      )}

    </motion.div>
  );
}
