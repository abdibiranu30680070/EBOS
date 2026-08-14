// ─────────────────────────────────────────────
// CollectPaymentModal — Log debt collection
// Props: isOpen, onClose, customer, user
// ─────────────────────────────────────────────

import { useState }   from 'react';
import { Modal }      from '../../components/ui/Modal.jsx';
import { FormField, inputClass, selectClass } from '../../components/ui/FormField.jsx';
import { PAYMENT_MODES_NO_CREDIT }            from '../../lib/constants.js';
import { db }         from '../../lib/db.js';
import { generateId } from '../../lib/generateId.js';
import { syncNow }    from '../../lib/syncEngine.js';

export function CollectPaymentModal({ isOpen, onClose, customer, user }) {
  const [amount,    setAmount]    = useState('');
  const [mode,      setMode]      = useState('CASH');
  const [reference, setReference] = useState('');
  const [error,     setError]     = useState('');
  const [saving,    setSaving]    = useState(false);

  const reset = () => { setAmount(''); setMode('CASH'); setReference(''); setError(''); };
  const handleClose = () => { reset(); onClose(); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const amt = Number(amount);
    if (!customer) { setError('No customer selected.'); return; }
    if (amt <= 0)  { setError('Amount must be greater than zero.'); return; }
    if (amt > customer.outstandingBalance) {
      setError(`Amount exceeds outstanding balance of ETB ${customer.outstandingBalance.toLocaleString()}.`);
      return;
    }

    setSaving(true);
    try {
      await db.transaction('rw', [db.customerPayments, db.customers], async () => {
        await db.customerPayments.add({
          id:              generateId('pmt'),
          businessId:      user?.businessId || customer.businessId,
          customerId:      customer.id,
          amount:          amt,
          paymentMode:     mode,
          referenceNumber: reference.trim(),
          createdAt:       new Date().toISOString(),
          syncStatus:      'PENDING',
        });

        const fresh = await db.customers.get(customer.id);
        if (fresh) {
          await db.customers.update(customer.id, {
            outstandingBalance: Math.max(0, fresh.outstandingBalance - amt),
            syncStatus: 'PENDING',
          });
        }
      });

      syncNow();
      reset();
      onClose();
    } catch (err) {
      setError(`Payment failed: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Register Debt Collection">
      {customer && (
        <div className="mb-5 p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm space-y-1">
          <div className="font-bold text-slate-800 text-base">{customer.name}</div>
          <div className="text-slate-500">
            Outstanding: <span className="font-bold text-rose-600">ETB {customer.outstandingBalance.toLocaleString()}</span>
          </div>
          <div className="text-slate-500">
            Credit limit: <span className="font-semibold">ETB {customer.creditLimit.toLocaleString()}</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">{error}</div>
        )}

        <FormField label="Amount Collected (ETB)" required>
          <input
            id="pmt-amount"
            type="number"
            min="1"
            className={inputClass}
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder="0.00"
            required
          />
        </FormField>

        <FormField label="Payment Method" required>
          <select
            id="pmt-mode"
            className={selectClass}
            value={mode}
            onChange={e => setMode(e.target.value)}
          >
            {PAYMENT_MODES_NO_CREDIT.map(m => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </FormField>

        <FormField label="Reference / Transaction Code">
          <input
            id="pmt-reference"
            type="text"
            className={inputClass}
            value={reference}
            onChange={e => setReference(e.target.value)}
            placeholder="Telebirr tx ID, bank ref, receipt #, etc."
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
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold text-sm py-2.5 rounded-xl cursor-pointer transition-colors"
          >
            {saving ? 'Saving…' : '💰 Log Collection'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
