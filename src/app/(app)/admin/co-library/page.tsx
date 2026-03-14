"use client";

import { useState, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Database, Plus, Search, Edit3, Archive, CheckCircle2,
  GitCommit, Target, Upload, X, Save, Trash2, Loader2
} from "lucide-react";
import { fadeSlideUp, staggerContainer } from "@/lib/animations";
import { useDataStore, COLibrarySet } from "@/lib/dataStore";
import { useAuthStore } from "@/lib/authStore";
import { useUIStore } from "@/lib/uiStore";
import { AccessGate } from "@/components/auth/AccessGate";

const DEPTS = ["CSE", "ECE", "MECH", "CIVIL", "IT", "MBA"];
const REGS  = ["R21", "R20", "R18", "R17"];
const BT_LEVELS = ["L1","L2","L3","L4","L5","L6"];

type CORow = { co: string; desc: string; bloomCode: string; poMaps: string };

type LibForm = {
  name: string; dept: string; courseCode: string; regulation: string; bloomCode: string;
  cos: CORow[];
};

const BLANK_FORM: LibForm = {
  name: "", dept: "CSE", courseCode: "", regulation: "R21", bloomCode: "L3",
  cos: [{ co: "CO1", desc: "", bloomCode: "L3", poMaps: "" }],
};

export default function AdminCOLibraryPage() {
  const coLibrary          = useDataStore(s => s.coLibrary);
  const addCOLibrarySet    = useDataStore(s => s.addCOLibrarySet);
  const updateCOLibrarySet = useDataStore(s => s.updateCOLibrarySet);
  const archiveCOLibrarySet = useDataStore(s => s.archiveCOLibrarySet);
  const restoreCOLibrarySet = useDataStore(s => s.restoreCOLibrarySet);
  const addAuditEntry      = useDataStore(s => s.addAuditEntry);
  const { user }           = useAuthStore();
  const { addToast }       = useUIStore();

  const [search, setSearch]       = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [statusTab, setStatusTab] = useState<"active" | "archived">("active");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm]           = useState<LibForm>(BLANK_FORM);
  const [saving, setSaving]       = useState(false);
  const csvRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() =>
    coLibrary.filter(lib =>
      lib.status === statusTab &&
      (deptFilter === "all" || lib.dept === deptFilter) &&
      (lib.name.toLowerCase().includes(search.toLowerCase()) ||
       lib.courseCode.toLowerCase().includes(search.toLowerCase()))
    ), [coLibrary, statusTab, deptFilter, search]);

  const openCreate = () => { setForm(BLANK_FORM); setEditingId(null); setShowModal(true); };
  const openEdit   = (lib: COLibrarySet) => {
    setForm({ name: lib.name, dept: lib.dept, courseCode: lib.courseCode, regulation: lib.regulation,
      bloomCode: lib.bloomCode, cos: lib.cos.map(c => ({ co: c.co, desc: c.desc, bloomCode: c.bloomCode, poMaps: c.poMaps || "" })) });
    setEditingId(lib.id); setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.courseCode) { addToast("Name and Course Code are required.", "warning"); return; }
    if (form.cos.some(c => !c.desc)) { addToast("All CO descriptions are required.", "warning"); return; }
    setSaving(true);
    await new Promise(r => setTimeout(r, 400));
    if (editingId) {
      updateCOLibrarySet(editingId, { name: form.name, dept: form.dept, courseCode: form.courseCode,
        regulation: form.regulation, bloomCode: form.bloomCode, cos: form.cos });
      addToast(`CO set updated: ${form.name} (v${(coLibrary.find(l => l.id === editingId)?.version || 1) + 1})`, "success");
    } else {
      addCOLibrarySet({ name: form.name, dept: form.dept, courseCode: form.courseCode,
        regulation: form.regulation, bloomCode: form.bloomCode, cos: form.cos, version: 1, status: "active" });
      addToast(`CO set registered: ${form.name}`, "success");
    }
    addAuditEntry({ type: "system", userId: user?.id || "admin", role: "admin",
      action: `CO Library ${editingId ? "updated" : "created"}: ${form.name} (${form.courseCode})`, ip: "127.0.0.1" });
    setSaving(false); setShowModal(false);
  };

  const addCORow = () => setForm(p => ({
    ...p, cos: [...p.cos, { co: `CO${p.cos.length + 1}`, desc: "", bloomCode: "L3", poMaps: "" }]
  }));
  const removeCORow = (i: number) => setForm(p => ({ ...p, cos: p.cos.filter((_, j) => j !== i) }));
  const updateCORow = (i: number, patch: Partial<CORow>) =>
    setForm(p => ({ ...p, cos: p.cos.map((c, j) => j === i ? { ...c, ...patch } : c) }));

  // Excel/CSV import
  const handleImport = async (file: File) => {
    try {
      const XLSX = await import("xlsx");
      const data = await file.arrayBuffer();
      const wb   = XLSX.read(data);
      const ws   = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string, string>>(ws);
      // Group by course code
      const groups: Record<string, CORow[]> = {};
      rows.forEach(row => {
        const code = String(row["Course Code"] || row["courseCode"] || "UNKNOWN");
        if (!groups[code]) groups[code] = [];
        groups[code].push({
          co:        String(row["CO"] || row["co"] || `CO${groups[code].length + 1}`),
          desc:      String(row["Description"] || row["desc"] || ""),
          bloomCode: String(row["BT Level"] || row["bloomCode"] || "L3"),
          poMaps:    String(row["PO Maps"] || row["poMaps"] || ""),
        });
      });
      let count = 0;
      Object.entries(groups).forEach(([code, cos]) => {
        addCOLibrarySet({ name: `${code} — Imported Set`, dept: "CSE", courseCode: code,
          regulation: "R21", bloomCode: "L3", cos, version: 1, status: "active" });
        count++;
      });
      addToast(`Imported ${count} CO set(s) from Excel.`, "success");
    } catch { addToast("Import failed. Ensure file is valid .xlsx format.", "error"); }
  };

  return (
    <AccessGate feature="co_library_manage" deny="lock">
      <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="max-w-6xl mx-auto pb-32">

        {/* Header */}
        <motion.div variants={fadeSlideUp} className="flex justify-between items-end pb-8 border-b border-white/5">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-mono text-brand uppercase tracking-widest mb-3">
              <span className="w-8 h-[1px] bg-brand" /> Standard Repository
            </div>
            <h1 className="text-4xl font-display text-white flex items-center gap-4">
              <Database className="w-8 h-8 text-brand" /> Default CO Library
            </h1>
            <p className="text-white/40 font-light mt-1">University-wide standard Course Outcome sets with version control.</p>
          </div>
          <div className="flex gap-3">
            <label className="px-5 py-2.5 border border-white/10 text-white/40 text-[10px] font-mono uppercase tracking-widest hover:border-white/30 hover:text-white transition-colors flex items-center gap-2 cursor-pointer">
              <Upload className="w-3.5 h-3.5" /> Import Excel
              <input ref={csvRef} type="file" accept=".xlsx,.xls" className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleImport(f); }} />
            </label>
            <button onClick={openCreate}
              className="px-5 py-2.5 bg-brand text-white text-[10px] font-mono uppercase tracking-widest hover:bg-brand/90 transition-colors flex items-center gap-2">
              <Plus className="w-3.5 h-3.5" /> Register New Set
            </button>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div variants={fadeSlideUp} className="flex gap-4 py-5 border-b border-white/5">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by name or course code..."
              className="w-full bg-white/[0.02] border border-white/10 pl-10 pr-4 py-2.5 text-sm text-white outline-none focus:border-brand transition-colors" />
          </div>
          <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)}
            className="bg-white/[0.02] border border-white/10 px-4 py-2.5 text-sm text-white outline-none text-[10px] font-mono uppercase">
            <option value="all">All Depts</option>
            {DEPTS.map(d => <option key={d} value={d} className="bg-[#0a0a0f]">{d}</option>)}
          </select>
          <div className="flex border border-white/10">
            {(["active", "archived"] as const).map(s => (
              <button key={s} onClick={() => setStatusTab(s)}
                className={`px-5 py-2.5 text-[10px] font-mono uppercase tracking-widest transition-colors ${statusTab === s ? "bg-brand text-white" : "text-white/30 hover:text-white"}`}>
                {s}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Library list */}
        <div className="flex flex-col divide-y divide-white/5">
          {filtered.length === 0 ? (
            <div className="py-24 text-center text-white/20">
              <Database className="w-10 h-10 mx-auto mb-4 opacity-20" />
              <p className="text-sm font-mono uppercase tracking-widest">No CO sets found</p>
            </div>
          ) : filtered.map(lib => (
            <motion.div key={lib.id} variants={fadeSlideUp} className="py-8">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-xl font-display text-white">{lib.courseCode}: {lib.name}</h3>
                    <span className="text-[9px] font-mono border border-brand/30 text-brand px-2 py-0.5 uppercase flex items-center gap-1">
                      <GitCommit className="w-2.5 h-2.5" /> v{lib.version}
                    </span>
                    <span className="text-[9px] font-mono border border-white/10 text-white/30 px-2 py-0.5 uppercase">{lib.regulation}</span>
                  </div>
                  <p className="text-[10px] font-mono text-white/20 uppercase tracking-widest">
                    Dept: {lib.dept} · Updated: {lib.updatedAt} · {lib.cos.length} Outcomes
                  </p>
                </div>
                <div className="flex gap-2">
                  {lib.status === "active" && (
                    <button onClick={() => openEdit(lib)}
                      className="px-4 py-2 border border-white/10 text-[10px] font-mono uppercase tracking-widest text-white/40 hover:text-white hover:border-white/30 transition-colors flex items-center gap-2">
                      <Edit3 className="w-3.5 h-3.5" /> Edit
                    </button>
                  )}
                  {lib.status === "active" ? (
                    <button onClick={() => { archiveCOLibrarySet(lib.id); addToast(`${lib.courseCode} archived.`, "info"); }}
                      className="px-4 py-2 border border-alert/20 text-[10px] font-mono uppercase tracking-widest text-alert hover:bg-alert/10 transition-colors flex items-center gap-2">
                      <Archive className="w-3.5 h-3.5" /> Archive
                    </button>
                  ) : (
                    <button onClick={() => { restoreCOLibrarySet(lib.id); addToast(`${lib.courseCode} restored.`, "success"); }}
                      className="px-4 py-2 border border-attain/20 text-[10px] font-mono uppercase tracking-widest text-attain hover:bg-attain/10 transition-colors flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Restore
                    </button>
                  )}
                </div>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {lib.cos.map(co => (
                  <div key={co.co} className="p-5 border border-white/10 bg-white/[0.01] hover:bg-white/[0.02] transition-colors">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-xs font-bold text-brand">{co.co}</span>
                      <span className="text-[9px] font-mono text-white/30 border border-white/10 px-1.5 py-0.5">{co.bloomCode}</span>
                    </div>
                    <p className="text-xs text-white/50 font-light leading-relaxed mb-3">{co.desc}</p>
                    {co.poMaps && (
                      <div className="flex items-center gap-1.5 text-[8px] font-mono text-white/20 uppercase">
                        <Target className="w-2.5 h-2.5" /> {co.poMaps}
                      </div>
                    )}
                  </div>
                ))}
                {lib.status === "active" && (
                  <button onClick={() => {
                    setForm({ name: lib.name, dept: lib.dept, courseCode: lib.courseCode, regulation: lib.regulation,
                      bloomCode: lib.bloomCode, cos: [...lib.cos.map(c => ({ co: c.co, desc: c.desc, bloomCode: c.bloomCode, poMaps: c.poMaps || "" })),
                        { co: `CO${lib.cos.length + 1}`, desc: "", bloomCode: "L3", poMaps: "" }] });
                    setEditingId(lib.id); setShowModal(true);
                  }} className="p-5 border border-dashed border-white/10 hover:border-brand/30 flex flex-col items-center justify-center gap-2 text-white/10 hover:text-brand transition-colors">
                    <Plus className="w-5 h-5" />
                    <span className="text-[9px] font-mono uppercase tracking-widest">Append CO</span>
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Create/Edit modal */}
        <AnimatePresence>
          {showModal && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-8">
              <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }}
                className="w-full max-w-2xl bg-[#0a0a0f] border border-white/10 p-8 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl font-display text-white">{editingId ? "Edit CO Set" : "Register New CO Set"}</h3>
                  <button onClick={() => setShowModal(false)} className="text-white/30 hover:text-white"><X className="w-5 h-5" /></button>
                </div>
                <div className="flex flex-col gap-5">
                  {/* Metadata */}
                  <div className="grid grid-cols-2 gap-4">
                    {([["Set Name", "name", "text", "Database Systems — Standard Set"],
                       ["Course Code", "courseCode", "text", "CS301"]] as [string, string, string, string][]).map(([label, key, type, ph]) => (
                      <div key={key} className="flex flex-col gap-1">
                        <label className="text-[9px] font-mono text-white/30 uppercase tracking-widest">{label}</label>
                        <input type={type} placeholder={ph} value={(form as any)[key]}
                          onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                          className="bg-white/[0.02] border border-white/10 px-4 py-2.5 text-white text-sm outline-none focus:border-brand transition-colors" />
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] font-mono text-white/30 uppercase tracking-widest">Department</label>
                      <select value={form.dept} onChange={e => setForm(p => ({ ...p, dept: e.target.value }))}
                        className="bg-white/[0.02] border border-white/10 px-3 py-2.5 text-white text-sm outline-none">
                        {DEPTS.map(d => <option key={d} value={d} className="bg-[#0a0a0f]">{d}</option>)}
                      </select>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] font-mono text-white/30 uppercase tracking-widest">Regulation</label>
                      <select value={form.regulation} onChange={e => setForm(p => ({ ...p, regulation: e.target.value }))}
                        className="bg-white/[0.02] border border-white/10 px-3 py-2.5 text-white text-sm outline-none">
                        {REGS.map(r => <option key={r} value={r} className="bg-[#0a0a0f]">{r}</option>)}
                      </select>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] font-mono text-white/30 uppercase tracking-widest">Default BT</label>
                      <select value={form.bloomCode} onChange={e => setForm(p => ({ ...p, bloomCode: e.target.value }))}
                        className="bg-white/[0.02] border border-white/10 px-3 py-2.5 text-white text-sm outline-none font-mono">
                        {BT_LEVELS.map(b => <option key={b} value={b} className="bg-[#0a0a0f]">{b}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* CO rows */}
                  <div className="border-t border-white/5 pt-4">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-[9px] font-mono text-white/30 uppercase tracking-widest">Course Outcomes</p>
                      <button onClick={addCORow}
                        className="text-[9px] font-mono text-brand uppercase tracking-widest flex items-center gap-1 hover:text-white transition-colors">
                        <Plus className="w-3 h-3" /> Add CO
                      </button>
                    </div>
                    <div className="flex flex-col gap-3">
                      {form.cos.map((co, i) => (
                        <div key={i} className="grid grid-cols-[60px_1fr_60px_100px_28px] gap-2 items-start">
                          <input value={co.co} onChange={e => updateCORow(i, { co: e.target.value })}
                            className="bg-white/[0.02] border border-white/10 px-2 py-2 text-brand text-xs font-mono outline-none focus:border-brand" />
                          <input value={co.desc} onChange={e => updateCORow(i, { desc: e.target.value })}
                            placeholder="CO description..."
                            className="bg-white/[0.02] border border-white/10 px-3 py-2 text-white text-xs outline-none focus:border-brand" />
                          <select value={co.bloomCode} onChange={e => updateCORow(i, { bloomCode: e.target.value })}
                            className="bg-white/[0.02] border border-white/10 px-2 py-2 text-white text-xs font-mono outline-none">
                            {BT_LEVELS.map(b => <option key={b} value={b} className="bg-[#0a0a0f]">{b}</option>)}
                          </select>
                          <input value={co.poMaps} onChange={e => updateCORow(i, { poMaps: e.target.value })}
                            placeholder="PO1, PO2..."
                            className="bg-white/[0.02] border border-white/10 px-2 py-2 text-white/50 text-xs outline-none focus:border-brand" />
                          <button onClick={() => removeCORow(i)} className="text-white/20 hover:text-alert transition-colors pt-2">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2 border-t border-white/5">
                    <button onClick={() => setShowModal(false)}
                      className="flex-1 py-2.5 border border-white/10 text-white/40 hover:text-white text-[10px] font-mono uppercase tracking-widest transition-colors">
                      Cancel
                    </button>
                    <button onClick={handleSave} disabled={saving}
                      className="flex-1 py-2.5 bg-brand text-white text-[10px] font-mono uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-brand/90 transition-colors">
                      {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                      {editingId ? "Save Changes" : "Register Set"}
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </motion.div>
    </AccessGate>
  );
}
