// ─────────────────────────────────────────────
// CartTerminal — Full Odoo-Style POS Order Lines Table
// Props: products, customers, selectedCustomerId, discountAmount, etc.
// ─────────────────────────────────────────────

import { useState, useEffect }     from 'react';
import { CheckoutForm }            from './CheckoutForm.jsx';
import { SearchableProductSelect } from '../../components/common/SearchableProductSelect.jsx';

export function CartTerminal({
  products = [],
  customers,
  selectedCustomerId, setSelectedCustomerId,
  discountAmount,     setDiscountAmount,
  paidAmount,         setPaidAmount,
  paymentMode,        setPaymentMode,
  checkoutError,
  onCheckout,
  onShowAddCustomer,
  onShowCollectPayment,
  selectedCatalogProduct, // Product clicked from ProductCatalog
  onClearCatalogSelection,
}) {
  // Odoo-style order lines state
  const [lines, setLines] = useState([
    { id: 'line_1', productId: '', quantity: 1, unitPrice: 0 }
  ]);

  // Handle product selected from catalog grid click (populate line instead of auto-add)
  useEffect(() => {
    if (selectedCatalogProduct) {
      setLines(prev => {
        // Find first empty line or append new line
        const emptyIndex = prev.findIndex(l => !l.productId);
        if (emptyIndex !== -1) {
          const updated = [...prev];
          updated[emptyIndex] = {
            ...updated[emptyIndex],
            productId: selectedCatalogProduct.id,
            unitPrice: selectedCatalogProduct.sellingPrice || 0,
          };
          return updated;
        } else {
          return [
            ...prev,
            {
              id: 'line_' + Date.now(),
              productId: selectedCatalogProduct.id,
              quantity: 1,
              unitPrice: selectedCatalogProduct.sellingPrice || 0,
            }
          ];
        }
      });
      onClearCatalogSelection?.();
    }
  }, [selectedCatalogProduct, onClearCatalogSelection]);

  // Line actions
  const addLine = () => {
    setLines(prev => [
      ...prev,
      { id: 'line_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4), productId: '', quantity: 1, unitPrice: 0 }
    ]);
  };

  const removeLine = (id) => {
    if (lines.length === 1) {
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

  // Derived order totals
  const validLines = lines.filter(l => l.productId && Number(l.quantity) > 0);
  const cartSubtotal = validLines.reduce((sum, l) => sum + ((Number(l.quantity) || 0) * (Number(l.unitPrice) || 0)), 0);
  const cartTotal    = Math.max(0, cartSubtotal - discountAmount);

  // Format valid lines for checkout payload
  const handleConfirmCheckout = () => {
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
    <div className="bg-white border border-slate-200 rounded-2xl flex flex-col shadow-sm overflow-hidden h-full">
      {/* Panel header */}
      <div className="bg-slate-50 border-b border-slate-200 px-5 py-3 flex items-center justify-between shrink-0">
        <span className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
          <span>📋</span>
          <span>Order Lines</span>
        </span>
        <span className="text-xs bg-blue-100 text-blue-700 font-bold px-2.5 py-0.5 rounded-full">
          {validLines.length} line{validLines.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Order Lines Table (Odoo Style) */}
      <div className="flex-1 overflow-y-auto p-4 min-h-0 space-y-3">
        <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50/50">
          <div className="divide-y divide-slate-200">
            {lines.map((line, index) => {
              const subtotal = (Number(line.quantity) || 0) * (Number(line.unitPrice) || 0);

              return (
                <div key={line.id} className="p-3 bg-white flex flex-col sm:flex-row items-center gap-2 hover:bg-slate-50/80 transition-colors">
                  {/* Row index */}
                  <span className="text-xs font-extrabold text-slate-400 w-5 shrink-0 text-center">{index + 1}</span>

                  {/* Product selector */}
                  <div className="flex-1 min-w-0 w-full">
                    <SearchableProductSelect
                      products={products}
                      selectedProductId={line.productId}
                      onSelect={(prodId) => updateLine(line.id, 'productId', prodId)}
                      placeholder="🔍 Select product line..."
                    />
                  </div>

                  {/* Quantity input */}
                  <div className="w-full sm:w-20 shrink-0">
                    <input
                      type="number"
                      min="1"
                      step="any"
                      placeholder="Qty"
                      value={line.quantity}
                      onChange={(e) => updateLine(line.id, 'quantity', Number(e.target.value))}
                      onClick={(e) => e.target.select()}
                      className="w-full px-2 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-extrabold text-slate-800 text-center focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  {/* Unit price input */}
                  <div className="w-full sm:w-24 shrink-0">
                    <input
                      type="number"
                      min="0"
                      step="any"
                      placeholder="Price"
                      value={line.unitPrice}
                      onChange={(e) => updateLine(line.id, 'unitPrice', Number(e.target.value))}
                      onClick={(e) => e.target.select()}
                      className="w-full px-2 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-extrabold text-slate-800 text-right focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  {/* Line subtotal */}
                  <div className="w-full sm:w-24 text-right font-extrabold text-xs text-slate-800 shrink-0">
                    ETB {subtotal.toLocaleString()}
                  </div>

                  {/* Remove line button */}
                  <button
                    type="button"
                    onClick={() => removeLine(line.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors shrink-0 cursor-pointer"
                    title="Remove line"
                  >
                    🗑️
                  </button>
                </div>
              );
            })}
          </div>

          {/* Odoo Style "Add a line" Action Bar */}
          <div className="p-3 bg-slate-100/60 border-t border-slate-200">
            <button
              type="button"
              onClick={addLine}
              className="w-full py-2.5 px-4 bg-white hover:bg-blue-50/60 border-2 border-dashed border-blue-300 hover:border-blue-500 text-blue-600 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs active:scale-[0.99]"
            >
              <span className="text-sm font-extrabold">➕</span>
              <span>Add a line</span>
            </button>
          </div>
        </div>
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
        onCheckout={handleConfirmCheckout}
        onShowAddCustomer={onShowAddCustomer}
        onShowCollectPayment={onShowCollectPayment}
        cartEmpty={validLines.length === 0}
      />
    </div>
  );
}
