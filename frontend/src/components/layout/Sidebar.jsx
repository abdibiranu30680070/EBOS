// ─────────────────────────────────────────────
// Sidebar — Left navigation rail
// Props: activeTab, onTabChange, user
// ─────────────────────────────────────────────

import { NAV_TABS } from '../../lib/constants.js';

export function Sidebar({ activeModule, activeTab, onTabChange, user }) {
  const tabs = NAV_TABS[activeModule] || [];

  return (
    <aside className="w-56 shrink-0 bg-white border-r border-slate-200 flex flex-col justify-between p-4">
      {/* Nav links */}
      <nav className="space-y-1">
        {tabs.map(({ id, icon, label }) => (
          <button
            key={id}
            onClick={() => onTabChange(id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium cursor-pointer transition-colors text-left ${
              activeTab === id
                ? 'bg-blue-50 text-blue-700 font-bold'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span className="text-base opacity-80">{icon}</span>
            <span>{label}</span>
          </button>
        ))}
      </nav>

      {/* User info footer */}
      <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs text-slate-500 space-y-0.5">
        <div className="text-slate-400 uppercase tracking-wider font-semibold text-[10px] mb-1">Signed in as</div>
        <div className="font-bold text-slate-800 truncate">{user?.fullName ?? user?.username ?? '—'}</div>
        <div className="text-slate-400 capitalize">{user?.role?.toLowerCase() ?? 'user'}</div>
      </div>
    </aside>
  );
}
