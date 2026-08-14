// ─────────────────────────────────────────────
// SuppliersTable — List of suppliers
// Props: suppliers
// ─────────────────────────────────────────────

import { SyncBadge } from '../../components/ui/Badge.jsx';

const HEADERS = ['Supplier Name', 'Sync', 'Actions'];

export function SuppliersTable({ suppliers }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden h-full flex flex-col">
      <div className="px-6 py-4 border-b border-slate-100 shrink-0">
        <h3 className="font-bold text-slate-800">Suppliers</h3>
        <p className="text-xs text-slate-400 mt-0.5">{suppliers.length} registered</p>
      </div>

      <div className="overflow-y-auto flex-1">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 sticky top-0">
              {HEADERS.map(h => (
                <th key={h} className="py-3 px-5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {suppliers.length === 0 ? (
              <tr>
                <td colSpan={HEADERS.length} className="py-10 text-center text-slate-400 text-sm">
                  No suppliers found. Add one to create a Purchase Order.
                </td>
              </tr>
            ) : (
              suppliers.map(s => (
                <tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                  <td className="py-3.5 px-5 font-bold text-slate-800">{s.name}</td>
                  <td className="py-3.5 px-5">
                    <SyncBadge status={s.syncStatus} />
                  </td>
                  <td className="py-3.5 px-5">
                    <button className="text-xs text-blue-600 hover:underline">Edit</button>
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
