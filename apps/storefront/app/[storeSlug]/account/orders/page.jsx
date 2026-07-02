'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ShoppingBag, ChevronRight, Package, ImageIcon } from 'lucide-react';
import { storefrontApi } from '../../../../lib/api';
import useCustomerAuthStore from '../../../../lib/customerAuth';

const statusColors = {
  pending: 'bg-gray-100 text-gray-700',
  confirmed: 'bg-blue-100 text-blue-700',
  processing: 'bg-purple-100 text-purple-700',
  shipped: 'bg-indigo-100 text-indigo-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
  refunded: 'bg-orange-100 text-orange-700',
};

export default function MyOrdersPage() {
  const params = useParams();
  const storeSlug = params.storeSlug;
  const token = useCustomerAuthStore((state) => state.getToken(storeSlug));

  const [orders, setOrders] = useState([]);
  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (!token) return;
    setLoading(true);

    Promise.all([
      storefrontApi.getStore(storeSlug),
      storefrontApi.getMyOrders(storeSlug, token, { page, limit: 10 }),
    ])
      .then(([storeData, ordersData]) => {
        setStore(storeData.store);
        setOrders(ordersData.data || []);
        setTotalPages(ordersData.meta?.totalPages || 1);
      })
      .finally(() => setLoading(false));
  }, [storeSlug, token, page]);

  const currencySymbol = store?.currencySymbol || '$';

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-dark">My Orders</h1>
        <p className="text-gray-600 mt-1">
          Track and view your order history
        </p>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 py-16 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
            <ShoppingBag className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-dark mb-2">
            No orders yet
          </h3>
          <p className="text-gray-600 mb-6">
            When you place orders, they'll appear here
          </p>
          <Link
            href={`/${storeSlug}/products`}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary-600 text-white rounded-lg text-sm font-semibold hover:bg-primary-700 transition-colors"
          >
            Start shopping
          </Link>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {orders.map((order) => (
              <Link
                key={order._id}
                href={`/${storeSlug}/account/orders/${order.orderNumber}`}
                className="block bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-md transition-all"
              >
                {/* Header row */}
                <div className="flex items-start justify-between mb-4 pb-4 border-b border-gray-100">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-dark">
                        {order.orderNumber}
                      </p>
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                          statusColors[order.status] || statusColors.pending
                        }`}
                      >
                        {order.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Placed on {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-dark">
                      {currencySymbol}
                      {(order.pricing?.total || 0).toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {order.items?.length || 0} items
                    </p>
                  </div>
                </div>

                {/* Items preview */}
                <div className="flex items-center gap-3 flex-wrap">
                  {order.items?.slice(0, 4).map((item, idx) => (
                    <div
                      key={idx}
                      className="relative w-14 h-14 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0"
                    >
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon className="w-6 h-6 text-gray-300" />
                        </div>
                      )}
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-gray-700 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                        {item.quantity}
                      </span>
                    </div>
                  ))}
                  {order.items?.length > 4 && (
                    <div className="w-14 h-14 rounded-lg bg-gray-50 flex items-center justify-center text-sm font-semibold text-gray-600">
                      +{order.items.length - 4}
                    </div>
                  )}

                  <div className="ml-auto flex items-center gap-1 text-sm text-primary-600 font-medium">
                    View details
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>

                {/* Tracking info if available */}
                {order.shipping?.trackingNumber && (
                  <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-2 text-xs text-gray-600">
                    <Package className="w-3.5 h-3.5" />
                    Tracking: {order.shipping.carrier} • {order.shipping.trackingNumber}
                  </div>
                )}
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <p className="text-sm text-gray-600">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 text-sm font-medium bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= totalPages}
                  className="px-3 py-1.5 text-sm font-medium bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}