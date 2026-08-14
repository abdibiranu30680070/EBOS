// ─────────────────────────────────────────────
// PurchasesPage — Purchase & Supplier Management
// Props: user
// ─────────────────────────────────────────────

import { useState }            from 'react';
import { useLiveQuery }        from 'dexie-react-hooks';
import { db }                  from '../../lib/db.js';
import { SuppliersTable }      from './SuppliersTable.jsx';
import { PurchaseOrderForm }   from './PurchaseOrderForm.jsx';
import { AddSupplierModal }    from './AddSupplierModal.jsx';
import { useToast }            from '../../components/ui/Toast.jsx';

export function PurchasesPage({ user }) {
  const [showAdd, setShowAdd] = useState(false);
  const toast = useToast();

  const suppliers = useLiveQuery(() => db.suppliers.toArray()) || [];
  const products  = useLiveQuery(() => db.products.where('isActive').equals(1).toArray()) || [];
  const purchaseOrders = useLiveQuery(() => db.purchaseOrders.toArray()) || [];

  return (
    <>
      <div className="space-y-6 h-full flex flex-col" style={{ height: 'calc(100vh - 120px)' }}>
        <div className="flex items-end justify-between shrink-0">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Purchases & Receiving</h1>
            <p className="text-slate-400 text-sm mt-0.5">Manage vendors and stock intake ({purchaseOrders.length} POs total)</p>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-4 py-2.5 rounded-xl transition-colors"
          >
            + Add Vendor
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0">
          <SuppliersTable suppliers={suppliers} />
          
          <PurchaseOrderForm 
            suppliers={suppliers} 
            products={products} 
            user={user} 
            onSuccess={() => toast.success('Goods received and stock updated successfully!')}
          />
        </div>
      </div>

      <AddSupplierModal
        isOpen={showAdd}
        onClose={() => setShowAdd(false)}
        user={user}
        onSuccess={(id) => {
          setShowAdd(false);
          toast.success('Vendor added successfully');
        }}
      />
    </>
  );
}
