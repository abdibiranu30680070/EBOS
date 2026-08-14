// ─────────────────────────────────────────────
// StockLedgerTable — All products + live stock
// Props: products, stockBalances
// ─────────────────────────────────────────────

const HEADERS = ['SKU', 'Product Name', 'Cost Price', 'Selling Price', 'Current Balance'];

export function StockLedgerTable({ products, stockBalances }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100">
        <h3 className="font-bold text-slate-800">Stock Ledger Balances</h3>
        <p className="text-xs text-slate-400 mt-0.5">Calculated live from additive movement ledger</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              {HEADERS.map(h => (
                <th key={h} className="py-3 px-5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr>
                <td colSpan={HEADERS.length} className="py-10 text-center text-slate-400 text-sm">
                  No products found. Products sync from the server.
                </td>
              </tr>
            ) : (
              products.map(p => {
                const balance = stockBalances[p.id] || 0;
                const isLow   = balance < p.minStockLevel;
                return (
                  <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-5 font-mono text-slate-400 text-xs">{p.sku}</td>
                    <td className="py-3.5 px-5 font-semibold text-slate-800">{p.name}</td>
                    <td className="py-3.5 px-5 text-slate-500">ETB {p.costPrice.toLocaleString()}</td>
                    <td className="py-3.5 px-5 text-slate-500">ETB {p.sellingPrice.toLocaleString()}</td>
                    <td className={`py-3.5 px-5 font-extrabold ${isLow ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {balance}
                      <span className="font-normal text-slate-400 ml-1 text-xs">{p.unitOfMeasure}</span>
                      {isLow && (
                        <span className="ml-2 text-xs bg-rose-50 text-rose-600 border border-rose-200 px-1.5 py-0.5 rounded font-semibold">
                          Low
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
