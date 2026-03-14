"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Target, Award, Edit3, Save, Plus, Trash2, CheckCircle2, X, GitCommit, Loader2 } from "lucide-react";
import { fadeSlideUp, staggerContainer } from "@/lib/animations";
import { useDataStore, PODefinition, PSODefinition } from "@/lib/dataStore";
import { useAuthStore } from "@/lib/authStore";
import { useUIStore } from "@/lib/uiStore";
import { AccessGate } from "@/components/auth/AccessGate";

const DEPTS = ["CSE", "ECE", "MECH", "CIVIL", "IT", "MBA"];
const REGS  = ["R21", "R20", "R18"];
const CATEGORIES: PODefinition["category"][] = ["Technical", "Professional", "Social"];

export default function AdminPOPSOMasterPage() {
  const poDefinitions     = useDataStore(s => s.poDefinitions);
  const psoDefinitions    = useDataStore(s => s.psoDefinitions);
  const updatePODef       = useDataStore(s => s.updatePODefinition);
  const addPSODef         = useDataStore(s => s.addPSODefinition);
  const updatePSODef      = useDataStore(s => s.updatePSODefinition);
  const deletePSODef      = useDataStore(s => s.deletePSODefinition);
  const addAuditEntry     = useDataStore(s => s.addAuditEntry);
  const { user }          = useAuthStore();
  const { addToast }      = useUIStore();

  const [editingPO, setEditingPO]   = useState<string | null>(null);
  const [editingPSO, setEditingPSO] = useState<string | null>(null);
  const [poText, setPOText]         = useState("");
  const [poCategory, setPOCategory] = useState<PODefinition["category"]>("Technical");
  const [psoText, setPSOText]       = useState("");
  const [psoName, setPSOName]       = useState("");
  const [psoDept, setPSODept]       = useState("CSE");
  const [psoReg, setPSOReg]         = useState("R21");
  const [showAddPSO, setShowAddPSO] = useState(false);
  const [newPSO, setNewPSO]         = useState({ id: "", name: "", statement: "", dept: "CSE", regulation: "R21" });
  const [saving, setSaving]         = useState(false);
  const [activeTab, setActiveTab]   = useState<"po" | "pso">("po");

  const startEditPO = (po: PODefinition) => {
    setEditingPO(po.id); setPOText(po.statement); setPOCategory(po.category);
  };
  const savePO = async (id: string) => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 300));
    updatePODef(id, { statement: poText, category: poCategory });
    addAuditEntry({ type: "system", userId: user?.id || "admin", role: "admin",
      action: `PO definition updated: ${id} (v${(poDefinitions.find(p => p.id === id)?.version || 1) + 1})`, ip: "127.0.0.1" });
    addToast(`${id} updated.`, "success");
    setSaving(false); setEditingPO(null);
  };

  const startEditPSO = (pso: PSODefinition) => {
    setEditingPSO(pso.id); setPSOText(pso.statement); setPSOName(pso.name); setPSODept(pso.dept); setPSOReg(pso.regulation);
  };
  const savePSO = async (id: string) => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 300));
    updatePSODef(id, { statement: psoText, name: psoName, dept: psoDept, regulation: psoReg });
    addAuditEntry({ type: "system", userId: user?.id || "admin", role: "admin",
      action: `PSO definition updated: ${id}`, ip: "127.0.0.1" });
    addToast(`${id} updated.`, "success");
    setSaving(false); setEditingPSO(null);
  };

  const handleAddPSO = async () => {
    if (!newPSO.id || !newPSO.statement) { addToast("PSO ID and statement are required.", "warning"); return; }
    setSaving(true);
    await new Promise(r => setTimeout(r, 300));
    addPSODef({ id: newPSO.id, name: newPSO.name, statement: newPSO.statement, dept: newPSO.dept, regulation: newPSO.regulation });
    addAuditEntry({ type: "system", userId: user?.id || "admin", role: "admin",
      action: `PSO added: ${newPSO.id} for ${newPSO.dept}`, ip: "127.0.0.1" });
    addToast(`${newPSO.id} added.`, "success");
    setNewPSO({ id: "", name: "", statement: "", dept: "CSE", regulation: "R21" });
    setSaving(false); setShowAddPSO(false);
  };

  const handleDeletePSO = (pso: PSODefinition) => {
    deletePSODef(pso.id);
    addAuditEntry({ type: "system", userId: user?.id || "admin", role: "admin",
      action: `PSO deleted: ${pso.id} (${pso.dept})`, ip: "127.0.0.1" });
    addToast(`${pso.id} deleted.`, "info");
  };

  const categoryColor = (cat: string) => {
    if (cat === "Technical")     return "text-brand border-brand/20";
    if (cat === "Professional")  return "text-aurora border-aurora/20";
    return "text-attain border-attain/20";
  };

  return (
    <AccessGate feature="user_management" deny="lock">
      <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="max-w-6xl mx-auto pb-32">

        {/* Header */}
        <motion.div variants={fadeSlideUp} className="flex justify-between items-end pb-8 border-b border-white/5">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-mono text-brand uppercase tracking-widest mb-3">
              <span className="w-8 h-[1px] bg-brand" /> NBA Framework
            </div>
            <h1 className="text-4xl font-display text-white">PO & PSO Master Dictionary</h1>
            <p className="text-white/40 font-light mt-1">Global declarations for Program and Program Specific Outcomes. All edits are versioned.</p>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="flex border-b border-white/5">
          {(["po", "pso"] as const).map(t => (
            <button key={t} onClick={() => setActiveTab(t)}
              className={`px-6 py-4 text-[10px] font-mono uppercase tracking-widest border-b-2 transition-all ${
                activeTab === t ? "border-brand text-brand" : "border-transparent text-white/30 hover:text-white"
              }`}>
              {t === "po" ? `Program Outcomes (PO1–PO12)` : `Program Specific Outcomes (PSOs)`}
            </button>
          ))}
        </div>

        {/* PO tab */}
        {activeTab === "po" && (
          <motion.div variants={fadeSlideUp} className="flex flex-col divide-y divide-white/5">
            {poDefinitions.map(po => (
              <div key={po.id} className="py-5 flex items-start gap-6 group">
                <div className="shrink-0 w-24">
                  <p className="text-lg font-bold text-white font-mono">{po.id}</p>
                  <span className={`text-[8px] font-mono uppercase px-1.5 py-0.5 border ${categoryColor(po.category)}`}>{po.category}</span>
                  <p className="text-[8px] font-mono text-white/20 mt-1 flex items-center gap-1">
                    <GitCommit className="w-2.5 h-2.5" /> v{po.version}
                  </p>
                </div>
                <div className="flex-1">
                  <p className="text-[10px] font-mono text-white/50 uppercase tracking-widest mb-1">{po.name}</p>
                  {editingPO === po.id ? (
                    <div className="flex flex-col gap-3">
                      <textarea value={poText} onChange={e => setPOText(e.target.value)}
                        className="w-full h-24 bg-white/[0.02] border border-brand/30 p-3 text-sm text-white outline-none resize-none" />
                      <div className="flex items-center gap-3">
                        <label className="text-[9px] font-mono text-white/30 uppercase">Category:</label>
                        {CATEGORIES.map(c => (
                          <button key={c} onClick={() => setPOCategory(c)}
                            className={`px-2 py-1 text-[9px] font-mono uppercase border transition-colors ${poCategory === c ? categoryColor(c) + " bg-current/10" : "border-white/10 text-white/30"}`}>
                            {c}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm font-light text-white/60 leading-relaxed">{po.statement}</p>
                  )}
                </div>
                <div className="shrink-0">
                  {editingPO === po.id ? (
                    <div className="flex gap-2">
                      <button onClick={() => setEditingPO(null)} className="p-1.5 text-white/30 hover:text-white transition-colors"><X className="w-4 h-4" /></button>
                      <button onClick={() => savePO(po.id)} disabled={saving}
                        className="p-1.5 text-attain hover:text-white transition-colors">
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => startEditPO(po)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 text-white/30 hover:text-brand transition-all">
                      <Edit3 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </motion.div>
        )}

        {/* PSO tab */}
        {activeTab === "pso" && (
          <motion.div variants={fadeSlideUp} className="flex flex-col">
            <div className="flex justify-end py-4 border-b border-white/5">
              <button onClick={() => setShowAddPSO(true)}
                className="px-5 py-2.5 bg-brand text-white text-[10px] font-mono uppercase tracking-widest hover:bg-brand/90 transition-colors flex items-center gap-2">
                <Plus className="w-3.5 h-3.5" /> Add PSO
              </button>
            </div>

            <div className="flex flex-col divide-y divide-white/5">
              {psoDefinitions.map(pso => (
                <div key={pso.id} className="py-5 flex items-start gap-6 group">
                  <div className="shrink-0 w-24">
                    <p className="text-lg font-bold text-white font-mono">{pso.id}</p>
                    <p className="text-[8px] font-mono text-white/30 uppercase">{pso.dept}</p>
                    <p className="text-[8px] font-mono text-white/20 mt-1 flex items-center gap-1">
                      <GitCommit className="w-2.5 h-2.5" /> v{pso.version}
                    </p>
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] font-mono text-white/50 uppercase tracking-widest mb-1">{pso.name}</p>
                    {editingPSO === pso.id ? (
                      <div className="flex flex-col gap-3">
                        <input value={psoName} onChange={e => setPSOName(e.target.value)}
                          placeholder="PSO name" className="bg-white/[0.02] border border-white/10 px-3 py-2 text-white text-sm outline-none focus:border-brand" />
                        <textarea value={psoText} onChange={e => setPSOText(e.target.value)}
                          className="w-full h-20 bg-white/[0.02] border border-brand/30 p-3 text-sm text-white outline-none resize-none" />
                        <div className="flex gap-3">
                          <select value={psoDept} onChange={e => setPSODept(e.target.value)}
                            className="bg-white/[0.02] border border-white/10 px-3 py-1.5 text-white text-xs outline-none">
                            {DEPTS.map(d => <option key={d} value={d} className="bg-[#0a0a0f]">{d}</option>)}
                          </select>
                          <select value={psoReg} onChange={e => setPSOReg(e.target.value)}
                            className="bg-white/[0.02] border border-white/10 px-3 py-1.5 text-white text-xs outline-none font-mono">
                            {REGS.map(r => <option key={r} value={r} className="bg-[#0a0a0f]">{r}</option>)}
                          </select>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm font-light text-white/60 leading-relaxed">{pso.statement}</p>
                    )}
                  </div>
                  <div className="shrink-0 flex gap-1">
                    {editingPSO === pso.id ? (
                      <>
                        <button onClick={() => setEditingPSO(null)} className="p-1.5 text-white/30 hover:text-white transition-colors"><X className="w-4 h-4" /></button>
                        <button onClick={() => savePSO(pso.id)} disabled={saving}
                          className="p-1.5 text-attain hover:text-white transition-colors">
                          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                        </button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => startEditPSO(pso)}
                          className="opacity-0 group-hover:opacity-100 p-1.5 text-white/30 hover:text-brand transition-all">
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDeletePSO(pso)}
                          className="opacity-0 group-hover:opacity-100 p-1.5 text-white/30 hover:text-alert transition-all">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Add PSO modal */}
            <AnimatePresence>
              {showAddPSO && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-8">
                  <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }}
                    className="w-full max-w-md bg-[#0a0a0f] border border-white/10 p-8">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-display text-white">Add New PSO</h3>
                      <button onClick={() => setShowAddPSO(false)} className="text-white/30 hover:text-white"><X className="w-5 h-5" /></button>
                    </div>
                    <div className="flex flex-col gap-4">
                      {([["PSO ID", "id", "PSO4"], ["Name", "name", "Domain Expertise"]] as [string, string, string][]).map(([label, key, ph]) => (
                        <div key={key} className="flex flex-col gap-1">
                          <label className="text-[9px] font-mono text-white/30 uppercase tracking-widest">{label}</label>
                          <input value={(newPSO as any)[key]} onChange={e => setNewPSO(p => ({ ...p, [key]: e.target.value }))}
                            placeholder={ph} className="bg-white/[0.02] border border-white/10 px-4 py-2.5 text-white text-sm outline-none focus:border-brand" />
                        </div>
                      ))}
                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] font-mono text-white/30 uppercase tracking-widest">Statement</label>
                        <textarea value={newPSO.statement} onChange={e => setNewPSO(p => ({ ...p, statement: e.target.value }))}
                          placeholder="Describe this PSO..." rows={3}
                          className="bg-white/[0.02] border border-white/10 px-4 py-2.5 text-white text-sm outline-none focus:border-brand resize-none" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] font-mono text-white/30 uppercase tracking-widest">Department</label>
                          <select value={newPSO.dept} onChange={e => setNewPSO(p => ({ ...p, dept: e.target.value }))}
                            className="bg-white/[0.02] border border-white/10 px-3 py-2.5 text-white text-sm outline-none">
                            {DEPTS.map(d => <option key={d} value={d} className="bg-[#0a0a0f]">{d}</option>)}
                          </select>
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] font-mono text-white/30 uppercase tracking-widest">Regulation</label>
                          <select value={newPSO.regulation} onChange={e => setNewPSO(p => ({ ...p, regulation: e.target.value }))}
                            className="bg-white/[0.02] border border-white/10 px-3 py-2.5 text-white text-sm outline-none font-mono">
                            {REGS.map(r => <option key={r} value={r} className="bg-[#0a0a0f]">{r}</option>)}
                          </select>
                        </div>
                      </div>
                      <div className="flex gap-3 pt-2 border-t border-white/5">
                        <button onClick={() => setShowAddPSO(false)}
                          className="flex-1 py-2.5 border border-white/10 text-white/40 hover:text-white text-[10px] font-mono uppercase tracking-widest transition-colors">
                          Cancel
                        </button>
                        <button onClick={handleAddPSO} disabled={saving}
                          className="flex-1 py-2.5 bg-brand text-white text-[10px] font-mono uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-brand/90 transition-colors">
                          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />} Add PSO
                        </button>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

      </motion.div>
    </AccessGate>
  );
}
