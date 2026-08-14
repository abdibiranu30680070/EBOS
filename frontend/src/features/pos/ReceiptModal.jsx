// ─────────────────────────────────────────────
// ReceiptModal — Post-checkout printable receipt
// Props: isOpen, onClose, order { items, customer,
//        totalAmount, discountAmount, paidAmount,
//        paymentMode, createdAt }, businessInfo
// ─────────────────────────────────────────────

import { Modal } from '../../components/ui/Modal.jsx';
import { PAYMENT_MODE_COLORS } from '../../lib/constants.js';
import { EbosLogo } from '../../components/common/EbosLogo.jsx';

function ReceiptRow({ label, value, bold, large }) {
  return (
    <div className={`flex justify-between items-baseline py-1 ${bold ? 'font-bold' : ''} ${large ? 'text-base' : 'text-sm'}`}>
      <span className="text-slate-500">{label}</span>
      <span className={`text-slate-800 ${bold ? 'font-extrabold' : ''}`}>{value}</span>
    </div>
  );
}

export function ReceiptModal({ isOpen, onClose, order }) {
  if (!order) return null;

  const modeColor = PAYMENT_MODE_COLORS[order.paymentMode] ?? 'bg-slate-100 text-slate-600';
  const changeAmount = Math.max(0, order.paidAmount - order.totalAmount);

  const handlePrint = () => window.print();

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Sale Receipt" size="sm">
      <div id="receipt-content" className="space-y-4">
        {/* Business header */}
        <div className="text-center pb-3 border-b border-dashed border-slate-200 flex flex-col items-center">
          <div className="mb-2">
            <EbosLogo size="sm" showText={false} />
          </div>
          <h2 className="font-extrabold text-slate-900 text-base">{order.businessName ?? 'EBOS Business'}</h2>
          <p className="text-xs text-slate-400">{order.branchName ?? 'Main Branch'}</p>
          <p className="text-xs text-slate-400 mt-1">
            {new Date(order.createdAt).toLocaleString('en-ET', {
              dateStyle: 'medium', timeStyle: 'short',
            })}
          </p>
        </div>

        {/* Order ID */}
        <div className="text-center">
          <span className="text-xs font-mono bg-slate-100 text-slate-500 px-3 py-1 rounded-full">
            #{order.id?.substring(0, 18).toUpperCase()}
          </span>
        </div>

        {/* Items */}
        <div className="space-y-1 border-b border-dashed border-slate-200 pb-3">
          <div className="flex justify-between text-xs font-semibold text-slate-400 uppercase mb-2">
            <span>Item</span><span>Total</span>
          </div>
          {(order.items || []).map((item, i) => (
            <div key={i} className="flex justify-between text-sm">
              <div>
                <span className="font-medium text-slate-800">{item.name || item.productId}</span>
                <span className="text-slate-400 ml-1.5 text-xs">× {item.quantity}</span>
              </div>
              <span className="font-semibold text-slate-800">ETB {item.totalPrice?.toLocaleString()}</span>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="space-y-0.5 border-b border-dashed border-slate-200 pb-3">
          <ReceiptRow label="Subtotal" value={`ETB ${(order.totalAmount + order.discountAmount).toLocaleString()}`} />
          {order.discountAmount > 0 && (
            <ReceiptRow label="Discount" value={`− ETB ${order.discountAmount.toLocaleString()}`} />
          )}
          <ReceiptRow label="Total" value={`ETB ${order.totalAmount.toLocaleString()}`} bold large />
          <ReceiptRow label="Paid" value={`ETB ${order.paidAmount.toLocaleString()}`} />
          {changeAmount > 0 && (
            <ReceiptRow label="Change" value={`ETB ${changeAmount.toLocaleString()}`} bold />
          )}
        </div>

        {/* Payment method + customer */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-500">Payment</span>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${modeColor}`}>
              {order.paymentMode}
            </span>
          </div>
          {order.customerName && (
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-500">Customer</span>
              <span className="text-xs font-semibold text-slate-700">{order.customerName}</span>
            </div>
          )}
          {order.paymentMode === 'CREDIT' && (
            <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 text-center">
              🔸 Credit: ETB {(order.totalAmount - order.paidAmount).toLocaleString()} added to account
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-slate-400 pt-2 border-t border-dashed border-slate-200">
          Thank you for your business!<br />
          <span className="font-mono text-[10px]">Powered by EBOS</span>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-1">
          <button
            onClick={handlePrint}
            className="flex-1 flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm py-2.5 rounded-xl cursor-pointer transition-colors"
          >
            🖨️ Print
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm py-2.5 rounded-xl cursor-pointer transition-colors"
          >
            New Sale
          </button>
        </div>
      </div>
    </Modal>
  );
}
