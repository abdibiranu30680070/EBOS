// ─────────────────────────────────────────────
// PosSalesOrderForm — Full Odoo-Style Sales Order Form
// Replaces Kanban catalog grid with clean Add a Line table form
// ─────────────────────────────────────────────

import { useState } from 'react';
import { FormField, selectClass, inputClass } from '../../components/ui/FormField.jsx';
import { SearchableProductSelect } from '../../components/common/SearchableProductSelect.jsx';

export function PosSalesOrderForm({
  products = [],
  customers = [],
  stockBalances = {},
  selectedCustomerId, setSelectedCustomerId,
  discountAmount,     setDiscountAmount,
  paidAmount,         setPaidAmount,
  paymentMode,        setPaymentMode,
  checkoutError,
  onCheckout,
  onShowAddCustomer,
  onShowCollectPayment,
  user,
}) {
  // Odoo-style order lines state
  const [lines, setLines] = useState([
    { id: 'line_1', productId: '', quantity: 1, unitPrice: 0 }
  ]);

  // Selected customer object for credit debt checking
  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);

  // Line actions
  const addLine = () => {
    setLines(prev => [
      ...prev,
      { id: 'line_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4), productId: '', quantity: 1, unitPrice: 0 }
    ]);
  };

  const removeLine = (id) => {
    if (lines.length === 1) {
      // Clear first line instead of removing completely
      setLines([{ id: 'line_' + Date.now(), productId: '', quantity: 1, unitPrice: 0 }]);
      return;
    }
    setLines(prev => prev.filter(l => l.id !== id));
  };

  const updateLine = (id, field, value) => {
    setLines(prev => prev.map(line => {
      if (line.id !== id) return line;

      const updated = { ...line, [field]: value };

      // Auto-fill selling price when product is selected
      if (field === 'productId') {
        const prod = products.find(p => p.id === value);
        if (prod) {
          updated.unitPrice = prod.sellingPrice || 0;
        }
      }
      return updated;
    }));
  };

  // Derived totals
  const validLines   = lines.filter(l => l.productId && Number(l.quantity) > 0);
  const cartSubtotal = validLines.reduce((sum, l) => sum + ((Number(l.quantity) || 0) * (Number(l.unitPrice) || 0)), 0);
  const cartTotal    = Math.max(0, cartSubtotal - discountAmount);
  const unpaidCredit = Math.max(0, cartTotal - paidAmount);

  // Auto-fill paid amount when paymentMode or total changes
  const handlePaymentModeChange = (newMode) => {
    setPaymentMode(newMode);
    setPaidAmount(newMode === 'CREDIT' ? 0 : cartTotal);
  };

  const handleConfirmOrder = (e) => {
    e.preventDefault();
    
    // Validate customer selection for partial payments
    if (paidAmount < cartTotal && !selectedCustomerId) {
      const remaining = cartTotal - paidAmount;
      onCheckout({ error: `Customer Account Required: Paying less than total (ETB ${remaining.toLocaleString()} remaining) requires selecting a Customer account to save as credit.` });
      return;
    }
    
    const formattedPayload = validLines.map(line => {
      const prod = products.find(p => p.id === line.productId);
      return {
        product: prod || { id: line.productId, name: 'Product', sellingPrice: Number(line.unitPrice) || 0 },
        productId: line.productId,
        productName: prod?.name,
        quantity: Number(line.quantity) || 1,
        unitPrice: Number(line.unitPrice) || 0,
      };
    });
    onCheckout(formattedPayload);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col h-full">
      
      {/* ── Form Top Bar Header ────────────────────── */}
      <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 shrink-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
            <span>🛒</span> Point of Sale — Sales Order Form
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">Create sales order line-by-line in Odoo format</p>
        </div>

        <div className="flex items-center gap-4 text-right">
          <div>
            <span className="text-xs text-slate-500 block uppercase font-bold tracking-wider">Subtotal</span>
            <span className="text-sm font-bold text-slate-700">ETB {cartSubtotal.toLocaleString()}</span>
          </div>
          <div className="pl-4 border-l border-slate-200">
            <span className="text-xs text-slate-500 block uppercase font-bold tracking-wider">Total Amount</span>
            <span className="text-xl font-extrabold text-blue-700">ETB {cartTotal.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <form onSubmit={handleConfirmOrder} className="p-6 overflow-y-auto flex-1 flex flex-col space-y-6">
        
        {/* Checkout / Form Error Alert */}
        {checkoutError && (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl leading-relaxed font-semibold">
            ⚠️ {checkoutError}
          </div>
        )}

        {/* ── Top Level Header Fields (Customer & Payment Mode) ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50/60 p-4 rounded-2xl border border-slate-200">
          
          {/* Customer selector */}
          <FormField label="Customer Account">
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
                  className="shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl cursor-pointer transition-colors shadow-xs"
                  title="Pay customer credit / collect debt"
                >
                  💰 Pay Credit
                </button>
              )}

              <button
                type="button"
                onClick={onShowAddCustomer}
                className="shrink-0 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs px-3.5 py-2.5 rounded-xl cursor-pointer transition-colors"
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
              onChange={e => handlePaymentModeChange(e.target.value)}
            >
              <option value="CASH">💵 Cash</option>
              <option value="TELEBIRR">📱 Telebirr</option>
              <option value="CBE_BIRR">🏦 CBE Birr</option>
              <option value="CREDIT">📑 Credit (Debt Account)</option>
            </select>
          </FormField>
        </div>

        {/* ── Odoo-Style Order Lines Table ──────────────────────── */}
        <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50/50 flex-1 flex flex-col min-h-[240px]">
          <div className="px-5 py-3 bg-slate-100/90 border-b border-slate-200 flex items-center justify-between text-xs font-extrabold text-slate-700 uppercase tracking-wider">
            <span className="flex items-center gap-2">
              <span>📋</span>
              <span>Order Lines</span>
            </span>
            <span className="text-slate-500 font-bold">{validLines.length} line{validLines.length !== 1 ? 's' : ''} configured</span>
          </div>

          <div className="divide-y divide-slate-200 overflow-y-auto max-h-[360px]">
            {lines.map((line, index) => {
              const subtotal = (Number(line.quantity) || 0) * (Number(line.unitPrice) || 0);
              const selectedProd = products.find(p => p.id === line.productId);
              const currentStock  = selectedProd ? (stockBalances[selectedProd.id] || 0) : null;

              return (
                <div key={line.id} className="p-3 bg-white flex flex-col sm:flex-row items-center gap-3 hover:bg-slate-50/80 transition-colors">
                  
                  {/* Line Index */}
                  <span className="text-xs font-extrabold text-slate-400 w-6 shrink-0 text-center">{index + 1}</span>

                  {/* Product Name Selector */}
                  <div className="flex-1 min-w-0 w-full">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5 sm:hidden">Product Name</label>
                    <SearchableProductSelect
                      products={products}
                      selectedProductId={line.productId}
                      onSelect={(prodId) => updateLine(line.id, 'productId', prodId)}
                      placeholder="🔍 Search & select product name..."
                    />
                    {currentStock !== null && (
                      <div className="text-[10px] text-slate-400 font-semibold mt-0.5 pl-1">
                        In Stock: <span className={currentStock > 0 ? 'text-emerald-600 font-bold' : 'text-rose-500 font-bold'}>{currentStock}</span> units
                      </div>
                    )}
                  </div>

                  {/* Quantity Input */}
                  <div className="w-full sm:w-28 shrink-0">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5 sm:hidden">Quantity</label>
                    <input
                      type="number"
                      min="1"
                      step="any"
                      placeholder="Qty"
                      value={line.quantity}
                      onChange={(e) => updateLine(line.id, 'quantity', Number(e.target.value))}
                      onClick={(e) => e.target.select()}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-extrabold text-slate-800 text-center focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-2xs"
                    />
                  </div>

                  {/* Unit Price Input */}
                  <div className="w-full sm:w-36 shrink-0">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5 sm:hidden">Unit Price (ETB)</label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-2 text-[10px] text-slate-400 font-bold">ETB</span>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        placeholder="Price"
                        value={line.unitPrice}
                        onChange={(e) => updateLine(line.id, 'unitPrice', Number(e.target.value))}
                        onClick={(e) => e.target.select()}
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-extrabold text-slate-800 text-right focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-2xs"
                      />
                    </div>
                  </div>

                  {/* Line Subtotal */}
                  <div className="w-full sm:w-32 text-right shrink-0">
                    <span className="text-[10px] text-slate-400 uppercase font-bold sm:hidden block">Subtotal</span>
                    <span className="font-extrabold text-xs text-slate-800">
                      ETB {subtotal.toLocaleString()}
                    </span>
                  </div>

                  {/* Remove Line Button */}
                  <button
                    type="button"
                    onClick={() => removeLine(line.id)}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors shrink-0 cursor-pointer"
                    title="Remove line"
                  >
                    🗑️
                  </button>
                </div>
              );
            })}
          </div>

          {/* Odoo Style "Add a line" Action Bar */}
          <div className="p-3 bg-slate-100/70 border-t border-slate-200">
            <button
              type="button"
              onClick={addLine}
              className="w-full py-3 px-4 bg-white hover:bg-blue-50/70 border-2 border-dashed border-blue-300 hover:border-blue-500 text-blue-600 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs active:scale-[0.99]"
            >
              <span className="text-base font-extrabold">➕</span>
              <span>Add a line</span>
            </button>
          </div>
        </div>

        {/* ── Order Summary & Payment Amounts Footer ──────────── */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            {/* Subtotal Display */}
            <div>
              <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-1">Subtotal</label>
              <div className="text-base font-extrabold text-slate-800">ETB {cartSubtotal.toLocaleString()}</div>
            </div>

            {/* Discount Input */}
            <div>
              <label htmlFor="pos-discount-input" className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-1">Discount (ETB)</label>
              <input
                id="pos-discount-input"
                type="number"
                min="0"
                step="any"
                value={discountAmount}
                onChange={e => setDiscountAmount(Number(e.target.value))}
                onClick={e => e.target.select()}
                className={`${inputClass} font-bold text-slate-800`}
              />
            </div>

            {/* Amount Paid Input */}
            <div>
              <label htmlFor="pos-paid-input" className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-1">Amount Paid (ETB)</label>
              <input
                id="pos-paid-input"
                type="number"
                min="0"
                step="any"
                value={paidAmount}
                onChange={e => setPaidAmount(Number(e.target.value))}
                onClick={e => e.target.select()}
                className={`${inputClass} font-bold text-slate-800`}
              />
            </div>
          </div>

          {/* Partial payment & Credit Risk Warning */}
          {unpaidCredit > 0 ? (
            <div className={`text-xs p-3.5 rounded-xl border ${
              selectedCustomerId ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}>
              {selectedCustomerId ? (
                <div>
                  <span className="font-bold">🔸 Unpaid Credit Balance:</span> ETB {unpaidCredit.toLocaleString()}
                  <p className="text-[11px] text-amber-700 mt-0.5">Will be automatically added to selected customer's credit debt balance.</p>
                </div>
              ) : (
                <div>
                  <span className="font-bold">⚠️ Customer Account Required:</span> Paying less than total (ETB {unpaidCredit.toLocaleString()} remaining) requires selecting a Customer account to save as credit.
                </div>
              )}
            </div>
          ) : paymentMode === 'CREDIT' ? (
            <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-3">
              🔸 Full Credit Sale — ETB {cartTotal.toLocaleString()} will be added to customer credit balance.
            </div>
          ) : null}

          {/* Submit / Confirm Button */}
          <button
            type="submit"
            disabled={validLines.length === 0}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-extrabold text-base py-4 rounded-xl shadow-lg transition-colors cursor-pointer"
          >
            ✅ Confirm Order & Issue Receipt
          </button>
        </div>

      </form>
    </div>
  );
}
