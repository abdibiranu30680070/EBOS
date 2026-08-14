// ─────────────────────────────────────────────
// ProductsPage — Product catalogue management
// Props: products (all, incl inactive), stockBalances, user
// ─────────────────────────────────────────────

import { useState }         from 'react';
import { useLiveQuery }     from 'dexie-react-hooks';
import { db }               from '../../lib/db.js';
import { ProductsTable }    from './ProductsTable.jsx';
import { AddProductModal }  from './AddProductModal.jsx';
import { useStockBalances } from '../../hooks/useStockBalances.js';

export function ProductsPage({ user }) {
  const [showAdd, setShowAdd] = useState(false);

  // Include ALL products (active + inactive) for management
  const allProducts   = useLiveQuery(() => db.products.toArray()) || [];
  const { stockBalances } = useStockBalances();

  const activeCount   = allProducts.filter(p => p.isActive === 1).length;
  const lowStockCount = allProducts.filter(p => (stockBalances[p.id] || 0) < p.minStockLevel && p.isActive === 1).length;

  return (
    <>
      <div className="space-y-6">
        {/* Page header */}
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Products</h1>
            <p className="text-slate-400 text-sm mt-0.5">
              {activeCount} active &nbsp;·&nbsp;
              <span className={lowStockCount > 0 ? 'text-rose-500 font-semibold' : ''}>
                {lowStockCount} low stock
              </span>
            </p>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-4 py-2.5 rounded-xl cursor-pointer transition-colors"
          >
            + Add Product
          </button>
        </div>

        {/* Summary strip */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total Products',   value: allProducts.length,  color: 'text-slate-800' },
            { label: 'Active',           value: activeCount,          color: 'text-emerald-600' },
            { label: 'Low Stock',        value: lowStockCount,        color: lowStockCount > 0 ? 'text-rose-600' : 'text-slate-800' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{label}</div>
              <div className={`text-2xl font-extrabold ${color}`}>{value}</div>
            </div>
          ))}
        </div>

        <ProductsTable
          products={allProducts}
          stockBalances={stockBalances}
          onAdd={() => setShowAdd(true)}
        />
      </div>

      <AddProductModal
        isOpen={showAdd}
        onClose={() => setShowAdd(false)}
        user={user}
        onSuccess={() => setShowAdd(false)}
      />
    </>
  );
}
