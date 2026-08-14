// ─────────────────────────────────────────────
// AddBranchModal — Modal form to create a new branch
// Props: isOpen, onClose, currentUser, onSuccess
// ─────────────────────────────────────────────

import { useState }          from 'react';
import { Modal }             from '../../components/ui/Modal.jsx';
import { FormField, inputClass } from '../../components/ui/FormField.jsx';
import { db }                from '../../lib/db.js';
import { API_BASE_URL }      from '../../lib/constants.js';

export function AddBranchModal({ isOpen, onClose, currentUser, onSuccess }) {
  const [name, setName]         = useState('');
  const [location, setLocation] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Branch Name is required.');
      return;
    }

    setLoading(true);
    const businessId = currentUser?.businessId || 'bus_mercato_001';
    const branchId   = `br_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    const newBranch = {
      id: branchId,
      businessId,
      name: name.trim(),
      location: location.trim(),
      isActive: true,
      syncStatus: 'PENDING',
    };

    try {
      // Write to IndexedDB local database
      await db.branches.put(newBranch);

      // Attempt online backend API sync if token available
      const token = localStorage.getItem('ebos_token');
      if (token) {
        await fetch(`${API_BASE_URL}/api/v1/branches`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(newBranch),
        }).catch(() => {
          // Offline fallback silently keeps PENDING status
        });
      }

      setName('');
      setLocation('');
      setLoading(false);
      onClose();
      if (onSuccess) onSuccess(newBranch);
    } catch (err) {
      setError(err.message || 'Failed to save branch');
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="🏢 Add New Branch" size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg">
            ⚠️ {error}
          </div>
        )}

        <FormField label="Branch Name *">
          <input
            type="text"
            className={inputClass}
            placeholder="e.g. Bole Branch, Piazza Outlet, Mercato Main Store"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </FormField>

        <FormField label="Location / Address">
          <input
            type="text"
            className={inputClass}
            placeholder="e.g. Addis Ababa, Bole Medhanialem, Building B"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </FormField>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 text-slate-700 font-semibold text-sm rounded-xl hover:bg-slate-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl disabled:opacity-50 transition-colors"
          >
            {loading ? 'Saving...' : 'Create Branch'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
