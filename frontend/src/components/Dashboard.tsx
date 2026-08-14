import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { 
  TrendingUp, DollarSign, Users, Package, AlertTriangle, 
  CheckCircle, Clock, ShoppingCart, ArrowUpRight, ArrowDownRight, Layers
} from 'lucide-react';

interface DashboardProps {
  dailySalesTotal?: number;
  totalOutstandingReceivables?: number;
  lowStockItems?: any[];
  orders?: any[];
  customers?: any[];
  products?: any[];
  stockBalances?: { [key: string]: number };
}

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#06b6d4', '#8b5cf6', '#ef4444'];

export default function Dashboard({ 
  dailySalesTotal: initialDailySales = 0, 
  totalOutstandingReceivables: initialReceivables = 0, 
  lowStockItems: initialLowStock = [], 
  orders: initialOrders = [], 
  customers: initialCustomers = [], 
  products: initialProducts = [],
  stockBalances: initialStockBalances = {} 
}: DashboardProps) {
  // Live IndexedDB Queries for Real-Time Updates
  const liveOrders = useLiveQuery(() => db.salesOrders.toArray()) || initialOrders;
  const liveProducts = useLiveQuery(() => db.products.toArray()) || initialProducts;
  const liveCustomers = useLiveQuery(() => db.customers.toArray()) || initialCustomers;
  const liveMovements = useLiveQuery(() => db.inventoryMovements.toArray()) || [];
  const liveOrderItems = useLiveQuery(() => db.salesOrderItems.toArray()) || [];

  // Live Stock Balances Map
  const liveStockBalances = React.useMemo(() => {
    const map: { [productId: string]: number } = {};
    liveMovements.forEach(m => {
      map[m.productId] = (map[m.productId] || 0) + Number(m.quantityDelta || 0);
    });
    return Object.keys(map).length > 0 ? map : initialStockBalances;
  }, [liveMovements, initialStockBalances]);

  // Live Low Stock Items
  const liveLowStock = React.useMemo(() => {
    return liveProducts.filter(p => {
      const bal = liveStockBalances[p.id] || 0;
      return bal <= (p.minStockLevel || 5);
    });
  }, [liveProducts, liveStockBalances]);

  // Financial Live Summary Metrics
  const metrics = React.useMemo(() => {
    const todayStr = new Date().toDateString();
    
    // Total Sales Value (All Time)
    const totalSalesValue = liveOrders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);

    // Today's Sales Value
    const todaysSalesValue = liveOrders
      .filter(o => new Date(o.createdAt).toDateString() === todayStr)
      .reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);

    // Total Purchase / Stock In Value (Inventory Restock Cost)
    const totalPurchaseValue = liveMovements
      .filter(m => m.type === 'STOCK_IN')
      .reduce((sum, m) => {
        const prod = liveProducts.find(p => p.id === m.productId);
        const cost = prod ? Number(prod.costPrice || 0) : 0;
        return sum + (Number(m.quantityDelta || 0) * cost);
      }, 0);

    // Estimated Product Cost of Goods Sold (COGS)
    let estimatedCOGS = 0;
    liveOrderItems.forEach(item => {
      const prod = liveProducts.find(p => p.id === item.productId);
      if (prod) {
        estimatedCOGS += Number(item.quantity || 0) * Number(prod.costPrice || 0);
      }
    });

    // Gross Sales Profit
    const grossSalesProfit = Math.max(0, totalSalesValue - estimatedCOGS);

    // Outstanding Credit Receivables
    const outstandingReceivables = liveCustomers.reduce(
      (sum, c) => sum + Number(c.outstandingBalance || 0), 
      0
    );

    return {
      totalSalesValue,
      todaysSalesValue,
      totalPurchaseValue,
      estimatedCOGS,
      grossSalesProfit,
      outstandingReceivables,
    };
  }, [liveOrders, liveProducts, liveMovements, liveOrderItems, liveCustomers]);

  // 7-Day Live Sales vs Purchase Value Chart Data
  const salesVsPurchaseData = React.useMemo(() => {
    const data = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toDateString();

      // Sales Value for day
      const daySales = liveOrders
        .filter(o => new Date(o.createdAt).toDateString() === dateStr)
        .reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);

      // Purchase Value for day (Stock In)
      const dayPurchase = liveMovements
        .filter(m => m.type === 'STOCK_IN' && new Date(m.createdAt).toDateString() === dateStr)
        .reduce((sum, m) => {
          const prod = liveProducts.find(p => p.id === m.productId);
          const cost = prod ? Number(prod.costPrice || 0) : 0;
          return sum + (Number(m.quantityDelta || 0) * cost);
        }, 0);

      data.push({
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
        SalesValue: daySales,
        PurchaseValue: dayPurchase,
      });
    }
    return data;
  }, [liveOrders, liveMovements, liveProducts]);

  // Live Sales by Payment Method Data
  const paymentMethodData = React.useMemo(() => {
    const methods: { [key: string]: number } = {};
    liveOrders.forEach(o => {
      const mode = o.paymentMode || 'CASH';
      methods[mode] = (methods[mode] || 0) + Number(o.totalAmount || 0);
    });
    return Object.entries(methods).map(([method, total]) => ({
      name: method,
      value: total,
    }));
  }, [liveOrders]);

  // Top Selling Products Report Data
  const topSellingProductsReport = React.useMemo(() => {
    const salesMap: { [productId: string]: { name: string; sku: string; costPrice: number; sellingPrice: number; qtySold: number; totalSalesValue: number } } = {};

    liveOrderItems.forEach(item => {
      const prod = liveProducts.find(p => p.id === item.productId);
      const name = prod?.name || `Product ${item.productId.substring(0, 6)}`;
      const sku = prod?.sku || 'N/A';
      const costPrice = Number(prod?.costPrice || 0);
      const sellingPrice = Number(prod?.sellingPrice || item.unitPrice || 0);

      if (!salesMap[item.productId]) {
        salesMap[item.productId] = {
          name,
          sku,
          costPrice,
          sellingPrice,
          qtySold: 0,
          totalSalesValue: 0,
        };
      }

      salesMap[item.productId].qtySold += Number(item.quantity || 0);
      salesMap[item.productId].totalSalesValue += Number(item.totalPrice || (item.quantity * item.unitPrice) || 0);
    });

    return Object.values(salesMap)
      .sort((a, b) => b.totalSalesValue - a.totalSalesValue)
      .slice(0, 6);
  }, [liveOrderItems, liveProducts]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
            📊 Sales & Purchase Analytics Report
          </h2>
          <p className="text-slate-500 text-sm mt-0.5">Live real-time revenue, stock purchases, and product sales insights</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Live Data Feed Active
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-xl border border-slate-200 text-xs text-slate-500">
            <Clock className="w-3.5 h-3.5" />
            <span>Updated: {new Date().toLocaleTimeString()}</span>
          </div>
        </div>
      </div>

      {/* Primary Financial Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Sales Value */}
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 text-white rounded-2xl p-5 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-indigo-100 text-xs font-bold uppercase tracking-wider">Total Sales Value</span>
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-extrabold">
            ETB {metrics.totalSalesValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <div className="mt-2 text-xs text-indigo-100 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-300" />
            <span>Today: ETB {metrics.todaysSalesValue.toLocaleString()}</span>
          </div>
        </div>

        {/* Total Purchase Restock Value */}
        <div className="bg-gradient-to-br from-blue-600 to-cyan-700 text-white rounded-2xl p-5 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-blue-100 text-xs font-bold uppercase tracking-wider">Stock Purchase Value</span>
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
              <ShoppingCart className="w-5 h-5 text-white" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-extrabold">
            ETB {metrics.totalPurchaseValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <div className="mt-2 text-xs text-blue-100">
            📦 Total Inventory Stock Restock Cost
          </div>
        </div>

        {/* Estimated Gross Sales Profit */}
        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-2xl p-5 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-emerald-100 text-xs font-bold uppercase tracking-wider">Estimated Profit Margin</span>
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
              <ArrowUpRight className="w-5 h-5 text-white" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-extrabold">
            ETB {metrics.grossSalesProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <div className="mt-2 text-xs text-emerald-100">
            📈 Net Profit Value (Sales Revenue - Product Cost)
          </div>
        </div>

        {/* Outstanding Receivables */}
        <div className="bg-gradient-to-br from-purple-600 to-indigo-800 text-white rounded-2xl p-5 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-purple-100 text-xs font-bold uppercase tracking-wider">Customer Receivables</span>
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
              <Users className="w-5 h-5 text-white" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-extrabold">
            ETB {metrics.outstandingReceivables.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <div className="mt-2 text-xs text-purple-100">
            💳 Outstanding Uncollected Credit Balances
          </div>
        </div>
      </div>

      {/* Charts Section: Sales vs Purchase Value */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Sales vs Purchase Trend */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-600" />
              Live Sales Value vs Stock Purchase Trend (7 Days)
            </span>
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={salesVsPurchaseData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="day" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#ffffff', 
                  borderRadius: '12px',
                  border: '1px solid #cbd5e1',
                  boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'
                }}
              />
              <Legend />
              <Bar dataKey="SalesValue" name="Sales Revenue (ETB)" fill="#6366f1" radius={[6, 6, 0, 0]} />
              <Bar dataKey="PurchaseValue" name="Stock Purchase Cost (ETB)" fill="#06b6d4" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Payment Methods Distribution */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-600" />
            Live Sales Revenue by Payment Channel
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={paymentMethodData}
                cx="50%"
                cy="50%"
                innerRadius={65}
                outerRadius={95}
                paddingAngle={5}
                dataKey="value"
              >
                {paymentMethodData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#ffffff', 
                  borderRadius: '12px',
                  border: '1px solid #cbd5e1'
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Live Selling Products Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
              <Package className="w-5 h-5 text-indigo-600" />
              Live Product Sales Performance Report
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Real-time breakdown of sold items, purchase costs, and sales revenue</p>
          </div>
          <span className="text-xs bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full font-bold border border-indigo-100">
            Live Product Sales
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/50">
                <th className="py-3.5 px-5 text-xs font-semibold text-slate-500 uppercase">Product Name</th>
                <th className="py-3.5 px-5 text-xs font-semibold text-slate-500 uppercase">SKU</th>
                <th className="py-3.5 px-5 text-xs font-semibold text-slate-500 uppercase text-right">Purchase (Cost)</th>
                <th className="py-3.5 px-5 text-xs font-semibold text-slate-500 uppercase text-right">Sale Price</th>
                <th className="py-3.5 px-5 text-xs font-semibold text-slate-500 uppercase text-center">Qty Sold</th>
                <th className="py-3.5 px-5 text-xs font-semibold text-slate-500 uppercase text-right">Total Sales Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {topSellingProductsReport.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 text-sm">
                    No product sales recorded yet. Completed sales orders will dynamically appear here in real-time.
                  </td>
                </tr>
              ) : (
                topSellingProductsReport.map(item => (
                  <tr key={item.sku} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-5 font-bold text-slate-800">{item.name}</td>
                    <td className="py-3.5 px-5 text-slate-500 font-mono text-xs">{item.sku}</td>
                    <td className="py-3.5 px-5 text-slate-600 text-right">ETB {item.costPrice.toLocaleString()}</td>
                    <td className="py-3.5 px-5 font-semibold text-slate-800 text-right">ETB {item.sellingPrice.toLocaleString()}</td>
                    <td className="py-3.5 px-5 text-center">
                      <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full text-xs font-bold">
                        {item.qtySold}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 font-bold text-indigo-600 text-right">
                      ETB {item.totalSalesValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Low Stock Alerts */}
      {liveLowStock.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 text-amber-800 font-bold text-base mb-3">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            Replenishment Alert ({liveLowStock.length} Low Stock Products)
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {liveLowStock.slice(0, 6).map(p => (
              <div key={p.id} className="bg-white p-3 rounded-xl border border-amber-100 shadow-2xs flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-800 text-sm">{p.name}</div>
                  <div className="text-xs text-slate-400 font-mono">{p.sku}</div>
                </div>
                <span className="bg-rose-100 text-rose-800 text-xs font-extrabold px-2.5 py-1 rounded-full">
                  {liveStockBalances[p.id] || 0} {p.unitOfMeasure || 'units'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
