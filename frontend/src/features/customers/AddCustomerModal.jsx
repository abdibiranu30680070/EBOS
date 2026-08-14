// ─────────────────────────────────────────────
// AddCustomerModal — Create a credit account
// Props: isOpen, onClose, user, onSuccess(custId)
// ─────────────────────────────────────────────

import { useState }  from 'react';
import { Modal }     from '../../components/ui/Modal.jsx';
import { FormField, inputClass } from '../../components/ui/FormField.jsx';
import { db }        from '../../lib/db.js';
import { generateId } from '../../lib/generateId.js';
import { syncNow }   from '../../lib/syncEngine.js';

export function AddCustomerModal({ isOpen, onClose, user, onSuccess }) {
  const [name,   setName]   = useState('');
  const [phone,  setPhone]  = useState('');
  const [limit,  setLimit]  = useState(10000);
  const [error,  setError]  = useState('');
  const [saving, setSaving] = useState(false);

  const reset = () => { setName(''); setPhone(''); setLimit(10000); setError(''); };

  const handleClose = () => { reset(); onClose(); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) { setError('Customer name is required.'); return; }

    setSaving(true);
    try {
      const custId = generateId('cust');
      await db.customers.add({
        id:                 custId,
        businessId:         user?.businessId || 'bus_mercato_001',
        name:               name.trim(),
        phone:              phone.trim(),
        creditLimit:        Number(limit),
        outstandingBalance: 0,
        syncStatus:         'PENDING',
      });

      syncNow();
      reset();
      onSuccess?.(custId);
    } catch (err) {
      setError(`Could not save customer: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Create Credit Account">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">{error}</div>
        )}

        <FormField label="Customer Name" required>
          <input
            id="cust-name"
            type="text"
            className={inputClass}
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Full name of individual or business"
            required
          />
        </FormField>

        <FormField label="Phone Number">
          <input
            id="cust-phone"
            type="tel"
            className={inputClass}
            value={phone}
            onChange={e => setPhone(e.target.value)}
            placeholder="+2519xxxxxxxx"
          />
        </FormField>

        <FormField label="Credit Limit (ETB)">
          <input
            id="cust-credit-limit"
            type="number"
            min="0"
            className={inputClass}
            value={limit}
            onChange={e => setLimit(e.target.value)}
          />
        </FormField>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={handleClose}
            className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm py-2.5 rounded-xl cursor-pointer transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-sm py-2.5 rounded-xl cursor-pointer transition-colors"
          >
            {saving ? 'Saving…' : 'Save Account'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
