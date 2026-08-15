// ─────────────────────────────────────────────
// Sidebar — Left navigation rail & mobile drawer
// ─────────────────────────────────────────────

import { NAV_TABS } from '../../lib/constants.js';

export function Sidebar({ activeModule, activeTab, onTabChange, user, isOnline, isOpen, onClose }) {
  const tabs = NAV_TABS[activeModule] || [];

  return (
    <aside className={`
      w-72 sm:w-64 shrink-0 bg-white border-r border-slate-200 flex flex-col justify-between p-4
      fixed inset-y-0 left-0 z-50 transition-transform duration-300 md:static md:translate-x-0 shadow-2xl md:shadow-none
      ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
    `}>
      {/* Mobile Drawer Header */}
      <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-100 md:hidden">
        <span className="font-bold text-slate-800 text-sm">Navigation Menu</span>
        <button
          onClick={onClose}
          className="p-1 text-slate-400 hover:text-slate-700 bg-slate-100 rounded-lg text-xs font-bold"
        >
          ✕ Close
        </button>
      </div>

      {/* Nav links */}
      <nav className="space-y-1.5 overflow-y-auto">
        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-1">
          {activeModule} Section
        </div>
        {tabs.map(({ id, icon, label }) => (
          <button
            key={id}
            onClick={() => onTabChange(id)}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold cursor-pointer transition-colors text-left ${
              activeTab === id
                ? 'bg-blue-50 text-blue-700 font-bold shadow-xs'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span className="text-lg opacity-90">{icon}</span>
            <span>{label}</span>
          </button>
        ))}
      </nav>

      {/* User info & status footer */}
      <div className="pt-3 border-t border-slate-100 space-y-2">
        <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs text-slate-500 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 uppercase tracking-wider font-semibold text-[10px]">Signed in as</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              isOnline ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
            }`}>
              {isOnline ? '🟢 Online' : '🔌 Offline'}
            </span>
          </div>
          <div className="font-bold text-slate-800 truncate">{user?.fullName ?? user?.username ?? '—'}</div>
          <div className="text-slate-400 capitalize">{user?.role?.toLowerCase() ?? 'User'} • {user?.branchName ?? 'Main Branch'}</div>
        </div>
      </div>
    </aside>
  );
}
