// ─────────────────────────────────────────────
// MovementForm — Stock In / Out / Adjustment
// Props: products, user, onSuccess
// ─────────────────────────────────────────────

import { useState }                          from 'react';
import { db }                                from '../../lib/db.js';
import { generateId }                        from '../../lib/generateId.js';
import { syncNow }                           from '../../lib/syncEngine.js';
import { MOVEMENT_TYPES, DEFAULT_BRANCH_ID } from '../../lib/constants.js';
import { FormField, selectClass, inputClass, textareaClass } from '../../components/ui/FormField.jsx';
import { SearchableProductSelect }           from '../../components/common/SearchableProductSelect.jsx';

export function MovementForm({ products, user, onSuccess }) {
  const [productId, setProductId] = useState('');
  const [qty,       setQty]       = useState(10);
  const [type,      setType]      = useState('STOCK_IN');
  const [notes,     setNotes]     = useState('');
  const [error,     setError]     = useState('');
  const [saving,    setSaving]    = useState(false);

  const reset = () => { setProductId(''); setQty(10); setNotes(''); setError(''); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!productId) { setError('Please select a product.'); return; }
    if (qty <= 0)   { setError('Quantity must be greater than zero.'); return; }

    setSaving(true);
    try {
      const delta = type === 'STOCK_IN' ? Math.abs(qty) : -Math.abs(qty);

      await db.inventoryMovements.add({
        id:            generateId('mv'),
        branchId:      user?.branchId || DEFAULT_BRANCH_ID,
        productId,
        quantityDelta: delta,
        type,
        notes,
        createdAt:     new Date().toISOString(),
        syncStatus:    'PENDING',
      });

      reset();
      syncNow();
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(`Failed to log movement: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100">
        <h3 className="font-bold text-slate-800">Register Movement</h3>
        <p className="text-xs text-slate-400 mt-0.5">Log a stock receipt, write-off, or count correction</p>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">{error}</div>
        )}

        <FormField label="Product" required>
          <SearchableProductSelect
            products={products}
            selectedProductId={productId}
            onSelect={setProductId}
            placeholder="🔍 Type product name or SKU..."
          />
        </FormField>

        <FormField label="Movement Type" required>
          <select
            id="inv-movement-type"
            className={selectClass}
            value={type}
            onChange={e => setType(e.target.value)}
          >
            {MOVEMENT_TYPES.map(m => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </FormField>

        <FormField label="Quantity" required>
          <input
            id="inv-quantity"
            type="number"
            min="1"
            className={inputClass}
            value={qty}
            onChange={e => setQty(Number(e.target.value))}
            required
          />
        </FormField>

        <FormField label="Notes / GRN Reference">
          <textarea
            id="inv-notes"
            className={textareaClass}
            rows={3}
            placeholder="Delivery note number, reason for write-off, etc."
            value={notes}
            onChange={e => setNotes(e.target.value)}
          />
        </FormField>

        <button
          id="inv-submit-btn"
          type="submit"
          disabled={saving}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-sm py-3 rounded-xl transition-colors cursor-pointer"
        >
          {saving ? 'Saving…' : '📦 Log Movement'}
        </button>
      </form>
    </div>
  );
}
