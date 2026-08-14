import React from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Users, Package, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

interface DashboardProps {
  dailySalesTotal: number;
  totalOutstandingReceivables: number;
  lowStockItems: any[];
  orders: any[];
  customers: any[];
  products: any[];
  stockBalances: { [key: string]: number };
}

const COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];

export default function Dashboard({ 
  dailySalesTotal, 
  totalOutstandingReceivables, 
  lowStockItems, 
  orders, 
  customers, 
  products,
  stockBalances 
}: DashboardProps) {
  // Calculate weekly sales data
  const weeklySalesData = React.useMemo(() => {
    const data = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toDateString();
      const dayTotal = orders
        .filter(o => new Date(o.createdAt).toDateString() === dateStr)
        .reduce((sum, o) => sum + o.totalAmount, 0);
      data.push({
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
        sales: dayTotal,
      });
    }
    return data;
  }, [orders]);

  // Calculate sales by payment method
  const paymentMethodData = React.useMemo(() => {
    const methods: { [key: string]: number } = {};
    orders.forEach(o => {
      methods[o.paymentMode] = (methods[o.paymentMode] || 0) + o.totalAmount;
    });
    return Object.entries(methods).map(([method, total]) => ({
      name: method,
      value: total,
    }));
  }, [orders]);

  // Calculate top selling products
  const topProducts = React.useMemo(() => {
    const productSales: { [key: string]: { name: string; total: number } } = {};
    orders.forEach(o => {
      // This would need to be enhanced with actual order items data
    });
    return Object.values(productSales).sort((a, b) => b.total - a.total).slice(0, 5);
  }, [orders]);

  // Calculate customer credit distribution
  const creditDistribution = React.useMemo(() => {
    const highCredit = customers.filter(c => c.outstandingBalance > 10000).length;
    const mediumCredit = customers.filter(c => c.outstandingBalance > 1000 && c.outstandingBalance <= 10000).length;
    const lowCredit = customers.filter(c => c.outstandingBalance > 0 && c.outstandingBalance <= 1000).length;
    const noCredit = customers.filter(c => c.outstandingBalance === 0).length;
    return [
      { name: 'High (>10K)', value: highCredit },
      { name: 'Medium (1K-10K)', value: mediumCredit },
      { name: 'Low (0-1K)', value: lowCredit },
      { name: 'No Credit', value: noCredit },
    ];
  }, [customers]);

  const MetricCard = ({ 
    title, 
    value, 
    icon: Icon, 
    trend, 
    trendValue, 
    color 
  }: { 
    title: string; 
    value: string | number; 
    icon: any; 
    trend?: 'up' | 'down'; 
    trendValue?: string;
    color: string;
  }) => (
    <div className="card-premium p-6 relative overflow-hidden group">
      <div className={`absolute top-0 right-0 w-32 h-32 ${color} opacity-10 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-500`} />
      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-xl ${color} bg-opacity-20`}>
            <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} />
          </div>
          {trend && (
            <div className={`flex items-center gap-1 text-sm font-semibold ${
              trend === 'up' ? 'text-emerald-600' : 'text-rose-600'
            }`}>
              {trend === 'up' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              <span>{trendValue}</span>
            </div>
          )}
        </div>
        <div className="text-sm font-medium text-slate-500 mb-1">{title}</div>
        <div className="text-3xl font-bold text-slate-900">{value}</div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gradient">Dashboard Overview</h2>
          <p className="text-slate-500 mt-1">Real-time business analytics and insights</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-slate-200 shadow-sm">
            <Clock className="w-4 h-4 text-slate-400" />
            <span className="text-sm text-slate-600">Last updated: {new Date().toLocaleTimeString()}</span>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Today's Sales"
          value={`ETB ${dailySalesTotal.toLocaleString()}`}
          icon={DollarSign}
          trend="up"
          trendValue="+12.5%"
          color="bg-indigo-500"
        />
        <MetricCard
          title="Outstanding Credit"
          value={`ETB ${totalOutstandingReceivables.toLocaleString()}`}
          icon={Users}
          color="bg-purple-500"
        />
        <MetricCard
          title="Total Products"
          value={products.length}
          icon={Package}
          color="bg-cyan-500"
        />
        <MetricCard
          title="Low Stock Alerts"
          value={lowStockItems.length}
          icon={AlertTriangle}
          color={lowStockItems.length > 0 ? 'bg-rose-500' : 'bg-emerald-500'}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Sales Chart */}
        <div className="card-premium p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-500" />
            Weekly Sales Trend
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={weeklySalesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="day" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="sales" 
                stroke="#6366f1" 
                strokeWidth={3}
                dot={{ fill: '#6366f1', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Payment Methods Chart */}
        <div className="card-premium p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-purple-500" />
            Sales by Payment Method
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={paymentMethodData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {paymentMethodData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tables Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="card-premium p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
            <Package className="w-5 h-5 text-cyan-500" />
            Recent Sales Orders
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Order ID</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Amount</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Method</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400">
                      <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>No sales transactions yet</p>
                    </td>
                  </tr>
                ) : (
                  orders.slice(0, 5).map((o) => (
                    <tr key={o.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-4 font-mono text-sm text-slate-600">{o.id.substring(0, 12)}...</td>
                      <td className="py-3 px-4 font-semibold text-slate-900">ETB {o.totalAmount.toLocaleString()}</td>
                      <td className="py-3 px-4">
                        <span className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-700 font-medium">
                          {o.paymentMode}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-xs px-2 py-1 rounded-full font-semibold flex items-center gap-1 w-fit ${
                          o.syncStatus === 'SYNCED' 
                            ? 'bg-emerald-100 text-emerald-700' 
                            : 'bg-amber-100 text-amber-700'
                        }`}>
                          {o.syncStatus === 'SYNCED' ? (
                            <CheckCircle className="w-3 h-3" />
                          ) : (
                            <Clock className="w-3 h-3" />
                          )}
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

        {/* Low Stock Alerts */}
        <div className="card-premium p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-500" />
            Stock Replenishment Alerts
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Product</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Current</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Minimum</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody>
                {lowStockItems.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-emerald-600">
                      <CheckCircle className="w-12 h-12 mx-auto mb-2" />
                      <p className="font-semibold">All stock levels healthy</p>
                    </td>
                  </tr>
                ) : (
                  lowStockItems.slice(0, 5).map((p) => {
                    const bal = stockBalances[p.id] || 0;
                    const isCritical = bal === 0;
                    return (
                      <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-medium text-slate-900">{p.name}</div>
                          <div className="text-xs text-slate-400 font-mono">{p.sku}</div>
                        </td>
                        <td className="py-3 px-4 font-bold text-rose-600">{bal} {p.unitOfMeasure}</td>
                        <td className="py-3 px-4 text-slate-500">{p.minStockLevel} {p.unitOfMeasure}</td>
                        <td className="py-3 px-4">
                          <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                            isCritical 
                              ? 'bg-rose-100 text-rose-700' 
                              : 'bg-amber-100 text-amber-700'
                          }`}>
                            {isCritical ? 'Critical' : 'Low'}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Customer Credit Distribution */}
      <div className="card-premium p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
          <Users className="w-5 h-5 text-purple-500" />
          Customer Credit Distribution
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {creditDistribution.map((item, index) => (
            <div key={item.name} className="bg-slate-50 rounded-xl p-4 border border-slate-100">
              <div className="text-sm text-slate-500 mb-1">{item.name}</div>
              <div className="text-2xl font-bold text-slate-900">{item.value}</div>
              <div className="mt-2 h-2 bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-500" style={{ 
                  width: `${(item.value / customers.length) * 100}%`,
                  backgroundColor: COLORS[index % COLORS.length]
                }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
