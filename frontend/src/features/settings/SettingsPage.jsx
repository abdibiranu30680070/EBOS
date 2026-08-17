// ─────────────────────────────────────────────
// SettingsPage — Configuration, User & Branch Management
// ─────────────────────────────────────────────

import { useEffect, useState }     from 'react';
import { useLiveQuery }            from 'dexie-react-hooks';
import { db }                      from '../../lib/db.js';
import { API_BASE_URL }            from '../../lib/constants.js';
import { UserManagementTable }     from './UserManagementTable.jsx';
import { AddUserModal }            from './AddUserModal.jsx';
import { BranchManagementTable }   from './BranchManagementTable.jsx';
import { AddBranchModal }          from './AddBranchModal.jsx';

export function SettingsPage({ currentUser }) {
  const [activeSubTab, setActiveSubTab] = useState('users'); // 'users' | 'branches'
  const [showAddUser, setShowAddUser]   = useState(false);
  const [showAddBranch, setShowAddBranch] = useState(false);

  const users = useLiveQuery(
    () => db.users.where('businessId').equals(currentUser?.businessId || '').toArray(),
    [currentUser?.businessId]
  ) || [];

  const branches = useLiveQuery(() => db.branches.toArray()) || [
    {
      id: 'br_mercato_main',
      businessId: currentUser?.businessId || 'bus_mercato_001',
      name: 'Mercato Main Store',
      location: 'Addis Ababa, Mercato, Block B',
      isActive: true,
    }
  ];

  useEffect(() => {
    if (!currentUser?.businessId) return;

    const loadUsers = async () => {
      try {
        const token = localStorage.getItem('ebos_token');
        if (!token) return;

        const res = await fetch(`${API_BASE_URL}/api/v1/auth/users?businessId=${encodeURIComponent(currentUser.businessId)}` , {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) return;

        const remoteUsers = await res.json();
        if (!Array.isArray(remoteUsers)) return;

        await db.transaction('rw', [db.users], async () => {
          for (const user of remoteUsers) {
            await db.users.put({
              id: user.id,
              username: user.username,
              role: user.role,
              businessId: user.businessId,
              branchId: user.branchId || null,
              fullName: user.fullName || user.username,
              isActive: user.isActive,
              syncStatus: 'SYNCED',
            });
          }
        });
      } catch (err) {
        console.warn('[SettingsPage] Failed to load users:', err);
      }
    };

    loadUsers();
  }, [currentUser?.businessId]);

  const isOwner = currentUser?.role === 'OWNER' || true; // Owner default for config access

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Configuration & Settings</h1>
            <p className="text-slate-400 text-sm mt-0.5">Manage business branches, users, roles, and branch terminals</p>
          </div>

          <div className="flex items-center gap-2">
            {isOwner && (
              activeSubTab === 'users' ? (
                <button
                  onClick={() => setShowAddUser(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-4 py-2.5 rounded-xl transition-colors cursor-pointer"
                >
                  + Add User
                </button>
              ) : (
                <button
                  onClick={() => setShowAddBranch(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-4 py-2.5 rounded-xl transition-colors cursor-pointer"
                >
                  + Add Branch
                </button>
              )
            )}
          </div>
        </div>

        {/* Section Navigation Pills */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
          <button
            onClick={() => setActiveSubTab('users')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${
              activeSubTab === 'users'
                ? 'bg-blue-50 text-blue-700 shadow-sm border border-blue-100'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            👥 User Accounts ({users.length})
          </button>
          <button
            onClick={() => setActiveSubTab('branches')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${
              activeSubTab === 'branches'
                ? 'bg-blue-50 text-blue-700 shadow-sm border border-blue-100'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            🏢 Business Branches ({branches.length})
          </button>
        </div>

        {/* Content Area */}
        {activeSubTab === 'users' && (
          <UserManagementTable users={users} />
        )}

        {activeSubTab === 'branches' && (
          <BranchManagementTable branches={branches} isOwner={isOwner} />
        )}
      </div>

      <AddUserModal
        isOpen={showAddUser}
        onClose={() => setShowAddUser(false)}
        currentUser={currentUser}
      />

      <AddBranchModal
        isOpen={showAddBranch}
        onClose={() => setShowAddBranch(false)}
        currentUser={currentUser}
      />
    </>
  );
}
