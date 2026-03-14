"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useUIStore } from "@/lib/uiStore";
import { X, Bell, CheckCircle2, AlertCircle, Info } from "lucide-react";

const TYPE_COLOR = {
  success: "text-attain",
  error: "text-alert",
  info: "text-brand",
};
const TYPE_ICON = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
};

export function NotificationsPanel() {
  const { notifOpen, closeNotif, notifications, markAllRead } = useUIStore();
  const unread = notifications.filter(n => !n.read).length;

  return (
    <AnimatePresence>
      {notifOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={closeNotif}
            className="fixed inset-0 z-[90] bg-black/40 backdrop-blur-sm"
          />

          {/* Slide-over panel */}
          <motion.div
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed right-0 top-0 h-full w-full max-w-sm bg-[#0D1829] border-l border-white/10 z-[100] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-8 py-6 border-b border-white/10">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-white/60" />
                <h2 className="text-white font-display text-xl">Notifications</h2>
                {unread > 0 && (
                  <span className="w-5 h-5 rounded-full bg-brand flex items-center justify-center text-[10px] text-white font-mono">{unread}</span>
                )}
              </div>
              <div className="flex items-center gap-4">
                {unread > 0 && (
                  <button onClick={markAllRead} className="text-xs font-mono text-white/40 hover:text-white transition-colors uppercase tracking-widest">
                    Mark all read
                  </button>
                )}
                <button onClick={closeNotif} className="text-white/30 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto divide-y divide-white/5">
              {notifications.map((n, i) => {
                const Icon = TYPE_ICON[n.type];
                return (
                  <motion.div
                    key={n.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className={`flex items-start gap-4 px-8 py-6 transition-colors ${!n.read ? "bg-white/[0.03]" : ""} hover:bg-white/[0.05]`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 mt-1 ${TYPE_COLOR[n.type]}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`font-medium text-sm leading-snug ${!n.read ? "text-white" : "text-white/50"}`}>{n.title}</p>
                        {!n.read && <span className="w-2 h-2 rounded-full bg-brand shrink-0 mt-1.5" />}
                      </div>
                      <p className="text-white/40 text-sm font-light mt-1 leading-relaxed">{n.desc}</p>
                      <p className="text-white/25 text-xs font-mono mt-2">{n.time}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            <div className="px-8 py-6 border-t border-white/10">
              <p className="text-white/20 text-xs font-mono uppercase tracking-widest">System notifications — Nexus Engine</p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
