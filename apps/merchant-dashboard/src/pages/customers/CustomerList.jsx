import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Users, Search, Mail, Loader2, DollarSign, ShoppingBag,
  User, ChevronRight,
} from 'lucide-react';
import clsx from 'clsx';
import { customerService } from '../../services/customer.service';
import { useDebounce } from '../../hooks/useDebounce';
import { formatPrice } from '../../utils/formatCurrency';
import { formatRelativeTime } from '../../utils/formatDate';
import EmptyState from '../../components/ui/EmptyState';

const StatCard = ({ label, value, icon: Icon, color = 'primary' }) => {
  const colors = {
    primary: 'bg-primary-50 text-primary-600',
    success: 'bg-green-50 text-green-600',
    warning: 'bg-yellow-50 text-yellow-600',
    info: 'bg-blue-50 text-blue-600',
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
      <div className={clsx('w-12 h-12 rounded-lg flex items-center justify-center', colors[color])}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-2xl font-bold text-dark">{value}</p>
        <p className="text-xs text-gray-500 mt-0.5">{label}</p>
      </div>
    </div>
  );
};

const CustomerList = () => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search, 400);

  const { data, isLoading } = useQuery({
    queryKey: ['customers', { search: debouncedSearch, page }],
    queryFn: () =>
      customerService.getAll({
        page,
        limit: 20,
        ...(debouncedSearch && { search: debouncedSearch }),
      }),
    keepPreviousData: true,
  });

  const customers = data?.data || [];
  const meta = data?.meta || {};
  const stats = meta?.stats || {
    total: 0,
    totalSpent: 0,
    registered: 0,
    guests: 0,
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-dark">Customers</h1>
        <p className="text-gray-600 mt-1">
          {stats.total} customers total
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total customers"
          value={stats.total}
          icon={Users}
          color="primary"
        />
        <StatCard
          label="Registered"
          value={stats.registered}
          icon={User}
          color="success"
        />
        <StatCard
          label="Guest checkouts"
          value={stats.guests}
          icon={ShoppingBag}
          color="info"
        />
        <StatCard
          label="Total revenue"
          value={formatPrice(stats.totalSpent)}
          icon={DollarSign}
          color="warning"
        />
      </div>

      {/* Search */}
      <div className="card !p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none"
          />
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="card flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        </div>
      ) : customers.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={Users}
            title={debouncedSearch ? 'No customers found' : 'No customers yet'}
            description={
              debouncedSearch
                ? `No customers match "${debouncedSearch}"`
                : 'When people buy from your store, they will appear here.'
            }
          />
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="divide-y divide-gray-100">
            {customers.map((customer) => (
              <div
                key={customer._id}
                className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors"
              >
                {/* Avatar */}
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-semibold flex-shrink-0">
                  {customer.firstName?.[0]}{customer.lastName?.[0]}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-dark">
                      {customer.firstName} {customer.lastName}
                    </p>
                    {customer.isGuest && (
                      <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">
                        Guest
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 flex items-center gap-1 truncate">
                    <Mail className="w-3.5 h-3.5" />
                    {customer.email}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Joined {formatRelativeTime(customer.createdAt)}
                  </p>
                </div>

                {/* Stats */}
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-bold text-dark">
                    {formatPrice(customer.stats?.totalSpent || 0)}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {customer.stats?.totalOrders || 0} orders
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pagination */}
      {meta.totalPages > 1 && (
        <div className="flex items-center justify-between flex-wrap gap-3">
          <p className="text-sm text-gray-600">
            Page {meta.page} of {meta.totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn-outline"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= meta.totalPages}
              className="btn-outline"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerList;