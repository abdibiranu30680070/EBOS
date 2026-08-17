// ─────────────────────────────────────────────
// useCart — POS cart state management
// Returns: cart state + all mutation handlers
// ─────────────────────────────────────────────

import { useState, useEffect } from 'react';
import { db } from '../lib/db.js';
import { generateId } from '../lib/generateId.js';
import { syncNow } from '../lib/syncEngine.js';
import { DEFAULT_BRANCH_ID } from '../lib/constants.js';

export function useCart({ user, customers }) {
  const [cart, setCart]                         = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [discountAmount, setDiscountAmount]     = useState(0);
  const [paidAmount, setPaidAmount]             = useState(0);
  const [paymentMode, setPaymentMode]           = useState('CASH');
  const [checkoutError, setCheckoutError]       = useState('');

  // Derived totals
  const cartSubtotal = cart.reduce((sum, item) => sum + item.product.sellingPrice * item.quantity, 0);
  const cartTotal    = Math.max(0, cartSubtotal - discountAmount);

  // Auto-fill paid amount when mode or total changes
  useEffect(() => {
    setPaidAmount(paymentMode === 'CREDIT' ? 0 : cartTotal);
  }, [paymentMode, cartTotal]);

  // ── Cart mutations ────────────────────────────

  const addToCart = (product, quantityToAdd = 1) => {
    const qtyNum = Math.max(1, Number(quantityToAdd) || 1);
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + qtyNum } : item
        );
      }
      return [...prev, { product, quantity: qtyNum }];
    });
  };

  const updateCartQty = (productId, delta) => {
    setCart(prev =>
      prev
        .map(item => {
          if (item.product.id !== productId) return item;
          const newQty = item.quantity + delta;
          return newQty > 0 ? { ...item, quantity: newQty } : null;
        })
        .filter(Boolean)
    );
  };

  const setCartQty = (productId, qty) => {
    const num = Number(qty);
    if (isNaN(num) || num <= 0) {
      setCart(prev => prev.filter(item => item.product.id !== productId));
    } else {
      setCart(prev =>
        prev.map(item =>
          item.product.id === productId ? { ...item, quantity: num } : item
        )
      );
    }
  };

  const clearCart = () => {
    setCart([]);
    setDiscountAmount(0);
    setPaidAmount(0);
    setSelectedCustomerId('');
    setPaymentMode('CASH');
    setCheckoutError('');
  };

  // ── Checkout ──────────────────────────────────

  const handleCheckout = async () => {
    setCheckoutError('');

    if (cart.length === 0) {
      setCheckoutError('Cart is empty. Add a product before checking out.');
      return;
    }

    // Calculate unpaid credit amount
    const unpaidCredit = Math.max(0, cartTotal - paidAmount);

    // If there is an unpaid balance or paymentMode is CREDIT
    if (unpaidCredit > 0 || paymentMode === 'CREDIT') {
      if (!selectedCustomerId) {
        setCheckoutError(`Unpaid balance of ETB ${unpaidCredit.toLocaleString()} requires selecting a customer account to save as credit.`);
        return;
      }
      const customer = customers.find(c => c.id === selectedCustomerId);
      if (customer) {
        const projectedBalance = customer.outstandingBalance + unpaidCredit;
        if (projectedBalance > customer.creditLimit) {
          setCheckoutError(
            `Credit limit exceeded for ${customer.name}! Limit: ETB ${customer.creditLimit.toLocaleString()}, ` +
            `current debt: ETB ${customer.outstandingBalance.toLocaleString()}, projected debt: ETB ${projectedBalance.toLocaleString()}.`
          );
          return;
        }
      }
    }

    try {
      const orderId    = generateId('ord');
      const branchId   = user?.branchId || DEFAULT_BRANCH_ID;
      const now        = new Date().toISOString();

      const newOrder = {
        id: orderId, branchId,
        customerId:     selectedCustomerId || null,
        userId:         user?.id,
        totalAmount:    cartTotal,
        discountAmount,
        paidAmount,
        paymentMode,
        createdAt:      now,
        syncStatus:     'PENDING',
      };

      const orderItems = cart.map(item => ({
        id:         generateId('item'),
        orderId,
        productId:  item.product.id,
        quantity:   item.quantity,
        unitPrice:  item.product.sellingPrice,
        totalPrice: item.product.sellingPrice * item.quantity,
      }));

      const inventoryMvs = cart.map(item => ({
        id:            generateId('mv'),
        branchId,
        productId:     item.product.id,
        quantityDelta: -item.quantity,
        type:          'SALE',
        referenceId:   orderId,
        createdAt:     now,
        syncStatus:    'PENDING',
      }));

      await db.transaction('rw', [db.salesOrders, db.salesOrderItems, db.inventoryMovements, db.customers], async () => {
        await db.salesOrders.add(newOrder);
        await db.salesOrderItems.bulkAdd(orderItems);
        await db.inventoryMovements.bulkAdd(inventoryMvs);

        // Adjust customer outstanding credit balance if there is an unpaid portion
        if (selectedCustomerId && unpaidCredit > 0) {
          const cust = await db.customers.get(selectedCustomerId);
          if (cust) {
            await db.customers.update(selectedCustomerId, {
              outstandingBalance: cust.outstandingBalance + unpaidCredit,
              syncStatus: 'PENDING',
            });
          }
        }
      });

      const receiptOrder = {
        ...newOrder,
        customerName: selectedCustomerId ? customers.find(c => c.id === selectedCustomerId)?.name : null,
        items: cart.map(item => ({
          name: item.product.name,
          productId: item.product.id,
          quantity: item.quantity,
          totalPrice: item.product.sellingPrice * item.quantity,
        })),
        businessName: user?.businessName,
        branchName: user?.branchName
      };

      clearCart();
      syncNow(); // fire-and-forget
      
      return receiptOrder;
    } catch (err) {
      setCheckoutError(`Order failed: ${err.message}`);
      return null;
    }
  };

  return {
    // State
    cart, selectedCustomerId, discountAmount, paidAmount, paymentMode, checkoutError,
    // Derived
    cartSubtotal, cartTotal,
    // Setters
    setSelectedCustomerId, setDiscountAmount, setPaidAmount, setPaymentMode,
    // Actions
    addToCart, updateCartQty, setCartQty, clearCart, handleCheckout,
  };
}
