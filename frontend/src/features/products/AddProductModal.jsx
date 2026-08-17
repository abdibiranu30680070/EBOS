// ─────────────────────────────────────────────
// AddProductModal — Create or update a product locally
// Props: isOpen, onClose, user, onSuccess, product
// ─────────────────────────────────────────────

import { useEffect, useState } from 'react';
import { Modal } from '../../components/ui/Modal.jsx';
import { FormField, inputClass, selectClass } from '../../components/ui/FormField.jsx';
import { db } from '../../lib/db.js';
import { generateId } from '../../lib/generateId.js';
import { syncNow } from '../../lib/syncEngine.js';
import { UNIT_OF_MEASURES, DEFAULT_BUSINESS_ID } from '../../lib/constants.js';

const emptyForm = {
  sku: '', name: '', costPrice: '', sellingPrice: '',
  minStockLevel: 5, unitOfMeasure: 'pcs',
};

export function AddProductModal({ isOpen, onClose, user, onSuccess, product = null }) {
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    if (product) {
      setForm({
        sku: product.sku || '',
        name: product.name || '',
        costPrice: String(product.costPrice ?? ''),
        sellingPrice: String(product.sellingPrice ?? ''),
        minStockLevel: Number(product.minStockLevel ?? 0),
        unitOfMeasure: product.unitOfMeasure || 'pcs',
      });
    } else {
      setForm(emptyForm);
    }
    setError('');
  }, [isOpen, product]);

  const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));

  const handleClose = () => {
    setForm(emptyForm);
    setError('');
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.name.trim()) {
      setError('Product name is required.');
      return;
    }
    if (!form.sellingPrice || Number(form.sellingPrice) <= 0) {
      setError('Selling price must be greater than zero.');
      return;
    }

    setSaving(true);
    try {
      const id = product?.id || generateId('prod');
      const autoSku = form.sku.trim() || `SKU-${id.substring(5, 11).toUpperCase()}`;
      const payload = {
        id,
        businessId: user?.businessId || DEFAULT_BUSINESS_ID,
        sku: autoSku,
        name: form.name.trim(),
        costPrice: Number(form.costPrice) || 0,
        sellingPrice: Number(form.sellingPrice),
        minStockLevel: Number(form.minStockLevel) || 0,
        unitOfMeasure: form.unitOfMeasure,
        isActive: product ? (product.isActive === 1 || product.isActive === true ? 1 : 0) : 1,
        syncStatus: 'PENDING',
      };

      if (product) {
        await db.products.update(product.id, payload);
      } else {
        await db.products.add(payload);
      }

      await syncNow();
      handleClose();
      onSuccess?.(payload);
    } catch (err) {
      setError(`Could not save product: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={product ? 'Edit Product' : 'Add New Product'} size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">{error}</div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Product Name" required>
            <input id="prod-name" type="text" className={inputClass} value={form.name}
              onChange={set('name')} placeholder="e.g. Injera 50pcs" required />
          </FormField>
          <FormField label="SKU / Barcode">
            <input id="prod-sku" type="text" className={inputClass} value={form.sku}
              onChange={set('sku')} placeholder="Auto-generated if blank" />
          </FormField>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Cost Price (ETB)">
            <input id="prod-cost" type="number" min="0" step="0.01" className={inputClass}
              value={form.costPrice} onChange={set('costPrice')} placeholder="0.00" />
          </FormField>
          <FormField label="Selling Price (ETB)" required>
            <input id="prod-price" type="number" min="0.01" step="0.01" className={inputClass}
              value={form.sellingPrice} onChange={set('sellingPrice')} placeholder="0.00" required />
          </FormField>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Unit of Measure">
            <select id="prod-uom" className={selectClass} value={form.unitOfMeasure} onChange={set('unitOfMeasure')}>
              {UNIT_OF_MEASURES.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </FormField>
          <FormField label="Min Stock Alert">
            <input id="prod-minstock" type="number" min="0" className={inputClass}
              value={form.minStockLevel} onChange={set('minStockLevel')} />
          </FormField>
        </div>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={handleClose}
            className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm py-2.5 rounded-xl cursor-pointer transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={saving}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-sm py-2.5 rounded-xl cursor-pointer transition-colors">
            {saving ? 'Saving…' : product ? '💾 Update Product' : '🏷️ Save Product'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
