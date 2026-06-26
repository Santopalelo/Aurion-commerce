'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  CheckCircle2, Package, MapPin, ChevronRight, Mail,
  Truck, ShoppingBag, ImageIcon,
} from 'lucide-react';
import { storefrontApi } from '../../../../lib/api';

export default function CheckoutSuccessPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const storeSlug = params.storeSlug;
  const orderNumber = searchParams.get('order');
  const email = searchParams.get('email');

  const [order, setOrder] = useState(null);
  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!orderNumber || !email) {
      setError('Missing order information');
      setLoading(false);
      return;
    }

    Promise.all([
      storefrontApi.getOrder(storeSlug, orderNumber, email),
      storefrontApi.getStore(storeSlug),
    ])
      .then(([orderData, storeData]) => {
        setOrder(orderData.order);
        setStore(storeData.store);
      })
      .catch((err) => {
        setError(err.response?.data?.message || 'Could not load order details');
      })
      .finally(() => setLoading(false));
  }, [storeSlug, orderNumber, email]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16 text-center">
        <h1 className="text-2xl font-bold text-dark mb-3">
          Could not load order
        </h1>
        <p className="text-gray-600 mb-8">{error}</p>
        <Link
          href={`/${storeSlug}`}
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors"
        >
          Back to store
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  const currencySymbol = store?.currencySymbol || '$';

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      {/* Success Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-4 animate-fade-in">
          <CheckCircle2 className="w-10 h-10 text-success" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-dark mb-2">
          Order confirmed! 🎉
        </h1>
        <p className="text-gray-600 mb-1">
          Thank you for your order, {order.customerSnapshot?.firstName}!
        </p>
        <p className="text-sm text-gray-500">
          A confirmation has been sent to{' '}
          <span className="font-medium text-dark">{order.customerSnapshot?.email}</span>
        </p>
      </div>

      {/* Order Number Card */}
      <div className="bg-primary-50 border border-primary-100 rounded-2xl p-6 mb-6 text-center">
        <p className="text-sm text-primary-700 mb-1">Your order number</p>
        <p className="text-2xl font-bold text-primary-900 font-mono">
          {order.orderNumber}
        </p>
        <p className="text-xs text-primary-700 mt-2">
          Save this for your records
        </p>
      </div>

      {/* Order Details */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
        <h2 className="font-bold text-dark text-lg mb-5 flex items-center gap-2">
          <Package className="w-5 h-5" />
          Order Items
        </h2>

        <div className="space-y-4">
          {order.items.map((item, idx) => (
            <div key={idx} className="flex gap-3 pb-4 border-b border-gray-100 last:border-0 last:pb-0">
              <div className="relative w-20 h-20 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                {item.image ? (
                  <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="w-8 h-8 text-gray-300" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-dark line-clamp-2">{item.title}</p>
                {item.sku && (
                  <p className="text-xs text-gray-500 mt-0.5">SKU: {item.sku}</p>
                )}
                <p className="text-sm text-gray-600 mt-1">
                  Qty: {item.quantity} × {currencySymbol}{Number(item.price).toFixed(2)}
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-dark">
                  {currencySymbol}{Number(item.totalPrice).toFixed(2)}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="mt-6 pt-6 border-t border-gray-200 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Subtotal</span>
            <span className="font-medium">
              {currencySymbol}{Number(order.pricing.subtotal).toFixed(2)}
            </span>
          </div>
          {order.pricing.discountAmount > 0 && (
            <div className="flex justify-between text-success">
              <span>Discount</span>
              <span>-{currencySymbol}{Number(order.pricing.discountAmount).toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-gray-600">Shipping</span>
            <span className="font-medium">
              {order.pricing.shippingCost === 0
                ? <span className="text-success">FREE</span>
                : `${currencySymbol}${Number(order.pricing.shippingCost).toFixed(2)}`
              }
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Tax</span>
            <span className="font-medium">
              {currencySymbol}{Number(order.pricing.taxAmount).toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between pt-3 border-t border-gray-100">
            <span className="font-bold text-dark">Total paid</span>
            <span className="font-bold text-dark text-lg">
              {currencySymbol}{Number(order.pricing.total).toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Shipping Info */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
        <h2 className="font-bold text-dark text-lg mb-4 flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          Shipping address
        </h2>
        <div className="text-sm text-gray-700 space-y-0.5">
          <p className="font-medium text-dark">
            {order.shippingAddress.firstName} {order.shippingAddress.lastName}
          </p>
          <p>{order.shippingAddress.line1}</p>
          {order.shippingAddress.line2 && <p>{order.shippingAddress.line2}</p>}
          <p>
            {order.shippingAddress.city}
            {order.shippingAddress.state && `, ${order.shippingAddress.state}`}{' '}
            {order.shippingAddress.zipCode}
          </p>
          <p>{order.shippingAddress.country}</p>
          {order.shippingAddress.phone && (
            <p className="pt-1">{order.shippingAddress.phone}</p>
          )}
        </div>
      </div>

      {/* What's Next */}
      <div className="bg-gradient-to-br from-primary-600 to-primary-800 text-white rounded-2xl p-6 mb-6">
        <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
          <Truck className="w-5 h-5" />
          What's next?
        </h2>
        <div className="space-y-3 text-sm">
          <div className="flex items-start gap-2">
            <Mail className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <p>We'll send an email confirmation shortly</p>
          </div>
          <div className="flex items-start gap-2">
            <Package className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <p>Your order will be prepared and shipped soon</p>
          </div>
          <div className="flex items-start gap-2">
            <Truck className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <p>You'll receive tracking info once it ships</p>
          </div>
        </div>
      </div>

      {/* CTAs */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          href={`/${storeSlug}/products`}
          className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors"
        >
          <ShoppingBag className="w-4 h-4" />
          Continue shopping
        </Link>
        <Link
          href={`/${storeSlug}`}
          className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-white border border-gray-300 text-dark rounded-lg font-semibold hover:bg-gray-50 transition-colors"
        >
          Back to store
        </Link>
      </div>
    </div>
  );
}