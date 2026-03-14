"use client";

import { useState, useMemo, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, Search, Plus, Edit3, Trash2, Shield,
  CheckCircle2, X, Loader2, Upload, BookOpen, UserCheck
} from "lucide-react";
import { fadeSlideUp, staggerContainer } from "@/lib/animations";
import { useDataStore, UserRecord, CourseRecord } from "@/lib/dataStore";
import { useAuthStore, Role } from "@/lib/authStore";
import { useUIStore } from "@/lib/uiStore";
import { AccessGate } from "@/components/auth/AccessGate";
import { FormInput } from "@/components/ui/FormInput";
import { DeleteConfirmationDialog } from "@/components/ui/DeleteConfirmationDialog";
import { useDeleteConfirmation } from "@/lib/useFormFeatures";
import { DataTable } from "@/components/ui/DataTable";

const ROLE_OPTIONS: { value: Role; label: string; color: string }[] = [
  { value: "admin",           label: "Admin",        color: "text-alert" },
  { value: "department_head", label: "HOD",           color: "text-aurora" },
  { value: "subject_lead",    label: "Course Lead",   color: "text-insight" },
  { value: "faculty",         label: "Faculty",       color: "text-brand" },
  { value: "student",         label: "Student",       color: "text-cyan-400" },
];
const DEPTS = ["Administration", "CSE", "ECE", "MECH", "CIVIL", "IT", "MBA"];

type FormState = {
  name: string; email: string; password: string; employeeId: string;
  phone: string; roles: Role[]; dept: string; designation: string;
  status: "active" | "inactive";
};
const BLANK: FormState = {
  name: "", email: "", password: "", employeeId: "", phone: "",
  roles: ["faculty"], dept: "CSE", designation: "", status: "active",
};

type ModalMode = "user" | "assign_course" | "assign_lead" | null;

export default function AdminUsersPage() {
  const users        = useDataStore(s => s.users);
  const courses      = useDataStore(s => s.courses);
  const addUser      = useDataStore(s => s.addUser);
  const updateUser   = useDataStore(s => s.updateUser);
  const deleteUser   = useDataStore(s => s.deleteUser);
  const updateCourse = useDataStore(s => s.updateCourse);
  const addAuditEntry = useDataStore(s => s.addAuditEntry);
  const { user: me } = useAuthStore();
  const { addToast } = useUIStore();

  const [search, setSearch]         = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [modal, setModal]           = useState<ModalMode>(null);
  const [editingId, setEditingId]   = useState<string | null>(null);
  const [form, setForm]             = useState<FormState>(BLANK);
  const [saving, setSaving]         = useState(false);
  const [csvErrors, setCsvErrors]   = useState<string[]>([]);
  const [csvPreview, setCsvPreview] = useState<FormState[]>([]);
  const [assignUserId, setAssignUserId] = useState<string>("");
  const [assignCourseId, setAssignCourseId] = useState<string>("");
  const [assignRole, setAssignRole] = useState<"faculty" | "lead">("faculty");
  const fileRef = useRef<HTMLInputElement>(null);
  
  // SF-09: Delete confirmation
  const { showConfirm, requestDelete, confirmDelete, cancelDelete } = useDeleteConfirmation();
  const [userToDelete, setUserToDelete] = useState<UserRecord | null>(null);

  const filtered = useMemo(() =>
    users.filter(u =>
      (roleFilter === "all" || u.roles.includes(roleFilter as Role)) &&
      (u.name.toLowerCase().includes(search.toLowerCase()) ||
       u.email.toLowerCase().includes(search.toLowerCase()) ||
       u.employeeId.toLowerCase().includes(search.toLowerCase()))
    ), [users, search, roleFilter]);

  const openCreate = () => { setForm(BLANK); setEditingId(null); setModal("user"); };
  const openEdit   = (u: UserRecord) => {
    setForm({ name: u.name, email: u.email, password: u.password, employeeId: u.employeeId,
      phone: (u as any).phone || "", roles: u.roles, dept: u.dept, designation: u.designation, status: u.status });
    setEditingId(u.id); setModal("user");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.employeeId) { addToast("Name, Email, and Employee ID are required.", "warning"); return; }
    setSaving(true);
    await new Promise(r => setTimeout(r, 500));
    if (editingId) {
      const prev = users.find(u => u.id === editingId);
      updateUser(editingId, form);
      if (prev && prev.roles[0] !== form.roles[0]) {
        addAuditEntry({ type: "user", userId: me?.id || "admin", role: "admin",
          action: `Role changed for ${form.name}: ${prev.roles[0]} → ${form.roles[0]}`, ip: "127.0.0.1" });
      }
      addToast(`Updated: ${form.name}`, "success");
    } else {
      addUser(form);
      addToast(`Provisioned: ${form.name} (${form.employeeId})`, "success");
    }
    setSaving(false); setModal(null);
  };

  const handleDelete = (u: UserRecord) => {
    if (u.id === me?.id) { addToast("Cannot delete your own account.", "warning"); return; }
    setUserToDelete(u);
    requestDelete(() => {
      deleteUser(u.id);
      addAuditEntry({ type: "user", userId: me?.id || "admin", role: "admin",
        action: `User deleted: ${u.name} (${u.employeeId})`, ip: "127.0.0.1" });
      addToast(`Removed: ${u.name}`, "info");
    });
  };
  
  // SF-08: Duplicate check for Employee ID
  const checkDuplicateEmployeeId = useCallback(async (value: string): Promise<boolean> => {
    const isDuplicate = users.some(u => 
      u.employeeId.toLowerCase() === value.toLowerCase() && u.id !== editingId
    );
    return isDuplicate;
  }, [users, editingId]);
  
  // SF-08: Duplicate check for Email
  const checkDuplicateEmail = useCallback(async (value: string): Promise<boolean> => {
    const isDuplicate = users.some(u => 
      u.email.toLowerCase() === value.toLowerCase() && u.id !== editingId
    );
    return isDuplicate;
  }, [users, editingId]);

  const toggleStatus = (u: UserRecord) => {
    const next = u.status === "active" ? "inactive" : "active";
    updateUser(u.id, { status: next });
    addAuditEntry({ type: "user", userId: me?.id || "admin", role: "admin",
      action: `User ${next === "active" ? "reactivated" : "deactivated"}: ${u.name}`, ip: "127.0.0.1" });
    addToast(`${u.name} — ${next}`, "info");
  };

  // Bulk CSV import
  const handleCSV = (file: File) => {
    setCsvErrors([]); setCsvPreview([]);
    const reader = new FileReader();
    reader.onload = e => {
      const text = e.target?.result as string;
      const lines = text.trim().split("\n").map(l => l.split(",").map(c => c.trim().replace(/^"|"$/g, "")));
      if (lines.length < 2) { setCsvErrors(["CSV must have a header row and at least one data row."]); return; }
      const header = lines[0].map(h => h.toLowerCase());
      const errs: string[] = [];
      const preview: FormState[] = [];
      lines.slice(1).forEach((row, i) => {
        const get = (key: string) => row[header.indexOf(key)] || "";
        const name = get("name"); const email = get("email"); const empId = get("employeeid") || get("employee_id") || get("id");
        const role = (get("role") || "faculty") as Role;
        if (!name) errs.push(`Row ${i + 2}: Name missing`);
        if (!email || !email.includes("@")) errs.push(`Row ${i + 2}: Invalid email`);
        if (!empId) errs.push(`Row ${i + 2}: Employee ID missing`);
        if (!ROLE_OPTIONS.find(r => r.value === role)) errs.push(`Row ${i + 2}: Invalid role "${role}"`);
        if (!errs.length || errs.length === 0) {
          preview.push({ name, email, password: get("password") || "Nexus@123", employeeId: empId,
            phone: get("phone") || "", roles: [role], dept: get("dept") || get("department") || "CSE",
            designation: get("designation") || "", status: "active" });
        }
      });
      setCsvErrors(errs);
      if (errs.length === 0) setCsvPreview(preview);
    };
    reader.readAsText(file);
  };

  const importCSV = async () => {
    setSaving(true);
    for (const u of csvPreview) { addUser(u); await new Promise(r => setTimeout(r, 50)); }
    addAuditEntry({ type: "user", userId: me?.id || "admin", role: "admin",
      action: `Bulk import: ${csvPreview.length} users provisioned via CSV`, ip: "127.0.0.1" });
    addToast(`${csvPreview.length} users imported successfully.`, "success");
    setCsvPreview([]); setSaving(false);
  };

  // Course assignment
  const handleAssignCourse = () => {
    if (!assignUserId || !assignCourseId) { addToast("Select both user and course.", "warning"); return; }
    if (assignRole === "faculty") {
      updateCourse(assignCourseId, { facultyId: assignUserId });
      addToast("Faculty assigned to course.", "success");
    } else {
      updateCourse(assignCourseId, { leadId: assignUserId });
      addToast("Course Lead assigned.", "success");
    }
    addAuditEntry({ type: "user", userId: me?.id || "admin", role: "admin",
      action: `${assignRole === "faculty" ? "Faculty" : "Lead"} assigned: user ${assignUserId} → course ${assignCourseId}`, ip: "127.0.0.1" });
    setModal(null);
  };

  const ROLE_META = Object.fromEntries(ROLE_OPTIONS.map(r => [r.value, r]));

  return (
    <AccessGate feature="user_management" deny="lock">
      <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="max-w-7xl mx-auto pb-32">

        {/* Header */}
        <motion.div variants={fadeSlideUp} className="flex justify-between items-end pb-8 border-b border-white/5">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-mono text-brand uppercase tracking-widest mb-3">
              <span className="w-8 h-[1px] bg-brand" /> User Administration
            </div>
            <h1 className="text-4xl font-display text-white flex items-center gap-4">
              <Users className="w-8 h-8 text-brand" /> User Management
            </h1>
            <p className="text-white/40 font-light mt-1">
              {users.length} registered · {users.filter(u => u.status === "active").length} active
            </p>
          </div>
          <div className="flex gap-3">
            <label className="px-5 py-2.5 border border-white/10 text-white/40 text-[10px] font-mono uppercase tracking-widest hover:border-white/30 hover:text-white transition-colors flex items-center gap-2 cursor-pointer">
              <Upload className="w-3.5 h-3.5" /> Bulk Import CSV
              <input ref={fileRef} type="file" accept=".csv" className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleCSV(f); }} />
            </label>
            <button onClick={() => setModal("assign_course")}
              className="px-5 py-2.5 border border-white/10 text-white/40 text-[10px] font-mono uppercase tracking-widest hover:border-white/30 hover:text-white transition-colors flex items-center gap-2">
              <BookOpen className="w-3.5 h-3.5" /> Assign Course
            </button>
            <button onClick={openCreate}
              className="px-5 py-2.5 bg-brand text-white text-[10px] font-mono uppercase tracking-widest hover:bg-brand/90 transition-colors flex items-center gap-2">
              <Plus className="w-3.5 h-3.5" /> Provision User
            </button>
          </div>
        </motion.div>

        {/* CSV preview */}
        {csvPreview.length > 0 && (
          <motion.div variants={fadeSlideUp} className="border border-attain/20 bg-attain/5 p-5 flex items-center justify-between">
            <p className="text-sm text-attain font-mono">{csvPreview.length} users ready to import from CSV.</p>
            <div className="flex gap-3">
              <button onClick={() => setCsvPreview([])} className="text-[10px] font-mono text-white/40 uppercase hover:text-white transition-colors">Discard</button>
              <button onClick={importCSV} disabled={saving}
                className="px-5 py-2 bg-attain text-white text-[10px] font-mono uppercase tracking-widest flex items-center gap-2 disabled:opacity-50">
                {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />} Confirm Import
              </button>
            </div>
          </motion.div>
        )}
        {csvErrors.length > 0 && (
          <div className="border border-alert/20 bg-alert/5 p-4 flex flex-col gap-1">
            {csvErrors.map((e, i) => <p key={i} className="text-xs text-alert font-mono">{e}</p>)}
          </div>
        )}

        {/* Table Refactored with DataTable */}
        <motion.div variants={fadeSlideUp} className="py-6">
          <DataTable 
            data={filtered}
            pageSize={10}
            columns={[
              { id: "employeeId", header: "Employee ID", accessor: u => u.employeeId, sortable: true, width: 150 },
              { id: "name", header: "Name", accessor: u => u.name, sortable: true, width: 250 },
              { id: "email", header: "Email", accessor: u => u.email, sortable: true, width: 250 },
              { id: "dept", header: "Department", accessor: u => u.dept, sortable: true, width: 150 },
              { 
                id: "roles", 
                header: "Role(s)", 
                accessor: u => u.roles.join(", "),
                render: (_, u) => (
                  <div className="flex flex-wrap gap-1">
                    {u.roles.map(r => {
                      const m = ROLE_META[r];
                      return <span key={r} className={`px-1.5 py-0.5 text-[8px] font-mono uppercase tracking-widest border ${m?.color || ""} border-current/20 bg-current/5`}>{m?.label || r}</span>;
                    })}
                  </div>
                )
              },
              { 
                id: "status", 
                header: "Status", 
                accessor: u => u.status,
                sortable: true,
                width: 100,
                render: (val) => (
                  <span className={`text-[9px] font-mono uppercase ${val === "active" ? "text-attain" : "text-white/20"}`}>{val}</span>
                )
              },
              {
                id: "actions",
                header: "Actions",
                accessor: u => u.id,
                width: 120,
                render: (_, u) => (
                  <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                    <button onClick={() => openEdit(u)} title="Edit"
                      className="p-1.5 text-white/30 hover:text-white transition-colors"><Edit3 className="w-3.5 h-3.5" /></button>
                    <button onClick={() => toggleStatus(u)} title="Toggle status"
                      className="p-1.5 text-white/30 hover:text-white transition-colors"><Shield className="w-3.5 h-3.5" /></button>
                    <button onClick={() => handleDelete(u)} title="Delete"
                      className="p-1.5 text-white/30 hover:text-alert transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                )
              }
            ]}
          />
        </motion.div>

        {/* Create/Edit modal */}
        <AnimatePresence>
          {modal === "user" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-8">
              <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
                className="w-full max-w-lg bg-[#0a0a0f] border border-white/10 p-8 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl font-display text-white">{editingId ? "Edit User" : "Provision New User"}</h3>
                  <button onClick={() => setModal(null)} className="text-white/30 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
                </div>
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  <FormInput
                    label="Full Name"
                    value={form.name}
                    onChange={(value) => setForm(p => ({ ...p, name: value }))}
                    placeholder="Dr. Firstname Lastname"
                    required
                    autoTrim
                  />
                  <FormInput
                    label="Email"
                    type="email"
                    value={form.email}
                    onChange={(value) => setForm(p => ({ ...p, email: value }))}
                    placeholder="user@nexus.edu"
                    required
                    autoTrim
                    duplicateCheckFn={checkDuplicateEmail}
                  />
                  <FormInput
                    label="Employee / Roll ID"
                    value={form.employeeId}
                    onChange={(value) => setForm(p => ({ ...p, employeeId: value }))}
                    placeholder="FAC2024001"
                    required
                    autoTrim
                    autoUppercase
                    duplicateCheckFn={checkDuplicateEmployeeId}
                  />
                  <FormInput
                    label="Phone"
                    type="text"
                    value={form.phone}
                    onChange={(value) => setForm(p => ({ ...p, phone: value }))}
                    placeholder="+91 9876543210"
                    autoTrim
                  />
                  <FormInput
                    label="Password"
                    type="password"
                    value={form.password}
                    onChange={(value) => setForm(p => ({ ...p, password: value }))}
                    placeholder="Secure@Pass1"
                    required={!editingId}
                  />
                  <FormInput
                    label="Designation"
                    value={form.designation}
                    onChange={(value) => setForm(p => ({ ...p, designation: value }))}
                    placeholder="Assistant Professor"
                    autoTrim
                  />
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-mono text-white/30 uppercase tracking-widest">Department</label>
                    <select value={form.dept} onChange={e => setForm(p => ({ ...p, dept: e.target.value }))}
                      className="bg-white/[0.02] border border-white/10 px-4 py-2.5 text-white text-sm outline-none">
                      {DEPTS.map(d => <option key={d} value={d} className="bg-[#0a0a0f]">{d}</option>)}
                    </select>
                  </div>
                  {/* Dual-role: allow multiple roles */}
                  <div className="flex flex-col gap-2">
                    <label className="text-[9px] font-mono text-white/30 uppercase tracking-widest">Role(s) — select multiple for dual-role</label>
                    <div className="flex flex-wrap gap-2">
                      {ROLE_OPTIONS.map(r => {
                        const active = form.roles.includes(r.value);
                        return (
                          <button key={r.value} type="button"
                            onClick={() => setForm(p => ({
                              ...p,
                              roles: active ? p.roles.filter(x => x !== r.value) : [...p.roles, r.value]
                            }))}
                            className={`px-3 py-1.5 text-[9px] font-mono uppercase tracking-widest border transition-colors ${active ? `${r.color} border-current/30 bg-current/10` : "border-white/10 text-white/30 hover:border-white/30"}`}>
                            {r.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div className="flex gap-3 pt-2 border-t border-white/5">
                    <button type="button" onClick={() => setModal(null)}
                      className="flex-1 py-2.5 border border-white/10 text-white/40 hover:text-white text-[10px] font-mono uppercase tracking-widest transition-colors">
                      Cancel
                    </button>
                    <button type="submit" disabled={saving}
                      className="flex-1 py-2.5 bg-brand text-white text-[10px] font-mono uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-brand/90 transition-colors">
                      {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                      {editingId ? "Save Changes" : "Create User"}
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Assign course/lead modal */}
        <AnimatePresence>
          {modal === "assign_course" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-8">
              <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }}
                className="w-full max-w-md bg-[#0a0a0f] border border-white/10 p-8">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl font-display text-white flex items-center gap-3">
                    <BookOpen className="w-5 h-5 text-brand" /> Assign Course
                  </h3>
                  <button onClick={() => setModal(null)} className="text-white/30 hover:text-white"><X className="w-5 h-5" /></button>
                </div>
                <div className="flex flex-col gap-5">
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-mono text-white/30 uppercase tracking-widest">Assignment Type</label>
                    <div className="flex border border-white/10">
                      {(["faculty", "lead"] as const).map(r => (
                        <button key={r} onClick={() => setAssignRole(r)}
                          className={`flex-1 py-2.5 text-[10px] font-mono uppercase tracking-widest transition-colors ${assignRole === r ? "bg-brand text-white" : "text-white/30 hover:text-white"}`}>
                          {r === "faculty" ? "Faculty" : "Course Lead"}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-mono text-white/30 uppercase tracking-widest">
                      {assignRole === "faculty" ? "Select Faculty" : "Select Lead"}
                    </label>
                    <select value={assignUserId} onChange={e => setAssignUserId(e.target.value)}
                      className="bg-white/[0.02] border border-white/10 px-4 py-2.5 text-white text-sm outline-none">
                      <option value="" className="bg-[#0a0a0f]">— Select user —</option>
                      {users.filter(u => u.roles.includes(assignRole === "faculty" ? "faculty" : "subject_lead") && u.status === "active")
                        .map(u => <option key={u.id} value={u.id} className="bg-[#0a0a0f]">{u.name} ({u.employeeId})</option>)}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-mono text-white/30 uppercase tracking-widest">Select Course</label>
                    <select value={assignCourseId} onChange={e => setAssignCourseId(e.target.value)}
                      className="bg-white/[0.02] border border-white/10 px-4 py-2.5 text-white text-sm outline-none">
                      <option value="" className="bg-[#0a0a0f]">— Select course —</option>
                      {courses.map(c => <option key={c.id} value={c.id} className="bg-[#0a0a0f]">{c.code} — {c.name}</option>)}
                    </select>
                  </div>
                  {assignCourseId && (
                    <div className="text-[10px] font-mono text-white/30 border border-white/5 p-3">
                      {(() => {
                        const c = courses.find(x => x.id === assignCourseId);
                        const fac = users.find(u => u.id === c?.facultyId);
                        const lead = users.find(u => u.id === c?.leadId);
                        return <><p>Current Faculty: {fac?.name || "—"}</p><p>Current Lead: {lead?.name || "—"}</p></>;
                      })()}
                    </div>
                  )}
                  <div className="flex gap-3 pt-2 border-t border-white/5">
                    <button onClick={() => setModal(null)}
                      className="flex-1 py-2.5 border border-white/10 text-white/40 hover:text-white text-[10px] font-mono uppercase tracking-widest transition-colors">
                      Cancel
                    </button>
                    <button onClick={handleAssignCourse}
                      className="flex-1 py-2.5 bg-brand text-white text-[10px] font-mono uppercase tracking-widest hover:bg-brand/90 transition-colors flex items-center justify-center gap-2">
                      <UserCheck className="w-3.5 h-3.5" /> Assign
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* SF-09: Delete Confirmation Dialog */}
        <DeleteConfirmationDialog
          isOpen={showConfirm}
          onConfirm={confirmDelete}
          onCancel={cancelDelete}
          title="Delete User"
          message={userToDelete ? `Are you sure you want to delete ${userToDelete.name}? This action cannot be undone.` : "Are you sure? This cannot be undone."}
          confirmText="Delete"
          cancelText="Cancel"
          isDangerous
        />

      </motion.div>
    </AccessGate>
  );
}
