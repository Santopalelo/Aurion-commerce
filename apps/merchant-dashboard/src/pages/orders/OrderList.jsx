import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingCart, Search, Loader2, DollarSign, Package, Clock,
  TrendingUp, ChevronRight, Mail, AlertCircle, CheckCircle2,
  Truck, XCircle,
} from 'lucide-react';
import clsx from 'clsx';
import EmptyState from '../../components/ui/EmptyState';
import { useOrders } from '../../hooks/useOrders';
import { useDebounce } from '../../hooks/useDebounce';
import { formatPrice } from '../../utils/formatCurrency';
import { formatRelativeTime } from '../../utils/formatDate';

// ============================================
// STATUS BADGE
// ============================================
const StatusBadge = ({ status }) => {
  const config = {
    pending: { label: 'Pending', className: 'bg-gray-100 text-gray-700', icon: Clock },
    confirmed: { label: 'Confirmed', className: 'bg-blue-100 text-blue-700', icon: CheckCircle2 },
    processing: { label: 'Processing', className: 'bg-purple-100 text-purple-700', icon: Package },
    shipped: { label: 'Shipped', className: 'bg-indigo-100 text-indigo-700', icon: Truck },
    delivered: { label: 'Delivered', className: 'bg-green-100 text-green-700', icon: CheckCircle2 },
    cancelled: { label: 'Cancelled', className: 'bg-red-100 text-red-700', icon: XCircle },
    refunded: { label: 'Refunded', className: 'bg-orange-100 text-orange-700', icon: AlertCircle },
    on_hold: { label: 'On Hold', className: 'bg-yellow-100 text-yellow-700', icon: AlertCircle },
  };

  const { label, className, icon: Icon } = config[status] || config.pending;

  return (
    <span className={clsx('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium', className)}>
      <Icon className="w-3 h-3" />
      {label}
    </span>
  );
};

// ============================================
// PAYMENT BADGE
// ============================================
const PaymentBadge = ({ status }) => {
  const config = {
    pending: { label: 'Pending', className: 'bg-gray-100 text-gray-700' },
    paid: { label: 'Paid', className: 'bg-green-100 text-green-700' },
    partially_paid: { label: 'Partial', className: 'bg-yellow-100 text-yellow-700' },
    refunded: { label: 'Refunded', className: 'bg-orange-100 text-orange-700' },
    partially_refunded: { label: 'Partial refund', className: 'bg-orange-100 text-orange-700' },
    failed: { label: 'Failed', className: 'bg-red-100 text-red-700' },
    voided: { label: 'Voided', className: 'bg-gray-100 text-gray-700' },
  };

  const { label, className } = config[status] || config.pending;

  return (
    <span className={clsx('inline-block px-2 py-0.5 rounded-full text-xs font-medium', className)}>
      {label}
    </span>
  );
};

// ============================================
// STATS CARD
// ============================================
const StatCard = ({ label, value, icon: Icon, color = 'primary' }) => {
  const colorClasses = {
    primary: 'bg-primary-50 text-primary-600',
    success: 'bg-green-50 text-green-600',
    warning: 'bg-yellow-50 text-yellow-600',
    info: 'bg-blue-50 text-blue-600',
    purple: 'bg-purple-50 text-purple-600',
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
      <div className={clsx('w-12 h-12 rounded-lg flex items-center justify-center', colorClasses[color])}>
        <Icon className="w-6 h-6" />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-bold text-dark truncate">{value}</p>
        <p className="text-xs text-gray-500 mt-0.5">{label}</p>
      </div>
    </div>
  );
};

// ============================================
// MAIN PAGE
// ============================================
const OrderList = () => {
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);

  const debouncedSearch = useDebounce(search, 400);

  const filters = {
    page,
    limit: 20,
    ...(debouncedSearch && { search: debouncedSearch }),
    ...(statusFilter !== 'all' && { status: statusFilter }),
  };

  const { data, isLoading, isFetching } = useOrders(filters);

  const orders = data?.data || [];
  const meta = data?.meta || {};
  const stats = meta?.stats || {
    total: 0,
    totalRevenue: 0,
    pending: 0,
    processing: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
    unfulfilled: 0,
  };

  const tabs = [
    { value: 'all', label: 'All', count: stats.total },
    { value: 'pending', label: 'Pending', count: stats.pending },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'processing', label: 'Processing', count: stats.processing },
    { value: 'shipped', label: 'Shipped', count: stats.shipped },
    { value: 'delivered', label: 'Delivered', count: stats.delivered },
    { value: 'cancelled', label: 'Cancelled', count: stats.cancelled },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-dark">Orders</h1>
        <p className="text-gray-600 mt-1">
          Manage and fulfill customer orders
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total orders"
          value={stats.total}
          icon={ShoppingCart}
          color="primary"
        />
        <StatCard
          label="Total revenue"
          value={formatPrice(stats.totalRevenue || 0)}
          icon={DollarSign}
          color="success"
        />
        <StatCard
          label="Unfulfilled"
          value={stats.unfulfilled || 0}
          icon={Package}
          color="warning"
        />
        <StatCard
          label="Processing"
          value={stats.processing || 0}
          icon={TrendingUp}
          color="purple"
        />
      </div>

      {/* Filters */}
      <div className="card !p-4 space-y-4">
        {/* Tabs */}
        <div className="flex items-center gap-1 border-b border-gray-200 -mx-4 px-4 -mt-4 pt-2 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => {
                setStatusFilter(tab.value);
                setPage(1);
              }}
              className={clsx(
                'px-4 py-3 text-sm font-medium border-b-2 transition-colors -mb-px whitespace-nowrap',
                statusFilter === tab.value
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-600 hover:text-dark'
              )}
            >
              {tab.label}
              {tab.count > 0 && (
                <span
                  className={clsx(
                    'ml-2 px-2 py-0.5 rounded-full text-xs font-semibold',
                    statusFilter === tab.value
                      ? 'bg-primary-100 text-primary-700'
                      : 'bg-gray-100 text-gray-600'
                  )}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by order number, customer name, or email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm placeholder:text-gray-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all"
          />
          {isFetching && search && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />
          )}
        </div>
      </div>

      {/* Orders */}
      {isLoading ? (
        <div className="card flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        </div>
      ) : orders.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={ShoppingCart}
            title={
              debouncedSearch
                ? 'No orders found'
                : statusFilter !== 'all'
                ? `No ${statusFilter} orders`
                : 'No orders yet'
            }
            description={
              debouncedSearch
                ? `No orders match "${debouncedSearch}"`
                : statusFilter !== 'all'
                ? `You don't have any ${statusFilter} orders right now.`
                : 'When customers place orders, they will appear here.'
            }
          />
        </div>
      ) : (
        <>
          {/* Count */}
          <p className="text-sm text-gray-600">
            Showing <span className="font-semibold text-dark">{orders.length}</span> of{' '}
            <span className="font-semibold text-dark">{meta.total}</span> orders
          </p>

          {/* Orders Table */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {/* Desktop Table Header */}
            <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase tracking-wider">
              <div className="col-span-2">Order</div>
              <div className="col-span-3">Customer</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-2">Payment</div>
              <div className="col-span-2 text-right">Total</div>
              <div className="col-span-1"></div>
            </div>

            {/* Order Rows */}
            <div className="divide-y divide-gray-100">
              {orders.map((order) => (
                <div
                  key={order._id}
                  onClick={() => navigate(`/orders/${order._id}`)}
                  className="grid grid-cols-1 md:grid-cols-12 gap-4 px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  {/* Order Number */}
                  <div className="md:col-span-2">
                    <p className="font-semibold text-dark">{order.orderNumber}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {formatRelativeTime(order.createdAt)}
                    </p>
                  </div>

                  {/* Customer */}
                  <div className="md:col-span-3 min-w-0">
                    <p className="text-sm font-medium text-dark truncate">
                      {order.customerSnapshot?.firstName} {order.customerSnapshot?.lastName}
                    </p>
                    <p className="text-xs text-gray-500 truncate flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      {order.customerSnapshot?.email}
                    </p>
                  </div>

                  {/* Status */}
                  <div className="md:col-span-2 flex items-center">
                    <StatusBadge status={order.status} />
                  </div>

                  {/* Payment */}
                  <div className="md:col-span-2 flex items-center">
                    <PaymentBadge status={order.paymentStatus} />
                  </div>

                  {/* Total */}
                  <div className="md:col-span-2 md:text-right">
                    <p className="font-bold text-dark">
                      {formatPrice(order.pricing?.total || 0, order.pricing?.currency)}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {order.items?.length || 0} {order.items?.length === 1 ? 'item' : 'items'}
                    </p>
                  </div>

                  {/* Arrow */}
                  <div className="hidden md:flex md:col-span-1 items-center justify-end">
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pagination */}
          {meta.totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <p className="text-sm text-gray-600">
                Page <span className="font-semibold">{meta.page}</span> of{' '}
                <span className="font-semibold">{meta.totalPages}</span>
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 text-sm font-medium bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= meta.totalPages}
                  className="px-3 py-1.5 text-sm font-medium bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
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
};

export default OrderList;