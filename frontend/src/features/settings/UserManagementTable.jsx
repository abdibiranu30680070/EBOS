// ─────────────────────────────────────────────
// UserManagementTable — List of users
// Props: users
// ─────────────────────────────────────────────

import { SyncBadge } from '../../components/ui/Badge.jsx';

const HEADERS = ['Username', 'Role', 'Branch', 'Status', 'Sync', 'Actions'];

export function UserManagementTable({ users }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100">
        <h3 className="font-bold text-slate-800">System Users</h3>
        <p className="text-xs text-slate-400 mt-0.5">Manage access and roles for this branch</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              {HEADERS.map(h => (
                <th key={h} className="py-3 px-5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={HEADERS.length} className="py-10 text-center text-slate-400 text-sm">
                  No users found.
                </td>
              </tr>
            ) : (
              users.map(u => (
                <tr key={u.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                  <td className="py-3.5 px-5 font-bold text-slate-800">{u.username || u.id}</td>
                  <td className="py-3.5 px-5">
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3.5 px-5 text-slate-500">{u.branchId}</td>
                  <td className="py-3.5 px-5">
                    <span className="text-xs text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      Active
                    </span>
                  </td>
                  <td className="py-3.5 px-5">
                    <SyncBadge status={u.syncStatus} />
                  </td>
                  <td className="py-3.5 px-5">
                    <button className="text-xs text-blue-600 hover:underline">Edit</button>
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
