import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Store, Users, ShoppingCart, DollarSign, Package,
  TrendingUp, ArrowRight, Loader2,
} from 'lucide-react';
import clsx from 'clsx';
import { adminService } from '../services/admin.service';
import { formatPrice, formatNumber, formatRelativeTime } from '../utils/format';

const StatCard = ({ icon: Icon, label, value, color = 'primary', subtext }) => {
  const colors = {
    primary: 'bg-primary-50 text-primary-600',
    success: 'bg-green-50 text-green-600',
    warning: 'bg-yellow-50 text-yellow-600',
    info: 'bg-blue-50 text-blue-600',
    purple: 'bg-purple-50 text-purple-600',
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-start justify-between mb-3">
        <div className={clsx('w-12 h-12 rounded-lg flex items-center justify-center', colors[color])}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
      <p className="text-2xl font-bold text-dark">{value}</p>
      <p className="text-sm text-gray-500 mt-1">{label}</p>
      {subtext && <p className="text-xs text-gray-400 mt-2">{subtext}</p>}
    </div>
  );
};

const Dashboard = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: adminService.getDashboard,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  const stats = data?.stats || {};
  const recentStores = data?.recentStores || [];
  const recentOrders = data?.recentOrders || [];
  const storesByStatus = data?.storesByStatus || {};
  const storesByPlan = data?.storesByPlan || {};

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-dark">Platform Overview</h1>
        <p className="text-gray-600 mt-1">
          Aurion Commerce platform-wide statistics
        </p>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Store}
          label="Total stores"
          value={formatNumber(stats.totalStores)}
          subtext={`${stats.activeStores || 0} active`}
          color="primary"
        />
        <StatCard
          icon={Users}
          label="Total merchants"
          value={formatNumber(stats.totalMerchants)}
          color="info"
        />
        <StatCard
          icon={ShoppingCart}
          label="Total orders"
          value={formatNumber(stats.totalOrders)}
          color="purple"
        />
        <StatCard
          icon={DollarSign}
          label="Total revenue"
          value={formatPrice(stats.totalRevenue)}
          subtext={`Avg: ${formatPrice(stats.averageOrderValue)}`}
          color="success"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Orders */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-dark">Recent orders</h3>
              <Link
                to="/stores"
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                View all stores →
              </Link>
            </div>

            {recentOrders.length === 0 ? (
              <p className="text-center text-sm text-gray-500 py-8">
                No orders yet across the platform
              </p>
            ) : (
              <div className="space-y-2">
                {recentOrders.map((order) => (
                  <div
                    key={order._id}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div>
                      <p className="text-sm font-semibold text-dark">
                        {order.orderNumber}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {order.store?.name || 'Unknown store'} •{' '}
                        {formatRelativeTime(order.createdAt)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-dark">
                        {formatPrice(order.pricing?.total)}
                      </p>
                      <p className="text-xs text-gray-500 capitalize mt-0.5">
                        {order.status}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Stores */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-dark">Recently created stores</h3>
              <Link
                to="/stores"
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                View all →
              </Link>
            </div>

            {recentStores.length === 0 ? (
              <p className="text-center text-sm text-gray-500 py-8">
                No stores yet
              </p>
            ) : (
              <div className="space-y-2">
                {recentStores.map((store) => (
                  <Link
                    key={store._id}
                    to={`/stores/${store._id}`}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-bold">
                        {store.name?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-dark">
                          {store.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {store.owner?.email || 'No owner'} •{' '}
                          {formatRelativeTime(store.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={clsx(
                          'inline-block px-2 py-0.5 rounded-full text-xs font-medium capitalize',
                          {
                            'bg-green-100 text-green-700':
                              store.status === 'active',
                            'bg-yellow-100 text-yellow-700':
                              store.status === 'setup',
                            'bg-red-100 text-red-700':
                              store.status === 'suspended',
                            'bg-gray-100 text-gray-700':
                              store.status === 'inactive',
                          }
                        )}
                      >
                        {store.status}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Stores by Status */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-bold text-dark mb-4">Stores by status</h3>
            <div className="space-y-3">
              {Object.entries(storesByStatus).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 capitalize">{status}</span>
                  <span className="text-sm font-bold text-dark">{count}</span>
                </div>
              ))}
              {Object.keys(storesByStatus).length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">
                  No data yet
                </p>
              )}
            </div>
          </div>

          {/* Stores by Plan */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-bold text-dark mb-4">Stores by plan</h3>
            <div className="space-y-3">
              {Object.entries(storesByPlan).map(([plan, count]) => (
                <div key={plan} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 capitalize">{plan}</span>
                  <span className="text-sm font-bold text-dark">{count}</span>
                </div>
              ))}
              {Object.keys(storesByPlan).length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">
                  No data yet
                </p>
              )}
            </div>
          </div>

          {/* Customers */}
          <StatCard
            icon={Users}
            label="Total customers"
            value={formatNumber(stats.totalCustomers)}
            color="warning"
          />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;