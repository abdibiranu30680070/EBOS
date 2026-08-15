// ─────────────────────────────────────────────
// PurchaseOrderForm — Create a PO & log stock
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
  const [productId,  setProductId]  = useState('');
  const [qty,        setQty]        = useState(10);
  const [costPrice,  setCostPrice]  = useState(0);
  
  const [error,   setError]   = useState('');
  const [saving,  setSaving]  = useState(false);

  const reset = () => {
    setSupplierId(''); setProductId(''); setQty(10); setCostPrice(0); setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!supplierId || !productId || qty <= 0) {
      setError('Please select supplier, product, and valid quantity.');
      return;
    }

    setSaving(true);
    try {
      const poId = generateId('po');
      const branchId = user?.branchId || DEFAULT_BRANCH_ID;
      const now = new Date().toISOString();

      await db.transaction('rw', [db.purchaseOrders, db.purchaseOrderItems, db.inventoryMovements], async () => {
        // 1. Create Purchase Order
        await db.purchaseOrders.add({
          id: poId,
          branchId,
          supplierId,
          syncStatus: 'PENDING',
          createdAt: now,
        });

        // 2. Add PO Item
        await db.purchaseOrderItems.add({
          id: generateId('poitem'),
          orderId: poId,
          productId,
        });

        // 3. Log Stock In
        await db.inventoryMovements.add({
          id: generateId('mv'),
          branchId,
          productId,
          quantityDelta: qty, // Positive delta for stock in
          type: 'STOCK_IN',
          notes: `Auto-generated from PO #${poId.substring(0,8)}`,
          syncStatus: 'PENDING',
          createdAt: now,
        });
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
      <div className="px-6 py-4 border-b border-slate-100 shrink-0">
        <h3 className="font-bold text-slate-800">New Purchase Order</h3>
        <p className="text-xs text-slate-400 mt-0.5">Receive goods and auto-increase stock</p>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">{error}</div>
        )}

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

        <FormField label="Product" required>
          <SearchableProductSelect
            products={products}
            selectedProductId={productId}
            onSelect={setProductId}
            placeholder="🔍 Type product name or SKU..."
          />
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Quantity Received" required>
            <input
              type="number"
              min="1"
              className={inputClass}
              value={qty}
              onChange={e => setQty(Number(e.target.value))}
              required
            />
          </FormField>

          <FormField label="Unit Cost (ETB)">
            <input
              type="number"
              min="0"
              className={inputClass}
              value={costPrice}
              onChange={e => setCostPrice(Number(e.target.value))}
            />
          </FormField>
        </div>

        <div className="pt-4 mt-auto">
          <button
            type="submit"
            disabled={saving}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-sm py-3.5 rounded-xl transition-colors"
          >
            {saving ? 'Processing…' : '📦 Confirm Receipt & Add Stock'}
          </button>
        </div>
      </form>
    </div>
  );
}
