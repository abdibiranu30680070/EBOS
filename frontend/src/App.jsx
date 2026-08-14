// ─────────────────────────────────────────────
// App.jsx — Root router (~50 lines)
// Responsibilities:
//   1. Instantiate global hooks (auth, sync, network, data)
//   2. Route: unauthenticated → LoginPage
//   3. Route: authenticated  → AppShell + active feature page
// No UI logic lives here — all delegated to features.
// ─────────────────────────────────────────────

import { useState }           from 'react';
import { useLiveQuery }       from 'dexie-react-hooks';

// lib
import { db }                 from './lib/db.js';

// hooks
import { useNetworkStatus }   from './hooks/useNetworkStatus.js';
import { useSync }            from './hooks/useSync.js';
import { useAuth }            from './hooks/useAuth.js';
import { useCart }            from './hooks/useCart.js';
import { useStockBalances }   from './hooks/useStockBalances.js';

// layout
import { AppShell }           from './components/layout/AppShell.jsx';
import { ToastProvider }      from './components/ui/Toast.jsx';

// feature pages
import { LoginPage }          from './features/auth/LoginPage.jsx';
import { DashboardPage }      from './features/dashboard/DashboardPage.jsx';
import { PosPage }            from './features/pos/PosPage.jsx';
import { InventoryPage }      from './features/inventory/InventoryPage.jsx';
import { CustomersPage }      from './features/customers/CustomersPage.jsx';
import { ProductsPage }       from './features/products/ProductsPage.jsx';
import { ReportsPage }        from './features/reports/ReportsPage.jsx';

import { SettingsPage }       from './features/settings/SettingsPage.jsx';
import { PurchasesPage }      from './features/purchases/PurchasesPage.jsx';

// ─── Live DB queries (app-level shared data) ──
function useAppData() {
  const products  = useLiveQuery(() => db.products.where('isActive').equals(1).toArray()) || [];
  const customers = useLiveQuery(() => db.customers.toArray()) || [];
  const orders    = useLiveQuery(() => db.salesOrders.orderBy('createdAt').reverse().limit(50).toArray()) || [];
  return { products, customers, orders };
}

// ─── Feature page router ──────────────────────
function FeaturePage({ tab, products, customers, orders, stockBalances, user, cartHook }) {
  switch (tab) {
    // Sales Module
    case 'dashboard':
      return <DashboardPage products={products} customers={customers} orders={orders} stockBalances={stockBalances} />;
    case 'pos':
      return <PosPage products={products} customers={customers} stockBalances={stockBalances} cartHook={cartHook} user={user} />;
    case 'customers':
      return <CustomersPage customers={customers} user={user} />;
    case 'reports':
      return <ReportsPage orders={orders} products={products} />;

    // Inventory Module
    case 'stock':
      return <InventoryPage products={products} stockBalances={stockBalances} user={user} />;
    case 'products':
      return <ProductsPage user={user} />;

    // Purchases Module
    case 'po':
    case 'suppliers':
      return <PurchasesPage user={user} />;

    // Settings Module
    case 'users':
      return <SettingsPage currentUser={user} />;

    default:
      return null;
  }
}

import { NAV_TABS } from './lib/constants.js';

// ─── Root App ─────────────────────────────────
export default function App() {
  const [activeModule, setActiveModule] = useState('sales');
  const [activeTab, setActiveTab]       = useState('dashboard');

  const handleModuleChange = (mod) => {
    setActiveModule(mod);
    setActiveTab(NAV_TABS[mod][0].id); // Select first tab of module
  };

  const { isOnline }                       = useNetworkStatus();
  const { syncing, syncMessage, triggerSync, clearSyncMessage, setSyncMessage } = useSync();
  const { user, authError, handleLogin, handleLogout } = useAuth({ isOnline, setSyncMessage });

  const { products, customers, orders } = useAppData();
  const { stockBalances }               = useStockBalances();
  const cartHook                        = useCart({ user, customers });

  // ── Unauthenticated ──────────────────────────
  if (!user) {
    return (
      <ToastProvider>
        <LoginPage
          isOnline={isOnline}
          onLogin={handleLogin}
          authError={authError}
          syncMessage={syncMessage}
        />
      </ToastProvider>
    );
  }

  // ── Authenticated ────────────────────────────
  return (
    <ToastProvider>
      <AppShell
        user={user}
        isOnline={isOnline}
        syncing={syncing}
        syncMessage={syncMessage}
        activeModule={activeModule}
        activeTab={activeTab}
        onModuleChange={handleModuleChange}
        onTabChange={(tab) => { setActiveTab(tab); clearSyncMessage(); }}
        onSync={triggerSync}
        onLogout={handleLogout}
        onDismissSync={clearSyncMessage}
      >
        <FeaturePage
          tab={activeTab}
          products={products}
          customers={customers}
          orders={orders}
          stockBalances={stockBalances}
          user={user}
          cartHook={cartHook}
        />
      </AppShell>
    </ToastProvider>
  );
}
