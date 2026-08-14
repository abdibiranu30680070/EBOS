// ─────────────────────────────────────────────
// KpiCards — Three KPI metric tiles
// Props: orders, customers, lowStockItems
// ─────────────────────────────────────────────

import { StatCard } from '../../components/ui/StatCard.jsx';

export function KpiCards({ orders, customers, lowStockItems }) {
  const todaySales = orders
    .filter(o => new Date(o.createdAt).toDateString() === new Date().toDateString())
    .reduce((sum, o) => sum + o.totalAmount, 0);

  const totalReceivables = customers.reduce((sum, c) => sum + c.outstandingBalance, 0);

  const lowCount = lowStockItems.length;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
      <StatCard
        title="Today's Sales"
        icon="💰"
        value={`ETB ${todaySales.toLocaleString()}`}
        subtitle={`${orders.filter(o => new Date(o.createdAt).toDateString() === new Date().toDateString()).length} orders today`}
      />
      <StatCard
        title="Credit Receivables"
        icon="📋"
        value={`ETB ${totalReceivables.toLocaleString()}`}
        subtitle={`${customers.filter(c => c.outstandingBalance > 0).length} accounts with open balance`}
        valueClass={totalReceivables > 0 ? 'text-amber-600' : 'text-slate-900'}
      />
      <StatCard
        title="Low Stock Alerts"
        icon="📦"
        value={`${lowCount} Product${lowCount !== 1 ? 's' : ''}`}
        subtitle={lowCount > 0 ? 'Action required — replenish stock' : 'All inventory levels healthy'}
        valueClass={lowCount > 0 ? 'text-rose-600' : 'text-emerald-600'}
      />
    </div>
  );
}
