'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowRight, ShoppingBag } from 'lucide-react';
import useCartStore from '../../../lib/cart';
import { storefrontApi } from '../../../lib/api';
import CartItem from '../../../components/cart/CartItem';
import EmptyCart from '../../../components/cart/EmptyCart';

export default function CartPage() {
  const params = useParams();
  const storeSlug = params.storeSlug;

  const [store, setStore] = useState(null);
  const [mounted, setMounted] = useState(false);

  const cart = useCartStore((state) => state.getCart(storeSlug));
  const subtotal = useCartStore((state) => state.getSubtotal(storeSlug));
  const savings = useCartStore((state) => state.getSavings(storeSlug));
  const itemCount = useCartStore((state) => state.getItemCount(storeSlug));

  // Fetch store info for currency
  useEffect(() => {
    setMounted(true);
    storefrontApi
      .getStore(storeSlug)
      .then((data) => setStore(data.store))
      .catch(() => {});
  }, [storeSlug]);

  const currencySymbol = store?.currencySymbol || '$';

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="h-96 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-gray-200 border-t-primary-600 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <ShoppingBag className="w-7 h-7 text-dark" />
          <h1 className="text-2xl sm:text-3xl font-bold text-dark">
            Your Cart
          </h1>
        </div>
        {cart.length > 0 && (
          <p className="text-gray-600">
            {itemCount} {itemCount === 1 ? 'item' : 'items'} in your cart
          </p>
        )}
      </div>

      {cart.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200">
          <EmptyCart storeSlug={storeSlug} />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart items */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-gray-200 px-6">
              {cart.map((item) => (
                <CartItem
                  key={item.productId}
                  item={item}
                  storeSlug={storeSlug}
                  currencySymbol={currencySymbol}
                />
              ))}
            </div>

            <Link
              href={`/${storeSlug}/products`}
              className="inline-flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 font-medium mt-6"
            >
              ← Continue shopping
            </Link>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-gray-200 p-6 sticky top-24">
              <h2 className="font-bold text-dark text-lg mb-4">
                Order Summary
              </h2>

              <div className="space-y-3 pb-4 border-b border-gray-200">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">
                    Subtotal ({itemCount} {itemCount === 1 ? 'item' : 'items'})
                  </span>
                  <span className="font-medium text-dark">
                    {currencySymbol}{subtotal.toFixed(2)}
                  </span>
                </div>

                {savings > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-success">Savings</span>
                    <span className="text-success font-semibold">
                      -{currencySymbol}{savings.toFixed(2)}
                    </span>
                  </div>
                )}

                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Shipping</span>
                  <span className="text-gray-500">Calculated at checkout</span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tax</span>
                  <span className="text-gray-500">Calculated at checkout</span>
                </div>
              </div>

              <div className="flex justify-between items-baseline py-4">
                <span className="font-bold text-dark">Total</span>
                <span className="text-2xl font-bold text-dark">
                  {currencySymbol}{subtotal.toFixed(2)}
                </span>
              </div>

              <Link
                href={`/${storeSlug}/checkout`}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors"
              >
                Proceed to checkout
                <ArrowRight className="w-4 h-4" />
              </Link>

              <p className="text-xs text-center text-gray-500 mt-3">
                Secure checkout powered by Stripe
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}