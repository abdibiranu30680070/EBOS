// ─────────────────────────────────────────────
// ItemizedSalesTable — Direct quantity report per product
// Props: orders, products, range
// ─────────────────────────────────────────────

import { useLiveQuery } from 'dexie-react-hooks';
import { db }           from '../../lib/db.js';
import { filterByRange } from './SalesSummaryCards.jsx';

export function ItemizedSalesTable({ orders, products, range }) {
  const filteredOrderIds = new Set(filterByRange(orders, range).map(o => o.id));

  const items = useLiveQuery(async () => {
    if (filteredOrderIds.size === 0) return [];
    const allItems = await db.salesOrderItems.toArray();
    return allItems.filter(i => filteredOrderIds.has(i.orderId));
  }, [orders, range]) || [];

  // Aggregate stats per product
  const productStats = {};
  for (const item of items) {
    if (!productStats[item.productId]) {
      productStats[item.productId] = { totalQty: 0, totalRevenue: 0, orderCount: 0 };
    }
    productStats[item.productId].totalQty += item.quantity;
    productStats[item.productId].totalRevenue += item.totalPrice;
    productStats[item.productId].orderCount += 1;
  }

  const productLookup = Object.fromEntries(products.map(p => [p.id, p]));

  const rows = Object.entries(productStats)
    .map(([productId, stats]) => ({
      product: productLookup[productId],
      ...stats,
    }))
    .filter(r => r.product)
    .sort((a, b) => b.totalQty - a.totalQty);

  const grandTotalQty = rows.reduce((s, r) => s + r.totalQty, 0);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
        <div>
          <h3 className="font-bold text-slate-800 text-base">📦 Direct Product Quantity Report</h3>
          <p className="text-xs text-slate-400 mt-0.5">Exact quantities sold per product for selected period</p>
        </div>
        {grandTotalQty > 0 && (
          <div className="bg-blue-50 border border-blue-200 text-blue-800 text-xs font-bold px-3 py-1.5 rounded-lg">
            Total Qty Sold: {grandTotalQty.toLocaleString()} units
          </div>
        )}
      </div>

      {rows.length === 0 ? (
        <div className="text-center text-slate-400 text-sm py-10">No product quantity data for this period.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <th className="px-6 py-3">Product Name</th>
                <th className="px-4 py-3">SKU</th>
                <th className="px-4 py-3 text-right">Quantity Sold</th>
                <th className="px-4 py-3 text-right">Unit Price</th>
                <th className="px-6 py-3 text-right">Total Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map(({ product, totalQty, totalRevenue }) => {
                const avgPrice = totalQty > 0 ? totalRevenue / totalQty : product.sellingPrice;
                return (
                  <tr key={product.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-3.5 font-semibold text-slate-800">
                      {product.name}
                    </td>
                    <td className="px-4 py-3.5 font-mono text-xs text-slate-500">
                      {product.sku}
                    </td>
                    <td className="px-4 py-3.5 text-right font-extrabold text-blue-600 bg-blue-50/30">
                      {totalQty.toLocaleString()} {product.unitOfMeasure || 'Pcs'}
                    </td>
                    <td className="px-4 py-3.5 text-right text-slate-600">
                      ETB {avgPrice.toLocaleString()}
                    </td>
                    <td className="px-6 py-3.5 text-right font-bold text-slate-900">
                      ETB {totalRevenue.toLocaleString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
