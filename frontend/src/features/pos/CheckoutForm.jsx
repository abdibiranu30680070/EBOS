// ─────────────────────────────────────────────
// CheckoutForm — Payment config + totals
// Props: customers, cart state + setters, onShowAddCustomer
// ─────────────────────────────────────────────

import { PAYMENT_MODES }                    from '../../lib/constants.js';
import { FormField, selectClass, inputClass } from '../../components/ui/FormField.jsx';

export function CheckoutForm({
  customers,
  selectedCustomerId, setSelectedCustomerId,
  discountAmount,     setDiscountAmount,
  paidAmount,         setPaidAmount,
  paymentMode,        setPaymentMode,
  cartSubtotal,       cartTotal,
  checkoutError,
  onCheckout,
  onShowAddCustomer,
  onShowCollectPayment,
  cartEmpty,
}) {
  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);

  return (
    <div className="flex flex-col h-full">
      {/* ── Payment fields ─────────────────────── */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Checkout error */}
        {checkoutError && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg leading-relaxed">
            ⚠️ {checkoutError}
          </div>
        )}

        {/* Customer selector */}
        <FormField label="Customer">
          <div className="flex gap-2">
            <select
              id="pos-customer-select"
              className={selectClass + ' flex-1'}
              value={selectedCustomerId}
              onChange={e => setSelectedCustomerId(e.target.value)}
            >
              <option value="">— Walk-in / Cash Customer —</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} (Debt: ETB {c.outstandingBalance.toLocaleString()})
                </option>
              ))}
            </select>

            {selectedCustomer && selectedCustomer.outstandingBalance > 0 && (
              <button
                type="button"
                onClick={() => onShowCollectPayment(selectedCustomer)}
                className="shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3 py-2 rounded-xl cursor-pointer transition-colors shadow-xs"
                title="Pay customer credit / collect debt"
              >
                💰 Pay Credit
              </button>
            )}

            <button
              type="button"
              onClick={onShowAddCustomer}
              className="shrink-0 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs px-3 py-2 rounded-xl cursor-pointer transition-colors"
              title="Add new customer"
            >
              + New
            </button>
          </div>
        </FormField>

        {/* Payment method */}
        <FormField label="Payment Method">
          <select
            id="pos-payment-mode"
            className={selectClass}
            value={paymentMode}
            onChange={e => setPaymentMode(e.target.value)}
          >
            {PAYMENT_MODES.map(m => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </FormField>
      </div>

      {/* ── Totals + Checkout ──────────────────── */}
      <div className="bg-slate-50 border-t border-slate-200 p-4 space-y-3">
        {/* Subtotal */}
        <div className="flex justify-between text-sm text-slate-500">
          <span>Subtotal</span>
          <span>ETB {cartSubtotal.toLocaleString()}</span>
        </div>

        {/* Discount */}
        <div className="flex justify-between items-center text-sm text-slate-500">
          <span>Discount (ETB)</span>
          <input
            id="pos-discount"
            type="number"
            min="0"
            className={`${inputClass} w-24 text-right py-1.5`}
            value={discountAmount}
            onChange={e => setDiscountAmount(Number(e.target.value))}
          />
        </div>

        {/* Amount paid */}
        <div className="flex justify-between items-center text-sm text-slate-500">
          <span>Amount Paid (ETB)</span>
          <input
            id="pos-paid-amount"
            type="number"
            min="0"
            step="any"
            className={`${inputClass} w-28 text-right py-1.5 font-bold text-slate-800`}
            value={paidAmount}
            onChange={e => setPaidAmount(Number(e.target.value))}
            onClick={e => e.target.select()}
          />
        </div>

        {/* Grand total */}
        <div className="flex justify-between items-baseline font-extrabold text-slate-900 text-lg border-t border-dashed border-slate-200 pt-3">
          <span>Total Amount</span>
          <span>ETB {cartTotal.toLocaleString()}</span>
        </div>

        {/* Partial payment & Credit indicators */}
        {cartTotal - paidAmount > 0 ? (
          <div className={`text-xs p-3 rounded-xl border ${
            selectedCustomerId
              ? 'bg-amber-50 text-amber-800 border-amber-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}>
            {selectedCustomerId ? (
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold">🔸 Credit Remaining:</span> ETB {(cartTotal - paidAmount).toLocaleString()}
                  <p className="text-[11px] text-amber-700 mt-0.5">Will be added to selected customer's credit balance.</p>
                </div>
              </div>
            ) : (
              <div>
                <span className="font-bold">⚠️ Customer Required:</span> Paying less than total (ETB {(cartTotal - paidAmount).toLocaleString()} remaining) requires selecting a Customer account to save as credit.
              </div>
            )}
          </div>
        ) : paymentMode === 'CREDIT' ? (
          <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-3">
            🔸 Full Credit Sale — ETB {cartTotal.toLocaleString()} will be added to customer credit balance.
          </div>
        ) : null}

        {/* Checkout button */}
        <button
          id="pos-checkout-btn"
          onClick={onCheckout}
          disabled={cartEmpty}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm py-3.5 rounded-xl transition-colors cursor-pointer"
        >
          ✅ Confirm & Issue Receipt
        </button>
      </div>
    </div>
  );
}
