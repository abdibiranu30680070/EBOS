// ─────────────────────────────────────────────
// CartTerminal — Right-hand cart panel
// Composes CartItem list + CheckoutForm
// Props: all cart state + customer data + handlers
// ─────────────────────────────────────────────

import { CartItem }      from './CartItem.jsx';
import { CheckoutForm }  from './CheckoutForm.jsx';

export function CartTerminal({
  cart,
  customers,
  selectedCustomerId, setSelectedCustomerId,
  discountAmount,     setDiscountAmount,
  paidAmount,         setPaidAmount,
  paymentMode,        setPaymentMode,
  cartSubtotal,       cartTotal,
  checkoutError,
  onAddToCart,
  onUpdateQty,
  onCheckout,
  onShowAddCustomer,
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl flex flex-col shadow-sm overflow-hidden">
      {/* Panel header */}
      <div className="bg-slate-50 border-b border-slate-200 px-5 py-3.5 flex items-center justify-between shrink-0">
        <span className="font-bold text-slate-800 text-sm">🛒 Cart Terminal</span>
        {cart.length > 0 && (
          <span className="text-xs bg-blue-100 text-blue-700 font-semibold px-2 py-0.5 rounded-full">
            {cart.reduce((s, i) => s + i.quantity, 0)} items
          </span>
        )}
      </div>

      {/* Cart item list */}
      <div className="flex-1 overflow-y-auto px-4 pt-2 pb-0 min-h-0">
        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-slate-400 text-sm gap-1">
            <span className="text-3xl">🛒</span>
            Cart is empty. Click a product to add it.
          </div>
        ) : (
          cart.map(item => (
            <CartItem
              key={item.product.id}
              item={item}
              onIncrement={onAddToCart}
              onDecrement={(productId) => onUpdateQty(productId, -1)}
            />
          ))
        )}
      </div>

      {/* Checkout form */}
      <CheckoutForm
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
        onCheckout={onCheckout}
        onShowAddCustomer={onShowAddCustomer}
        cartEmpty={cart.length === 0}
      />
    </div>
  );
}
