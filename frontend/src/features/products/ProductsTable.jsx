// ─────────────────────────────────────────────
// ProductsTable — All products with management
// Props: products, stockBalances, onAdd, onToggleActive
// ─────────────────────────────────────────────

import { useState }   from 'react';
import { db }         from '../../lib/db.js';
import { SyncBadge }  from '../../components/ui/Badge.jsx';

const HEADERS = ['SKU', 'Product Name', 'Unit', 'Cost', 'Price', 'Margin', 'Min Stock', 'Balance', 'Status'];

export function ProductsTable({ products, stockBalances, onAdd }) {
  const [search, setSearch] = useState('');

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.sku.toLowerCase().includes(search.toLowerCase())
  );

  const handleToggle = async (product) => {
    await db.products.update(product.id, { isActive: product.isActive === 1 ? 0 : 1 });
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      {/* Header row */}
      <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-4">
        <div className="flex-1">
          <h3 className="font-bold text-slate-800">Product Catalogue</h3>
          <p className="text-xs text-slate-400 mt-0.5">{products.length} products</p>
        </div>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search…"
          className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-48"
        />
        <button
          onClick={onAdd}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-4 py-2 rounded-xl cursor-pointer transition-colors shrink-0"
        >
          + Add Product
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              {HEADERS.map(h => (
                <th key={h} className="py-3 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                  {h}
                </th>
              ))}
              <th className="py-3 px-4" />
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={HEADERS.length + 1} className="py-12 text-center text-slate-400 text-sm">
                  {search ? `No products match "${search}"` : 'No products yet. Add your first product →'}
                </td>
              </tr>
            ) : filtered.map(p => {
              const balance = stockBalances[p.id] || 0;
              const isLow   = balance < p.minStockLevel;
              const margin  = p.costPrice > 0
                ? Math.round(((p.sellingPrice - p.costPrice) / p.sellingPrice) * 100)
                : null;
              const inactive = p.isActive !== 1;

              return (
                <tr key={p.id} className={`border-b border-slate-100 transition-colors ${inactive ? 'opacity-50 bg-slate-50' : 'hover:bg-slate-50/50'}`}>
                  <td className="py-3 px-4 font-mono text-slate-400 text-xs">{p.sku}</td>
                  <td className="py-3 px-4 font-semibold text-slate-800 max-w-[180px]">
                    <div className="truncate">{p.name}</div>
                  </td>
                  <td className="py-3 px-4 text-slate-500">{p.unitOfMeasure}</td>
                  <td className="py-3 px-4 text-slate-500">ETB {Number(p.costPrice).toLocaleString()}</td>
                  <td className="py-3 px-4 font-bold text-blue-600">ETB {Number(p.sellingPrice).toLocaleString()}</td>
                  <td className="py-3 px-4">
                    {margin !== null ? (
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${margin >= 20 ? 'bg-emerald-50 text-emerald-700' : margin >= 10 ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'}`}>
                        {margin}%
                      </span>
                    ) : <span className="text-slate-300">—</span>}
                  </td>
                  <td className="py-3 px-4 text-slate-500">{p.minStockLevel}</td>
                  <td className={`py-3 px-4 font-bold ${isLow ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {balance} {p.unitOfMeasure}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${inactive ? 'bg-slate-100 text-slate-500' : 'bg-emerald-50 text-emerald-700'}`}>
                      {inactive ? 'Inactive' : 'Active'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => handleToggle(p)}
                      className="text-xs text-slate-400 hover:text-slate-700 cursor-pointer transition-colors underline underline-offset-2"
                    >
                      {inactive ? 'Activate' : 'Deactivate'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
