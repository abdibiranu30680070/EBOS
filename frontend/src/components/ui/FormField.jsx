// ─────────────────────────────────────────────
// FormField — Label + input/select/textarea wrapper
// Standardizes spacing, label style, and error display
// Props: label, error?, required?, children
// ─────────────────────────────────────────────

export function FormField({ label, error, required, children }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
        {label}
        {required && <span className="text-rose-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-rose-600">{error}</p>}
    </div>
  );
}

// ─── Shared input / select class strings ─────
export const inputClass =
  'w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-sm ' +
  'text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 ' +
  'placeholder:text-slate-400 transition-shadow';

export const selectClass =
  'w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-sm ' +
  'text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer';

export const textareaClass =
  'w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-sm ' +
  'text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none';
