// ─────────────────────────────────────────────
// RecentOrdersTable — Last 15 sales orders
// Props: orders
// ─────────────────────────────────────────────

import { SyncBadge } from '../../components/ui/Badge.jsx';

const HEADERS = ['Order ID', 'Amount (ETB)', 'Method', 'Time', 'Sync'];

export function RecentOrdersTable({ orders }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100">
        <h3 className="font-bold text-slate-800">Recent Sales Orders</h3>
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
            {orders.length === 0 ? (
              <tr>
                <td colSpan={HEADERS.length} className="py-10 text-center text-slate-400 text-sm">
                  No sales yet. Head to the POS to register a sale.
                </td>
              </tr>
            ) : (
              orders.map(order => (
                <tr key={order.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                  <td className="py-3.5 px-5 font-mono text-slate-400 text-xs">{order.id.substring(0, 18)}…</td>
                  <td className="py-3.5 px-5 font-bold text-slate-800">{order.totalAmount.toLocaleString()}</td>
                  <td className="py-3.5 px-5">
                    <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium">
                      {order.paymentMode}
                    </span>
                  </td>
                  <td className="py-3.5 px-5 text-slate-400 text-xs">
                    {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="py-3.5 px-5">
                    <SyncBadge status={order.syncStatus} />
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
