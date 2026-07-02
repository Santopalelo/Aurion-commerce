'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, User, Phone, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { storefrontApi } from '../../../../lib/api';
import useCustomerAuthStore from '../../../../lib/customerAuth';

export default function CustomerRegisterPage() {
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
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    acceptsMarketing: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setMounted(true);
    storefrontApi
      .getStore(storeSlug)
      .then((data) => setStore(data.store))
      .catch(() => {});
  }, [storeSlug]);

  useEffect(() => {
    if (mounted && isAuthenticated) {
      router.push(redirectTo || `/${storeSlug}/account`);
    }
  }, [mounted, isAuthenticated, storeSlug, router, redirectTo]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (errors[name]) setErrors({ ...errors, [name]: undefined });
  };

  const passwordChecks = [
    { label: '8+ characters', valid: formData.password.length >= 8 },
    { label: 'One number', valid: /[0-9]/.test(formData.password) },
    { label: 'One letter', valid: /[a-zA-Z]/.test(formData.password) },
  ];

  const validate = () => {
    const newErrors = {};
    if (!formData.firstName.trim()) newErrors.firstName = 'First name required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name required';
    if (!formData.email) newErrors.email = 'Email required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    if (!formData.password) newErrors.password = 'Password required';
    else if (formData.password.length < 8) {
      newErrors.password = 'Must be at least 8 characters';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const { customer, token } = await storefrontApi.registerCustomer(
        storeSlug,
        formData
      );

      setSession(storeSlug, customer, token);
      toast.success(`Welcome, ${customer.firstName}! 🎉`);
      router.push(redirectTo || `/${storeSlug}/account`);
    } catch (error) {
      const msg =
        error.response?.data?.message ||
        'Registration failed. Please try again.';
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
          <h1 className="text-2xl font-bold text-dark">Create account</h1>
          <p className="text-gray-600 mt-1">
            Join {store?.name} for faster checkout
          </p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-dark mb-1.5">
                  First name
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="John"
                  autoComplete="given-name"
                  className={`w-full px-4 py-2.5 rounded-lg border bg-white text-dark text-sm focus:ring-2 focus:ring-primary-200 transition-all ${
                    errors.firstName
                      ? 'border-red-500'
                      : 'border-gray-300 focus:border-primary-500'
                  }`}
                />
                {errors.firstName && (
                  <p className="text-xs text-red-600 mt-1">{errors.firstName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-dark mb-1.5">
                  Last name
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Doe"
                  autoComplete="family-name"
                  className={`w-full px-4 py-2.5 rounded-lg border bg-white text-dark text-sm focus:ring-2 focus:ring-primary-200 transition-all ${
                    errors.lastName
                      ? 'border-red-500'
                      : 'border-gray-300 focus:border-primary-500'
                  }`}
                />
                {errors.lastName && (
                  <p className="text-xs text-red-600 mt-1">{errors.lastName}</p>
                )}
              </div>
            </div>

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
                      ? 'border-red-500'
                      : 'border-gray-300 focus:border-primary-500'
                  }`}
                />
              </div>
              {errors.email && (
                <p className="text-xs text-red-600 mt-1">{errors.email}</p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-dark mb-1.5">
                Phone <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+1 (555) 123-4567"
                  autoComplete="tel"
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 bg-white text-dark text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all"
                />
              </div>
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
                  placeholder="Create a strong password"
                  autoComplete="new-password"
                  className={`w-full pl-10 pr-4 py-2.5 rounded-lg border bg-white text-dark text-sm focus:ring-2 focus:ring-primary-200 transition-all ${
                    errors.password
                      ? 'border-red-500'
                      : 'border-gray-300 focus:border-primary-500'
                  }`}
                />
              </div>
              {errors.password && (
                <p className="text-xs text-red-600 mt-1">{errors.password}</p>
              )}

              {/* Password strength */}
              {formData.password && (
                <div className="flex gap-3 mt-2">
                  {passwordChecks.map((check) => (
                    <div
                      key={check.label}
                      className={`flex items-center gap-1 text-xs ${
                        check.valid ? 'text-green-600' : 'text-gray-400'
                      }`}
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      {check.label}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Marketing */}
            <label className="flex items-start gap-2 cursor-pointer pt-2">
              <input
                type="checkbox"
                name="acceptsMarketing"
                checked={formData.acceptsMarketing}
                onChange={handleChange}
                className="w-4 h-4 rounded border-gray-300 text-primary-600 mt-0.5"
              />
              <span className="text-sm text-gray-700">
                Email me about new products and offers
              </span>
            </label>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mt-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                <>
                  Create account
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <p className="text-xs text-gray-500 text-center mt-2">
              By creating an account, you agree to our terms & privacy policy.
            </p>
          </form>

          {/* Login link */}
          <div className="my-6 flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-500">Already have an account?</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          <Link
            href={`/${storeSlug}/auth/login${
              redirectTo ? `?redirect=${redirectTo}` : ''
            }`}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-white border border-gray-300 text-dark rounded-lg font-semibold hover:bg-gray-50 transition-colors"
          >
            Sign in instead
          </Link>
        </div>

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