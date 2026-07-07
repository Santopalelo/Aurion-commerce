import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, TrendingUp, Store as StoreIcon } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { adminService } from '../services/admin.service';
import { formatPrice } from '../utils/format';

const Analytics = () => {
  const [period, setPeriod] = useState('30d');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-analytics', period],
    queryFn: () => adminService.getRevenueAnalytics(period),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  const dailyRevenue = (data?.dailyRevenue || []).map((d) => ({
    date: new Date(d._id).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    }),
    revenue: d.revenue,
    orders: d.orderCount,
  }));

  const topStores = data?.topStores || [];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark">Analytics</h1>
          <p className="text-gray-600 mt-1">Platform-wide revenue insights</p>
        </div>

        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="px-4 py-2 rounded-lg border border-gray-200 text-sm bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
        >
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
          <option value="1y">Last year</option>
        </select>
      </div>

      {/* Revenue Chart */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp className="w-5 h-5 text-primary-600" />
          <h3 className="font-bold text-dark">Revenue over time</h3>
        </div>

        {dailyRevenue.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <p>No revenue data for this period</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dailyRevenue}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
              <YAxis stroke="#6b7280" fontSize={12} tickFormatter={(v) => `$${v}`} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
                formatter={(value) => formatPrice(value)}
              />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#8B5CF6"
                strokeWidth={2}
                dot={{ fill: '#8B5CF6', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Top Stores */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-6">
          <StoreIcon className="w-5 h-5 text-primary-600" />
          <h3 className="font-bold text-dark">Top stores by revenue</h3>
        </div>

        {topStores.length === 0 ? (
          <p className="text-center text-sm text-gray-500 py-8">
            No store revenue data yet
          </p>
        ) : (
          <div className="space-y-3">
            {topStores.map((store, idx) => (
              <div
                key={store._id}
                className="flex items-center gap-4 p-3 rounded-lg bg-gray-50"
              >
                <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-bold">
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-dark truncate">
                    {store.storeName}
                  </p>
                  <p className="text-xs text-gray-500">
                    {store.orderCount} orders • /{store.storeSlug}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-dark">
                    {formatPrice(store.revenue)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Analytics;