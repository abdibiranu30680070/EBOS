// ─────────────────────────────────────────────
// ProductsPage — Product catalogue management
// Props: products (all, incl inactive), stockBalances, user
// ─────────────────────────────────────────────

import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../lib/db.js';
import { syncNow } from '../../lib/syncEngine.js';
import { ProductsTable } from './ProductsTable.jsx';
import { AddProductModal } from './AddProductModal.jsx';
import { useStockBalances } from '../../hooks/useStockBalances.js';

export function ProductsPage({ user }) {
  const [showAdd, setShowAdd] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const allProducts = useLiveQuery(() => db.products.toArray()) || [];
  const { stockBalances } = useStockBalances();

  const activeCount = allProducts.filter(p => p.isActive === 1 || p.isActive === true).length;
  const lowStockCount = allProducts.filter(p => (p.isActive === 1 || p.isActive === true) && (stockBalances[p.id] || 0) < p.minStockLevel).length;

  const openAdd = () => {
    setEditingProduct(null);
    setShowAdd(true);
  };

  const openEdit = (product) => {
    setEditingProduct(product);
    setShowAdd(true);
  };

  const handleDelete = async (product) => {
    if (!window.confirm(`Delete ${product.name}? This will mark the product inactive and sync the change.`)) {
      return;
    }

    await db.products.update(product.id, {
      isActive: 0,
      syncStatus: 'PENDING',
    });
    await syncNow();
  };

  return (
    <>
      <div className="space-y-6">
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
            onClick={openAdd}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-4 py-2.5 rounded-xl cursor-pointer transition-colors"
          >
            + Add Product
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: 'Total Products', value: allProducts.length, color: 'text-slate-800' },
            { label: 'Active', value: activeCount, color: 'text-emerald-600' },
            { label: 'Low Stock', value: lowStockCount, color: lowStockCount > 0 ? 'text-rose-600' : 'text-slate-800' },
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
          onAdd={openAdd}
          onEdit={openEdit}
          onDelete={handleDelete}
        />
      </div>

      <AddProductModal
        isOpen={showAdd}
        onClose={() => {
          setShowAdd(false);
          setEditingProduct(null);
        }}
        user={user}
        product={editingProduct}
        onSuccess={() => {
          setShowAdd(false);
          setEditingProduct(null);
        }}
      />
    </>
  );
}
