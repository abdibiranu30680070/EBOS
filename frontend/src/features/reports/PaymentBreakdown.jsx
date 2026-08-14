// ─────────────────────────────────────────────
// PaymentBreakdown — Payment mode distribution
// Props: orders, range
// ─────────────────────────────────────────────

import { filterByRange }     from './SalesSummaryCards.jsx';
import { PAYMENT_MODE_COLORS } from '../../lib/constants.js';

export function PaymentBreakdown({ orders, range }) {
  const filtered = filterByRange(orders, range);
  const total    = filtered.reduce((s, o) => s + o.totalAmount, 0);

  // Aggregate by payment mode
  const breakdown = filtered.reduce((acc, o) => {
    acc[o.paymentMode] = (acc[o.paymentMode] || 0) + o.totalAmount;
    return acc;
  }, {});

  const entries = Object.entries(breakdown).sort((a, b) => b[1] - a[1]);

  // Bar widths
  const max = entries[0]?.[1] || 1;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100">
        <h3 className="font-bold text-slate-800">Payment Method Breakdown</h3>
        <p className="text-xs text-slate-400 mt-0.5">Revenue distribution by payment type</p>
      </div>

      <div className="p-6 space-y-4">
        {entries.length === 0 ? (
          <p className="text-center text-slate-400 text-sm py-6">No sales in this period.</p>
        ) : entries.map(([mode, amount]) => {
          const pct     = total > 0 ? Math.round((amount / total) * 100) : 0;
          const barPct  = Math.round((amount / max) * 100);
          const color   = PAYMENT_MODE_COLORS[mode] ?? 'bg-slate-100 text-slate-600';
          const barCls  = {
            CASH:          'bg-emerald-400',
            TELEBIRR:      'bg-blue-400',
            CBE_BIRR:      'bg-indigo-400',
            BANK_TRANSFER: 'bg-purple-400',
            CREDIT:        'bg-amber-400',
          }[mode] ?? 'bg-slate-400';

          return (
            <div key={mode} className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${color}`}>{mode}</span>
                <div className="text-right">
                  <span className="font-bold text-slate-800">ETB {amount.toLocaleString()}</span>
                  <span className="text-slate-400 text-xs ml-2">({pct}%)</span>
                </div>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div className={`${barCls} h-2 rounded-full transition-all duration-500`} style={{ width: `${barPct}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
