import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, Store, Users, Package, ShoppingCart, DollarSign,
  Mail, Phone, Calendar, Loader2, ExternalLink, Ban, CheckCircle2,
} from 'lucide-react';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import { adminService } from '../services/admin.service';
import { formatPrice, formatDate, formatNumber } from '../utils/format';
import { getErrorMessage } from '../services/api';

const StoreDetail = () => {
  const { id } = useParams();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-store', id],
    queryFn: () => adminService.getStoreDetail(id),
  });

  const statusMutation = useMutation({
    mutationFn: ({ status, reason }) =>
      adminService.updateStoreStatus(id, status, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-store', id] });
      toast.success('Store status updated');
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const handleStatusChange = (newStatus) => {
    const reason = prompt(`Reason for changing status to ${newStatus}? (optional)`);
    if (reason !== null) {
      statusMutation.mutate({ status: newStatus, reason });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  const store = data?.store;
  const subscription = data?.subscription;
  const stats = data?.stats || {};

  if (!store) {
    return <div>Store not found</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Back */}
      <Link
        to="/stores"
        className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-primary-600"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to stores
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-bold text-2xl">
            {store.name?.[0]?.toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-dark">{store.name}</h1>
            <p className="text-gray-500 flex items-center gap-2">
              <span>/{store.slug}</span>
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
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={`https://aurion-commerce-storefront.vercel.app/${store.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-outline"
          >
            <ExternalLink className="w-4 h-4" />
            View storefront
          </a>
          {store.status === 'suspended' ? (
            <button
              onClick={() => handleStatusChange('active')}
              className="btn bg-green-600 text-white hover:bg-green-700"
            >
              <CheckCircle2 className="w-4 h-4" />
              Reactivate
            </button>
          ) : (
            <button
              onClick={() => handleStatusChange('suspended')}
              className="btn-danger"
            >
              <Ban className="w-4 h-4" />
              Suspend
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card">
          <Package className="w-6 h-6 text-primary-600 mb-2" />
          <p className="text-2xl font-bold">{formatNumber(stats.productCount)}</p>
          <p className="text-sm text-gray-500">Products ({stats.activeProductCount} active)</p>
        </div>
        <div className="card">
          <ShoppingCart className="w-6 h-6 text-blue-600 mb-2" />
          <p className="text-2xl font-bold">{formatNumber(stats.orderCount)}</p>
          <p className="text-sm text-gray-500">Total orders</p>
        </div>
        <div className="card">
          <DollarSign className="w-6 h-6 text-green-600 mb-2" />
          <p className="text-2xl font-bold">{formatPrice(stats.totalRevenue)}</p>
          <p className="text-sm text-gray-500">Total revenue</p>
        </div>
        <div className="card">
          <Users className="w-6 h-6 text-purple-600 mb-2" />
          <p className="text-2xl font-bold">{formatNumber(stats.customerCount)}</p>
          <p className="text-sm text-gray-500">Customers</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Owner */}
        <div className="card">
          <h3 className="font-bold text-dark mb-4 flex items-center gap-2">
            <Users className="w-5 h-5" />
            Store owner
          </h3>
          <div className="space-y-2 text-sm">
            <p className="font-semibold text-dark">
              {store.owner?.firstName} {store.owner?.lastName}
            </p>
            <p className="flex items-center gap-2 text-gray-600">
              <Mail className="w-4 h-4" />
              {store.owner?.email}
            </p>
            {store.owner?.phone && (
              <p className="flex items-center gap-2 text-gray-600">
                <Phone className="w-4 h-4" />
                {store.owner.phone}
              </p>
            )}
            <p className="flex items-center gap-2 text-gray-500 text-xs pt-2">
              <Calendar className="w-4 h-4" />
              Member since {formatDate(store.owner?.createdAt)}
            </p>
          </div>
        </div>

        {/* Subscription */}
        <div className="card">
          <h3 className="font-bold text-dark mb-4 flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Subscription
          </h3>
          {subscription ? (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Plan</span>
                <span className="font-semibold capitalize">{subscription.plan}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Status</span>
                <span className="font-semibold capitalize">{subscription.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Billing</span>
                <span className="font-semibold capitalize">{subscription.billingCycle}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Price</span>
                <span className="font-semibold">{formatPrice(subscription.price)}</span>
              </div>
              {subscription.trialEndsAt && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Trial ends</span>
                  <span className="font-semibold">
                    {formatDate(subscription.trialEndsAt)}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No subscription data</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default StoreDetail;