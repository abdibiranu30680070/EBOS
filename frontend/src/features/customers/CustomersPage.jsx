// ─────────────────────────────────────────────
// CustomersPage — Customer accounts screen
// Composes CustomerLedgerTable + AddCustomerModal
//              + CollectPaymentModal
// Props: customers, user
// ─────────────────────────────────────────────

import { useState }               from 'react';
import { CustomerLedgerTable }    from './CustomerLedgerTable.jsx';
import { AddCustomerModal }       from './AddCustomerModal.jsx';
import { CollectPaymentModal }    from './CollectPaymentModal.jsx';

export function CustomersPage({ customers, user }) {
  const [showAdd,          setShowAdd]     = useState(false);
  const [collectCustomer,  setCollect]     = useState(null); // customer object or null

  const totalReceivables = customers.reduce((s, c) => s + c.outstandingBalance, 0);

  return (
    <>
      <div className="space-y-6">
        {/* Page header */}
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Customers & Credit</h1>
            <p className="text-slate-400 text-sm mt-0.5">
              Total receivables:&nbsp;
              <strong className={totalReceivables > 0 ? 'text-amber-600' : 'text-emerald-600'}>
                ETB {totalReceivables.toLocaleString()}
              </strong>
            </p>
          </div>

          <button
            id="add-customer-btn"
            onClick={() => setShowAdd(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-4 py-2.5 rounded-xl cursor-pointer transition-colors"
          >
            + New Account
          </button>
        </div>

        {/* Ledger table */}
        <CustomerLedgerTable
          customers={customers}
          onCollectPayment={(customer) => setCollect(customer)}
        />
      </div>

      {/* Add customer modal */}
      <AddCustomerModal
        isOpen={showAdd}
        onClose={() => setShowAdd(false)}
        user={user}
        onSuccess={() => setShowAdd(false)}
      />

      {/* Collect payment modal */}
      <CollectPaymentModal
        isOpen={!!collectCustomer}
        onClose={() => setCollect(null)}
        customer={collectCustomer}
        user={user}
      />
    </>
  );
}
