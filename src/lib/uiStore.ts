import { create } from 'zustand';

export type Toast = {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
};

type Notification = {
  id: string;
  title: string;
  desc: string;
  time: string;
  read: boolean;
  type: 'success' | 'error' | 'info';
};

interface UIState {
  // Toast
  toasts: Toast[];
  addToast: (message: string, type?: Toast['type']) => void;
  removeToast: (id: string) => void;

  // Notifications panel
  notifOpen: boolean;
  notifications: Notification[];
  openNotif: () => void;
  closeNotif: () => void;
  markAllRead: () => void;
  
  // Global search
  searchOpen: boolean;
  openSearch: () => void;
  closeSearch: () => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  toasts: [],
  addToast: (message, type = 'info') => {
    const id = Date.now().toString();
    set(s => ({ toasts: [...s.toasts, { id, message, type }] }));
    setTimeout(() => get().removeToast(id), 4500);
  },
  removeToast: (id) => set(s => ({ toasts: s.toasts.filter(t => t.id !== id) })),

  notifOpen: false,
  notifications: [
    { id: 'n1', title: 'CO Attainment Computed', desc: 'DBMS-301 · CO attainment report is ready to view', time: '5 min ago', read: false, type: 'success' },
    { id: 'n2', title: 'AI Analysis Complete', desc: 'ML-401 · Question Bloom classification finished', time: '45 min ago', read: false, type: 'info' },
    { id: 'n3', title: 'At-Risk Alert', desc: 'EC201 attainment dropped below 60% threshold', time: '2 hrs ago', read: false, type: 'error' },
    { id: 'n4', title: 'Report Generated', desc: 'PO Attainment Report for AY 2025-26 exported as PDF', time: '5 hrs ago', read: true, type: 'success' },
    { id: 'n5', title: 'Marks Uploaded', desc: 'CS301 T2 marks imported from Excel successfully', time: 'Yesterday', read: true, type: 'success' },
  ],
  openNotif: () => set({ notifOpen: true }),
  closeNotif: () => set({ notifOpen: false }),
  markAllRead: () => set(s => ({ notifications: s.notifications.map(n => ({ ...n, read: true })) })),

  searchOpen: false,
  openSearch: () => set({ searchOpen: true }),
  closeSearch: () => set({ searchOpen: false }),
}));
