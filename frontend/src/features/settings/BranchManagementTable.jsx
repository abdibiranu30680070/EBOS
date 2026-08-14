// ─────────────────────────────────────────────
// BranchManagementTable — Branch configuration listing & actions
// Props: branches, onToggleActive, isOwner
// ─────────────────────────────────────────────

import { db } from '../../lib/db.js';
import { API_BASE_URL } from '../../lib/constants.js';

const HEADERS = ['Branch Name', 'Branch ID', 'Location', 'Status', 'Actions'];

export function BranchManagementTable({ branches = [], isOwner }) {

  const handleToggleActive = async (branch) => {
    if (!isOwner) return;
    const updatedStatus = !branch.isActive;

    try {
      await db.branches.update(branch.id, { isActive: updatedStatus });

      const token = localStorage.getItem('ebos_token');
      if (token) {
        await fetch(`${API_BASE_URL}/api/v1/branches/${branch.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ isActive: updatedStatus }),
        }).catch(() => {});
      }
    } catch (err) {
      console.error('Failed to toggle branch status:', err);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
        <div>
          <h2 className="font-bold text-slate-800 text-base">🏢 Business Branches Configuration</h2>
          <p className="text-xs text-slate-400 mt-0.5">Manage store locations and regional branch terminals</p>
        </div>
        <span className="text-xs bg-slate-200 text-slate-700 px-2.5 py-1 rounded-full font-semibold">
          {branches.length} Registered Branches
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/50">
              {HEADERS.map((h) => (
                <th key={h} className="py-3 px-5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {branches.length === 0 ? (
              <tr>
                <td colSpan={HEADERS.length} className="py-8 text-center text-slate-400 text-sm">
                  No custom branches created yet. Click "+ Add Branch" to configure your first location.
                </td>
              </tr>
            ) : (
              branches.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3.5 px-5 font-bold text-slate-800">{b.name}</td>
                  <td className="py-3.5 px-5 text-slate-500 font-mono text-xs">{b.id}</td>
                  <td className="py-3.5 px-5 text-slate-600">{b.location || '—'}</td>
                  <td className="py-3.5 px-5">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      b.isActive !== false ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {b.isActive !== false ? '● Active' : '○ Inactive'}
                    </span>
                  </td>
                  <td className="py-3.5 px-5">
                    {isOwner ? (
                      <button
                        onClick={() => handleToggleActive(b)}
                        className={`text-xs px-3 py-1.5 rounded-lg font-semibold cursor-pointer transition-colors ${
                          b.isActive !== false
                            ? 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                        }`}
                      >
                        {b.isActive !== false ? 'Deactivate' : 'Activate'}
                      </button>
                    ) : (
                      <span className="text-xs text-slate-400">View Only</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
