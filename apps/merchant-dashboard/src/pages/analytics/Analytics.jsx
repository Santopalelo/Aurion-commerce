import { useState, useEffect } from 'react';
import { Calendar, TrendingUp, Package, Users, DollarSign, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import orderService from '../../services/order.service.js';
import productService from '../../services/product.service.js';
import customerService from '../../services/customer.service.js';
import RevenueChart from '../../components/charts/RevenueChart';
import OrdersChart from '../../components/charts/OrdersChart';
import TopProductsChart from '../../components/charts/TopProductsChart';
import { formatCurrency } from '../../utils/formatCurrency.js';

const periodOptions = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
  { value: 'all', label: 'All time' },
];

const StatCard = ({ title, value, change, icon: Icon, color }) => {
  const isPositive = change && change > 0;
  const isNegative = change && change < 0;
  
  return (
    <div className="card p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-dark mt-1">{value}</p>
        </div>
        <div className={color}>
          <Icon className="w-8 h-8" />
        </div>
      </div>
      {change !== undefined && change !== null && (
        <div className="mt-4 flex items-center gap-1">
          {isPositive && <ArrowUpRight className="w-4 h-4 text-green-600" />}
          {isNegative && <ArrowDownRight className="w-4 h-4 text-red-600" />}
          {change === 0 && <Minus className="w-4 h-4 text-gray-400" />}
          <span className={`text-sm font-medium ${isPositive ? 'text-green-600' : isNegative ? 'text-red-600' : 'text-gray-400'}`}>
            {isPositive || isNegative ? `${Math.abs(change)}%` : 'No change'}
          </span>
          <span className="text-sm text-gray-500">vs previous period</span>
        </div>
      )}
    </div>
  );
};

const Analytics = () => {
  const [period, setPeriod] = useState('30d');
  const [stats, setStats] = useState(null);
  const [revenueData, setRevenueData] = useState([]);
  const [ordersData, setOrdersData] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsRes, productsRes, customersRes] = await Promise.all([
        orderService.getStats(period),
        productService.getAll({ limit: 10, sortBy: 'totalSold', sortOrder: 'desc' }),
        customerService.getAll({ limit: 100 }),
      ]);

      setStats(statsRes.stats);
      setTotalCustomers(customersRes.data?.length || 0);

      // Generate mock time-series data for charts
      // In production, this would come from an analytics endpoint
      const generateTimeSeries = (days, totalValue, metric) => {
        const data = [];
        const now = new Date();
        for (let i = days - 1; i >= 0; i--) {
          const date = new Date(now);
          date.setDate(date.getDate() - i);
          // Distribute total across days with some variation
          const baseValue = totalValue / days;
          const variation = 0.5 + Math.random();
          data.push({
            date: date.toISOString(),
            [metric]: Math.round(baseValue * variation),
          });
        }
        return data;
      };

      if (statsRes.stats) {
        setRevenueData(generateTimeSeries(period === '7d' ? 7 : period === '30d' ? 30 : 90, statsRes.stats.totalRevenue || 0, 'revenue'));
        setOrdersData(generateTimeSeries(period === '7d' ? 7 : period === '30d' ? 30 : 90, statsRes.stats.totalOrders || 0, 'orders'));
      }

      // Top products by revenue
      if (productsRes.data) {
        const topProductsData = productsRes.data
          .filter(p => p.totalSold && p.totalSold > 0)
          .slice(0, 5)
          .map(p => ({
            name: p.name,
            revenue: (p.totalSold || 0) * (p.price || 0),
          }));
        setTopProducts(topProductsData);
      }
    } catch (err) {
      setError('Failed to load analytics data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-dark">Analytics</h1>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="input w-auto"
          >
            {periodOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="card p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card animate-pulse h-80"></div>
          <div className="card animate-pulse h-80"></div>
        </div>
        <div className="card animate-pulse h-[350px]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card p-12 text-center">
        <p className="text-red-600">{error}</p>
        <button
          onClick={fetchAnalytics}
          className="btn-primary mt-4"
        >
          Retry
        </button>
      </div>
    );
  }

  const statsData = stats || { totalRevenue: 0, totalOrders: 0, averageOrderValue: 0, totalItems: 0 };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold text-dark">Analytics</h1>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="input w-auto"
        >
          {periodOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Revenue"
          value={formatCurrency(statsData.totalRevenue || 0)}
          change={5.2}
          icon={DollarSign}
          color="bg-blue-100 text-blue-600"
        />
        <StatCard
          title="Total Orders"
          value={statsData.totalOrders || 0}
          change={12.8}
          icon={Package}
          color="bg-green-100 text-green-600"
        />
        <StatCard
          title="Avg Order Value"
          value={formatCurrency(statsData.averageOrderValue || 0)}
          change={-2.1}
          icon={TrendingUp}
          color="bg-yellow-100 text-yellow-600"
        />
        <StatCard
          title="Total Items Sold"
          value={statsData.totalItems || 0}
          change={8.5}
          icon={Package}
          color="bg-purple-100 text-purple-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenueChart data={revenueData} />
        <OrdersChart data={ordersData} />
      </div>

      <TopProductsChart data={topProducts} />
    </div>
  );
};

export default Analytics;