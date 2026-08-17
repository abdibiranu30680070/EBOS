// ─────────────────────────────────────────────
// PosPage — Point-of-Sale screen
// Composes ProductCatalog + CartTerminal
// Props: products, customers, stockBalances, cartHook
// ─────────────────────────────────────────────

import { useState }            from 'react';
import { PosSalesOrderForm }   from './PosSalesOrderForm.jsx';
import { AddCustomerModal }    from '../customers/AddCustomerModal.jsx';
import { CollectPaymentModal } from '../customers/CollectPaymentModal.jsx';
import { ReceiptModal }        from './ReceiptModal.jsx';

export function PosPage({ products, customers, stockBalances, cartHook, user }) {
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [collectCustomer, setCollectCustomer] = useState(null);
  const [lastOrder, setLastOrder]             = useState(null);

  const {
    selectedCustomerId, setSelectedCustomerId,
    discountAmount,     setDiscountAmount,
    paidAmount,         setPaidAmount,
    paymentMode,        setPaymentMode,
    checkoutError,      handleCheckout,
    setSelectedCustomerId: selectCustomer,
  } = cartHook;

  const handleCustomerAdded = (custId) => {
    selectCustomer(custId);
    setShowAddCustomer(false);
  };

  const onCheckoutClick = async (customLines) => {
    const order = await handleCheckout(customLines);
    if (order) {
      setLastOrder(order);
    }
  };

  return (
    <>
      <div className="h-[calc(100vh-120px)] overflow-hidden">
        <PosSalesOrderForm
          products={products}
          customers={customers}
          stockBalances={stockBalances}
          selectedCustomerId={selectedCustomerId}
          setSelectedCustomerId={setSelectedCustomerId}
          discountAmount={discountAmount}
          setDiscountAmount={setDiscountAmount}
          paidAmount={paidAmount}
          setPaidAmount={setPaidAmount}
          paymentMode={paymentMode}
          setPaymentMode={setPaymentMode}
          checkoutError={checkoutError}
          onCheckout={onCheckoutClick}
          onShowAddCustomer={() => setShowAddCustomer(true)}
          onShowCollectPayment={(customer) => setCollectCustomer(customer)}
          user={user}
        />
      </div>

      {/* Add customer modal */}
      <AddCustomerModal
        isOpen={showAddCustomer}
        onClose={() => setShowAddCustomer(false)}
        user={user}
        onSuccess={handleCustomerAdded}
      />

      {/* Collect payment modal for quick debt repayment */}
      <CollectPaymentModal
        isOpen={!!collectCustomer}
        onClose={() => setCollectCustomer(null)}
        customer={collectCustomer}
        user={user}
      />

      {/* Receipt modal */}
      <ReceiptModal
        isOpen={!!lastOrder}
        onClose={() => setLastOrder(null)}
        order={lastOrder}
      />
    </>
  );
}
