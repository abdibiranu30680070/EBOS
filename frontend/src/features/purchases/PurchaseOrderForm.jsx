// ─────────────────────────────────────────────
// PurchaseOrderForm — Multi-line Odoo-style PO creation
// Props: suppliers, products, user, onSuccess
// ─────────────────────────────────────────────

import { useState } from 'react';
import { db } from '../../lib/db.js';
import { generateId } from '../../lib/generateId.js';
import { syncNow } from '../../lib/syncEngine.js';
import { DEFAULT_BRANCH_ID } from '../../lib/constants.js';
import { FormField, selectClass, inputClass } from '../../components/ui/FormField.jsx';
import { SearchableProductSelect } from '../../components/common/SearchableProductSelect.jsx';

export function PurchaseOrderForm({ suppliers, products, user, onSuccess }) {
  const [supplierId, setSupplierId] = useState('');
  
  // Odoo-style order lines state
  const [lines, setLines] = useState([
    { id: 'line_' + Date.now(), productId: '', quantity: 1, unitCost: 0 }
  ]);
  
  const [error,  setError]  = useState('');
  const [saving, setSaving] = useState(false);

  // ── Line actions ─────────────────────────────
  const addLine = () => {
    setLines(prev => [
      ...prev,
      { id: 'line_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4), productId: '', quantity: 1, unitCost: 0 }
    ]);
  };

  const removeLine = (id) => {
    if (lines.length === 1) {
      // Clear first line instead of removing completely
      setLines([{ id: 'line_' + Date.now(), productId: '', quantity: 1, unitCost: 0 }]);
      return;
    }
    setLines(prev => prev.filter(l => l.id !== id));
  };

  const updateLine = (id, field, value) => {
    setLines(prev => prev.map(line => {
      if (line.id !== id) return line;

      const updated = { ...line, [field]: value };
      
      // Auto-fill cost price if product is selected
      if (field === 'productId') {
        const prod = products.find(p => p.id === value);
        if (prod && prod.costPrice !== undefined) {
          updated.unitCost = prod.costPrice || 0;
        }
      }
      return updated;
    }));
  };

  // Derived totals
  const totalItems = lines.filter(l => l.productId).length;
  const totalQty   = lines.reduce((sum, l) => sum + (Number(l.quantity) || 0), 0);
  const totalCost  = lines.reduce((sum, l) => sum + ((Number(l.quantity) || 0) * (Number(l.unitCost) || 0)), 0);

  const reset = () => {
    setSupplierId('');
    setLines([{ id: 'line_' + Date.now(), productId: '', quantity: 1, unitCost: 0 }]);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!supplierId) {
      setError('Please select a supplier.');
      return;
    }

    const validLines = lines.filter(l => l.productId && Number(l.quantity) > 0);
    if (validLines.length === 0) {
      setError('Please select at least one valid product line with quantity > 0.');
      return;
    }

    setSaving(true);
    try {
      const poId = generateId('po');
      const branchId = user?.branchId || DEFAULT_BRANCH_ID;
      const now = new Date().toISOString();

      await db.transaction('rw', [db.purchaseOrders, db.purchaseOrderItems, db.inventoryMovements], async () => {
        // 1. Create Purchase Order header
        await db.purchaseOrders.add({
          id: poId,
          branchId,
          supplierId,
          totalAmount: totalCost,
          syncStatus: 'PENDING',
          createdAt: now,
        });

        // 2. Add PO items & Inventory Stock-In movements for each line
        const poItems = [];
        const invMvs  = [];

        for (const line of validLines) {
          const qty = Number(line.quantity);
          const cost = Number(line.unitCost) || 0;

          poItems.push({
            id: generateId('poitem'),
            orderId: poId,
            productId: line.productId,
            quantity: qty,
            unitCost: cost,
            totalCost: qty * cost,
          });

          invMvs.push({
            id: generateId('mv'),
            branchId,
            productId: line.productId,
            quantityDelta: qty, // Positive delta for stock-in
            type: 'STOCK_IN',
            notes: `PO #${poId.substring(0, 8)} receipt`,
            syncStatus: 'PENDING',
            createdAt: now,
          });
        }

        await db.purchaseOrderItems.bulkAdd(poItems);
        await db.inventoryMovements.bulkAdd(invMvs);
      });

      syncNow();
      reset();
      onSuccess?.();
    } catch (err) {
      setError(`Failed to process purchase order: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden h-full flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 shrink-0 flex items-center justify-between">
        <div>
          <h3 className="font-bold text-slate-800 text-base">New Purchase Order</h3>
          <p className="text-xs text-slate-500 mt-0.5">Odoo-style multi-product receiving & stock increase</p>
        </div>
        <div className="text-right">
          <span className="text-xs text-slate-500 block">Total Order Cost</span>
          <span className="text-lg font-extrabold text-blue-700">ETB {totalCost.toLocaleString()}</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto flex-1 flex flex-col">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium">{error}</div>
        )}

        {/* Supplier selection */}
        <FormField label="Supplier" required>
          <select
            className={selectClass}
            value={supplierId}
            onChange={e => setSupplierId(e.target.value)}
            required
          >
            <option value="">— Select Supplier —</option>
            {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </FormField>

        {/* Order Lines Table (Odoo Style) */}
        <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50/50 flex-1 flex flex-col">
          <div className="px-4 py-2.5 bg-slate-100/80 border-b border-slate-200 flex items-center justify-between text-xs font-bold text-slate-700 uppercase tracking-wider">
            <span>Order Lines</span>
            <span className="text-slate-500 font-semibold">{totalItems} line{totalItems !== 1 ? 's' : ''} added</span>
          </div>

          <div className="divide-y divide-slate-200 overflow-y-auto max-h-80">
            {lines.map((line, index) => {
              const subtotal = (Number(line.quantity) || 0) * (Number(line.unitCost) || 0);

              return (
                <div key={line.id} className="p-3 bg-white flex flex-col sm:flex-row items-center gap-3 hover:bg-slate-50/80 transition-colors">
                  {/* Line index badge */}
                  <span className="text-xs font-extrabold text-slate-400 w-6 shrink-0 text-center">{index + 1}</span>

                  {/* Product selector */}
                  <div className="flex-1 min-w-0 w-full">
                    <SearchableProductSelect
                      products={products}
                      selectedProductId={line.productId}
                      onSelect={(prodId) => updateLine(line.id, 'productId', prodId)}
                      placeholder="🔍 Search & select product..."
                    />
                  </div>

                  {/* Quantity input */}
                  <div className="w-full sm:w-24 shrink-0">
                    <input
                      type="number"
                      min="1"
                      step="any"
                      placeholder="Qty"
                      value={line.quantity}
                      onChange={(e) => updateLine(line.id, 'quantity', Number(e.target.value))}
                      onClick={(e) => e.target.select()}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 text-center focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  {/* Unit cost input */}
                  <div className="w-full sm:w-32 shrink-0">
                    <div className="relative">
                      <span className="absolute left-2.5 top-2 text-[10px] text-slate-400 font-bold">ETB</span>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        placeholder="Cost/unit"
                        value={line.unitCost}
                        onChange={(e) => updateLine(line.id, 'unitCost', Number(e.target.value))}
                        onClick={(e) => e.target.select()}
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 text-right focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Line subtotal */}
                  <div className="w-full sm:w-28 text-right font-extrabold text-xs text-slate-800 shrink-0">
                    ETB {subtotal.toLocaleString()}
                  </div>

                  {/* Remove line button */}
                  <button
                    type="button"
                    onClick={() => removeLine(line.id)}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors shrink-0 cursor-pointer"
                    title="Remove line"
                  >
                    🗑️
                  </button>
                </div>
              );
            })}
          </div>

          {/* Odoo Style "Add a line" Action Bar */}
          <div className="p-3 bg-slate-100/50 border-t border-slate-200">
            <button
              type="button"
              onClick={addLine}
              className="w-full py-2.5 px-4 bg-white hover:bg-blue-50/50 border-2 border-dashed border-blue-300 hover:border-blue-500 text-blue-600 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs active:scale-[0.99]"
            >
              <span className="text-sm font-extrabold">➕</span>
              <span>Add a line</span>
            </button>
          </div>
        </div>

        {/* Footer actions */}
        <div className="pt-2 mt-auto flex items-center justify-between gap-4">
          <div className="text-xs text-slate-500">
            Total Qty: <strong className="text-slate-800">{totalQty} units</strong>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-extrabold text-sm rounded-xl transition-colors cursor-pointer shadow-md"
          >
            {saving ? 'Saving PO…' : '📦 Confirm Purchase Order'}
          </button>
        </div>
      </form>
    </div>
  );
}
