// ─────────────────────────────────────────────
// Badge — Sync status / payment mode pill
// Props: children, variant ('success'|'warning'|'info'|'danger'|'neutral')
// ─────────────────────────────────────────────

const VARIANT_CLASSES = {
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  warning: 'bg-amber-50   text-amber-700   border-amber-200',
  danger:  'bg-rose-50    text-rose-700    border-rose-200',
  info:    'bg-blue-50    text-blue-700    border-blue-200',
  neutral: 'bg-slate-100  text-slate-600   border-slate-200',
};

export function Badge({ children, variant = 'neutral', className = '' }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${VARIANT_CLASSES[variant] ?? VARIANT_CLASSES.neutral} ${className}`}>
      {children}
    </span>
  );
}

// ─── Convenience helpers ──────────────────────

/** Maps syncStatus string → Badge variant */
export function SyncBadge({ status }) {
  const map = { SYNCED: 'success', PENDING: 'warning', FAILED: 'danger' };
  return <Badge variant={map[status] ?? 'neutral'}>{status}</Badge>;
}
