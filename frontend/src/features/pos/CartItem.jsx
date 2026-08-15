// ─────────────────────────────────────────────
// CartItem — Single row in the cart panel
// Props: item { product, quantity }, onIncrement, onDecrement, onSetQty
// ─────────────────────────────────────────────

export function CartItem({ item, onIncrement, onDecrement, onSetQty }) {
  const { product, quantity } = item;
  const lineTotal = product.sellingPrice * quantity;

  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-slate-100 last:border-0">
      {/* Product info */}
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-slate-800 text-sm line-clamp-1">{product.name}</div>
        <div className="text-xs text-slate-400 mt-0.5">
          ETB {product.sellingPrice.toLocaleString()} × {quantity}
        </div>
      </div>

      {/* Qty controls with direct numerical input */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={() => onDecrement(product.id)}
          className="w-7 h-7 flex items-center justify-center bg-slate-100 hover:bg-slate-200 rounded text-slate-700 font-bold text-base transition-colors cursor-pointer"
          aria-label="Decrease quantity"
        >
          −
        </button>
        <input
          type="number"
          min="1"
          step="any"
          value={quantity}
          onChange={(e) => onSetQty?.(product.id, e.target.value)}
          onClick={(e) => e.target.select()}
          className="w-14 text-center text-sm font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded py-1 px-1 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />
        <button
          onClick={() => onIncrement(product)}
          className="w-7 h-7 flex items-center justify-center bg-blue-100 hover:bg-blue-200 rounded text-blue-700 font-bold text-base transition-colors cursor-pointer"
          aria-label="Increase quantity"
        >
          +
        </button>
      </div>

      {/* Line total */}
      <div className="text-sm font-bold text-slate-800 w-20 text-right shrink-0">
        ETB {lineTotal.toLocaleString()}
      </div>
    </div>
  );
}
