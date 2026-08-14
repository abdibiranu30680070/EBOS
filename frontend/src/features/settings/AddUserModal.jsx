// ─────────────────────────────────────────────
// AddUserModal — Create a new system user
// Props: isOpen, onClose, currentUser
// ─────────────────────────────────────────────

import { useState }      from 'react';
import { useLiveQuery }  from 'dexie-react-hooks';
import { Modal }         from '../../components/ui/Modal.jsx';
import { FormField, inputClass, selectClass } from '../../components/ui/FormField.jsx';
import { db }            from '../../lib/db.js';
import { generateId }    from '../../lib/generateId.js';
import { API_BASE_URL }  from '../../lib/constants.js';

export function AddUserModal({ isOpen, onClose, currentUser }) {
  const branches = useLiveQuery(() => db.branches.toArray()) || [
    { id: 'br_mercato_main', name: 'Mercato Main Store' }
  ];

  const [username, setUsername]                 = useState('');
  const [password, setPassword]                 = useState('');
  const [role,     setRole]                     = useState('CASHIER');
  const [selectedBranchId, setSelectedBranchId] = useState(currentUser?.branchId || 'br_mercato_main');
  const [error,    setError]                    = useState('');
  const [saving,   setSaving]                   = useState(false);

  const reset = () => {
    setUsername('');
    setPassword('');
    setRole('CASHIER');
    setSelectedBranchId(currentUser?.branchId || 'br_mercato_main');
    setError('');
  };
  const handleClose = () => { reset(); onClose(); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Username and password are required.');
      return;
    }

    setSaving(true);
    const userId     = generateId('usr');
    const businessId = currentUser?.businessId || 'bus_mercato_001';
    const branchId   = selectedBranchId || currentUser?.branchId || 'br_mercato_main';

    let initialStatus = 'PENDING';

    try {
      // Register user on backend server
      if (navigator.onLine) {
        try {
          const res = await fetch(`${API_BASE_URL}/api/v1/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              username: username.trim(),
              password: password.trim(),
              fullName: username.trim(),
              role: role,
              businessId,
              branchId,
            }),
          });
          if (res.ok) {
            initialStatus = 'SYNCED';
          }
        } catch (apiErr) {
          console.warn('Backend user registration offline/failed, saving locally as PENDING', apiErr);
        }
      }

      await db.users.put({
        id:         userId,
        username:   username.trim(),
        password:   password.trim(),
        role:       role,
        branchId:   branchId,
        businessId: businessId,
        syncStatus: initialStatus,
      });

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

        <FormField label="Assigned Branch" required>
          <select
            id="usr-branch"
            className={selectClass}
            value={selectedBranchId}
            onChange={e => setSelectedBranchId(e.target.value)}
          >
            {branches.map(b => (
              <option key={b.id} value={b.id}>
                🏢 {b.name} ({b.id})
              </option>
            ))}
          </select>
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
