// ─────────────────────────────────────────────
// LowStockTable — Products below minimum level
// Props: products, stockBalances
// ─────────────────────────────────────────────

const HEADERS = ['Product', 'SKU', 'Current Stock', 'Minimum Level'];

export function LowStockTable({ products, stockBalances }) {
  const lowItems = products.filter(p => (stockBalances[p.id] || 0) < p.minStockLevel);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <h3 className="font-bold text-slate-800">Stock Replenishment Alerts</h3>
        {lowItems.length > 0 && (
          <span className="text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-1 rounded-full">
            {lowItems.length} item{lowItems.length !== 1 ? 's' : ''} low
          </span>
        )}
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
            {lowItems.length === 0 ? (
              <tr>
                <td colSpan={HEADERS.length} className="py-10 text-center text-emerald-600 font-semibold text-sm">
                  ✅ All inventory levels are healthy.
                </td>
              </tr>
            ) : (
              lowItems.map(p => {
                const bal = stockBalances[p.id] || 0;
                return (
                  <tr key={p.id} className="border-b border-slate-100 hover:bg-rose-50/30 transition-colors">
                    <td className="py-3.5 px-5 font-semibold text-slate-800">{p.name}</td>
                    <td className="py-3.5 px-5 font-mono text-slate-400 text-xs">{p.sku}</td>
                    <td className="py-3.5 px-5 font-extrabold text-rose-600">
                      {bal} <span className="font-normal text-slate-400">{p.unitOfMeasure}</span>
                    </td>
                    <td className="py-3.5 px-5 text-slate-500">
                      {p.minStockLevel} {p.unitOfMeasure}
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
