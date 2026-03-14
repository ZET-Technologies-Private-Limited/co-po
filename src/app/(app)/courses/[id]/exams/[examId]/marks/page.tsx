"use client";

import { use, useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronLeft, Save, Download, FileSpreadsheet, 
  CheckCircle2, AlertCircle, Calendar, Target,
  Users, BarChart3, Edit3, Trash2, Info, Search
} from "lucide-react";
import Link from "next/link";
import { fadeSlideUp, staggerContainer } from "@/lib/animations";
import { useDataStore, ExamConfig, StudentMark, ExamQuestion } from "@/lib/dataStore";
import { useAuthStore } from "@/lib/authStore";
import { useUIStore } from "@/lib/uiStore";

export default function MarksEntryPage({ params }: { params: Promise<{ id: string; examId: string }> }) {
  const { id: courseId, examId } = use(params);
  const { user }         = useAuthStore();
  const { addToast }     = useUIStore();
  const courses          = useDataStore(s => s.courses);
  const examConfigs      = useDataStore(s => s.examConfigs[courseId] || []);
  const submissions      = useDataStore(s => s.submissions[courseId] || []);
  const setSubmission    = useDataStore(s => s.setSubmission);
  const addAuditEntry    = useDataStore(s => s.addAuditEntry);

  const course = courses.find(c => c.id === courseId);
  const exam   = examConfigs.find(e => e.id === examId);
  const existing = submissions.find(s => s.examId === examId);

  // Local State for Marks
  const [localMarks, setLocalMarks] = useState<StudentMark[]>([]);
  const [isSaving, setIsSaving]     = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Initialize marks from store or create default list
  useEffect(() => {
    if (existing?.students) {
      setLocalMarks(existing.students);
    } else if (course?.studentRolls) {
      setLocalMarks(course.studentRolls.map(roll => ({
        roll: roll,
        name: `Student ${roll}`,
        marks: {},
        status: "present"
      })));
    }
  }, [existing, course]);

  const subStatus = existing?.status || "draft";

  const handleSave = async (status: "draft" | "pending") => {
    setIsSaving(true);
    await new Promise(r => setTimeout(r, 700));
    
    setSubmission(courseId, {
      courseId: courseId,
      examId: examId,
      status: status,
      submittedAt: new Date().toISOString(),
      students: localMarks
    });

    addAuditEntry({
      type: status === "pending" ? "approval" : "system",
      userId: user?.id || "fac",
      role: "faculty",
      action: `${status === "pending" ? "Submitted" : "Saved draft"} marks for ${course?.code} ${exam?.name}`,
      ip: "127.0.0.1"
    });

    addToast(status === "pending" ? "Marks submitted for lead approval." : "Draft marks saved locally.", "success");
    setIsSaving(false);
  };

  const isQuestionDisabled = (studentRoll: string, q: ExamQuestion) => {
    if (q.type !== "either-or" || !q.pairId) return false;
    const currentStudent = localMarks.find(s => s.roll === studentRoll);
    if (!currentStudent) return false;
    
    // Find the paired question
    const pairValue = currentStudent.marks[q.pairId];
    return pairValue !== undefined && pairValue !== "" && Number(pairValue) > 0;
  };

  const handleMarkChange = (roll: string, qno: string, val: string) => {
    const num = val === "" ? "" : parseFloat(val);
    const q = exam?.questions.find(x => x.qno === qno);
    
    if (num !== "" && num < 0) { addToast("Negative marks not allowed.", "error"); return; }
    if (q && num !== "" && num > q.maxMarks) { addToast(`${qno} marks exceed max ${q.maxMarks}.`, "error"); return; }

    setLocalMarks(prev => prev.map(s => {
      if (s.roll !== roll) return s;
      return { ...s, marks: { ...s.marks, [qno]: num } };
    }));
  };

  const getStudentTotal = (marks: Record<string, number | "">) => {
    return Object.values(marks).reduce((a, b) => (Number(a) || 0) + (Number(b) || 0), 0) as number;
  };

  const handleDownloadTemplate = () => {
    addToast("Generating Excel template...", "info");
    setTimeout(() => addToast("Template downloaded: Marks_Template.xlsx", "success"), 1000);
  };

  const filteredMarks = useMemo(() => 
    localMarks.filter(m => m.roll.toLowerCase().includes(searchQuery.toLowerCase()) || m.name.toLowerCase().includes(searchQuery.toLowerCase())), 
    [localMarks, searchQuery]);

  if (!course || !exam) return <div className="p-20 text-center text-white/20">Loading configuration...</div>;

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="max-w-[1600px] mx-auto pb-32 px-4">
      
      {/* ── HEADER ── */}
      <motion.div variants={fadeSlideUp} className="mb-10 flex justify-between items-end flex-wrap gap-8">
        <div>
          <Link href={`/courses/${courseId}`} className="flex items-center gap-2 text-white/30 hover:text-white transition-colors text-[10px] font-mono uppercase tracking-widest mb-4">
            <ChevronLeft className="w-4 h-4" /> {course.code} Portfolio
          </Link>
          <div className="flex items-center gap-4 mb-2">
            <h1 className="text-4xl font-display text-white">{exam.name}</h1>
            <span className={`px-2.5 py-1 text-[9px] font-mono uppercase border rounded ${
              subStatus === 'approved' ? 'border-attain/30 text-attain bg-attain/5' :
              subStatus === 'pending'  ? 'border-amber-400/30 text-amber-400 bg-amber-400/5' :
              'border-white/10 text-white/40'
            }`}>{subStatus}</span>
          </div>
          <div className="flex items-center gap-4 text-white/30 text-xs font-mono">
            <span className="flex items-center gap-2"><Calendar className="w-3.5 h-3.5" /> {exam.date || "Not set"}</span>
            <span className="w-1 h-1 rounded-full bg-white/10" />
            <span className="flex items-center gap-2"><Target className="w-3.5 h-3.5" /> {exam.maxMarks} Marks</span>
            <span className="w-1 h-1 rounded-full bg-white/10" />
            <span className="flex items-center gap-2"><FileSpreadsheet className="w-3.5 h-3.5" /> CSV/Excel enabled</span>
          </div>
        </div>

        <div className="flex gap-4">
           <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
              <input type="text" placeholder="Search roll/name..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                className="bg-white/5 border border-white/10 pl-10 pr-4 py-2 text-white text-xs outline-none focus:border-brand/40 rounded transition-all w-64" />
           </div>
           <button onClick={handleDownloadTemplate}
             className="px-4 py-2.5 bg-white/5 border border-white/10 text-white/40 hover:text-white text-[10px] font-mono uppercase rounded flex items-center gap-2 transition-all">
             <Download className="w-3.5 h-3.5" /> Template
           </button>
           <button onClick={() => handleSave("draft")} disabled={subStatus === 'approved' || isSaving}
             className="px-5 py-2.5 border border-brand/20 text-brand text-[10px] font-mono uppercase rounded hover:bg-brand/5 transition-all">
             Save Draft
           </button>
           <button onClick={() => handleSave("pending")} disabled={subStatus === 'approved' || subStatus === 'pending' || isSaving}
             className="px-6 py-2.5 bg-brand text-white text-[10px] font-mono uppercase rounded hover:bg-brand/90 transition-all shadow-lg">
             Submit Approval
           </button>
        </div>
      </motion.div>

      {/* ── RETURNED WARNING ── */}
      {existing?.status === "returned" && (
        <motion.div variants={fadeSlideUp} className="mb-8 p-6 bg-alert/5 border border-alert/20 rounded-xl flex gap-5 items-start">
           <AlertCircle className="w-6 h-6 text-alert mt-1 shrink-0" />
           <div>
              <p className="text-sm text-alert font-bold uppercase tracking-wider mb-1">Submission Returned for Correction</p>
              <p className="text-sm text-white/60 font-light italic">"{existing.returnReason}"</p>
           </div>
        </motion.div>
      )}

      {/* ── SPREADSHEET TABLE ── */}
      <motion.div variants={fadeSlideUp} className="border border-white/10 bg-white/[0.01] rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1200px]">
            <thead>
              <tr className="bg-[#0a0a0f] border-b border-white/10">
                <th className="p-5 text-[10px] font-mono text-white/30 uppercase tracking-widest border-r border-white/10 sticky left-0 bg-[#0a0a0f] z-20 w-56">Student Identity</th>
                {exam.questions.map(q => (
                  <th key={q.qno} className="p-5 text-center border-r border-white/10 group relative">
                    <div className="flex flex-col gap-1">
                      <span className="text-white text-[11px] font-bold">{q.qno}</span>
                      <span className="text-[9px] font-mono text-white/20 uppercase tracking-tighter">Max: {q.maxMarks}</span>
                      <span className="text-[9px] font-mono text-brand/40 uppercase">{q.co} · {q.bloomCode}</span>
                    </div>
                  </th>
                ))}
                <th className="p-5 text-[10px] font-mono text-white/30 uppercase tracking-widest text-center w-36 bg-brand/5">Total ({exam.maxMarks})</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredMarks.map((s) => {
                const total = getStudentTotal(s.marks);
                const isOver = total > exam.maxMarks;
                return (
                  <tr key={s.roll} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="p-5 sticky left-0 bg-[#0a0c12] border-r border-white/10 z-10 group-hover:bg-[#12141c] transition-colors">
                      <div className="flex flex-col">
                        <span className="text-white font-mono text-sm group-hover:text-brand transition-colors">{s.roll}</span>
                        <span className="text-[10px] text-white/30 font-light">{s.name}</span>
                      </div>
                    </td>
                    {exam.questions.map(q => {
                      const disabled = isQuestionDisabled(s.roll, q);
                      return (
                        <td key={q.qno} className={`p-0 border-r border-white/10 transition-all ${disabled ? "bg-black/40" : ""}`}>
                          <input 
                            type="number" 
                            disabled={disabled || subStatus === "approved" || subStatus === "pending"}
                            value={disabled ? "" : (s.marks[q.qno] ?? "")}
                            onChange={(e) => handleMarkChange(s.roll, q.qno, e.target.value)}
                            onFocus={(e) => e.target.select()}
                            className={`w-full h-16 bg-transparent text-center text-sm font-mono outline-none transition-all 
                              ${disabled ? "cursor-not-allowed opacity-0" : "text-white/70 focus:bg-brand/5 focus:text-white"}`}
                            placeholder={disabled ? "—" : "0"}
                          />
                        </td>
                      );
                    })}
                    <td className={`p-5 text-center font-mono text-sm border-l border-white/10 transition-colors
                      ${isOver ? "bg-alert/20 text-alert" : "bg-brand/5 text-brand"}`}>
                      {total}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* ── PERFORMANCE WIDGETS ── */}
      <motion.div variants={fadeSlideUp} className="mt-12 grid grid-cols-1 md:grid-cols-4 gap-6">
         {[
           { label: "Enrolled", val: localMarks.length, icon: Users, color: "text-white/60" },
           { label: "Attendance", val: `${Math.round((localMarks.length / (course?.students || 1)) * 100)}%`, icon: CheckCircle2, color: "text-attain" },
           { label: "Average", val: `${(localMarks.reduce((a, b) => a + getStudentTotal(b.marks), 0) / (localMarks.length || 1)).toFixed(1)} / ${exam.maxMarks}`, icon: BarChart3, color: "text-brand" },
           { label: "High Score", val: Math.max(0, ...localMarks.map(s => getStudentTotal(s.marks))), icon: Edit3, color: "text-amber-400" },
         ].map(stat => (
           <div key={stat.label} className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl flex flex-col gap-1">
              <span className="text-[10px] font-mono text-white/20 uppercase tracking-widest flex items-center gap-2">
                <stat.icon className="w-3 h-3" /> {stat.label}
              </span>
              <span className={`text-2xl font-mono ${stat.color}`}>{stat.val}</span>
           </div>
         ))}
      </motion.div>

    </motion.div>
  );
}
