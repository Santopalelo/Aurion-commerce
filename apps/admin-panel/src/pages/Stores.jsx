import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Search, Store as StoreIcon, Loader2, ChevronRight } from 'lucide-react';
import clsx from 'clsx';
import { adminService } from '../services/admin.service';
import { formatPrice, formatRelativeTime } from '../utils/format';

const Stores = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [planFilter, setPlanFilter] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-stores', { search, statusFilter, planFilter, page }],
    queryFn: () =>
      adminService.getStores({
        search: search || undefined,
        status: statusFilter || undefined,
        plan: planFilter || undefined,
        page,
        limit: 20,
      }),
    keepPreviousData: true,
  });

  const stores = data?.data || [];
  const meta = data?.meta || {};

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-dark">Stores</h1>
        <p className="text-gray-600 mt-1">
          {meta.total || 0} stores across the platform
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by store name or slug..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2 rounded-lg border border-gray-200 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
          >
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="setup">Setup</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
          </select>

          <select
            value={planFilter}
            onChange={(e) => {
              setPlanFilter(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2 rounded-lg border border-gray-200 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
          >
            <option value="">All plans</option>
            <option value="free">Free</option>
            <option value="starter">Starter</option>
            <option value="growth">Growth</option>
            <option value="pro">Pro</option>
            <option value="enterprise">Enterprise</option>
          </select>
        </div>
      </div>

      {/* Stores List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        </div>
      ) : stores.length === 0 ? (
        <div className="card text-center py-16">
          <StoreIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600">No stores found</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {/* Header row */}
          <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase">
            <div className="col-span-4">Store</div>
            <div className="col-span-3">Owner</div>
            <div className="col-span-1">Products</div>
            <div className="col-span-1">Orders</div>
            <div className="col-span-2">Revenue</div>
            <div className="col-span-1">Status</div>
          </div>

          {/* Rows */}
          <div className="divide-y divide-gray-100">
            {stores.map((store) => (
              <Link
                key={store._id}
                to={`/stores/${store._id}`}
                className="grid grid-cols-1 md:grid-cols-12 gap-4 px-6 py-4 hover:bg-gray-50 transition-colors"
              >
                {/* Store */}
                <div className="md:col-span-4 flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-bold flex-shrink-0">
                    {store.name?.[0]?.toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-dark truncate">{store.name}</p>
                    <p className="text-xs text-gray-500 truncate">
                      /{store.slug} • {formatRelativeTime(store.createdAt)}
                    </p>
                  </div>
                </div>

                {/* Owner */}
                <div className="md:col-span-3 min-w-0">
                  <p className="text-sm text-dark truncate">
                    {store.owner?.firstName} {store.owner?.lastName}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {store.owner?.email}
                  </p>
                </div>

                {/* Stats */}
                <div className="md:col-span-1">
                  <p className="text-sm font-semibold text-dark">
                    {store.stats?.productCount || 0}
                  </p>
                </div>

                <div className="md:col-span-1">
                  <p className="text-sm font-semibold text-dark">
                    {store.stats?.orderCount || 0}
                  </p>
                </div>

                <div className="md:col-span-2">
                  <p className="text-sm font-bold text-dark">
                    {formatPrice(store.stats?.revenue || 0)}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">{store.plan} plan</p>
                </div>

                {/* Status */}
                <div className="md:col-span-1 flex items-center">
                  <span
                    className={clsx(
                      'inline-block px-2 py-0.5 rounded-full text-xs font-medium capitalize',
                      {
                        'bg-green-100 text-green-700': store.status === 'active',
                        'bg-yellow-100 text-yellow-700': store.status === 'setup',
                        'bg-red-100 text-red-700': store.status === 'suspended',
                        'bg-gray-100 text-gray-700': store.status === 'inactive',
                      }
                    )}
                  >
                    {store.status}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Pagination */}
      {meta.totalPages > 1 && (
        <div className="flex items-center justify-between">
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

export default Stores;