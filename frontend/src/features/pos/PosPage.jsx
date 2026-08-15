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
  const [mobileCartOpen, setMobileCartOpen]   = useState(false);

  const {
    cart, addToCart, updateCartQty, setCartQty,
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
    if (order) {
      setLastOrder(order);
      setMobileCartOpen(false);
    }
  };

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 lg:gap-6 relative" style={{ height: 'calc(100vh - 120px)' }}>
        
        {/* Left — Product catalog */}
        <div className="lg:col-span-2 overflow-hidden flex flex-col h-full pb-16 lg:pb-0">
          <div className="flex items-center justify-between mb-4 shrink-0">
            <h1 className="text-xl font-extrabold text-slate-800">Point of Sale</h1>
          </div>
          <div className="flex-1 overflow-y-auto pr-1">
            <ProductCatalog
              products={products}
              stockBalances={stockBalances}
              onAddToCart={addToCart}
            />
          </div>
        </div>

        {/* Floating Mobile Cart Button */}
        <div className="lg:hidden fixed bottom-4 left-4 right-4 z-20">
          <button 
            onClick={() => setMobileCartOpen(true)}
            className="w-full bg-blue-600 text-white font-bold text-lg py-4 rounded-2xl shadow-xl flex items-center justify-between px-6 active:scale-95 transition-transform"
          >
            <span className="flex items-center gap-2">🛒 View Cart</span>
            <div className="flex items-center gap-2">
              <span className="bg-white/20 px-2 py-0.5 rounded-full text-sm">{totalItems}</span>
              <span>ETB {cartTotal.toLocaleString()}</span>
            </div>
          </button>
        </div>

        {/* Right — Cart terminal (Fixed overlay on mobile, static col on desktop) */}
        <div className={`
          fixed inset-0 z-30 bg-white lg:static lg:bg-transparent lg:block transition-transform duration-300
          ${mobileCartOpen ? 'translate-y-0' : 'translate-y-full lg:translate-y-0'}
        `}>
          <div className="h-full w-full flex flex-col pt-12 lg:pt-0 pb-4 px-4 lg:p-0">
            {/* Mobile close button */}
            <button 
              onClick={() => setMobileCartOpen(false)}
              className="lg:hidden absolute top-4 left-4 p-2 bg-slate-100 rounded-full text-slate-600"
            >
              ↓ Close Cart
            </button>
            
            <CartTerminal
              products={products}
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
              onSetQty={setCartQty}
              onCheckout={onCheckoutClick}
              onShowAddCustomer={() => setShowAddCustomer(true)}
            />
          </div>
        </div>
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
