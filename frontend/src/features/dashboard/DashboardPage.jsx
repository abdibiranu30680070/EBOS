// ─────────────────────────────────────────────
// DashboardPage — Overview screen
// Composes KpiCards + RecentOrdersTable + LowStockTable
// Props: products, customers, orders, stockBalances
// ─────────────────────────────────────────────

import { KpiCards }          from './KpiCards.jsx';
import { RecentOrdersTable } from './RecentOrdersTable.jsx';
import { LowStockTable }     from './LowStockTable.jsx';

export function DashboardPage({ products, customers, orders, stockBalances }) {
  const lowStockItems = products.filter(p => (stockBalances[p.id] || 0) < p.minStockLevel);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Dashboard</h1>
        <p className="text-slate-400 text-sm mt-0.5">
          {new Date().toLocaleDateString('en-ET', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* KPI strip */}
      <KpiCards orders={orders} customers={customers} lowStockItems={lowStockItems} />

      {/* Tables row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <RecentOrdersTable orders={orders} />
        <LowStockTable products={products} stockBalances={stockBalances} />
      </div>
    </div>
  );
}
