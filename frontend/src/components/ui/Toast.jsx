// ─────────────────────────────────────────────
// Toast — Lightweight global notification system
// Usage: import { useToast } from '../../components/ui/Toast.jsx'
//        const toast = useToast();
//        toast.success('Saved!');
// ─────────────────────────────────────────────

import { useState, useCallback, createContext, useContext } from 'react';

const ToastContext = createContext(null);

let _uid = 0;

const TYPE_STYLES = {
  success: { bar: 'bg-emerald-500', icon: '✅', text: 'text-emerald-800', bg: 'bg-white border-emerald-200' },
  error:   { bar: 'bg-rose-500',    icon: '❌', text: 'text-rose-800',    bg: 'bg-white border-rose-200'    },
  warning: { bar: 'bg-amber-400',   icon: '⚠️', text: 'text-amber-800',   bg: 'bg-white border-amber-200'   },
  info:    { bar: 'bg-blue-500',    icon: 'ℹ️', text: 'text-blue-800',    bg: 'bg-white border-blue-200'    },
};

// ── Provider ──────────────────────────────────
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = ++_uid;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration);
  }, []);

  const dismiss = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toast = {
    success: (msg, dur) => addToast(msg, 'success', dur),
    error:   (msg, dur) => addToast(msg, 'error',   dur),
    warning: (msg, dur) => addToast(msg, 'warning', dur),
    info:    (msg, dur) => addToast(msg, 'info',    dur),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {/* Toast stack — fixed bottom-right */}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2.5 pointer-events-none" aria-live="polite">
        {toasts.map(t => {
          const s = TYPE_STYLES[t.type] ?? TYPE_STYLES.info;
          return (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-start gap-3 min-w-[280px] max-w-sm ${s.bg} border rounded-xl shadow-lg overflow-hidden`}
              style={{ animation: 'slideIn 0.2s ease-out' }}
            >
              {/* Left accent bar */}
              <div className={`w-1 self-stretch ${s.bar} rounded-l-xl shrink-0`} />
              <div className="flex-1 px-2 py-3 flex items-start gap-2.5">
                <span className="shrink-0 mt-0.5 text-base leading-none">{s.icon}</span>
                <span className={`text-sm font-medium ${s.text} flex-1 leading-snug`}>{t.message}</span>
                <button
                  onClick={() => dismiss(t.id)}
                  className="shrink-0 text-slate-400 hover:text-slate-700 text-base leading-none cursor-pointer transition-colors mt-0.5"
                  aria-label="Dismiss"
                >×</button>
              </div>
            </div>
          );
        })}
      </div>
      {/* Slide-in animation */}
      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(24px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </ToastContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within <ToastProvider>');
  return ctx;
}
