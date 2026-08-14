// ─────────────────────────────────────────────
// TopProductsTable — Best selling products
// Props: orders (with items from DB), products, range
// ─────────────────────────────────────────────

import { useLiveQuery } from 'dexie-react-hooks';
import { db }           from '../../lib/db.js';
import { filterByRange } from './SalesSummaryCards.jsx';

export function TopProductsTable({ orders, products, range }) {
  // Get all order items for filtered orders
  const filteredOrderIds = new Set(filterByRange(orders, range).map(o => o.id));

  const items = useLiveQuery(async () => {
    if (filteredOrderIds.size === 0) return [];
    const allItems = await db.salesOrderItems.toArray();
    return allItems.filter(i => filteredOrderIds.has(i.orderId));
  }, [orders, range]) || [];

  // Aggregate by product
  const productMap = {};
  for (const item of items) {
    if (!productMap[item.productId]) {
      productMap[item.productId] = { qty: 0, revenue: 0 };
    }
    productMap[item.productId].qty     += item.quantity;
    productMap[item.productId].revenue += item.totalPrice;
  }

  const productLookup = Object.fromEntries(products.map(p => [p.id, p]));

  const sorted = Object.entries(productMap)
    .map(([productId, stats]) => ({
      product: productLookup[productId],
      ...stats,
    }))
    .filter(r => r.product)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);

  const maxRevenue = sorted[0]?.revenue || 1;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100">
        <h3 className="font-bold text-slate-800">Top 10 Products by Revenue</h3>
        <p className="text-xs text-slate-400 mt-0.5">Based on completed sales in period</p>
      </div>

      {sorted.length === 0 ? (
        <p className="text-center text-slate-400 text-sm py-10">No sales data for this period.</p>
      ) : (
        <div className="divide-y divide-slate-100">
          {sorted.map(({ product, qty, revenue }, idx) => {
            const barPct = Math.round((revenue / maxRevenue) * 100);
            return (
              <div key={product.id} className="px-6 py-3.5 hover:bg-slate-50/50 transition-colors">
                <div className="flex items-center gap-4">
                  {/* Rank */}
                  <span className={`w-7 h-7 shrink-0 flex items-center justify-center rounded-full text-xs font-extrabold ${
                    idx === 0 ? 'bg-amber-100 text-amber-700' :
                    idx === 1 ? 'bg-slate-200 text-slate-600' :
                    idx === 2 ? 'bg-orange-100 text-orange-700' :
                    'bg-slate-100 text-slate-500'
                  }`}>
                    {idx + 1}
                  </span>

                  {/* Product info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between mb-1">
                      <span className="font-semibold text-slate-800 text-sm truncate max-w-[200px]">{product.name}</span>
                      <span className="font-bold text-slate-800 text-sm ml-2 shrink-0">ETB {revenue.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-slate-100 rounded-full h-1.5">
                        <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${barPct}%` }} />
                      </div>
                      <span className="text-xs text-slate-400 shrink-0">{qty} {product.unitOfMeasure} sold</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
