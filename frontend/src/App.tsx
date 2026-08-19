import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type LocalProduct, type LocalSalesOrder } from './db';
import { syncNow, startAutoSync, stopAutoSync } from './syncEngine';
import { API_BASE_URL } from './lib/constants.js';

// Utility for collision-free local ID generation
const generateId = (prefix: string) => {
  const rand = Math.random().toString(36).substring(2, 10);
  const time = Date.now().toString(36);
  return `${prefix}_${time}_${rand}`;
};

export default function App() {
  // Authentication & Session States
  const [user, setUser] = useState<any>(null);
  const [loginBusinessId, setLoginBusinessId] = useState('bus_mercato_001');
  const [loginUsername, setLoginUsername] = useState('almaz');
  const [loginPassword, setLoginPassword] = useState('almaz123');
  const [authError, setAuthError] = useState('');

  // Active Tab
  const [activeTab, setActiveTab] = useState<'dashboard' | 'pos' | 'inventory' | 'customers'>('dashboard');

  // Network & Sync States
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<{ type: 'success' | 'danger' | 'warning'; text: string } | null>(null);

  // Cart & POS Checkout States
  const [cart, setCart] = useState<{ product: LocalProduct; quantity: number }[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [paymentMode, setPaymentMode] = useState<'CASH' | 'TELEBIRR' | 'CBE_BIRR' | 'BANK_TRANSFER' | 'CREDIT'>('CASH');
  const [checkoutError, setCheckoutError] = useState('');

  // Customer Management States
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustCredit, setNewCustCredit] = useState(10000);

  // Customer Payment States
  const [showPayModal, setShowPayModal] = useState(false);
  const [payCustomerId, setPayCustomerId] = useState('');
  const [payAmount, setPayAmount] = useState(0);
  const [payMode, setPayMode] = useState<'CASH' | 'TELEBIRR' | 'CBE_BIRR' | 'BANK_TRANSFER'>('CASH');
  const [payReference, setPayReference] = useState('');

  // Inventory Management States
  const [adjProductId, setAdjProductId] = useState('');
  const [adjQty, setAdjQty] = useState(10);
  const [adjType, setAdjType] = useState<'STOCK_IN' | 'STOCK_OUT' | 'ADJUSTMENT'>('STOCK_IN');
  const [adjNotes, setAdjNotes] = useState('');

  // Search Filters
  const [posSearch, setPosSearch] = useState('');

  // -------------------------------------------------------------
  // DB Live Queries
  // -------------------------------------------------------------
  const products = useLiveQuery(() => db.products.where('isActive').equals(1).toArray()) || [];
  const customers = useLiveQuery(() => db.customers.toArray()) || [];
  const movements = useLiveQuery(() => db.inventoryMovements.orderBy('createdAt').reverse().limit(15).toArray()) || [];
  const orders = useLiveQuery(() => db.salesOrders.orderBy('createdAt').reverse().limit(15).toArray()) || [];
  
  // Calculate current stock levels from movements dynamically
  const stockBalances = useLiveQuery(async () => {
    const allMovements = await db.inventoryMovements.toArray();
    const balances: { [productId: string]: number } = {};
    for (const mv of allMovements) {
      balances[mv.productId] = (balances[mv.productId] || 0) + mv.quantityDelta;
    }
    return balances;
  }, [movements]) || {};

  // -------------------------------------------------------------
  // Initial Handlers
  // -------------------------------------------------------------
  useEffect(() => {
    // Check if token exists in localStorage
    const savedUser = localStorage.getItem('ebos_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }

    // Network status listeners
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Start background auto sync
    startAutoSync(20000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      stopAutoSync();
    };
  }, []);

  // -------------------------------------------------------------
  // Actions: Authentication
  // -------------------------------------------------------------
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setSyncMessage(null);

    // If online, login via backend API
    if (isOnline) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: loginUsername,
            password: loginPassword,
            businessId: loginBusinessId,
          }),
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.message || 'Login failed');
        }

        const data = await res.json();
        localStorage.setItem('ebos_token', data.access_token);
        localStorage.setItem('ebos_user', JSON.stringify(data.user));
        setUser(data.user);

        // Perform initial pull sync immediately
        setSyncing(true);
        const syncRes = await syncNow();
        setSyncing(false);
        if (syncRes.success) {
          setSyncMessage({ type: 'success', text: 'Logged in and database synced successfully!' });
        }
      } catch (err: any) {
        setAuthError(err.message || 'Network error connecting to auth server.');
      }
    } else {
      // Offline fallback: Check local user profiles cache
      const cachedUserStr = localStorage.getItem('ebos_user');
      if (cachedUserStr) {
        const cachedUser = JSON.parse(cachedUserStr);
        if (
          cachedUser.username === loginUsername &&
          cachedUser.businessId === loginBusinessId
        ) {
          setUser(cachedUser);
          setSyncMessage({ type: 'warning', text: 'Offline login successful. Syncing will occur when reconnected.' });
          return;
        }
      }
      setAuthError('Offline login requires a previously successful online login on this device.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('ebos_token');
    localStorage.removeItem('ebos_user');
    setUser(null);
    setCart([]);
  };

  // -------------------------------------------------------------
  // Actions: Sync
  // -------------------------------------------------------------
  const triggerManualSync = async () => {
    setSyncing(true);
    setSyncMessage(null);
    const res = await syncNow();
    setSyncing(false);
    if (res.success) {
      setSyncMessage({ type: 'success', text: res.message });
    } else {
      setSyncMessage({ type: 'danger', text: res.message });
    }
  };

  // -------------------------------------------------------------
  // Actions: POS & Cart
  // -------------------------------------------------------------
  const addToCart = (product: LocalProduct) => {
    const existing = cart.find((item) => item.product.id === product.id);
    if (existing) {
      setCart(cart.map((item) =>
        item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
      ));
    } else {
      setCart([...cart, { product, quantity: 1 }]);
    }
  };

  const updateCartQty = (productId: string, delta: number) => {
    const updated = cart.map((item) => {
      if (item.product.id === productId) {
        const newQty = item.quantity + delta;
        return newQty > 0 ? { ...item, quantity: newQty } : null;
      }
      return item;
    }).filter(Boolean) as { product: LocalProduct; quantity: number }[];
    setCart(updated);
  };

  // Calculations
  const cartSubtotal = cart.reduce((sum, item) => sum + item.product.sellingPrice * item.quantity, 0);
  const cartTotal = Math.max(0, cartSubtotal - discountAmount);

  // Auto-fill paid amount when payment mode changes
  useEffect(() => {
    if (paymentMode === 'CREDIT') {
      setPaidAmount(0);
    } else {
      setPaidAmount(cartTotal);
    }
  }, [paymentMode, cartTotal]);

  const handleCheckout = async () => {
    setCheckoutError('');
    if (cart.length === 0) {
      setCheckoutError('Cart is empty.');
      return;
    }

    const customer = customers.find((c) => c.id === selectedCustomerId);

    // Verify Credit Sale Constraints
    if (paymentMode === 'CREDIT') {
      if (!selectedCustomerId) {
        setCheckoutError('A customer must be selected for Credit sales.');
        return;
      }
      if (customer) {
        const netCreditAmount = cartTotal - paidAmount;
        const totalProjectedDebt = customer.outstandingBalance + netCreditAmount;
        if (totalProjectedDebt > customer.creditLimit) {
          setCheckoutError(`Credit limit exceeded! Customer credit limit is ETB ${customer.creditLimit.toLocaleString()}. Projected outstanding balance would be ETB ${totalProjectedDebt.toLocaleString()}.`);
          return;
        }
      }
    }

    try {
      const orderId = generateId('ord');

      // Create Order Structure
      const newOrder: LocalSalesOrder = {
        id: orderId,
        branchId: user.branchId || 'br_mercato_main',
        customerId: selectedCustomerId || null,
        userId: user.id,
        totalAmount: cartTotal,
        discountAmount: discountAmount,
        paidAmount: paidAmount,
        paymentMode: paymentMode,
        createdAt: new Date().toISOString(),
        syncStatus: 'PENDING',
      };

      // Create Order Items & Inventory Movements
      const orderItems = cart.map((item) => ({
        id: generateId('item'),
        orderId: orderId,
        productId: item.product.id,
        quantity: item.quantity,
        unitPrice: item.product.sellingPrice,
        totalPrice: item.product.sellingPrice * item.quantity,
      }));

      const inventoryMvs = cart.map((item) => ({
        id: generateId('mv'),
        branchId: user.branchId || 'br_mercato_main',
        productId: item.product.id,
        quantityDelta: -item.quantity,
        type: 'SALE' as const,
        referenceId: orderId,
        createdAt: new Date().toISOString(),
        syncStatus: 'PENDING' as const,
      }));

      // Write to IndexedDB inside a transaction
      await db.transaction('rw', [db.salesOrders, db.salesOrderItems, db.inventoryMovements, db.customers], async () => {
        await db.salesOrders.add(newOrder);
        await db.salesOrderItems.bulkAdd(orderItems);
        await db.inventoryMovements.bulkAdd(inventoryMvs);

        // Adjust local outstanding balance for customer if CREDIT sale
        if (paymentMode === 'CREDIT' && selectedCustomerId) {
          const creditAmount = cartTotal - paidAmount;
          if (creditAmount > 0) {
            const currentCust = await db.customers.get(selectedCustomerId);
            if (currentCust) {
              await db.customers.update(selectedCustomerId, {
                outstandingBalance: currentCust.outstandingBalance + creditAmount,
                syncStatus: 'PENDING',
              });
            }
          }
        }
      });

      // Clear POS states
      setCart([]);
      setDiscountAmount(0);
      setPaidAmount(0);
      setSelectedCustomerId('');
      setPaymentMode('CASH');

      // Trigger sync in background immediately
      syncNow();
    } catch (err: any) {
      setCheckoutError(`Error saving order: ${err.message}`);
    }
  };

  // -------------------------------------------------------------
  // Actions: Customers
  // -------------------------------------------------------------
  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName) return;

    try {
      const custId = generateId('cust');
      await db.customers.add({
        id: custId,
        businessId: user.businessId,
        name: newCustName,
        phone: newCustPhone,
        creditLimit: newCustCredit,
        outstandingBalance: 0.0,
        syncStatus: 'PENDING',
      });

      setNewCustName('');
      setNewCustPhone('');
      setNewCustCredit(10000);
      setShowAddCustomer(false);
      
      // Auto select the new customer in POS
      setSelectedCustomerId(custId);
      
      // Trigger sync
      syncNow();
    } catch (err: any) {
      alert(`Failed to save customer: ${err.message}`);
    }
  };

  const handleRegisterPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payCustomerId || payAmount <= 0) return;

    try {
      const paymentId = generateId('pmt');
      const newPayment = {
        id: paymentId,
        businessId: user.businessId,
        customerId: payCustomerId,
        amount: payAmount,
        paymentMode: payMode,
        referenceNumber: payReference,
        createdAt: new Date().toISOString(),
        syncStatus: 'PENDING' as const,
      };

      await db.transaction('rw', [db.customerPayments, db.customers], async () => {
        await db.customerPayments.add(newPayment);
        const currentCust = await db.customers.get(payCustomerId);
        if (currentCust) {
          await db.customers.update(payCustomerId, {
            outstandingBalance: Math.max(0, currentCust.outstandingBalance - payAmount),
            syncStatus: 'PENDING',
          });
        }
      });

      setPayCustomerId('');
      setPayAmount(0);
      setPayReference('');
      setShowPayModal(false);

      // Trigger sync
      syncNow();
    } catch (err: any) {
      alert(`Failed to log payment: ${err.message}`);
    }
  };

  // -------------------------------------------------------------
  // Actions: Inventory
  // -------------------------------------------------------------
  const handleInventoryMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjProductId || adjQty <= 0) return;

    try {
      const delta = adjType === 'STOCK_IN' ? adjQty : -adjQty;
      await db.inventoryMovements.add({
        id: generateId('mv'),
        branchId: user.branchId || 'br_mercato_main',
        productId: adjProductId,
        quantityDelta: delta,
        type: adjType === 'ADJUSTMENT' ? 'ADJUSTMENT' : adjType,
        notes: adjNotes,
        createdAt: new Date().toISOString(),
        syncStatus: 'PENDING',
      });

      setAdjProductId('');
      setAdjQty(10);
      setAdjNotes('');

      // Trigger sync
      syncNow();
    } catch (err: any) {
      alert(`Failed to write movement: ${err.message}`);
    }
  };

  // Filter Catalog
  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(posSearch.toLowerCase()) ||
    p.sku.toLowerCase().includes(posSearch.toLowerCase())
  );

  // -------------------------------------------------------------
  // Render: Auth Page
  // -------------------------------------------------------------
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 text-slate-100 font-sans">
        <div className="w-full max-w-md bg-slate-800 border border-slate-700 rounded-2xl shadow-xl p-8">
          <h2 className="text-3xl font-extrabold text-center tracking-tight text-white mb-2">💼 EBOS Portal</h2>
          <p className="text-sm text-slate-400 text-center mb-6">Ethiopian Business Operating System</p>
          
          {authError && (
            <div className="mb-4 p-3.5 bg-rose-950/50 border border-rose-800 rounded-lg text-rose-200 text-sm flex items-center gap-2">
              <span>⚠️ {authError}</span>
            </div>
          )}
          
          {syncMessage && (
            <div className={`mb-4 p-3.5 border rounded-lg text-sm flex items-center gap-2 ${
              syncMessage.type === 'success' 
                ? 'bg-emerald-950/50 border-emerald-800 text-emerald-200' 
                : 'bg-amber-950/50 border-amber-800 text-amber-200'
            }`}>
              <span>{syncMessage.text}</span>
            </div>
          )}

          <div className="p-4 bg-slate-750 border border-slate-700 rounded-xl text-xs mb-6 text-slate-300">
            <strong className="text-white block mb-1">Demo Credentials (auto-filled):</strong>
            Business ID: <code className="text-blue-400 bg-slate-850 px-1 py-0.5 rounded">bus_mercato_001</code><br />
            Username: <code className="text-blue-400 bg-slate-850 px-1 py-0.5 rounded">almaz</code> | Password: <code className="text-blue-400 bg-slate-850 px-1 py-0.5 rounded">almaz123</code>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Business ID</label>
              <input
                type="text"
                className="w-full px-3.5 py-2.5 bg-slate-850 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white text-sm"
                value={loginBusinessId}
                onChange={(e) => setLoginBusinessId(e.target.value)}
                required
              />
            </div>
            
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Username</label>
              <input
                type="text"
                className="w-full px-3.5 py-2.5 bg-slate-850 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white text-sm"
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                required
              />
            </div>
            
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Password</label>
              <input
                type="password"
                className="w-full px-3.5 py-2.5 bg-slate-850 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white text-sm"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm py-3 rounded-lg transition duration-150 cursor-pointer">
              Login ({isOnline ? 'Online' : 'Offline Mode'})
            </button>
          </form>

          <div className="text-center mt-6 text-xs text-slate-400 border-t border-slate-700/50 pt-4">
            Network Status: <span className="font-semibold">{isOnline ? '🟢 Connected (Online)' : '🔴 Disconnected (Offline)'}</span>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // Render: Dashboard / App Shell
  // -------------------------------------------------------------
  const dailySalesTotal = orders
    .filter(o => new Date(o.createdAt).toDateString() === new Date().toDateString())
    .reduce((sum, o) => sum + o.totalAmount, 0);

  const totalOutstandingReceivables = customers.reduce((sum, c) => sum + c.outstandingBalance, 0);

  const lowStockItems = products.filter(p => {
    const bal = stockBalances[p.id] || 0;
    return bal < p.minStockLevel;
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="text-xl font-bold text-blue-600">💼 EBOS</span>
          <span className="text-sm bg-slate-100 text-slate-600 px-3 py-1 rounded-full font-medium">
            {user.businessName} - {user.branchName || 'Central'}
          </span>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Connection status */}
          <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
            isOnline 
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
              : 'bg-rose-50 text-rose-700 border border-rose-200'
          }`}>
            {isOnline ? '🟢 Online' : '🔌 Offline'}
          </span>

          {/* Sync Trigger */}
          <button
            onClick={triggerManualSync}
            disabled={syncing || !isOnline}
            className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-xs px-4 py-2 rounded-lg transition duration-150 cursor-pointer disabled:opacity-50"
          >
            {syncing ? '🔄 Syncing...' : '🔄 Sync Now'}
          </button>

          <button onClick={handleLogout} className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs px-4 py-2 rounded-lg transition duration-150 cursor-pointer">
            Logout
          </button>
        </div>
      </header>

      {/* Main Layout Grid */}
      <div className="flex flex-1">
        {/* Navigation Sidebar */}
        <aside className="w-64 bg-white border-r border-slate-200 p-4 flex flex-col justify-between shrink-0">
          <div className="space-y-1">
            <div
              className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium cursor-pointer transition-colors text-sm ${
                activeTab === 'dashboard' ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-slate-600 hover:bg-slate-50'
              }`}
              onClick={() => { setActiveTab('dashboard'); setSyncMessage(null); }}
            >
              📊 Dashboard
            </div>
            
            <div
              className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium cursor-pointer transition-colors text-sm ${
                activeTab === 'pos' ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-slate-600 hover:bg-slate-50'
              }`}
              onClick={() => { setActiveTab('pos'); setSyncMessage(null); }}
            >
              🛒 Checkout POS
            </div>
            
            <div
              className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium cursor-pointer transition-colors text-sm ${
                activeTab === 'inventory' ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-slate-600 hover:bg-slate-50'
              }`}
              onClick={() => { setActiveTab('inventory'); setSyncMessage(null); }}
            >
              📦 Inventory
            </div>
            
            <div
              className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium cursor-pointer transition-colors text-sm ${
                activeTab === 'customers' ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-slate-600 hover:bg-slate-50'
              }`}
              onClick={() => { setActiveTab('customers'); setSyncMessage(null); }}
            >
              👥 Customers & Credit
            </div>
          </div>
          
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-500">
            User Account:<br />
            <strong className="text-slate-900">{user.fullName}</strong> ({user.role})
          </div>
        </aside>

        {/* Dynamic content view */}
        <main className="flex-1 p-8 overflow-y-auto">
          {syncMessage && (
            <div className={`mb-6 p-4 rounded-xl border text-sm flex items-center gap-2 ${
              syncMessage.type === 'success' 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                : syncMessage.type === 'danger'
                ? 'bg-rose-50 border-rose-200 text-rose-800'
                : 'bg-amber-50 border-amber-200 text-amber-800'
            }`}>
              <span>{syncMessage.type === 'success' ? '✅' : '⚠️'} {syncMessage.text}</span>
            </div>
          )}

          {/* 1. DASHBOARD VIEW */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-slate-800">Dashboard Overview</h2>
              
              {/* Metrics Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Today's Sales (Local Term)</div>
                  <div className="text-3xl font-bold text-slate-900">ETB {dailySalesTotal.toLocaleString()}</div>
                </div>
                
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Credit Accounts Receivable</div>
                  <div className="text-3xl font-bold text-slate-900">ETB {totalOutstandingReceivables.toLocaleString()}</div>
                </div>
                
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Low Stock Alert</div>
                  <div className={`text-3xl font-bold ${lowStockItems.length > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {lowStockItems.length} Products
                  </div>
                </div>
              </div>

              {/* Lists Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Orders */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                  <h3 className="text-lg font-bold text-slate-900 mb-4">Recent Sales Orders (Offline/Online)</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50">
                          <th className="py-2.5 px-4 font-semibold text-slate-600 text-xs">Order ID</th>
                          <th className="py-2.5 px-4 font-semibold text-slate-600 text-xs">Total Amount</th>
                          <th className="py-2.5 px-4 font-semibold text-slate-600 text-xs">Method</th>
                          <th className="py-2.5 px-4 font-semibold text-slate-600 text-xs">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.length === 0 ? (
                          <tr><td colSpan={4} className="py-4 text-center text-slate-400">No sales transactions logged.</td></tr>
                        ) : (
                          orders.map((o) => (
                            <tr key={o.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                              <td className="py-3 px-4 font-mono text-slate-600">{o.id.substring(0, 14)}...</td>
                              <td className="py-3 px-4 font-semibold text-slate-900">ETB {o.totalAmount}</td>
                              <td className="py-3 px-4 text-slate-700"><span className="text-xs bg-slate-100 px-2 py-0.5 rounded font-medium">{o.paymentMode}</span></td>
                              <td className="py-3 px-4">
                                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                                  o.syncStatus === 'SYNCED' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                                }`}>
                                  {o.syncStatus}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Low Stock Warning */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                  <h3 className="text-lg font-bold text-slate-900 mb-4">Stock Replenishment Alerts</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50">
                          <th className="py-2.5 px-4 font-semibold text-slate-600 text-xs">Product</th>
                          <th className="py-2.5 px-4 font-semibold text-slate-600 text-xs">Current Stock</th>
                          <th className="py-2.5 px-4 font-semibold text-slate-600 text-xs">Min Target</th>
                        </tr>
                      </thead>
                      <tbody>
                        {lowStockItems.length === 0 ? (
                          <tr><td colSpan={3} className="py-4 text-center text-emerald-600 font-semibold">✅ All items are healthy.</td></tr>
                        ) : (
                          lowStockItems.map((p) => {
                            const bal = stockBalances[p.id] || 0;
                            return (
                              <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                                <td className="py-3 px-4 text-slate-900 font-medium">{p.name} <code className="text-slate-400 text-xs">({p.sku})</code></td>
                                <td className="py-3 px-4 text-rose-600 font-bold">{bal} {p.unitOfMeasure}</td>
                                <td className="py-3 px-4 text-slate-500">{p.minStockLevel} {p.unitOfMeasure}</td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2. CHECKOUT POS VIEW */}
          {activeTab === 'pos' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-140px)]">
              {/* Product Catalog */}
              <div className="lg:col-span-2 flex flex-col gap-4 overflow-y-auto pr-2">
                <div className="sticky top-0 bg-slate-50 pb-2 z-5">
                  <input
                    type="text"
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm shadow-sm"
                    placeholder="🔍 Search product catalog by name or SKU..."
                    value={posSearch}
                    onChange={(e) => setPosSearch(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {filteredProducts.map((p) => {
                    const stock = stockBalances[p.id] || 0;
                    const isLow = stock < p.minStockLevel;
                    return (
                      <div
                        key={p.id}
                        className="bg-white border border-slate-200 rounded-xl p-4 cursor-pointer hover:border-blue-500 hover:shadow-md transition duration-150 flex flex-col justify-between h-36"
                        onClick={() => addToCart(p)}
                      >
                        <div>
                          <div className="font-bold text-slate-800 text-sm line-clamp-2">{p.name}</div>
                          <div className="text-xs text-slate-400 font-mono mt-0.5">{p.sku}</div>
                        </div>
                        <div className="mt-3 pt-2 border-t border-slate-50 flex justify-between items-baseline">
                          <div className="font-extrabold text-blue-600 text-sm">ETB {p.sellingPrice}</div>
                          <div className={`text-xs ${isLow ? 'text-rose-600 font-bold' : 'text-slate-500'}`}>
                            Stock: {stock}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Shopping Cart / Terminal Checkout */}
              <div className="bg-white border border-slate-200 rounded-2xl flex flex-col h-full shadow-sm overflow-hidden">
                <div className="bg-slate-50 border-b border-slate-200 px-4 py-3.5 font-bold text-slate-800 text-sm">
                  🛒 Cart Terminal
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {checkoutError && (
                    <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg">
                      <span>⚠️ {checkoutError}</span>
                    </div>
                  )}

                  {cart.length === 0 ? (
                    <div className="text-center text-slate-400 text-sm mt-12">
                      Cart is empty.<br />Click catalog products to check out.
                    </div>
                  ) : (
                    cart.map((item) => (
                      <div key={item.product.id} className="flex justify-between items-center py-2 border-b border-slate-100">
                        <div className="flex-1 pr-3">
                          <div className="font-semibold text-slate-800 text-sm line-clamp-1">{item.product.name}</div>
                          <div className="text-xs text-slate-400">
                            ETB {item.product.sellingPrice} × {item.quantity}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button className="w-7 h-7 bg-slate-100 hover:bg-slate-250 text-slate-800 rounded font-bold cursor-pointer" onClick={() => updateCartQty(item.product.id, -1)}>-</button>
                          <span className="w-6 text-center text-sm font-semibold">{item.quantity}</span>
                          <button className="w-7 h-7 bg-slate-100 hover:bg-slate-250 text-slate-800 rounded font-bold cursor-pointer" onClick={() => addToCart(item.product)}>+</button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="bg-slate-50 border-t border-slate-200 p-4 space-y-3">
                  {/* Customer Select */}
                  <div>
                    <div className="flex justify-between text-xs font-semibold text-slate-500 uppercase mb-1.5">
                      <span>Client Account</span>
                      <span
                        className="text-blue-600 hover:underline cursor-pointer normal-case"
                        onClick={() => setShowAddCustomer(true)}
                      >
                        + Create Customer
                      </span>
                    </div>
                    <select
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white text-sm"
                      value={selectedCustomerId}
                      onChange={(e) => setSelectedCustomerId(e.target.value)}
                    >
                      <option value="">-- Walk-in Cash Customer --</option>
                      {customers.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} (Outstanding: ETB {c.outstandingBalance})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Payment Mode */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Payment Method</label>
                    <select
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white text-sm"
                      value={paymentMode}
                      onChange={(e) => setPaymentMode(e.target.value as any)}
                    >
                      <option value="CASH">Cash Payment</option>
                      <option value="TELEBIRR">Telebirr Mobile Payment</option>
                      <option value="CBE_BIRR">CBE Birr Mobile Payment</option>
                      <option value="BANK_TRANSFER">Bank Transfer</option>
                      <option value="CREDIT">Business Credit Ledger</option>
                    </select>
                  </div>

                  {/* Pricing summaries */}
                  <div className="space-y-1.5 text-sm border-t border-slate-200/60 pt-3">
                    <div className="flex justify-between text-slate-500">
                      <span>Subtotal</span>
                      <span>ETB {cartSubtotal}</span>
                    </div>

                    <div className="flex justify-between items-center text-slate-500">
                      <span>Discount (ETB)</span>
                      <input
                        type="number"
                        className="w-20 text-right px-2 py-0.5 border border-slate-200 bg-white rounded text-sm text-slate-800"
                        value={discountAmount}
                        onChange={(e) => setDiscountAmount(Number(e.target.value))}
                      />
                    </div>

                    <div className="flex justify-between items-center text-slate-500">
                      <span>Paid Amount (ETB)</span>
                      <input
                        type="number"
                        disabled={paymentMode === 'CREDIT'}
                        className="w-20 text-right px-2 py-0.5 border border-slate-200 bg-white rounded text-sm text-slate-800 disabled:bg-slate-100 disabled:text-slate-500"
                        value={paidAmount}
                        onChange={(e) => setPaidAmount(Number(e.target.value))}
                      />
                    </div>

                    <div className="flex justify-between font-extrabold text-slate-900 text-base border-t border-dashed border-slate-200 pt-2">
                      <span>Total Net</span>
                      <span>ETB {cartTotal.toLocaleString()}</span>
                    </div>
                  </div>

                  <button
                    onClick={handleCheckout}
                    disabled={cart.length === 0}
                    className="w-full mt-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm py-3 rounded-lg transition duration-150 cursor-pointer disabled:opacity-50"
                  >
                    Confirm Order & Receipt
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 3. INVENTORY ADJUSTMENT VIEW */}
          {activeTab === 'inventory' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Product Inventory Table */}
              <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Stock Ledger Balances</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50">
                        <th className="py-2.5 px-4 font-semibold text-slate-600 text-xs">SKU</th>
                        <th className="py-2.5 px-4 font-semibold text-slate-600 text-xs">Product Name</th>
                        <th className="py-2.5 px-4 font-semibold text-slate-600 text-xs">Cost Price</th>
                        <th className="py-2.5 px-4 font-semibold text-slate-600 text-xs">Selling Price</th>
                        <th className="py-2.5 px-4 font-semibold text-slate-600 text-xs">Stock Level</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map((p) => {
                        const bal = stockBalances[p.id] || 0;
                        const isLow = bal < p.minStockLevel;
                        return (
                          <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                            <td className="py-3 px-4 font-mono text-slate-500">{p.sku}</td>
                            <td className="py-3 px-4 font-medium text-slate-900">{p.name}</td>
                            <td className="py-3 px-4 text-slate-700">ETB {p.costPrice}</td>
                            <td className="py-3 px-4 text-slate-700">ETB {p.sellingPrice}</td>
                            <td className={`py-3 px-4 font-bold ${isLow ? 'text-rose-600' : 'text-emerald-600'}`}>
                              {bal} {p.unitOfMeasure}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Log stock movements */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm h-fit">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Register Inventory Movement</h3>
                <form onSubmit={handleInventoryMovement} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Select Product</label>
                    <select
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-lg bg-white text-sm"
                      value={adjProductId}
                      onChange={(e) => setAdjProductId(e.target.value)}
                      required
                    >
                      <option value="">-- Choose Product --</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Movement Action</label>
                    <select
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-lg bg-white text-sm"
                      value={adjType}
                      onChange={(e) => setAdjType(e.target.value as any)}
                    >
                      <option value="STOCK_IN">Stock In (Replenish / Purchase)</option>
                      <option value="STOCK_OUT">Stock Out (Damage / Loss)</option>
                      <option value="ADJUSTMENT">Count Discrepancy Adjustment</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Quantity (Units)</label>
                    <input
                      type="number"
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-lg bg-white text-sm"
                      min="1"
                      value={adjQty}
                      onChange={(e) => setAdjQty(Number(e.target.value))}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Notes / Reference</label>
                    <textarea
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-lg bg-white text-sm"
                      rows={3}
                      placeholder="e.g. GRN Invoice #, Damaged during transit reason"
                      value={adjNotes}
                      onChange={(e) => setAdjNotes(e.target.value)}
                    />
                  </div>

                  <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm py-3 rounded-lg transition duration-150 cursor-pointer">
                    Log Movement
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* 4. CUSTOMERS & PAYMENTS VIEW */}
          {activeTab === 'customers' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Customers Outstanding list */}
              <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
                  <h3 className="text-lg font-bold text-slate-900">Credit Customer Balances</h3>
                  <button onClick={() => setShowPayModal(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-3.5 py-2 rounded-lg transition duration-150 cursor-pointer">
                    💰 Collect Outstanding Balance
                  </button>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50">
                        <th className="py-2.5 px-4 font-semibold text-slate-600 text-xs">Customer Name</th>
                        <th className="py-2.5 px-4 font-semibold text-slate-600 text-xs">Phone</th>
                        <th className="py-2.5 px-4 font-semibold text-slate-600 text-xs">Credit Limit</th>
                        <th className="py-2.5 px-4 font-semibold text-slate-600 text-xs">Outstanding Debt</th>
                        <th className="py-2.5 px-4 font-semibold text-slate-600 text-xs">Sync</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customers.map((c) => (
                        <tr key={c.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                          <td className="py-3 px-4 font-bold text-slate-800">{c.name}</td>
                          <td className="py-3 px-4 text-slate-500 font-mono text-xs">{c.phone || '-'}</td>
                          <td className="py-3 px-4 text-slate-700">ETB {c.creditLimit.toLocaleString()}</td>
                          <td className={`py-3 px-4 font-extrabold ${
                            c.outstandingBalance > 0 ? 'text-rose-600' : 'text-slate-400'
                          }`}>
                            ETB {c.outstandingBalance.toLocaleString()}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                              c.syncStatus === 'SYNCED' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                            }`}>
                              {c.syncStatus}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Add Customer Panel */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm h-fit">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Add Credit Account</h3>
                <form onSubmit={handleAddCustomer} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Customer Name</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-lg bg-white text-sm"
                      value={newCustName}
                      onChange={(e) => setNewCustName(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Phone Number</label>
                    <input
                      type="tel"
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-lg bg-white text-sm"
                      placeholder="+2519xxxxxxxx"
                      value={newCustPhone}
                      onChange={(e) => setNewCustPhone(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Credit Limit (ETB)</label>
                    <input
                      type="number"
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-lg bg-white text-sm"
                      value={newCustCredit}
                      onChange={(e) => setNewCustCredit(Number(e.target.value))}
                    />
                  </div>

                  <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm py-3 rounded-lg transition duration-150 cursor-pointer">
                    Save Account
                  </button>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* MODAL 1: ADD CUSTOMER POPUP (POS SHORTCUT) */}
      {showAddCustomer && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Create Customer Account</h3>
            <form onSubmit={handleAddCustomer} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Customer Name</label>
                <input
                  type="text"
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg bg-white text-sm"
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Phone Number</label>
                <input
                  type="tel"
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg bg-white text-sm"
                  placeholder="+2519xxxxxxxx"
                  value={newCustPhone}
                  onChange={(e) => setNewCustPhone(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Credit Limit (ETB)</label>
                <input
                  type="number"
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg bg-white text-sm"
                  value={newCustCredit}
                  onChange={(e) => setNewCustCredit(Number(e.target.value))}
                />
              </div>

              <div className="flex gap-3 pt-3">
                <button type="button" className="w-1/2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm py-2.5 rounded-lg transition duration-150 cursor-pointer" onClick={() => setShowAddCustomer(false)}>
                  Cancel
                </button>
                <button type="submit" className="w-1/2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm py-2.5 rounded-lg transition duration-150 cursor-pointer">
                  Save & Select
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: REGISTER PAYMENT POPUP */}
      {showPayModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Register Credit Debt Collection</h3>
            <form onSubmit={handleRegisterPayment} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Select Debtor</label>
                <select
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg bg-white text-sm"
                  value={payCustomerId}
                  onChange={(e) => setPayCustomerId(e.target.value)}
                  required
                >
                  <option value="">-- Choose Customer --</option>
                  {customers.filter(c => c.outstandingBalance > 0).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} (Debt: ETB {c.outstandingBalance})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Amount Collected (ETB)</label>
                <input
                  type="number"
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg bg-white text-sm"
                  min="1"
                  value={payAmount}
                  onChange={(e) => setPayAmount(Number(e.target.value))}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Payment Method</label>
                <select
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg bg-white text-sm"
                  value={payMode}
                  onChange={(e) => setPayMode(e.target.value as any)}
                >
                  <option value="CASH">Cash</option>
                  <option value="TELEBIRR">Telebirr Mobile Payment</option>
                  <option value="CBE_BIRR">CBE Birr Mobile Payment</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Reference / Tx Code</label>
                <input
                  type="text"
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg bg-white text-sm"
                  placeholder="e.g. Telebirr reference code"
                  value={payReference}
                  onChange={(e) => setPayReference(e.target.value)}
                />
              </div>

              <div className="flex gap-3 pt-3">
                <button type="button" className="w-1/2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm py-2.5 rounded-lg transition duration-150 cursor-pointer" onClick={() => setShowPayModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="w-1/2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm py-2.5 rounded-lg transition duration-150 cursor-pointer">
                  Log Collection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
