// ─────────────────────────────────────────────
// ProductCard — Single product tile in catalog
// Props: product, stockBalance, onAdd
// ─────────────────────────────────────────────

export function ProductCard({ product, stockBalance, onAdd }) {
  const isLow     = stockBalance < product.minStockLevel;
  const isOutOfStock = stockBalance <= 0;

  return (
    <button
      onClick={() => !isOutOfStock && onAdd(product)}
      disabled={isOutOfStock}
      className={`
        w-full text-left bg-white border rounded-xl p-4 flex flex-col justify-between h-36
        transition-all cursor-pointer
        ${isOutOfStock
          ? 'opacity-50 cursor-not-allowed border-slate-200'
          : 'border-slate-200 hover:border-blue-400 hover:shadow-md active:scale-95'
        }
      `}
    >
      <div>
        <div className="font-bold text-slate-800 text-sm line-clamp-2 leading-snug">{product.name}</div>
        <div className="text-xs text-slate-400 font-mono mt-0.5">{product.sku}</div>
      </div>

      <div className="mt-3 pt-2 border-t border-slate-100 flex justify-between items-end">
        <div className="font-extrabold text-blue-600 text-sm">ETB {product.sellingPrice.toLocaleString()}</div>
        <div className={`text-xs font-semibold ${isOutOfStock ? 'text-rose-500' : isLow ? 'text-amber-500' : 'text-slate-400'}`}>
          {isOutOfStock ? 'Out of stock' : `${stockBalance} ${product.unitOfMeasure}`}
        </div>
      </div>
    </button>
  );
}
