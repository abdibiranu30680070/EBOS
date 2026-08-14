// ─────────────────────────────────────────────
// SettingsPage — Configuration & User Management
// ─────────────────────────────────────────────

import { useState }            from 'react';
import { useLiveQuery }        from 'dexie-react-hooks';
import { db }                  from '../../lib/db.js';
import { UserManagementTable } from './UserManagementTable.jsx';
import { AddUserModal }        from './AddUserModal.jsx';

export function SettingsPage({ currentUser }) {
  const [showAdd, setShowAdd] = useState(false);
  const users = useLiveQuery(() => db.users.toArray()) || [];

  // In a real app, we'd check if currentUser.role === 'OWNER' to restrict this view
  const isOwner = currentUser?.role === 'OWNER';

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Configuration & Settings</h1>
            <p className="text-slate-400 text-sm mt-0.5">Manage users, roles, and business preferences</p>
          </div>
          {isOwner && (
            <button
              onClick={() => setShowAdd(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-4 py-2.5 rounded-xl transition-colors"
            >
              + Add User
            </button>
          )}
        </div>

        {/* Access Control Warning */}
        {!isOwner && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl text-sm font-medium">
            ⚠️ You are logged in as a <strong>{currentUser?.role}</strong>. Only <strong>OWNER</strong> accounts can make changes here.
          </div>
        )}

        <div className="grid grid-cols-1 gap-6">
          <UserManagementTable users={users} />
        </div>
      </div>

      <AddUserModal
        isOpen={showAdd}
        onClose={() => setShowAdd(false)}
        currentUser={currentUser}
      />
    </>
  );
}
