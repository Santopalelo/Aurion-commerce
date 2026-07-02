'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  User, ShoppingBag, MapPin, ChevronRight,
  TrendingUp, DollarSign, Package,
} from 'lucide-react';
import { storefrontApi } from '../../../lib/api';
import useCustomerAuthStore from '../../../lib/customerAuth';

export default function AccountOverviewPage() {
  const params = useParams();
  const storeSlug = params.storeSlug;

  const customer = useCustomerAuthStore((state) => state.getCustomer(storeSlug));
  const token = useCustomerAuthStore((state) => state.getToken(storeSlug));
  const updateCustomer = useCustomerAuthStore((state) => state.updateCustomer);

  const [store, setStore] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);

  useEffect(() => {
    if (!token) return;

    // Fetch fresh customer data + store + recent orders
    Promise.all([
      storefrontApi.getStore(storeSlug),
      storefrontApi.getMyProfile(storeSlug, token),
      storefrontApi.getMyOrders(storeSlug, token, { limit: 3 }),
    ])
      .then(([storeData, profileData, ordersData]) => {
        setStore(storeData.store);
        updateCustomer(storeSlug, profileData);
        setRecentOrders(ordersData.data || []);
      })
      .catch(() => {});
  }, [storeSlug, token]);

  const currencySymbol = store?.currencySymbol || '$';
  const stats = customer?.stats || {
    totalOrders: 0,
    totalSpent: 0,
    averageOrderValue: 0,
  };

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-dark">
          Hi, {customer?.firstName} 👋
        </h1>
        <p className="text-gray-600 mt-1">
          Welcome back to your account
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center mb-3">
            <ShoppingBag className="w-5 h-5 text-primary-600" />
          </div>
          <p className="text-2xl font-bold text-dark">{stats.totalOrders || 0}</p>
          <p className="text-sm text-gray-500 mt-1">Total orders</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center mb-3">
            <DollarSign className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-dark">
            {currencySymbol}{(stats.totalSpent || 0).toFixed(2)}
          </p>
          <p className="text-sm text-gray-500 mt-1">Total spent</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center mb-3">
            <TrendingUp className="w-5 h-5 text-purple-600" />
          </div>
          <p className="text-2xl font-bold text-dark">
            {currencySymbol}{(stats.averageOrderValue || 0).toFixed(2)}
          </p>
          <p className="text-sm text-gray-500 mt-1">Average order</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          href={`/${storeSlug}/account/orders`}
          className="group bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-all"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-lg bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                <Package className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-dark">My Orders</p>
                <p className="text-sm text-gray-500">Track your purchases</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-primary-600 transition-colors" />
          </div>
        </Link>

        <Link
          href={`/${storeSlug}/account/addresses`}
          className="group bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-all"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-lg bg-orange-50 flex items-center justify-center group-hover:bg-orange-100 transition-colors">
                <MapPin className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="font-semibold text-dark">Addresses</p>
                <p className="text-sm text-gray-500">Manage shipping addresses</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-primary-600 transition-colors" />
          </div>
        </Link>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-dark">Recent orders</h3>
          {recentOrders.length > 0 && (
            <Link
              href={`/${storeSlug}/account/orders`}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              View all →
            </Link>
          )}
        </div>

        {recentOrders.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-gray-100 flex items-center justify-center">
              <ShoppingBag className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-sm text-gray-600 mb-4">
              You haven't placed any orders yet
            </p>
            <Link
              href={`/${storeSlug}/products`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-semibold hover:bg-primary-700 transition-colors"
            >
              Start shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {recentOrders.map((order) => (
              <Link
                key={order._id}
                href={`/${storeSlug}/account/orders/${order.orderNumber}`}
                className="block p-3 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-dark">
                      {order.orderNumber}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {new Date(order.createdAt).toLocaleDateString()} •{' '}
                      {order.items?.length || 0} items
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-dark">
                      {currencySymbol}
                      {(order.pricing?.total || 0).toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500 capitalize mt-0.5">
                      {order.status}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}