// ─────────────────────────────────────────────
// CustomerLedgerTable — Credit account list
// Props: customers, onCollectPayment
// ─────────────────────────────────────────────

import { SyncBadge } from '../../components/ui/Badge.jsx';

const HEADERS = ['Customer', 'Phone', 'Credit Limit', 'Outstanding Debt', 'Sync', 'Action'];

export function CustomerLedgerTable({ customers, onCollectPayment }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100">
        <h3 className="font-bold text-slate-800">Credit Ledger & Accounts Receivable</h3>
        <p className="text-xs text-slate-400 mt-0.5">{customers.length} account{customers.length !== 1 ? 's' : ''} registered</p>
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
            {customers.length === 0 ? (
              <tr>
                <td colSpan={HEADERS.length} className="py-10 text-center text-slate-400 text-sm">
                  No customers yet. Add an account using the form →
                </td>
              </tr>
            ) : (
              customers.map(c => (
                <tr key={c.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                  <td className="py-3.5 px-5 font-bold text-slate-800">{c.name}</td>
                  <td className="py-3.5 px-5 text-slate-400 text-xs font-mono">{c.phone || '—'}</td>
                  <td className="py-3.5 px-5 text-slate-600">ETB {c.creditLimit.toLocaleString()}</td>
                  <td className={`py-3.5 px-5 font-extrabold ${c.outstandingBalance > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                    ETB {c.outstandingBalance.toLocaleString()}
                    {c.outstandingBalance > 0 && (
                      <span className="ml-1.5 text-xs text-rose-400 font-normal">
                        ({Math.round((c.outstandingBalance / c.creditLimit) * 100)}% used)
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-5">
                    <SyncBadge status={c.syncStatus} />
                  </td>
                  <td className="py-3.5 px-5">
                    {c.outstandingBalance > 0 && (
                      <button
                        onClick={() => onCollectPayment(c)}
                        className="text-xs bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 font-semibold px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors"
                      >
                        💰 Collect
                      </button>
                    )}
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
