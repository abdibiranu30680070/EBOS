// ─────────────────────────────────────────────
// SalesSummaryCards — KPI strip for Reports page
// Props: orders, dateRange ('today'|'week'|'month'|'all')
// ─────────────────────────────────────────────

import { StatCard } from '../../components/ui/StatCard.jsx';

function filterByRange(orders, range) {
  const now  = new Date();
  const sod  = new Date(now.getFullYear(), now.getMonth(), now.getDate());       // start of today
  const sow  = new Date(sod); sow.setDate(sod.getDate() - sod.getDay());        // start of week (Sun)
  const som  = new Date(now.getFullYear(), now.getMonth(), 1);                   // start of month

  return orders.filter(o => {
    const d = new Date(o.createdAt);
    if (range === 'today') return d >= sod;
    if (range === 'week')  return d >= sow;
    if (range === 'month') return d >= som;
    return true;
  });
}

export function SalesSummaryCards({ orders, range }) {
  const filtered   = filterByRange(orders, range);
  const revenue    = filtered.reduce((s, o) => s + o.totalAmount, 0);
  const cashOrders = filtered.filter(o => o.paymentMode !== 'CREDIT');
  const cashIn     = cashOrders.reduce((s, o) => s + o.paidAmount, 0);
  const creditOut  = filtered
    .filter(o => o.paymentMode === 'CREDIT')
    .reduce((s, o) => s + (o.totalAmount - o.paidAmount), 0);

  const avg = filtered.length > 0 ? Math.round(revenue / filtered.length) : 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <StatCard title="Total Sales" icon="💰" value={`ETB ${revenue.toLocaleString()}`} subtitle={`${filtered.length} orders`} />
      <StatCard title="Cash Collected" icon="🏦" value={`ETB ${cashIn.toLocaleString()}`} subtitle={`${cashOrders.length} cash orders`} valueClass="text-emerald-600" />
      <StatCard title="Credit Extended" icon="📋" value={`ETB ${creditOut.toLocaleString()}`}
        subtitle="Awaiting collection" valueClass={creditOut > 0 ? 'text-amber-600' : 'text-slate-900'} />
      <StatCard title="Avg. Order Value" icon="📊" value={`ETB ${avg.toLocaleString()}`} subtitle="Per transaction" />
    </div>
  );
}

// Export the filter helper for other report components
export { filterByRange };
