"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Download, Loader2, CheckCircle2, FileSpreadsheet, Award, Lock, TrendingUp, AlertTriangle, BarChart2, Users, Briefcase } from "lucide-react";
import { staggerContainer, fadeSlideUp } from "@/lib/animations";
import { useAuthStore, Role } from "@/lib/authStore";

// ─── Report catalogue (Spec Section 11.1) ────────────────────────────────
type ReportDef = {
  id: string;
  name: string;
  desc: string;
  icon: any;
  allowedRoles: Role[];
  formats: ("PDF" | "Excel")[];
  nba?: boolean;
};

const REPORT_CATALOGUE: ReportDef[] = [
  {
    id: "co_attainment",
    name: "CO Attainment Report",
    desc: "Bar chart per CO, CIE vs SEE split, Level badges, student count per attainment level.",
    icon: BarChart2,
    allowedRoles: ["faculty", "subject_lead", "department_head", "admin"],
    formats: ["PDF", "Excel"],
  },
  {
    id: "po_attainment",
    name: "PO Attainment Report",
    desc: "PO-wise attainment %, CO contribution breakdown, target vs actual comparison.",
    icon: TrendingUp,
    allowedRoles: ["subject_lead", "department_head", "admin"],
    formats: ["PDF", "Excel"],
  },
  {
    id: "pso_attainment",
    name: "PSO Attainment Report",
    desc: "PSO-wise attainment %, mapping trace back to contributing COs and weights.",
    icon: Briefcase,
    allowedRoles: ["subject_lead", "department_head", "admin"],
    formats: ["PDF", "Excel"],
  },
  {
    id: "student_performance",
    name: "Student Performance Report",
    desc: "Student-wise CO score table, pass/fail breakdown per CO. Marks-level detail.",
    icon: Users,
    allowedRoles: ["faculty", "admin"],
    formats: ["Excel"],
  },
  {
    id: "ay_trend",
    name: "3-Year Trend Report",
    desc: "CO/PO line charts across AY-2 → AY-1 → Current AY. HOD and Admin only.",
    icon: TrendingUp,
    allowedRoles: ["department_head", "admin"],
    formats: ["PDF", "Excel"],
  },
  {
    id: "curricular_gap",
    name: "Curricular Gap Report",
    desc: "COs consistently below Level 2 for 2+ years, with curriculum improvement recommendations.",
    icon: AlertTriangle,
    allowedRoles: ["department_head", "admin"],
    formats: ["PDF"],
  },
  {
    id: "dept_summary",
    name: "Department Summary Report",
    desc: "All courses, all COs, PO/PSO aggregated at department level for accreditation.",
    icon: FileText,
    allowedRoles: ["department_head", "admin"],
    formats: ["PDF", "Excel"],
    nba: true,
  },
  {
    id: "nba_naac",
    name: "NBA / NAAC Export",
    desc: "One-click export of CO-PO attainment in the exact format required for NBA accreditation.",
    icon: Award,
    allowedRoles: ["admin"],
    formats: ["PDF", "Excel"],
    nba: true,
  },
];

export default function ReportsPage() {
  const { activeRole } = useAuthStore();
  const [generating, setGenerating] = useState<string | null>(null);
  const [ready, setReady] = useState<string[]>([]);
  const [downloading, setDownloading] = useState<string | null>(null);

  const visibleReports = REPORT_CATALOGUE.filter(r =>
    activeRole && r.allowedRoles.includes(activeRole)
  );

  const generate = (id: string) => {
    setGenerating(id);
    setTimeout(() => {
      setGenerating(null);
      setReady(prev => [...prev, id]);
    }, 2500);
  };

  const download = (id: string, fmt: string) => {
    setDownloading(`${id}-${fmt}`);
    setTimeout(() => setDownloading(null), 1000);
  };

  return (
    <div className="w-full min-h-screen pb-24">
      <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="max-w-5xl mx-auto px-6 pt-12">

        {/* Header */}
        <motion.div variants={fadeSlideUp} className="mb-16">
          <div className="flex items-center gap-3 text-sm font-mono text-brand uppercase tracking-widest mb-4">
            <span className="w-8 h-[1px] bg-brand" />
            Reporting Suite
          </div>
          <h1 className="text-5xl font-display text-white mb-4">Reports</h1>
          <p className="text-white/40 font-light max-w-xl">
            All reports are role-gated. You are viewing reports available to{" "}
            <span className="text-white font-medium">{activeRole?.replace("_", " ")}</span>.
          </p>
        </motion.div>

        {/* Report tiles */}
        <motion.div variants={staggerContainer} className="flex flex-col divide-y divide-white/10">
          {visibleReports.map((report, i) => {
            const isGenerating = generating === report.id;
            const isReady = ready.includes(report.id);
            const Icon = report.icon;
            return (
              <motion.div key={report.id} variants={fadeSlideUp}
                className="flex flex-col md:flex-row md:items-center gap-6 md:gap-12 py-10 group hover:pl-2 transition-all"
              >
                <div className="flex items-start gap-6 flex-1 min-w-0">
                  <Icon className="w-5 h-5 text-white/30 mt-0.5 shrink-0 group-hover:text-brand transition-colors" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-display text-white group-hover:text-brand transition-colors">
                        {report.name}
                      </h3>
                      {report.nba && (
                        <span className="px-2 py-0.5 bg-attain/10 border border-attain/30 text-attain text-[10px] font-mono uppercase tracking-widest">
                          NBA
                        </span>
                      )}
                    </div>
                    <p className="text-white/40 text-sm font-light leading-relaxed">{report.desc}</p>
                    <div className="flex gap-3 mt-3">
                      {report.formats.map(fmt => (
                        <span key={fmt} className="text-[10px] font-mono text-white/30 bg-white/5 px-2 py-1 uppercase">
                          {fmt}
                        </span>
                      ))}
                      <span className="text-[10px] font-mono text-white/20">
                        {report.allowedRoles.join(" · ")}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {isReady ? (
                    <>
                      {report.formats.map(fmt => (
                        <button key={fmt} onClick={() => download(report.id, fmt)}
                          className="flex items-center gap-2 px-4 py-2.5 border border-attain/50 text-attain text-xs font-mono uppercase tracking-widest hover:bg-attain hover:text-black transition-all"
                        >
                          {downloading === `${report.id}-${fmt}` ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Download className="w-3 h-3" />
                          )}
                          {fmt}
                        </button>
                      ))}
                    </>
                  ) : (
                    <button onClick={() => generate(report.id)} disabled={isGenerating}
                      className={`flex items-center gap-2 px-6 py-3 text-xs font-mono uppercase tracking-widest border transition-all ${
                        isGenerating
                          ? "border-white/10 text-white/30 cursor-wait"
                          : "border-white/30 text-white hover:bg-white hover:text-black"
                      }`}
                    >
                      {isGenerating ? (
                        <><Loader2 className="w-3 h-3 animate-spin" /> Generating…</>
                      ) : (
                        <><FileText className="w-3 h-3" /> Generate</>
                      )}
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {visibleReports.length === 0 && (
          <div className="py-24 text-center">
            <Lock className="w-8 h-8 text-white/20 mx-auto mb-4" />
            <p className="text-white/30 font-mono uppercase tracking-widest text-sm">No reports available for your role.</p>
          </div>
        )}

      </motion.div>
    </div>
  );
}
