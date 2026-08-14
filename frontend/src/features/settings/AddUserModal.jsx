// ─────────────────────────────────────────────
// AddUserModal — Create a new system user
// Props: isOpen, onClose, currentUser
// ─────────────────────────────────────────────

import { useState }  from 'react';
import { Modal }     from '../../components/ui/Modal.jsx';
import { FormField, inputClass, selectClass } from '../../components/ui/FormField.jsx';
import { db }        from '../../lib/db.js';
import { generateId } from '../../lib/generateId.js';
import { syncNow }   from '../../lib/syncEngine.js';

export function AddUserModal({ isOpen, onClose, currentUser }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role,     setRole]     = useState('CASHIER');
  const [error,    setError]    = useState('');
  const [saving,   setSaving]   = useState(false);

  const reset = () => { setUsername(''); setPassword(''); setRole('CASHIER'); setError(''); };
  const handleClose = () => { reset(); onClose(); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Username and password are required.');
      return;
    }

    setSaving(true);
    try {
      // Create user locally. In a real system, passwords should be hashed, 
      // but we will sync this to the backend which handles actual authentication.
      await db.users.add({
        id:         generateId('usr'),
        username:   username.trim(),
        password:   password.trim(), // Placeholder for demo
        role:       role,
        branchId:   currentUser?.branchId,
        businessId: currentUser?.businessId,
        syncStatus: 'PENDING',
      });

      syncNow();
      reset();
      onClose();
    } catch (err) {
      setError(`Could not save user: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add New User">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">{error}</div>
        )}

        <FormField label="Username" required>
          <input
            id="usr-name"
            type="text"
            className={inputClass}
            value={username}
            onChange={e => setUsername(e.target.value)}
            placeholder="e.g. cashier1"
            required
          />
        </FormField>

        <FormField label="Password / PIN" required>
          <input
            id="usr-pass"
            type="password"
            className={inputClass}
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
        </FormField>

        <FormField label="Role" required>
          <select
            id="usr-role"
            className={selectClass}
            value={role}
            onChange={e => setRole(e.target.value)}
          >
            <option value="CASHIER">Cashier (POS Only)</option>
            <option value="MANAGER">Manager (Sales & Inventory)</option>
            <option value="OWNER">Owner (Full Access)</option>
          </select>
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
            {saving ? 'Saving…' : 'Save User'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
