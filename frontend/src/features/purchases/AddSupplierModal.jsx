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
  const [name,    setName]    = useState('');
  const [phone,   setPhone]   = useState('');
  const [tin,     setTin]     = useState('');
  const [address, setAddress] = useState('');
  const [error,   setError]   = useState('');
  const [saving,  setSaving]  = useState(false);

  const reset = () => { 
    setName(''); setPhone(''); setTin(''); setAddress(''); setError(''); 
  };
  
  const handleClose = () => { reset(); onClose(); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) { setError('Vendor name is required.'); return; }

    setSaving(true);
    try {
      const suppId = generateId('supp');
      await db.suppliers.add({
        id:         suppId,
        businessId: user?.businessId || DEFAULT_BUSINESS_ID,
        name:       name.trim(),
        phone:      phone.trim(),
        tin:        tin.trim(),
        address:    address.trim(),
        syncStatus: 'PENDING',
      });

      syncNow();
      reset();
      onSuccess?.(suppId);
    } catch (err) {
      setError(`Could not save vendor: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add New Vendor">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">{error}</div>
        )}

        <FormField label="Vendor Name / Company" required>
          <input
            id="vend-name"
            type="text"
            className={inputClass}
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Addis Wholesalers Ltd"
            required
          />
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Phone Number">
            <input
              id="vend-phone"
              type="tel"
              className={inputClass}
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="+251..."
            />
          </FormField>
          
          <FormField label="TIN (Tax ID)">
            <input
              id="vend-tin"
              type="text"
              className={inputClass}
              value={tin}
              onChange={e => setTin(e.target.value)}
              placeholder="e.g. 000123456"
            />
          </FormField>
        </div>

        <FormField label="Physical Address">
          <textarea
            id="vend-address"
            className={`${inputClass} resize-none h-20`}
            value={address}
            onChange={e => setAddress(e.target.value)}
            placeholder="e.g. Mercato, Addis Ababa"
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
            {saving ? 'Saving…' : 'Save Vendor'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
