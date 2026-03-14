"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, Search, Plus, Edit3, Trash2, Shield, 
  CheckCircle2, X, Loader2, Mail, Building2, Phone
} from "lucide-react";
import { fadeSlideUp, staggerContainer } from "@/lib/animations";
import { useDataStore, UserRecord } from "@/lib/dataStore";
import { useAuthStore, Role } from "@/lib/authStore";
import { useUIStore } from "@/lib/uiStore";

const ROLE_OPTIONS: { value: Role; label: string; color: string }[] = [
  { value: "admin",           label: "Admin",         color: "text-alert" },
  { value: "department_head", label: "HOD",            color: "text-aurora" },
  { value: "subject_lead",    label: "Course Lead",    color: "text-insight" },
  { value: "faculty",         label: "Faculty",        color: "text-brand" },
  { value: "student",         label: "Student",        color: "text-cyan-400" },
];

const DEPTS = ["Administration", "CSE", "ECE", "MECH", "CIVIL", "IT", "MBA"];

const BLANK_USER: {
  name: string; email: string; password: string; employeeId: string;
  roles: Role[]; dept: string; designation: string; status: "active" | "inactive"
} = {
  name: "", email: "", password: "", employeeId: "",
  roles: ["faculty"] as Role[], dept: "CSE", designation: "", status: "active"
};

export default function AdminUsersPage() {
  const users       = useDataStore(s => s.users);
  const addUser     = useDataStore(s => s.addUser);
  const updateUser  = useDataStore(s => s.updateUser);
  const deleteUser  = useDataStore(s => s.deleteUser);
  const { user: me } = useAuthStore();
  const { addToast }  = useUIStore();

  const [search, setSearch]         = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [showModal, setShowModal]   = useState(false);
  const [editingId, setEditingId]   = useState<string | null>(null);
  const [form, setForm]             = useState(BLANK_USER);
  const [saving, setSaving]         = useState(false);

  const filtered = useMemo(() =>
    users.filter(u =>
      (roleFilter === "all" || u.roles.includes(roleFilter as Role)) &&
      (u.name.toLowerCase().includes(search.toLowerCase()) ||
       u.email.toLowerCase().includes(search.toLowerCase()) ||
       u.employeeId.toLowerCase().includes(search.toLowerCase()))
    ), [users, search, roleFilter]);

  const openCreate = () => { setForm(BLANK_USER); setEditingId(null); setShowModal(true); };
  const openEdit   = (u: UserRecord) => {
    setForm({ name: u.name, email: u.email, password: u.password, employeeId: u.employeeId, roles: u.roles, dept: u.dept, designation: u.designation, status: u.status as "active" | "inactive" });
    setEditingId(u.id); setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.employeeId) {
      addToast("Name, Email, and Employee ID are required.", "warning"); return;
    }
    setSaving(true);
    await new Promise(r => setTimeout(r, 600));
    if (editingId) {
      updateUser(editingId, form);
      addToast(`Profile updated: ${form.name}`, "success");
    } else {
      addUser(form);
      addToast(`User provisioned: ${form.name} (${form.employeeId})`, "success");
    }
    setSaving(false);
    setShowModal(false);
  };

  const handleDelete = (u: UserRecord) => {
    if (u.id === me?.id) { addToast("Cannot delete your own account.", "warning"); return; }
    deleteUser(u.id);
    addToast(`User removed: ${u.name}`, "info");
  };

  const ROLE_META = Object.fromEntries(ROLE_OPTIONS.map(r => [r.value, r]));

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="max-w-7xl mx-auto pb-32">
      
      {/* ── HEADER ── */}
      <motion.div variants={fadeSlideUp} className="mb-10 flex justify-between items-end flex-wrap gap-6">
        <div>
          <h1 className="text-4xl font-display text-white mb-2 flex items-center gap-4">
            <Users className="w-8 h-8 text-brand" /> User Management
          </h1>
          <p className="text-white/40 font-light">{users.length} users registered &nbsp;·&nbsp; {users.filter(u => u.status === "active").length} active</p>
        </div>
        <button onClick={openCreate}
          className="px-6 py-3 bg-brand text-white text-[10px] font-mono uppercase tracking-widest hover:bg-brand/90 transition-colors flex items-center gap-2 rounded shadow-[0_0_15px_rgba(30,174,219,0.2)]">
          <Plus className="w-4 h-4" /> Provision User
        </button>
      </motion.div>

      {/* ── FILTERS ── */}
      <motion.div variants={fadeSlideUp} className="mb-6 flex gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, email or ID…"
            className="w-full bg-white/5 border border-white/10 pl-10 pr-4 py-2.5 text-sm text-white outline-none focus:border-brand/50 transition-colors rounded font-mono" />
        </div>
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
          className="bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white outline-none rounded uppercase tracking-widest text-[10px] font-mono">
          <option value="all">All Roles</option>
          {ROLE_OPTIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>
      </motion.div>

      {/* ── TABLE ── */}
      <motion.div variants={fadeSlideUp} className="border border-white/10 bg-white/[0.01] rounded-xl overflow-hidden">
        <table className="w-full text-left font-mono text-sm">
          <thead className="bg-white/[0.03] border-b border-white/10">
            <tr>
              {["Employee ID", "Name", "Email", "Department", "Role", "Status", "Actions"].map(h => (
                <th key={h} className="px-5 py-4 text-white/30 uppercase tracking-widest text-[10px] font-normal">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filtered.length === 0 ? (
              <tr><td colSpan={7} className="py-20 text-center text-white/20 italic">No users match your search.</td></tr>
            ) : filtered.map(u => (
              <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                <td className="px-5 py-4 text-white/60">{u.employeeId}</td>
                <td className="px-5 py-4 text-white font-medium">{u.name}</td>
                <td className="px-5 py-4 text-white/50">{u.email}</td>
                <td className="px-5 py-4 text-white/50">{u.dept}</td>
                <td className="px-5 py-4">
                  <div className="flex flex-wrap gap-1">
                    {u.roles.map(r => {
                      const m = ROLE_META[r];
                      return <span key={r} className={`px-2 py-0.5 text-[8px] font-mono uppercase tracking-widest border rounded ${m?.color || ""} border-current/30 bg-current/5`}>{m?.label || r}</span>;
                    })}
                  </div>
                </td>
                <td className="px-5 py-4">
                  <span className={`text-[9px] font-mono uppercase tracking-widest ${u.status === "active" ? "text-attain" : "text-white/30"}`}>
                    {u.status}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(u)}
                      className="p-1.5 hover:bg-white/10 rounded text-white/40 hover:text-white transition-colors">
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDelete(u)}
                      className="p-1.5 hover:bg-alert/10 rounded text-white/40 hover:text-alert transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => { updateUser(u.id, { status: u.status === "active" ? "inactive" : "active" }); addToast(`${u.name} — ${u.status === "active" ? "deactivated" : "reactivated"}`, "info"); }}
                      className="p-1.5 hover:bg-white/10 rounded text-white/40 hover:text-white transition-colors" title="Toggle status">
                      <Shield className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </motion.div>

      {/* ── MODAL: Create / Edit ── */}
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-8">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="w-full max-w-lg bg-[#0a0a0f] border border-white/10 rounded-xl p-8 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-display text-white">{editingId ? "Edit User" : "Provision New User"}</h3>
                <button onClick={() => setShowModal(false)} className="text-white/40 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                {([
                  ["Full Name",     "name",        "text",     "Dr. Firstname Lastname"],
                  ["Email",         "email",       "email",    "user@nexus.edu"],
                  ["Employee / Roll ID", "employeeId", "text", "FAC2024001"],
                  ["Password",      "password",    "password", "Secure@Pass1"],
                  ["Designation",   "designation", "text",     "Assistant Professor"],
                ] as [string, string, string, string][]).map(([label, key, type, ph]) => (
                  <div key={key} className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-mono text-white/40 uppercase tracking-widest">{label}</label>
                    <input type={type} placeholder={ph} value={(form as any)[key]}
                      onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                      className="bg-black/30 border border-white/10 px-4 py-2.5 text-white text-sm outline-none focus:border-brand/50 transition-colors rounded" />
                  </div>
                ))}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Department</label>
                  <select value={form.dept} onChange={e => setForm(p => ({ ...p, dept: e.target.value }))}
                    className="bg-black/30 border border-white/10 px-4 py-2.5 text-white text-sm outline-none rounded">
                    {DEPTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Role</label>
                  <select value={form.roles[0]} onChange={e => setForm(p => ({ ...p, roles: [e.target.value as Role] }))}
                    className="bg-black/30 border border-white/10 px-4 py-2.5 text-white text-sm outline-none rounded">
                    {ROLE_OPTIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowModal(false)}
                    className="flex-1 px-4 py-2.5 border border-white/10 text-white/50 hover:text-white hover:border-white/30 transition-colors text-[10px] font-mono uppercase tracking-widest rounded">
                    Cancel
                  </button>
                  <button type="submit" disabled={saving}
                    className="flex-1 px-4 py-2.5 bg-brand text-white hover:bg-brand/90 transition-colors text-[10px] font-mono uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-50 rounded">
                    {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                    {editingId ? "Save Changes" : "Create User"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
