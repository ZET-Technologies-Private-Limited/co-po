"use client";

import { useState, useRef, use } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, FileText, History, Eye, Edit3, CheckCircle2, UploadCloud, Loader2, Sparkles, ArrowRight, X } from "lucide-react";
import { staggerContainer, fadeSlideUp } from "@/lib/animations";

const VERSIONS = [
  { id: 1, label: "Version 03 — Current", date: "Mar 13, 2026", author: "Dr. Kumar", notes: "Final curriculum alignment" },
  { id: 2, label: "Version 02", date: "Feb 28, 2026", author: "Dr. Kumar", notes: "Module IV updates" },
  { id: 3, label: "Version 01 — Initial", date: "Jan 10, 2026", author: "Dr. Kumar", notes: "Base draft" },
];

const MOCK_CONTENT = `MODULE I: Introduction to DBMS
Overview of database systems, data models, schema and instances, database languages, database system architecture.

MODULE II: Relational Model
Relational model concepts, integrity constraints, relational algebra, structured query language (SQL).

MODULE III: Database Design
Entity-Relationship model, ER-to-relational mapping, normalization, functional dependencies, normal forms.

MODULE IV: Transactions and Concurrency
Transaction processing, ACID properties, concurrency control protocols, deadlock handling.

MODULE V: Storage and Indexing
Physical storage, file organization, indexing techniques, B-trees, query optimization.`;

export default function SyllabusPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: courseId } = use(params);
  const [tab, setTab] = useState<"upload" | "preview" | "history" | "edit">("upload");
  const [content, setContent] = useState(MOCK_CONTENT);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const simulateUpload = () => {
    setUploading(true);
    setTimeout(() => { setUploading(false); setUploaded(true); setTab("preview"); }, 2400);
  };

  const TABS = [
    { id: "upload", icon: Upload, label: "Upload" },
    { id: "preview", icon: Eye, label: "Preview" },
    { id: "edit", icon: Edit3, label: "Edit" },
    { id: "history", icon: History, label: "Versions" },
  ];

  return (
    <div className="w-full min-h-screen pb-32 pt-4">
      <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="max-w-5xl mx-auto flex flex-col gap-20">
        
        {/* ── HERO SECTION ── */}
        <motion.section variants={fadeSlideUp} className="flex flex-col gap-8">
          <div className="flex items-center gap-3 text-sm font-mono text-aurora uppercase tracking-widest">
            <span className="w-8 h-[1px] bg-aurora" /> Curriculum Control
          </div>
          <div className="flex items-end justify-between flex-wrap gap-8">
            <div className="flex-1 min-w-[300px]">
              <h1 className="text-6xl md:text-7xl font-display font-medium text-white leading-tight tracking-tight">
                Syllabus<br />
                <span className="text-white/30">Management.</span>
              </h1>
              <p className="text-xl text-white/50 font-light mt-6 max-w-xl">
                 Course {courseId.toUpperCase()} · Database Management Systems
              </p>
            </div>
            <div className="flex flex-col items-end gap-2 shrink-0">
               <span className="text-xs font-mono text-white/30 uppercase tracking-widest px-4 py-2 border border-white/10">Active v3.0.4</span>
            </div>
          </div>
        </motion.section>

        {/* ── TAB NAVIGATION ── */}
        <motion.section variants={fadeSlideUp} className="flex gap-0 border-b border-white/10">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id as any)}
              className={`flex items-center gap-2 px-8 py-5 text-xs font-mono uppercase tracking-widest transition-all ${tab === t.id ? "border-b-2 border-white text-white" : "text-white/30 hover:text-white/60"}`}>
              <t.icon className="w-3.5 h-3.5" /> {t.label}
            </button>
          ))}
        </motion.section>

        <AnimatePresence mode="wait">
          {/* UPLOAD PANEL */}
          {tab === "upload" && (
            <motion.section key="upload" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="min-h-[400px]">
              {!uploading && !uploaded ? (
                <div
                  onDragOver={e => { e.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={e => { e.preventDefault(); setDragging(false); simulateUpload(); }}
                  onClick={() => fileRef.current?.click()}
                  className={`group relative overflow-hidden flex flex-col items-center justify-center py-32 cursor-pointer transition-all border ${dragging ? "border-brand bg-brand/5 scale-[0.99]" : "border-white/10 hover:border-white/30"}`}
                >
                   {/* Background ambient light */}
                   <div className="absolute inset-0 bg-gradient-to-t from-brand/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                   
                   <input ref={fileRef} type="file" className="hidden" onChange={simulateUpload} accept=".pdf,.docx,.txt" />
                   <UploadCloud className={`w-16 h-16 mb-8 transition-all ${dragging ? "text-brand scale-110" : "text-white/20 group-hover:text-white/40 group-hover:scale-110"}`} />
                   <div className="text-center relative z-10">
                      <p className="text-white/70 text-2xl font-display group-hover:text-white transition-colors tracking-tight">Drop syllabus document here</p>
                      <p className="text-white/25 text-xs font-mono uppercase tracking-widest mt-4">PDF · DOCX · TXT (AI Analysis automatically applies)</p>
                   </div>
                   <div className="mt-12 px-6 py-2 border border-white/10 text-white/30 text-[10px] font-mono uppercase tracking-widest group-hover:border-white/30 group-hover:text-white/60 transition-all">
                      Select From Filesystem
                   </div>
                </div>
              ) : uploading ? (
                <div className="flex flex-col items-center justify-center py-32 gap-10">
                  <div className="relative">
                     <Loader2 className="w-16 h-16 text-brand animate-spin" />
                     <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-aurora animate-pulse" />
                  </div>
                  <div className="text-center">
                    <p className="text-white text-3xl font-display tracking-tight">AI Orchestration In Progress</p>
                    <p className="text-white/30 text-xs font-mono uppercase tracking-widest mt-4">Parsing module structure and Bloom's classification</p>
                  </div>
                  <div className="w-80 h-[2px] bg-white/5 relative overflow-hidden">
                    <motion.div className="h-full bg-brand shadow-[0_0_15px_rgba(37,99,235,0.5)]" initial={{ width: 0 }} animate={{ width: "100%" }} transition={{ duration: 2.4 }} />
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-32 gap-10">
                  <div className="w-16 h-16 rounded-full border border-attain flex items-center justify-center">
                     <CheckCircle2 className="w-8 h-8 text-attain" />
                  </div>
                  <div className="text-center">
                     <p className="text-white text-3xl font-display tracking-tight">Processing Successful</p>
                     <p className="text-white/30 text-xs font-mono uppercase tracking-widest mt-4">Syllabus v3.0.5 is ready for preview</p>
                  </div>
                  <button onClick={() => setTab("preview")} className="px-10 py-5 bg-white text-black font-medium text-sm hover:bg-white/90 transition-all uppercase tracking-widest font-mono group">
                    Initialize Preview <ArrowRight className="w-4 h-4 inline ml-2 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              )}
            </motion.section>
          )}

          {/* PREVIEW PANEL */}
          {tab === "preview" && (
            <motion.section key="preview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex flex-col gap-10">
              <div className="flex items-center justify-between pb-6 border-b border-white/10">
                <div className="flex items-center gap-4 text-xs font-mono text-attain uppercase tracking-widest">
                  <FileText className="w-4 h-4" /> syllabus_final_v3.pdf
                </div>
                <button onClick={() => setTab("edit")} className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-white/30 hover:text-white transition-colors">
                  <Edit3 className="w-3 h-3" /> Edit Source
                </button>
              </div>
              <div className="relative">
                 <div className="absolute -left-12 top-0 bottom-0 w-[1px] bg-white/5" />
                 <pre className="text-white/60 font-mono text-sm leading-[2.5] whitespace-pre-wrap pb-24 selection:bg-brand/30 selection:text-white">{content}</pre>
              </div>
            </motion.section>
          )}

          {/* EDIT PANEL */}
          {tab === "edit" && (
            <motion.section key="edit" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex flex-col gap-10">
              <div className="flex items-center justify-between">
                 <p className="text-xs font-mono text-white/30 uppercase tracking-widest">Manual Override • Live Sync</p>
                 <button onClick={() => setTab("preview")} className="p-2 text-white/20 hover:text-white transition-colors">
                    <X className="w-5 h-5" />
                 </button>
              </div>
              <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                className="bg-transparent border border-white/10 text-white/80 p-10 font-mono text-base leading-[2] resize-none outline-none h-[650px] focus:border-white/30 transition-colors selection:bg-brand/30 selection:text-white"
                spellCheck={false}
              />
              <div className="flex justify-end gap-6">
                 <button onClick={() => setTab("preview")} className="text-xs font-mono uppercase tracking-widest text-white/30 hover:text-white py-4 px-8 border border-white/10 hover:border-white/20">Discard</button>
                 <button onClick={() => setTab("preview")} className="px-10 py-4 bg-white text-black text-xs font-mono uppercase tracking-widest hover:bg-white/90 transition-all">Apply Changes</button>
              </div>
            </motion.section>
          )}

          {/* HISTORY PANEL */}
          {tab === "history" && (
            <motion.section key="history" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
               <p className="text-xs font-mono text-white/30 uppercase tracking-widest mb-8">Version Archive • Historical Snapshots</p>
               <div className="flex flex-col divide-y divide-white/10">
                 {VERSIONS.map(v => (
                   <div key={v.id} className="flex flex-col md:flex-row md:items-center py-10 group hover:pl-4 transition-all gap-6">
                      <div className="flex-1">
                        <p className="text-white text-2xl font-display group-hover:text-brand transition-colors">{v.label}</p>
                        <p className="text-white/40 font-mono text-xs uppercase tracking-widest mt-2">{v.date} · {v.author}</p>
                        <p className="text-white/20 text-sm italic mt-3 group-hover:text-white/40 transition-colors">"{v.notes}"</p>
                      </div>
                      <div className="md:opacity-0 group-hover:opacity-100 transition-all flex gap-4 shrink-0">
                        <button className="px-5 py-2 border border-white/10 text-xs font-mono uppercase tracking-widest text-white/40 hover:text-white hover:border-white transition-all">Compare</button>
                        <button className="px-5 py-2 bg-white/5 border border-white/10 text-xs font-mono uppercase tracking-widest text-white/60 hover:text-brand hover:border-brand/40 transition-all">Restore</button>
                      </div>
                   </div>
                 ))}
               </div>
            </motion.section>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
