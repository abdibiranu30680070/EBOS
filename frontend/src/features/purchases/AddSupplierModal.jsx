// ─────────────────────────────────────────────
// AddSupplierModal — Create a new supplier
// Props: isOpen, onClose, user, onSuccess
// ─────────────────────────────────────────────

import { useState }  from 'react';
import { Modal }     from '../../components/ui/Modal.jsx';
import { FormField, inputClass } from '../../components/ui/FormField.jsx';
import { db }        from '../../lib/db.js';
import { generateId } from '../../lib/generateId.js';
import { syncNow }   from '../../lib/syncEngine.js';
import { DEFAULT_BUSINESS_ID } from '../../lib/constants.js';

export function AddSupplierModal({ isOpen, onClose, user, onSuccess }) {
  const [name,   setName]   = useState('');
  const [error,  setError]  = useState('');
  const [saving, setSaving] = useState(false);

  const reset = () => { setName(''); setError(''); };
  const handleClose = () => { reset(); onClose(); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) { setError('Supplier name is required.'); return; }

    setSaving(true);
    try {
      const suppId = generateId('supp');
      await db.suppliers.add({
        id:         suppId,
        businessId: user?.businessId || DEFAULT_BUSINESS_ID,
        name:       name.trim(),
        syncStatus: 'PENDING',
      });

      syncNow();
      reset();
      onSuccess?.(suppId);
    } catch (err) {
      setError(`Could not save supplier: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add New Supplier">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">{error}</div>
        )}

        <FormField label="Supplier Name / Company" required>
          <input
            id="supp-name"
            type="text"
            className={inputClass}
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Addis Wholesalers Ltd"
            required
          />
        </FormField>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={handleClose}
            className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm py-2.5 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-sm py-2.5 rounded-xl transition-colors"
          >
            {saving ? 'Saving…' : 'Save Supplier'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
