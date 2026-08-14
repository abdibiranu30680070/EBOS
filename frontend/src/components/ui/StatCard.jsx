// ─────────────────────────────────────────────
// StatCard — KPI metric display card
// Props: title, value, valueClass?, icon?, subtitle?
// ─────────────────────────────────────────────

export function StatCard({ title, value, valueClass = 'text-slate-900', icon, subtitle }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</span>
        {icon && <span className="text-2xl opacity-70">{icon}</span>}
      </div>
      <div className={`text-3xl font-extrabold leading-tight ${valueClass}`}>{value}</div>
      {subtitle && <div className="text-xs text-slate-400">{subtitle}</div>}
    </div>
  );
}
