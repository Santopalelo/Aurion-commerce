'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { X, ArrowRight, ShoppingBag } from 'lucide-react';
import useCartStore from '../../lib/cart';
import CartItem from './CartItem';
import EmptyCart from './EmptyCart';

export default function CartDrawer({ storeSlug, currencySymbol = '$' }) {
  // Use state selectors properly so it re-renders
  const isOpen = useCartStore((state) => state.isDrawerOpen);
  const closeDrawer = useCartStore((state) => state.closeDrawer);
  
  // Select the specific cart
  const cart = useCartStore((state) => state.carts[storeSlug] || []);
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const savings = cart.reduce((sum, item) => {
    if (item.compareAtPrice && item.compareAtPrice > item.price) {
      return sum + (item.compareAtPrice - item.price) * item.quantity;
    }
    return sum;
  }, 0);

  // Close on Escape
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') closeDrawer();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, closeDrawer]);

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-fade-in"
          onClick={closeDrawer}
        />
      )}

      {/* Drawer */}
      <aside
        className={`fixed top-0 right-0 z-[60] h-screen w-full sm:w-[420px] bg-white shadow-xl flex flex-col transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-dark" />
            <h2 className="font-bold text-dark">
              Your Cart
              {cart.length > 0 && (
                <span className="text-gray-500 font-normal ml-1">
                  ({cart.reduce((a, b) => a + b.quantity, 0)})
                </span>
              )}
            </h2>
          </div>
          <button
            onClick={closeDrawer}
            className="w-9 h-9 rounded-lg hover:bg-gray-100 flex items-center justify-center"
            aria-label="Close cart"
          >
            <X className="w-5 h-5 text-gray-700" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {cart.length === 0 ? (
            <EmptyCart
              storeSlug={storeSlug}
              onClose={closeDrawer}
              compact
            />
          ) : (
            <div className="px-5">
              {cart.map((item) => (
                <CartItem
                  key={item.productId}
                  item={item}
                  storeSlug={storeSlug}
                  currencySymbol={currencySymbol}
                  compact
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div className="border-t border-gray-200 px-5 py-4 space-y-3 flex-shrink-0">
            {savings > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-success font-medium">You save</span>
                <span className="text-success font-semibold">
                  -{currencySymbol}{savings.toFixed(2)}
                </span>
              </div>
            )}

            <div className="flex justify-between items-baseline">
              <span className="font-semibold text-dark">Subtotal</span>
              <div className="text-right">
                <p className="text-xl font-bold text-dark">
                  {currencySymbol}{subtotal.toFixed(2)}
                </p>
                <p className="text-xs text-gray-500">Shipping & taxes at checkout</p>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <Link
                href={`/${storeSlug}/checkout`}
                onClick={closeDrawer}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors"
              >
                Proceed to checkout
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}