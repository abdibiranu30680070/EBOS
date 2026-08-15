// ─────────────────────────────────────────────
// AppShell — Authenticated layout wrapper
// Composes Header + Sidebar + main content area
// Props: user, isOnline, syncing, syncMessage, activeTab,
//        onTabChange, onSync, onLogout, children
// ─────────────────────────────────────────────

import { useState } from 'react';
import { Header }  from './Header.jsx';
import { Sidebar } from './Sidebar.jsx';
import { Alert }   from '../ui/Alert.jsx';

export function AppShell({
  user, isOnline, syncing, syncMessage, activeModule, activeTab,
  onModuleChange, onTabChange, onSync, onLogout, onDismissSync, children,
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <Header
        user={user}
        isOnline={isOnline}
        syncing={syncing}
        activeModule={activeModule}
        onModuleChange={(mod) => { onModuleChange(mod); setSidebarOpen(false); }}
        onSync={onSync}
        onLogout={onLogout}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
      />

      <div className="flex flex-1 overflow-hidden relative">
        <Sidebar
          activeModule={activeModule}
          activeTab={activeTab}
          onTabChange={(tab) => { onTabChange(tab); setSidebarOpen(false); }}
          user={user}
          isOnline={isOnline}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        
        {/* Mobile backdrop */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 md:hidden transition-opacity" 
            onClick={() => setSidebarOpen(false)} 
          />
        )}

        <main className="flex-1 overflow-y-auto p-4 md:p-8">
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
