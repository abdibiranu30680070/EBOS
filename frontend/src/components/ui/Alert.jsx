// ─────────────────────────────────────────────
// Alert — Success / danger / warning banner
// Props: type ('success'|'danger'|'warning'), children, onDismiss?
// ─────────────────────────────────────────────

const STYLES = {
  success: { wrap: 'bg-emerald-50 border-emerald-200 text-emerald-800', icon: '✅' },
  danger:  { wrap: 'bg-rose-50    border-rose-200    text-rose-800',    icon: '⚠️' },
  warning: { wrap: 'bg-amber-50   border-amber-200   text-amber-800',   icon: '⚠️' },
};

export function Alert({ type = 'info', children, onDismiss }) {
  const style = STYLES[type] ?? STYLES.warning;

  return (
    <div className={`flex items-start gap-2.5 p-4 rounded-xl border text-sm ${style.wrap}`} role="alert">
      <span className="shrink-0 mt-0.5">{style.icon}</span>
      <span className="flex-1">{children}</span>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="shrink-0 text-current opacity-60 hover:opacity-100 transition-opacity cursor-pointer text-base leading-none"
          aria-label="Dismiss alert"
        >
          ×
        </button>
      )}
    </div>
  );
}
