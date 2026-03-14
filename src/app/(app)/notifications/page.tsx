"use client";

import { motion } from "framer-motion";
import { 
  Bell, CheckCircle2, ShieldAlert, Cpu, Award, Settings, Trash2, CheckSquare, Clock
} from "lucide-react";
import { fadeSlideUp, staggerContainer } from "@/lib/animations";
import { useUIStore } from "@/lib/uiStore";

export default function NotificationsPage() {
  const { notifications, markNotifRead, clearNotifs } = useUIStore();

  const getIcon = (type: any) => {
    switch(type) {
       case 'alert': return <ShieldAlert className="w-5 h-5 text-alert" />;
       case 'success': return <CheckCircle2 className="w-5 h-5 text-attain" />;
       case 'ai': return <Cpu className="w-5 h-5 text-brand" />;
       case 'deadline': return <Clock className="w-5 h-5 text-amber-500" />;
       default: return <Award className="w-5 h-5 text-insight" />;
    }
  };

  const markAllRead = () => {
     notifications.forEach(n => !n.read && markNotifRead(n.id));
  };

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="max-w-4xl mx-auto pb-32">
      
      {/* ── HEADER ── */}
      <motion.div variants={fadeSlideUp} className="mb-12 flex justify-between items-end flex-wrap gap-6 border-b border-white/10 pb-8">
        <div>
          <h1 className="text-4xl font-display text-white mb-2">Notification Centre</h1>
          <p className="text-white/40 font-light italic">System-wide alerts, workflow approvals, and deadline triggers.</p>
        </div>
        <div className="flex gap-4">
           <button onClick={markAllRead} className="px-5 py-2 hover:bg-white/5 border border-transparent hover:border-white/10 text-white/50 hover:text-white transition-colors text-[10px] font-mono uppercase tracking-widest flex items-center gap-2 rounded">
             <CheckSquare className="w-3.5 h-3.5" /> Mark All Read
           </button>
           <button onClick={clearNotifs} className="px-5 py-2 hover:bg-alert/10 border border-transparent hover:border-alert/30 text-white/50 hover:text-alert transition-colors text-[10px] font-mono uppercase tracking-widest flex items-center gap-2 rounded">
             <Trash2 className="w-3.5 h-3.5" /> Clear All
           </button>
        </div>
      </motion.div>

      {/* ── FEED ── */}
      <motion.div variants={fadeSlideUp} className="flex flex-col gap-4">
         {notifications.length === 0 ? (
            <div className="py-32 flex flex-col items-center justify-center text-white/20">
               <Bell className="w-12 h-12 mb-4" />
               <p className="text-sm font-mono uppercase tracking-widest">Inbox is clear</p>
            </div>
         ) : (
            notifications.map((notif) => (
               <motion.div key={notif.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className={`group relative flex items-start gap-6 p-6 rounded-xl border transition-colors cursor-default
                     ${!notif.read ? 'bg-white/[0.03] border-white/20 shadow-lg' : 'bg-transparent border-white/5 hover:bg-white/[0.01]'}`}
               >
                  {!notif.read && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-12 rounded-r-md bg-brand" />}
                  
                  <div className={`mt-1 p-3 rounded-full ${!notif.read ? 'bg-black/40' : 'bg-white/5'}`}>
                     {getIcon(notif.type)}
                  </div>
                  
                  <div className="flex-1">
                     <div className="flex items-center justify-between mb-2">
                        <h4 className={`text-lg font-display tracking-wide ${!notif.read ? 'text-white' : 'text-white/60'}`}>{notif.title}</h4>
                        <span className="text-[10px] font-mono text-white/30 uppercase tracking-widest">{notif.timestamp}</span>
                     </div>
                     <p className={`text-sm font-light leading-relaxed max-w-2xl ${!notif.read ? 'text-white/80' : 'text-white/40'}`}>
                        {notif.message}
                     </p>

                     {!notif.read && (
                        <div className="mt-6 flex items-center gap-4">
                           {notif.type === 'alert' && (
                              <button className="px-4 py-1.5 bg-alert/20 text-alert border border-alert/30 text-[10px] font-mono uppercase tracking-widest hover:bg-alert hover:text-white transition-colors">
                                 Resolve Issue
                              </button>
                           )}
                           {notif.type === 'deadline' && (
                              <button className="px-4 py-1.5 bg-brand/20 text-brand border border-brand/30 text-[10px] font-mono uppercase tracking-widest hover:bg-brand hover:text-white transition-colors">
                                 Action Required
                              </button>
                           )}
                           <button onClick={() => markNotifRead(notif.id)} className="px-4 py-1.5 border border-white/10 text-white/40 text-[10px] font-mono uppercase tracking-widest hover:text-white hover:border-white/30 transition-colors">
                              Dismiss
                           </button>
                        </div>
                     )}
                  </div>
               </motion.div>
            ))
         )}
      </motion.div>
    </motion.div>
  );
}
