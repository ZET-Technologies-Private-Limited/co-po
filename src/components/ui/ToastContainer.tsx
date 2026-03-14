"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useUIStore } from "@/lib/uiStore";
import { CheckCircle2, AlertTriangle, Info, X, Bell, AlertCircle } from "lucide-react";

const ICONS = {
  success: <CheckCircle2 className="w-4 h-4 text-attain shrink-0" />,
  error: <AlertCircle className="w-4 h-4 text-alert shrink-0" />,
  info: <Info className="w-4 h-4 text-brand shrink-0" />,
  warning: <AlertTriangle className="w-4 h-4 text-aurora shrink-0" />,
};

export function ToastContainer() {
  const { toasts, removeToast } = useUIStore();

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] flex flex-col gap-3 items-center pointer-events-none">
      <AnimatePresence>
        {toasts.map(toast => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 28 }}
            className="flex items-center gap-3 px-5 py-3 bg-[#1E293B] border border-white/10 shadow-2xl pointer-events-auto"
            style={{ minWidth: 280 }}
          >
            {ICONS[toast.type]}
            <span className="text-white/80 text-sm font-light flex-1">{toast.message}</span>
            <button onClick={() => removeToast(toast.id)} className="text-white/30 hover:text-white transition-colors ml-4 shrink-0">
              <X className="w-3 h-3" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
