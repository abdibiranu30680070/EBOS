// ─────────────────────────────────────────────
// Header — Top navigation bar
// Props: user, isOnline, syncing, onSync, onLogout
// ─────────────────────────────────────────────

import { usePendingSync } from '../../hooks/usePendingSync.js';
import { MODULES } from '../../lib/constants.js';

export function Header({ user, isOnline, syncing, activeModule, onModuleChange, onSync, onLogout }) {
  const { pendingCount, hasPending } = usePendingSync();

  return (
    <header className="bg-slate-900 border-b border-slate-800 px-6 py-0 flex justify-between items-center sticky top-0 z-10 shadow-sm text-white">
      {/* Brand + Context */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3 py-3">
          <span className="text-xl font-extrabold text-blue-400 tracking-tight">💼 EBOS</span>
        </div>

        {/* Module Switcher */}
        <nav className="flex items-center space-x-1 h-full">
          {MODULES.map(m => (
            <button
              key={m.id}
              onClick={() => onModuleChange(m.id)}
              className={`flex items-center gap-2 px-4 py-4 text-sm font-semibold transition-colors border-b-2 ${
                activeModule === m.id
                  ? 'border-blue-400 text-white bg-slate-800'
                  : 'border-transparent text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <span>{m.icon}</span>
              {m.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 py-3">
        <span className="text-xs bg-slate-800 text-slate-300 px-3 py-1 rounded-full font-medium border border-slate-700">
          {user?.branchName ?? 'Central Branch'}
        </span>

        {/* Network indicator */}
        <span className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
          isOnline
            ? 'bg-emerald-900/30 text-emerald-400 border-emerald-800'
            : 'bg-rose-900/30 text-rose-400 border-rose-800'
        }`}>
          {isOnline ? '🟢 Online' : '🔌 Offline'}
        </span>

        {/* Manual sync */}
        <button
          onClick={onSync}
          disabled={syncing || (!isOnline && pendingCount === 0)}
          className="relative flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold text-xs px-4 py-2 rounded-lg transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <span className={syncing ? 'animate-spin inline-block' : ''}>🔄</span>
          {syncing ? 'Syncing…' : 'Sync Now'}
          {hasPending && !syncing && (
            <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-sm">
              {pendingCount}
            </span>
          )}
        </button>

        {/* Logout */}
        <button
          onClick={onLogout}
          className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold text-xs px-4 py-2 rounded-lg transition-colors cursor-pointer"
        >
          Logout
        </button>
      </div>
    </header>
  );
}
