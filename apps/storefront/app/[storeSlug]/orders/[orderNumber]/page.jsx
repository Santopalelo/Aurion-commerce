'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  CheckCircle2, Package, MapPin, ChevronRight, Mail,
  Truck, ShoppingBag, ImageIcon, ArrowLeft,
} from 'lucide-react';
import { storefrontApi } from '../../../../lib/api';

export default function GuestOrderDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const storeSlug = params.storeSlug;
  const orderNumber = params.orderNumber;
  const email = searchParams.get('email');

  const [order, setOrder] = useState(null);
  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!orderNumber || !email) {
      setError('Missing order information. Please provide both order number and email.');
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
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
          <Package className="w-8 h-8 text-red-600" />
        </div>
        <h1 className="text-2xl font-bold text-dark mb-3">
          Could not load order
        </h1>
        <p className="text-gray-600 mb-8">{error}</p>
        <Link
          href={`/${storeSlug}/track-order`}
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors"
        >
          Track Order
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  const currencySymbol = store?.currencySymbol || '$';

  const statusColors = {
    pending: 'bg-gray-100 text-gray-700',
    confirmed: 'bg-blue-100 text-blue-700',
    processing: 'bg-purple-100 text-purple-700',
    shipped: 'bg-indigo-100 text-indigo-700',
    delivered: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700',
    refunded: 'bg-orange-100 text-orange-700',
    on_hold: 'bg-yellow-100 text-yellow-700',
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <Link
        href={`/${storeSlug}/track-order`}
        className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 mb-6 font-medium"
      >
        <ArrowLeft className="w-4 h-4" />
        Track Another Order
      </Link>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-dark mb-1">
              Order Details
            </h1>
            <p className="text-gray-600 font-mono">{order.orderNumber}</p>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${
              statusColors[order.status] || statusColors.pending
            }`}
          >
            {order.status.replace('_', ' ')}
          </span>
        </div>
        <p className="text-sm text-gray-500">
          Placed on {new Date(order.createdAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      </div>

      {/* Order Items */}
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
            <span className="font-bold text-dark">Total</span>
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
          Shipping Address
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

      <div className="text-center">
        <Link
          href={`/${storeSlug}`}
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors"
        >
          <ShoppingBag className="w-4 h-4" />
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}
