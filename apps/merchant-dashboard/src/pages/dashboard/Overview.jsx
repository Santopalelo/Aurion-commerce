import { TrendingUp, DollarSign, ShoppingBag, Users, Package, ArrowUpRight } from 'lucide-react';
import useAuthStore from '../../store/useAuthStore';

const StatCard = ({ icon: Icon, label, value, change, changeType = 'positive' }) => (
  <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
    <div className="flex items-start justify-between mb-4">
      <div className="w-12 h-12 rounded-lg bg-primary-50 flex items-center justify-center">
        <Icon className="w-6 h-6 text-primary-600" />
      </div>
      {change && (
        <div
          className={`flex items-center gap-1 text-xs font-medium ${
            changeType === 'positive' ? 'text-success' : 'text-danger'
          }`}
        >
          <ArrowUpRight className="w-3.5 h-3.5" />
          {change}
        </div>
      )}
    </div>
    <p className="text-sm text-gray-500 mb-1">{label}</p>
    <p className="text-2xl font-bold text-dark">{value}</p>
  </div>
);

const Overview = () => {
  const user = useAuthStore((state) => state.user);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-dark">
          {greeting}, {user?.firstName} 👋
        </h1>
        <p className="text-gray-600 mt-1">
          Here's what's happening with your store today.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={DollarSign}
          label="Total Revenue"
          value="$0.00"
          change="+0%"
        />
        <StatCard
          icon={ShoppingBag}
          label="Total Orders"
          value="0"
          change="+0%"
        />
        <StatCard
          icon={Users}
          label="New Customers"
          value="0"
          change="+0%"
        />
        <StatCard
          icon={Package}
          label="Products"
          value="0"
        />
      </div>

      {/* Welcome Card */}
      <div className="bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 rounded-2xl p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
        <div className="relative z-10 max-w-2xl">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-5 h-5" />
            <span className="text-sm font-medium uppercase tracking-wider opacity-90">
              Getting started
            </span>
          </div>
          <h2 className="text-2xl font-bold mb-3">
            Welcome to Aurion Commerce!
          </h2>
          <p className="text-white/80 mb-6">
            Your store is all set up and ready. Start by adding your first product,
            customizing your storefront, or inviting team members.
          </p>
          <div className="flex flex-wrap gap-3">
            <button className="px-5 py-2.5 bg-white text-primary-700 rounded-lg text-sm font-semibold hover:bg-gray-100 transition-colors">
              Add your first product
            </button>
            <button className="px-5 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm font-semibold hover:bg-white/20 transition-colors">
              View setup guide
            </button>
          </div>
        </div>
      </div>

      {/* Two-column section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-dark">Recent Orders</h3>
            <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">
              View all
            </button>
          </div>
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gray-100 flex items-center justify-center">
              <ShoppingBag className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-sm text-gray-500">No orders yet</p>
            <p className="text-xs text-gray-400 mt-1">
              Your orders will appear here
            </p>
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-dark">Top Products</h3>
            <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">
              View all
            </button>
          </div>
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gray-100 flex items-center justify-center">
              <Package className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-sm text-gray-500">No products yet</p>
            <p className="text-xs text-gray-400 mt-1">
              Add your first product to get started
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Overview;