// ─────────────────────────────────────────────
// ReportsPage — Comprehensive business analytics
// Composes all report widgets
// Props: orders, products
// ─────────────────────────────────────────────

import { useState } from 'react';
import { SalesSummaryCards } from './SalesSummaryCards.jsx';
import { PaymentBreakdown }  from './PaymentBreakdown.jsx';
import { TopProductsTable }  from './TopProductsTable.jsx';
import { DailySalesChart }   from './DailySalesChart.jsx';
import { selectClass }       from '../../components/ui/FormField.jsx';

export function ReportsPage({ orders, products }) {
  const [range, setRange] = useState('month');

  return (
    <div className="space-y-6 pb-10">
      {/* Header + Range selector */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Business Reports</h1>
          <p className="text-slate-400 text-sm mt-0.5">Analytics and sales performance</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Period:</span>
          <select
            className={`${selectClass} w-40 py-2`}
            value={range}
            onChange={e => setRange(e.target.value)}
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="all">All Time</option>
          </select>
        </div>
      </div>

      {/* KPIs */}
      <SalesSummaryCards orders={orders} range={range} />

      {/* Main charts area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left col: Daily chart + Top products */}
        <div className="lg:col-span-2 space-y-6">
          <DailySalesChart orders={orders} />
          <TopProductsTable orders={orders} products={products} range={range} />
        </div>

        {/* Right col: Payment breakdown */}
        <div className="lg:col-span-1">
          <PaymentBreakdown orders={orders} range={range} />
        </div>
      </div>
    </div>
  );
}
