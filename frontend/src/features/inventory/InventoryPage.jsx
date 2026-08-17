// ─────────────────────────────────────────────
// InventoryPage — Inventory management screen
// Composes StockLedgerTable + MovementForm
// Props: products, stockBalances, user
// ─────────────────────────────────────────────

import { StockLedgerTable } from './StockLedgerTable.jsx';
import { MovementForm }     from './MovementForm.jsx';

export function InventoryPage({ products, stockBalances, user }) {
  return (
    <div className="space-y-4 sm:space-y-2">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-800 tracking-tight">Inventory</h1>
        <p className="text-slate-400 text-xs sm:text-sm mt-0.5">Manage stock levels and log movements</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6 items-start">
        <div className="xl:col-span-2 min-w-0">
          <StockLedgerTable products={products} stockBalances={stockBalances} />
        </div>

        <div className="xl:col-span-1 min-w-0">
          <MovementForm products={products} user={user} />
        </div>
      </div>
    </div>
  );
}
