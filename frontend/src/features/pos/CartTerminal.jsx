import { useState }                from 'react';
import { CartItem }                from './CartItem.jsx';
import { CheckoutForm }            from './CheckoutForm.jsx';
import { SearchableProductSelect } from '../../components/common/SearchableProductSelect.jsx';

export function CartTerminal({
  products = [],
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
  onSetQty,
  onCheckout,
  onShowAddCustomer,
  onShowCollectPayment,
}) {
  const [quickQty, setQuickQty] = useState(1);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl flex flex-col shadow-sm overflow-hidden h-full">
      {/* Panel header */}
      <div className="bg-slate-50 border-b border-slate-200 px-5 py-3 flex items-center justify-between shrink-0">
        <span className="font-bold text-slate-800 text-sm">🛒 Cart Terminal</span>
        {cart.length > 0 && (
          <span className="text-xs bg-blue-100 text-blue-700 font-semibold px-2 py-0.5 rounded-full">
            {cart.reduce((s, i) => s + i.quantity, 0)} items
          </span>
        )}
      </div>

      {/* Direct Quantity & Product Selection Form */}
      <div className="px-4 py-2.5 bg-slate-50/80 border-b border-slate-200 shrink-0 space-y-1">
        <div className="flex items-center gap-2">
          {/* Quantity Input Field */}
          <div className="w-20 shrink-0">
            <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-0.5">Qty</label>
            <input
              type="number"
              min="1"
              step="any"
              value={quickQty}
              onChange={(e) => setQuickQty(e.target.value)}
              onClick={(e) => e.target.select()}
              className="w-full px-2 py-2 bg-white border border-slate-300 rounded-xl text-sm font-extrabold text-slate-800 text-center focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-xs"
            />
          </div>

          {/* Product Select Input Field */}
          <div className="flex-1 min-w-0">
            <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-0.5">Product</label>
            <SearchableProductSelect
              products={products}
              selectedProductId=""
              onSelect={(prodId) => {
                const p = products.find(prod => prod.id === prodId);
                if (p) {
                  const qtyToAdd = Math.max(1, Number(quickQty) || 1);
                  onAddToCart(p, qtyToAdd);
                  setQuickQty(1); // Reset after adding
                }
              }}
              placeholder="🔍 Search & select product..."
            />
          </div>
        </div>
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
              onSetQty={onSetQty}
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
        onShowCollectPayment={onShowCollectPayment}
        cartEmpty={cart.length === 0}
      />
    </div>
  );
}
