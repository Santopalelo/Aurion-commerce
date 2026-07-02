'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, ArrowRight, Loader2, ShoppingBag } from 'lucide-react';
import toast from 'react-hot-toast';
import { storefrontApi } from '../../../../lib/api';
import useCustomerAuthStore from '../../../../lib/customerAuth';

export default function CustomerLoginPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const storeSlug = params.storeSlug;
  const redirectTo = searchParams.get('redirect');

  const setSession = useCustomerAuthStore((state) => state.setSession);
  const isAuthenticated = useCustomerAuthStore((state) =>
    state.isAuthenticated(storeSlug)
  );

  const [store, setStore] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  // Load store info
  useEffect(() => {
    setMounted(true);
    storefrontApi
      .getStore(storeSlug)
      .then((data) => setStore(data.store))
      .catch(() => {});
  }, [storeSlug]);

  // Redirect if already logged in
  useEffect(() => {
    if (mounted && isAuthenticated) {
      router.push(redirectTo || `/${storeSlug}/account`);
    }
  }, [mounted, isAuthenticated, storeSlug, router, redirectTo]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: undefined });
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.email) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    if (!formData.password) newErrors.password = 'Password is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const { customer, token } = await storefrontApi.loginCustomer(
        storeSlug,
        formData.email,
        formData.password
      );

      setSession(storeSlug, customer, token);
      toast.success(`Welcome back, ${customer.firstName}!`);
      router.push(redirectTo || `/${storeSlug}/account`);
    } catch (error) {
      const msg =
        error.response?.data?.message ||
        'Login failed. Please try again.';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Store logo */}
        <div className="text-center mb-8">
          {store?.logo?.url ? (
            <img
              src={store.logo.url}
              alt={store.name}
              className="w-14 h-14 rounded-lg object-cover mx-auto mb-3"
            />
          ) : (
            <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-bold text-2xl mx-auto mb-3">
              {store?.name?.[0]?.toUpperCase() || 'S'}
            </div>
          )}
          <h1 className="text-2xl font-bold text-dark">Welcome back</h1>
          <p className="text-gray-600 mt-1">
            Sign in to your {store?.name} account
          </p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-dark mb-1.5">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  autoComplete="email"
                  className={`w-full pl-10 pr-4 py-2.5 rounded-lg border bg-white text-dark text-sm focus:ring-2 focus:ring-primary-200 transition-all ${
                    errors.email
                      ? 'border-red-500 focus:border-red-500'
                      : 'border-gray-300 focus:border-primary-500'
                  }`}
                />
              </div>
              {errors.email && (
                <p className="text-xs text-red-600 mt-1">{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-dark mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Your password"
                  autoComplete="current-password"
                  className={`w-full pl-10 pr-4 py-2.5 rounded-lg border bg-white text-dark text-sm focus:ring-2 focus:ring-primary-200 transition-all ${
                    errors.password
                      ? 'border-red-500 focus:border-red-500'
                      : 'border-gray-300 focus:border-primary-500'
                  }`}
                />
              </div>
              {errors.password && (
                <p className="text-xs text-red-600 mt-1">{errors.password}</p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mt-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign in
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-500">New customer?</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Register link */}
          <Link
            href={`/${storeSlug}/auth/register${
              redirectTo ? `?redirect=${redirectTo}` : ''
            }`}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-white border border-gray-300 text-dark rounded-lg font-semibold hover:bg-gray-50 transition-colors"
          >
            <ShoppingBag className="w-4 h-4" />
            Create an account
          </Link>
        </div>

        {/* Back to store */}
        <div className="text-center mt-6">
          <Link
            href={`/${storeSlug}`}
            className="text-sm text-gray-600 hover:text-primary-600 font-medium"
          >
            ← Back to store
          </Link>
        </div>
      </div>
    </div>
  );
}