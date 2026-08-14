// ─────────────────────────────────────────────
// ProductCatalog — Searchable product grid
// Props: products, stockBalances, onAddToCart
// ─────────────────────────────────────────────

import { useState }     from 'react';
import { ProductCard }  from './ProductCard.jsx';

export function ProductCatalog({ products, stockBalances, onAddToCart }) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  // Extract unique categories or tags if available
  const categories = ['ALL', ...new Set(products.map(p => p.unitOfMeasure ? p.unitOfMeasure.toUpperCase() : 'GENERAL'))];

  const filtered = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'ALL' || 
      (p.unitOfMeasure && p.unitOfMeasure.toUpperCase() === selectedCategory);
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="flex flex-col gap-4 overflow-y-auto">
      {/* Search & Category Filter bar */}
      <div className="sticky top-0 bg-slate-50 pb-2 z-[1] space-y-2">
        <input
          id="pos-product-search"
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="🔍  Search by product name or SKU..."
          className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-400"
        />

        {/* Quick Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              {cat === 'ALL' ? '📦 All Items' : `🏷️ ${cat}`}
            </button>
          ))}
        </div>
      </div>

      {/* Product grid */}
      {filtered.length === 0 ? (
        <div className="flex items-center justify-center h-40 text-slate-400 text-sm">
          No products match "{search}"
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3.5">
          {filtered.map(p => (
            <ProductCard
              key={p.id}
              product={p}
              stockBalance={stockBalances[p.id] || 0}
              onAdd={onAddToCart}
            />
          ))}
        </div>
      )}
    </div>
  );
}
