// ─────────────────────────────────────────────
// CartItem — Single row in the cart panel
// Props: item { product, quantity }, onIncrement, onDecrement
// ─────────────────────────────────────────────

export function CartItem({ item, onIncrement, onDecrement }) {
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

      {/* Qty controls */}
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={() => onDecrement(product.id)}
          className="w-7 h-7 flex items-center justify-center bg-slate-100 hover:bg-slate-200 rounded text-slate-700 font-bold text-base transition-colors cursor-pointer"
          aria-label="Decrease quantity"
        >
          −
        </button>
        <span className="w-6 text-center text-sm font-bold text-slate-800">{quantity}</span>
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
