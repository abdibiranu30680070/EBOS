// ─────────────────────────────────────────────
// InventoryPage — Inventory management screen
// Composes StockLedgerTable + MovementForm
// Props: products, stockBalances, user
// ─────────────────────────────────────────────

import { StockLedgerTable } from './StockLedgerTable.jsx';
import { MovementForm }     from './MovementForm.jsx';

export function InventoryPage({ products, stockBalances, user }) {
  return (
    <div className="space-y-2">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Inventory</h1>
        <p className="text-slate-400 text-sm mt-0.5">Manage stock levels and log movements</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        {/* Stock table — takes 2/3 of space */}
        <div className="xl:col-span-2">
          <StockLedgerTable products={products} stockBalances={stockBalances} />
        </div>

        {/* Movement form — 1/3 */}
        <div className="xl:col-span-1">
          <MovementForm products={products} user={user} />
        </div>
      </div>
    </div>
  );
}
