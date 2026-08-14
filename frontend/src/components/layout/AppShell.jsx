// ─────────────────────────────────────────────
// AppShell — Authenticated layout wrapper
// Composes Header + Sidebar + main content area
// Props: user, isOnline, syncing, syncMessage, activeTab,
//        onTabChange, onSync, onLogout, children
// ─────────────────────────────────────────────

import { Header }  from './Header.jsx';
import { Sidebar } from './Sidebar.jsx';
import { Alert }   from '../ui/Alert.jsx';

export function AppShell({
  user, isOnline, syncing, syncMessage, activeModule, activeTab,
  onModuleChange, onTabChange, onSync, onLogout, onDismissSync, children,
}) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <Header
        user={user}
        isOnline={isOnline}
        syncing={syncing}
        activeModule={activeModule}
        onModuleChange={onModuleChange}
        onSync={onSync}
        onLogout={onLogout}
      />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          activeModule={activeModule}
          activeTab={activeTab}
          onTabChange={onTabChange}
          user={user}
        />

        <main className="flex-1 overflow-y-auto p-8">
          {/* Global sync alert banner */}
          {syncMessage && (
            <div className="mb-6">
              <Alert type={syncMessage.type} onDismiss={onDismissSync}>
                {syncMessage.text}
              </Alert>
            </div>
          )}

          {/* Feature page content */}
          {children}
        </main>
      </div>
    </div>
  );
}
