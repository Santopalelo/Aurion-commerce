'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Package, MapPin, Truck, CheckCircle2,
  ImageIcon, Calendar,
} from 'lucide-react';
import { storefrontApi } from '../../../../../lib/api';
import useCustomerAuthStore from '../../../../../lib/customerAuth';

const statusColors = {
  pending: 'bg-gray-100 text-gray-700',
  confirmed: 'bg-blue-100 text-blue-700',
  processing: 'bg-purple-100 text-purple-700',
  shipped: 'bg-indigo-100 text-indigo-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

export default function CustomerOrderDetailPage() {
  const params = useParams();
  const storeSlug = params.storeSlug;
  const orderNumber = params.orderNumber;

  const customer = useCustomerAuthStore((state) => state.getCustomer(storeSlug));

  const [order, setOrder] = useState(null);
  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!customer) return;

    Promise.all([
      storefrontApi.getStore(storeSlug),
      storefrontApi.getOrder(storeSlug, orderNumber, customer.email),
    ])
      .then(([storeData, orderData]) => {
        setStore(storeData.store);
        setOrder(orderData.order);
      })
      .catch((err) => {
        console.error(err);
      })
      .finally(() => setLoading(false));
  }, [storeSlug, orderNumber, customer]);

  const currencySymbol = store?.currencySymbol || '$';

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-16">
        <h2 className="text-xl font-bold text-dark mb-2">Order not found</h2>
        <Link
          href={`/${storeSlug}/account/orders`}
          className="text-primary-600 hover:text-primary-700 font-medium"
        >
          ← Back to orders
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href={`/${storeSlug}/account/orders`}
        className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-primary-600"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to orders
      </Link>

      {/* Header */}
      <div>
        <div className="flex items-center gap-2 flex-wrap mb-2">
          <h1 className="text-2xl font-bold text-dark">
            Order {order.orderNumber}
          </h1>
          <span
            className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
              statusColors[order.status] || statusColors.pending
            }`}
          >
            {order.status}
          </span>
        </div>
        <p className="text-sm text-gray-500 flex items-center gap-1">
          <Calendar className="w-3.5 h-3.5" />
          Placed on {new Date(order.createdAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      </div>

      {/* Tracking */}
      {order.shipping?.trackingNumber && (
        <div className="bg-primary-50 border border-primary-200 rounded-2xl p-5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center flex-shrink-0">
              <Truck className="w-5 h-5 text-primary-600" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-primary-900 mb-1">
                Your order is on its way!
              </p>
              <p className="text-sm text-primary-700">
                {order.shipping.carrier && `${order.shipping.carrier} • `}
                Tracking: {order.shipping.trackingNumber}
              </p>
              {order.shipping.trackingUrl && (
                <a
                  href={order.shipping.trackingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mt-2 text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  Track package →
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Items */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h3 className="font-bold text-dark mb-4 flex items-center gap-2">
          <Package className="w-5 h-5" />
          Items ({order.items.length})
        </h3>

        <div className="space-y-4">
          {order.items.map((item, idx) => (
            <div
              key={idx}
              className="flex gap-4 pb-4 border-b border-gray-100 last:border-0 last:pb-0"
            >
              <div className="w-20 h-20 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="w-8 h-8 text-gray-300" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-dark line-clamp-2">
                  {item.title}
                </p>
                {item.sku && (
                  <p className="text-xs text-gray-500 mt-0.5">SKU: {item.sku}</p>
                )}
                <p className="text-sm text-gray-600 mt-1">
                  Qty: {item.quantity} × {currencySymbol}
                  {Number(item.price).toFixed(2)}
                </p>
              </div>
              <div className="text-right">
                <p className="font-bold text-dark">
                  {currencySymbol}
                  {Number(item.totalPrice).toFixed(2)}
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
              {currencySymbol}{Number(order.pricing?.subtotal).toFixed(2)}
            </span>
          </div>
          {order.pricing?.discountAmount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Discount</span>
              <span>-{currencySymbol}{Number(order.pricing?.discountAmount).toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-gray-600">Shipping</span>
            <span className="font-medium">
              {order.pricing?.shippingCost === 0
                ? <span className="text-green-600">FREE</span>
                : `${currencySymbol}${Number(order.pricing?.shippingCost).toFixed(2)}`
              }
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Tax</span>
            <span className="font-medium">
              {currencySymbol}{Number(order.pricing?.taxAmount).toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between pt-3 border-t border-gray-100">
            <span className="font-bold text-dark">Total</span>
            <span className="font-bold text-dark text-lg">
              {currencySymbol}{Number(order.pricing?.total).toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Shipping address */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h3 className="font-bold text-dark mb-4 flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          Shipping Address
        </h3>
        <div className="text-sm text-gray-700 space-y-0.5">
          <p className="font-medium text-dark">
            {order.shippingAddress?.firstName} {order.shippingAddress?.lastName}
          </p>
          <p>{order.shippingAddress?.line1}</p>
          {order.shippingAddress?.line2 && <p>{order.shippingAddress.line2}</p>}
          <p>
            {order.shippingAddress?.city}
            {order.shippingAddress?.state && `, ${order.shippingAddress.state}`}{' '}
            {order.shippingAddress?.zipCode}
          </p>
          <p>{order.shippingAddress?.country}</p>
        </div>
      </div>
    </div>
  );
}