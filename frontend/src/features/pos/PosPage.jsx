// ─────────────────────────────────────────────
// PosPage — Point-of-Sale screen
// Composes ProductCatalog + CartTerminal
// Props: products, customers, stockBalances, cartHook
// ─────────────────────────────────────────────

import { useState }          from 'react';
import { ProductCatalog }    from './ProductCatalog.jsx';
import { CartTerminal }      from './CartTerminal.jsx';
import { AddCustomerModal }  from '../customers/AddCustomerModal.jsx';

import { ReceiptModal }      from './ReceiptModal.jsx';

export function PosPage({ products, customers, stockBalances, cartHook, user }) {
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [lastOrder, setLastOrder]             = useState(null);

  const {
    cart, addToCart, updateCartQty,
    selectedCustomerId, setSelectedCustomerId,
    discountAmount,     setDiscountAmount,
    paidAmount,         setPaidAmount,
    paymentMode,        setPaymentMode,
    cartSubtotal,       cartTotal,
    checkoutError,      handleCheckout,
    setSelectedCustomerId: selectCustomer,
  } = cartHook;

  const handleCustomerAdded = (custId) => {
    selectCustomer(custId);
    setShowAddCustomer(false);
  };

  const onCheckoutClick = async () => {
    const order = await handleCheckout();
    if (order) setLastOrder(order);
  };

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" style={{ height: 'calc(100vh - 148px)' }}>
        {/* Left — Product catalog */}
        <div className="lg:col-span-2 overflow-hidden flex flex-col">
          <h1 className="text-xl font-extrabold text-slate-800 mb-4 shrink-0">Point of Sale</h1>
          <div className="flex-1 overflow-y-auto pr-1">
            <ProductCatalog
              products={products}
              stockBalances={stockBalances}
              onAddToCart={addToCart}
            />
          </div>
        </div>

        {/* Right — Cart terminal */}
        <CartTerminal
          cart={cart}
          customers={customers}
          selectedCustomerId={selectedCustomerId}
          setSelectedCustomerId={setSelectedCustomerId}
          discountAmount={discountAmount}
          setDiscountAmount={setDiscountAmount}
          paidAmount={paidAmount}
          setPaidAmount={setPaidAmount}
          paymentMode={paymentMode}
          setPaymentMode={setPaymentMode}
          cartSubtotal={cartSubtotal}
          cartTotal={cartTotal}
          checkoutError={checkoutError}
          onAddToCart={addToCart}
          onUpdateQty={updateCartQty}
          onCheckout={onCheckoutClick}
          onShowAddCustomer={() => setShowAddCustomer(true)}
        />
      </div>

      {/* Add customer modal */}
      <AddCustomerModal
        isOpen={showAddCustomer}
        onClose={() => setShowAddCustomer(false)}
        user={user}
        onSuccess={handleCustomerAdded}
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
