"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, Search, UserPlus, FileUp, Edit3, Trash2, Shield, MoreVertical, XCircle, CheckCircle2 
} from "lucide-react";
import { fadeSlideUp, staggerContainer } from "@/lib/animations";
import { useUIStore } from "@/lib/uiStore";

// ─── MOCK DATA ───
const DEPARTMENTS = ["CSE", "ECE", "MECH", "CIVIL", "IT"];
const ROLES = ["faculty", "subject_lead", "department_head", "admin"];

const USERS_MOCK = [
  { id: "FAC2024001", name: "Dr. Alan Smith", email: "asmith@univ.edu", dept: "CSE", role: "subject_lead", status: "active" },
  { id: "FAC2024002", name: "Prof. Sarah Johnson", email: "sjohnson@univ.edu", dept: "ECE", role: "department_head", status: "active" },
  { id: "FAC2024003", name: "Dr. Emily Chen", email: "echen@univ.edu", dept: "CSE", role: "faculty", status: "active" },
  { id: "FAC2024004", name: "Mark Davis", email: "mdavis@univ.edu", dept: "MECH", role: "faculty", status: "inactive" },
  { id: "SYSADMIN01", name: "System Admin", email: "admin@univ.edu", dept: "SYSTEM", role: "admin", status: "active" }
];

export default function AdminUserManagementPage() {
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  
  const [isAdding, setIsAdding] = useState(false);
  const [newUser, setNewUser] = useState({ id: "", name: "", email: "", dept: "CSE", role: "faculty" });
  const { addToast } = useUIStore();

  const filteredUsers = USERS_MOCK.filter(u => 
    (deptFilter === "all" || u.dept === deptFilter) &&
    (roleFilter === "all" || u.role === roleFilter) &&
    (u.name.toLowerCase().includes(search.toLowerCase()) || u.id.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="max-w-7xl mx-auto pb-32">
      
      {/* ── HEADER ── */}
      <motion.div variants={fadeSlideUp} className="mb-12 flex justify-between items-end flex-wrap gap-6">
        <div>
          <h1 className="text-4xl font-display text-white mb-2">User Provisioning</h1>
          <p className="text-white/40 font-light italic">System-wide role-based access control and account lifecycle management</p>
        </div>
        <div className="flex gap-4">
           <button 
             onClick={() => addToast("Prepared system for CSV bulk import", "info")}
             className="px-6 py-2.5 bg-white/[0.05] border border-white/10 text-white hover:bg-white/10 transition-colors text-[10px] font-mono uppercase tracking-widest flex items-center gap-2 rounded">
             <FileUp className="w-3.5 h-3.5" /> CSV Bulk Import
           </button>
           <button onClick={() => setIsAdding(true)} className="px-6 py-2.5 bg-brand text-white hover:bg-brand/90 transition-colors text-[10px] font-mono uppercase tracking-widest flex items-center gap-2 rounded shadow-[0_0_15px_rgba(30,174,219,0.3)]">
             <UserPlus className="w-3.5 h-3.5" /> Provision User
           </button>
        </div>
      </motion.div>

      {/* ── METRICS ── */}
      <motion.div variants={fadeSlideUp} className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
         <div className="bg-white/[0.02] border border-white/10 p-6 rounded-xl relative overflow-hidden">
            <Shield className="w-24 h-24 text-white/[0.02] absolute -right-4 -bottom-4" />
            <p className="text-[10px] font-mono text-white/40 uppercase tracking-widest mb-1 relative z-10">Total Active Profiles</p>
            <p className="text-3xl font-display text-white relative z-10">1,248</p>
         </div>
         <div className="bg-white/[0.02] border border-white/10 p-6 rounded-xl">
            <p className="text-[10px] font-mono text-white/40 uppercase tracking-widest mb-1">Subject Leads</p>
            <p className="text-3xl font-display text-aurora">45</p>
         </div>
         <div className="bg-white/[0.02] border border-white/10 p-6 rounded-xl">
            <p className="text-[10px] font-mono text-white/40 uppercase tracking-widest mb-1">Department Heads</p>
            <p className="text-3xl font-display text-insight">12</p>
         </div>
         <div className="bg-white/[0.02] border border-white/10 p-6 rounded-xl">
            <p className="text-[10px] font-mono text-alert uppercase tracking-widest mb-1">Pending Password Resets</p>
            <p className="text-3xl font-display text-alert">3</p>
         </div>
      </motion.div>

      {/* ── FILTERS ── */}
      <motion.div variants={fadeSlideUp} className="mb-6 flex flex-wrap gap-4 bg-white/[0.02] border border-white/5 p-4 rounded-lg">
         <div className="flex-1 min-w-[250px] relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
            <input 
              type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, ID, or email..."
              className="w-full bg-cosmic border border-white/10 pl-10 pr-4 py-2 text-sm text-white outline-none focus:border-white/30 transition-colors rounded"
            />
         </div>
         <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)} className="bg-cosmic border border-white/10 px-4 py-2 text-sm text-white outline-none focus:border-white/30 transition-colors rounded">
           <option value="all">All Departments</option>
           {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
         </select>
         <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="bg-cosmic border border-white/10 px-4 py-2 text-sm text-white outline-none focus:border-white/30 transition-colors rounded">
           <option value="all">All Roles</option>
           {ROLES.map(r => <option key={r} value={r}>{r.replace('_', ' ').toUpperCase()}</option>)}
         </select>
      </motion.div>

      {/* ── USER DIRECTORY ── */}
      <motion.div variants={fadeSlideUp} className="border border-white/10 bg-white/[0.01] overflow-hidden rounded-xl">
         <table className="w-full text-left font-mono text-sm">
           <thead className="bg-white/[0.03] border-b border-white/10">
              <tr>
                 <th className="px-6 py-4 text-white/30 uppercase tracking-widest text-[10px] font-normal">Identity</th>
                 <th className="px-6 py-4 text-white/30 uppercase tracking-widest text-[10px] font-normal">Contact</th>
                 <th className="px-6 py-4 text-white/30 uppercase tracking-widest text-[10px] font-normal">Department</th>
                 <th className="px-6 py-4 text-white/30 uppercase tracking-widest text-[10px] font-normal">System Role</th>
                 <th className="px-6 py-4 text-white/30 uppercase tracking-widest text-[10px] font-normal">Status</th>
                 <th className="px-6 py-4 text-white/30 uppercase tracking-widest text-[10px] font-normal text-right">Actions</th>
              </tr>
           </thead>
           <tbody className="divide-y divide-white/5">
              {filteredUsers.length === 0 ? (
                <tr>
                   <td colSpan={6} className="py-24 text-center text-white/20 italic">No user records found.</td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-white/[0.02] transition-colors group">
                     <td className="px-6 py-6 font-light">
                        <div className="flex flex-col gap-1">
                           <span className="text-white font-medium">{user.name}</span>
                           <span className="text-[10px] font-mono text-white/40">{user.id}</span>
                        </div>
                     </td>
                     <td className="px-6 py-6 text-white/50">{user.email}</td>
                     <td className="px-6 py-6 font-bold text-white/70">{user.dept}</td>
                     <td className="px-6 py-6">
                        <span className={`px-2.5 py-1 text-[9px] uppercase tracking-widest border rounded
                           ${user.role === 'admin' ? 'border-brand/30 text-brand bg-brand/10' : 
                             user.role === 'department_head' ? 'border-insight/30 text-insight bg-insight/10' :
                             user.role === 'subject_lead' ? 'border-aurora/30 text-aurora bg-aurora/10' :
                             'border-white/10 text-white/60 bg-white/5'}`}>
                           {user.role.replace('_', ' ')}
                        </span>
                     </td>
                     <td className="px-6 py-6">
                        <div className="flex items-center gap-2">
                           <span className={`w-2 h-2 rounded-full ${user.status === 'active' ? 'bg-attain shadow-[0_0_5px_#22c55e]' : 'bg-white/20'}`} />
                           <span className="text-[10px] uppercase text-white/40">{user.status}</span>
                        </div>
                     </td>
                     <td className="px-6 py-6 text-right relative">
                        <button 
                          onClick={() => addToast(`Opened management options for ${user.id}`, "info")}
                          className="p-2 text-white/20 hover:text-white transition-colors opacity-0 group-hover:opacity-100">
                           <MoreVertical className="w-4 h-4" />
                        </button>
                     </td>
                  </tr>
                ))
              )}
           </tbody>
         </table>
      </motion.div>

      {/* ── PROVISION MODAL ── */}
      <AnimatePresence>
         {isAdding && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
               <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-cosmic border border-white/10 p-8 w-full max-w-lg shadow-2xl relative rounded-xl"
               >
                  <button onClick={() => setIsAdding(false)} className="absolute top-4 right-4 text-white/20 hover:text-white transition-colors"><XCircle className="w-5 h-5" /></button>
                  <div className="flex items-center gap-3 mb-2">
                     <span className="p-2 bg-brand/10 rounded text-brand"><UserPlus className="w-5 h-5" /></span>
                     <h3 className="text-xl font-display text-white">Provision Identity Record</h3>
                  </div>
                  <p className="text-sm font-light text-white/40 mb-8 italic indent-12">Create a new authenticated user profile and assign permission boundaries.</p>
                  
                  <div className="grid grid-cols-2 gap-6 font-mono text-sm">
                     <div className="col-span-2 flex flex-col gap-2">
                        <label className="text-[10px] text-white/30 uppercase tracking-widest">Employee ID</label>
                        <input type="text" value={newUser.id} onChange={e => setNewUser(n => ({ ...n, id: e.target.value }))} placeholder="e.g. FAC2024005" className="bg-white/5 border border-white/10 px-4 py-3 text-white outline-none focus:border-brand transition-colors rounded" />
                     </div>
                     <div className="col-span-2 flex flex-col gap-2">
                        <label className="text-[10px] text-white/30 uppercase tracking-widest">Full Legal Name</label>
                        <input type="text" value={newUser.name} onChange={e => setNewUser(n => ({ ...n, name: e.target.value }))} className="bg-white/5 border border-white/10 px-4 py-3 text-white outline-none focus:border-brand transition-colors rounded" />
                     </div>
                     <div className="col-span-2 flex flex-col gap-2">
                        <label className="text-[10px] text-white/30 uppercase tracking-widest">Institutional Email</label>
                        <input type="email" value={newUser.email} onChange={e => setNewUser(n => ({ ...n, email: e.target.value }))} className="bg-white/5 border border-white/10 px-4 py-3 text-white outline-none focus:border-brand transition-colors rounded" />
                     </div>
                     <div className="flex flex-col gap-2">
                        <label className="text-[10px] text-white/30 uppercase tracking-widest">Department</label>
                        <select value={newUser.dept} onChange={e => setNewUser(n => ({ ...n, dept: e.target.value }))} className="bg-white/5 border border-white/10 px-4 py-3 text-white outline-none focus:border-brand transition-colors rounded">
                           {DEPARTMENTS.map(d => <option key={d} value={d} className="bg-cosmic">{d}</option>)}
                        </select>
                     </div>
                     <div className="flex flex-col gap-2">
                        <label className="text-[10px] text-white/30 uppercase tracking-widest">System Role</label>
                        <select value={newUser.role} onChange={e => setNewUser(n => ({ ...n, role: e.target.value }))} className="bg-white/5 border border-white/10 px-4 py-3 text-white outline-none focus:border-brand transition-colors rounded">
                           {ROLES.map(r => <option key={r} value={r} className="bg-cosmic">{r.replace('_', ' ').toUpperCase()}</option>)}
                        </select>
                     </div>
                  </div>

                  <div className="mt-8 pt-6 border-t border-white/10 flex justify-end gap-4">
                     <button onClick={() => setIsAdding(false)} className="px-6 py-2 text-white/40 hover:text-white text-[10px] font-mono uppercase tracking-widest transition-colors">Cancel</button>
                     <button 
                        onClick={() => {
                           setIsAdding(false);
                           addToast(`Provisioned new ${newUser.role.replace('_', ' ')} profile for ${newUser.name || newUser.id || 'User'}`, "success");
                        }} 
                        className="px-8 py-2.5 bg-brand text-white text-[10px] font-mono uppercase tracking-widest hover:bg-brand/80 transition-colors flex items-center gap-2 rounded">
                        <CheckCircle2 className="w-4 h-4" /> Create Profile
                     </button>
                  </div>
               </motion.div>
            </div>
         )}
      </AnimatePresence>

    </motion.div>
  );
}
