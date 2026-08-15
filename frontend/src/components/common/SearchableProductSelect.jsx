// ─────────────────────────────────────────────
// SearchableProductSelect — Auto-complete product input
// Props: products, selectedProductId, onSelect, placeholder
// ─────────────────────────────────────────────

import { useState, useRef, useEffect } from 'react';

export function SearchableProductSelect({ products = [], selectedProductId = '', onSelect, placeholder = '🔍 Type product name or SKU...' }) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const selectedProduct = products.find(p => p.id === selectedProductId);

  // Sync query when selectedProduct changes or resets
  useEffect(() => {
    if (selectedProduct) {
      setQuery(selectedProduct.name);
    } else if (!selectedProductId) {
      setQuery('');
    }
  }, [selectedProductId, selectedProduct]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filtered = products.filter(p => {
    const q = query.toLowerCase().trim();
    if (!q) return true;
    return p.name.toLowerCase().includes(q) || (p.sku && p.sku.toLowerCase().includes(q));
  });

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            if (!e.target.value) onSelect('');
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all placeholder:text-slate-400"
        />
        {selectedProduct && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              onSelect('');
              setIsOpen(true);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs bg-slate-200 rounded-full w-5 h-5 flex items-center justify-center font-bold"
          >
            ✕
          </button>
        )}
      </div>

      {/* Auto-complete Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 max-h-56 overflow-y-auto divide-y divide-slate-100">
          {filtered.length === 0 ? (
            <div className="p-3 text-xs text-slate-400 text-center">
              No matching products found
            </div>
          ) : (
            filtered.map(p => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  onSelect(p.id);
                  setQuery(p.name);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-4 py-2.5 hover:bg-blue-50 transition-colors flex items-center justify-between text-xs cursor-pointer ${
                  selectedProductId === p.id ? 'bg-blue-50/80 font-bold' : ''
                }`}
              >
                <div>
                  <div className="font-semibold text-slate-800 text-sm">{p.name}</div>
                  <div className="text-slate-400 font-mono text-[11px]">{p.sku}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-bold text-blue-600">ETB {p.sellingPrice.toLocaleString()}</div>
                  <div className="text-[10px] text-slate-400">{p.unitOfMeasure || 'Pcs'}</div>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
