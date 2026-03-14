"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Target, Award, Edit3, Save, PlusCircle, CheckCircle2 
} from "lucide-react";
import { fadeSlideUp, staggerContainer } from "@/lib/animations";

// ─── MOCK DATA ───
const INITAL_POS = [
  { id: "PO1", type: "Technical", text: "Engineering Knowledge: Apply the knowledge of mathematics, science, engineering fundamentals, and an engineering specialization to the solution of complex engineering problems." },
  { id: "PO2", type: "Technical", text: "Problem Analysis: Identify, formulate, review research literature, and analyze complex engineering problems reaching substantiated conclusions." },
  { id: "PO3", type: "Technical", text: "Design/Development of Solutions: Design solutions for complex engineering problems and design system components or processes that meet the specified needs with appropriate consideration for the public health and safety." },
  { id: "PO4", type: "Technical", text: "Conduct Investigations of Complex Problems: Use research-based knowledge and research methods including design of experiments, analysis and interpretation of data, and synthesis of the information to provide valid conclusions." },
  { id: "PO5", type: "Technical", text: "Modern Tool Usage: Create, select, and apply appropriate techniques, resources, and modern engineering and IT tools including prediction and modeling to complex engineering activities." },
  { id: "PO6", type: "Social", text: "The Engineer and Society: Apply reasoning informed by the contextual knowledge to assess societal, health, safety, legal and cultural issues and the consequent responsibilities relevant to the professional engineering practice." },
  { id: "PO7", type: "Social", text: "Environment and Sustainability: Understand the impact of the professional engineering solutions in societal and environmental contexts, and demonstrate the knowledge of, and need for sustainable development." },
  { id: "PO8", type: "Professional", text: "Ethics: Apply ethical principles and commit to professional ethics and responsibilities and norms of the engineering practice." },
  { id: "PO9", type: "Professional", text: "Individual and Team Work: Function effectively as an individual, and as a member or leader in diverse teams, and in multidisciplinary settings." },
  { id: "PO10", type: "Professional", text: "Communication: Communicate effectively on complex engineering activities with the engineering community and with society at large." },
  { id: "PO11", type: "Professional", text: "Project Management and Finance: Demonstrate knowledge and understanding of the engineering and management principles and apply these to one's own work." },
  { id: "PO12", type: "Professional", text: "Life-long Learning: Recognize the need for, and have the preparation and ability to engage in independent and life-long learning in the broadest context of technological change." },
];

const INITIAL_PSOS = [
  { id: "PSO1", dept: "CSE", text: "Specify, design, develop, test and maintain usable software systems." },
  { id: "PSO2", dept: "CSE", text: "Use modern network and security engineering techniques for business scale IT infrastructure." },
];

export default function AdminPOPSOMasterPage() {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  const startEdit = (id: string, text: string) => {
    setEditingId(id);
    setEditText(text);
  };

  const saveEdit = () => {
    // In a real app this would save to the DB backend
    setEditingId(null);
  };

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="max-w-6xl mx-auto pb-32">
      
      {/* ── HEADER ── */}
      <motion.div variants={fadeSlideUp} className="mb-12 flex justify-between items-end flex-wrap gap-6">
        <div>
          <h1 className="text-4xl font-display text-white mb-2">PO & PSO Master Dictionary</h1>
          <p className="text-white/40 font-light italic">Global declarations for Program and Program Specific Outcomes (NBA format)</p>
        </div>
        <div className="flex gap-4">
           <button className="px-6 py-2.5 bg-brand text-white hover:bg-brand/90 transition-colors text-[10px] font-mono uppercase tracking-widest flex items-center gap-2 rounded">
             <Save className="w-3.5 h-3.5" /> Save Global Changes
           </button>
        </div>
      </motion.div>

      {/* ── INFO ── */}
      <motion.div variants={fadeSlideUp} className="mb-12 bg-insight/10 border border-insight/20 p-6 rounded text-insight flex items-start gap-4">
         <Target className="w-5 h-5 mt-0.5 shrink-0" />
         <div>
            <h3 className="text-sm font-bold uppercase tracking-widest mb-1">Regulation Linking</h3>
            <p className="font-light text-sm italic">Changes made to PO/PSO statements here will automatically apply to all active Academic Years under the current University regulation framework.</p>
         </div>
      </motion.div>

      {/* ── PROGRAM OUTCOMES (POs) ── */}
      <motion.section variants={fadeSlideUp} className="mb-16">
        <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
           <div className="flex items-center gap-3 text-sm font-mono text-white/50 uppercase tracking-widest">
             <Target className="w-4 h-4 text-brand" /> Program Outcomes (PO1 - PO12)
           </div>
        </div>

        <div className="flex flex-col gap-4">
           {INITAL_POS.map((po) => (
             <div key={po.id} className="bg-white/[0.02] border border-white/10 p-5 rounded-lg flex items-start gap-6 group hover:border-white/20 transition-colors">
                <div className="shrink-0 w-20">
                   <span className="text-lg font-bold text-white">{po.id}</span><br />
                   <span className="text-[9px] font-mono text-white/30 uppercase tracking-widest">{po.type}</span>
                </div>
                
                <div className="flex-1">
                   {editingId === po.id ? (
                      <textarea 
                        value={editText} onChange={e => setEditText(e.target.value)}
                        className="w-full h-24 bg-black/50 border border-brand/50 p-3 text-sm text-white outline-none rounded resize-none"
                      />
                   ) : (
                      <p className="text-sm font-light text-white/70 leading-relaxed">{po.text}</p>
                   )}
                </div>

                <div className="shrink-0">
                   {editingId === po.id ? (
                      <button onClick={saveEdit} className="p-2 bg-attain/20 text-attain border border-attain/30 rounded flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest">
                         <CheckCircle2 className="w-3 h-3" /> Save
                      </button>
                   ) : (
                      <button onClick={() => startEdit(po.id, po.text)} className="opacity-0 group-hover:opacity-100 p-2 text-white/30 hover:text-brand transition-colors">
                         <Edit3 className="w-4 h-4" />
                      </button>
                   )}
                </div>
             </div>
           ))}
        </div>
      </motion.section>

      {/* ── PROGRAM SPECIFIC OUTCOMES (PSOs) ── */}
      <motion.section variants={fadeSlideUp}>
        <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
           <div className="flex items-center gap-3 text-sm font-mono text-white/50 uppercase tracking-widest">
             <Award className="w-4 h-4 text-aurora" /> Program Specific Outcomes (Department Level)
           </div>
           <button className="text-[10px] font-mono text-white/40 hover:text-white flex items-center gap-2 uppercase tracking-widest transition-colors">
              <PlusCircle className="w-3.5 h-3.5" /> Add PSO
           </button>
        </div>

        <div className="flex flex-col gap-4">
           {INITIAL_PSOS.map((pso) => (
             <div key={pso.id} className="bg-white/[0.02] border border-white/10 p-5 rounded-lg flex items-start gap-6 group hover:border-white/20 transition-colors">
                <div className="shrink-0 w-20">
                   <span className="text-lg font-bold text-white">{pso.id}</span><br />
                   <span className="text-[9px] font-mono text-white/30 uppercase tracking-widest">{pso.dept}</span>
                </div>
                
                <div className="flex-1">
                   {editingId === pso.id ? (
                      <textarea 
                        value={editText} onChange={e => setEditText(e.target.value)}
                        className="w-full h-24 bg-black/50 border border-brand/50 p-3 text-sm text-white outline-none rounded resize-none"
                      />
                   ) : (
                      <p className="text-sm font-light text-white/70 leading-relaxed">{pso.text}</p>
                   )}
                </div>

                <div className="shrink-0">
                   {editingId === pso.id ? (
                      <button onClick={saveEdit} className="p-2 bg-attain/20 text-attain border border-attain/30 rounded flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest">
                         <CheckCircle2 className="w-3 h-3" /> Save
                      </button>
                   ) : (
                      <button onClick={() => startEdit(pso.id, pso.text)} className="opacity-0 group-hover:opacity-100 p-2 text-white/30 hover:text-brand transition-colors">
                         <Edit3 className="w-4 h-4" />
                      </button>
                   )}
                </div>
             </div>
           ))}
        </div>
      </motion.section>
    </motion.div>
  );
}
