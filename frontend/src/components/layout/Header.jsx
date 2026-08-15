// ─────────────────────────────────────────────
// Header — Top navigation bar
// ─────────────────────────────────────────────

import { usePendingSync } from '../../hooks/usePendingSync.js';
import { MODULES }        from '../../lib/constants.js';
import { EbosLogo }       from '../common/EbosLogo.jsx';

export function Header({ user, isOnline, syncing, activeModule, onModuleChange, onSync, onLogout, onToggleSidebar }) {
  const { pendingCount, hasPending } = usePendingSync();

  return (
    <header className="bg-slate-900 border-b border-slate-800 px-3 sm:px-6 py-0 flex justify-between items-center sticky top-0 z-40 shadow-md text-white h-[60px] sm:h-[65px] select-none">
      {/* Left — Hamburger + Logo + Module Switcher */}
      <div className="flex items-center gap-2 sm:gap-4 md:gap-6 h-full min-w-0">
        <button 
          onClick={onToggleSidebar}
          className="md:hidden p-2 -ml-1 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          aria-label="Toggle Navigation Menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
          </svg>
        </button>

        <div className="flex items-center gap-2 shrink-0 py-2">
          <EbosLogo size="md" showText={true} className="hidden sm:flex" />
          <EbosLogo size="sm" showText={true} className="sm:hidden text-xs" />
        </div>

        {/* Module Switcher (Horizontal scrollable pill nav) */}
        <nav className="flex items-center space-x-1 h-full overflow-x-auto hide-scrollbar py-1">
          {MODULES.map(m => (
            <button
              key={m.id}
              onClick={() => onModuleChange(m.id)}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3.5 py-2 sm:py-3.5 text-xs sm:text-sm font-semibold transition-all rounded-lg sm:rounded-none sm:border-b-2 whitespace-nowrap cursor-pointer ${
                activeModule === m.id
                  ? 'bg-blue-600 sm:bg-slate-800 text-white sm:border-blue-400 shadow-sm sm:shadow-none'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60 sm:border-transparent'
              }`}
            >
              <span className="text-base">{m.icon}</span>
              <span className="hidden sm:inline">{m.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Right — Network Status + Sync + Actions */}
      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0 py-2">
        {/* Branch Indicator (Hidden on tiny screens) */}
        <span className="hidden lg:inline-block text-xs bg-slate-800 text-slate-300 px-2.5 py-1 rounded-md font-medium border border-slate-700 truncate max-w-[140px]">
          🏢 {user?.branchName ?? 'Main Branch'}
        </span>

        {/* Network indicator */}
        <span className={`text-[11px] sm:text-xs font-semibold px-2.5 py-1 sm:py-1.5 rounded-full border transition-colors ${
          isOnline
            ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800/80'
            : 'bg-rose-950/80 text-rose-400 border-rose-800/80'
        }`}>
          {isOnline ? '🟢 Online' : '🔌 Offline'}
        </span>

        {/* Sync Button */}
        <button
          onClick={onSync}
          disabled={syncing || (!isOnline && pendingCount === 0)}
          className="relative flex items-center gap-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold text-xs px-2.5 sm:px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          title="Sync offline records"
        >
          <span className={syncing ? 'animate-spin inline-block' : ''}>🔄</span>
          <span className="hidden sm:inline">{syncing ? 'Syncing…' : 'Sync'}</span>
          {hasPending && !syncing && (
            <span className="bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full shadow-sm">
              {pendingCount}
            </span>
          )}
        </button>

        {/* Logout Button */}
        <button
          onClick={onLogout}
          className="hidden sm:block bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white font-semibold text-xs px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
        >
          Logout
        </button>
      </div>
    </header>
  );
}
