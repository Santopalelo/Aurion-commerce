'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Mail,
  MapPin,
  ShoppingBag,
  Lock,
  Truck,
  Check,
  AlertCircle,
  ImageIcon,
  ArrowRight,
} from 'lucide-react';
import toast from 'react-hot-toast';
import useCartStore from '../../../lib/cart';
import { storefrontApi } from '../../../lib/api';
import StripeProvider from '../../../components/checkout/StripeProvider';
import StripePaymentForm from '../../../components/checkout/StripePaymentForm';

const COUNTRIES = [
  'United States', 'United Kingdom', 'Canada', 'Australia',
  'Nigeria', 'Kenya', 'South Africa', 'Ghana',
  'India', 'France', 'Germany', 'Spain', 'Italy',
  'Brazil', 'Mexico',
];

export default function CheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const storeSlug = params.storeSlug;

  // State
  const [store, setStore] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState('info'); // 'info' | 'payment'
  const [clientSecret, setClientSecret] = useState(null);
  const [paymentIntentId, setPaymentIntentId] = useState(null);
  const [creatingIntent, setCreatingIntent] = useState(false);
  const [errors, setErrors] = useState({});

  // Cart state
  const cart = useCartStore((state) => state.carts[storeSlug] || []);

  // Form state
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    firstName: '',
    lastName: '',
    address1: '',
    address2: '',
    city: '',
    state: '',
    country: 'United States',
    zipCode: '',
    notes: '',
    acceptsMarketing: false,
  });

  // Fetch store info
  useEffect(() => {
    setMounted(true);
    storefrontApi
      .getStore(storeSlug)
      .then((data) => setStore(data.store))
      .catch(() => toast.error('Could not load store info'));
  }, [storeSlug]);

  // Redirect if cart is empty
  useEffect(() => {
    if (mounted && cart.length === 0 && step === 'info') {
      toast.error('Your cart is empty');
      router.push(`/${storeSlug}/products`);
    }
  }, [mounted, cart.length, storeSlug, router, step]);

  // Calculate totals
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const savings = cart.reduce((sum, item) => {
    if (item.compareAtPrice && item.compareAtPrice > item.price) {
      return sum + (item.compareAtPrice - item.price) * item.quantity;
    }
    return sum;
  }, 0);
  const shipping = subtotal >= 50 ? 0 : 5;
  const tax = subtotal * 0.08;
  const total = subtotal + shipping + tax;
  const currencySymbol = store?.currencySymbol || '$';

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    if (!formData.firstName) newErrors.firstName = 'First name is required';
    if (!formData.lastName) newErrors.lastName = 'Last name is required';
    if (!formData.address1) newErrors.address1 = 'Address is required';
    if (!formData.city) newErrors.city = 'City is required';
    if (!formData.country) newErrors.country = 'Country is required';
    if (!formData.zipCode) newErrors.zipCode = 'ZIP/Postal code is required';
    if (!formData.phone) newErrors.phone = 'Phone is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Step 1 → 2: Create payment intent, move to payment step
  const handleContinueToPayment = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fill in all required fields');
      const firstError = document.querySelector('.input-error');
      if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setCreatingIntent(true);

    try {
      const payload = {
        items: cart.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
        customer: {
          email: formData.email,
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
        },
        shippingAddress: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          line1: formData.address1,
          line2: formData.address2,
          city: formData.city,
          state: formData.state,
          country: formData.country,
          zipCode: formData.zipCode,
          phone: formData.phone,
        },
      };

      const response = await storefrontApi.createPaymentIntent(storeSlug, payload);

      setClientSecret(response.clientSecret);
      setPaymentIntentId(response.paymentIntentId);
      setStep('payment');

      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      const message =
        error.response?.data?.message ||
        'Could not initialize payment. Please try again.';
      toast.error(message);
      console.error('Payment intent error:', error);
    } finally {
      setCreatingIntent(false);
    }
  };

  // Go back to info step
  const handleBackToInfo = () => {
    setStep('info');
    setClientSecret(null);
    setPaymentIntentId(null);
  };

  if (!mounted || !store) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (cart.length === 0 && step === 'info') {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      {/* Back link */}
      {step === 'info' ? (
        <Link
          href={`/${storeSlug}/cart`}
          className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-primary-600 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to cart
        </Link>
      ) : (
        <button
          onClick={handleBackToInfo}
          className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-primary-600 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to information
        </button>
      )}

      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-dark mb-2">
          Checkout
        </h1>

        {/* Step Indicator */}
        <div className="flex items-center gap-2 text-sm">
          <span
            className={`flex items-center gap-1 ${
              step === 'info' ? 'text-primary-600 font-semibold' : 'text-success'
            }`}
          >
            {step !== 'info' && <Check className="w-4 h-4" />}
            <span>1. Information</span>
          </span>
          <ArrowRight className="w-3 h-3 text-gray-300" />
          <span
            className={
              step === 'payment'
                ? 'text-primary-600 font-semibold'
                : 'text-gray-400'
            }
          >
            2. Payment
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT — Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* ============================================
              STEP 1: INFORMATION
              ============================================ */}
          {step === 'info' && (
            <form onSubmit={handleContinueToPayment} className="space-y-6">
              {/* Contact Information */}
              <section className="bg-white rounded-2xl border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center">
                    <Mail className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <h2 className="font-bold text-dark">Contact information</h2>
                    <p className="text-xs text-gray-500">
                      We'll send order updates here
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-dark mb-1.5">
                      Email <span className="text-danger">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="you@example.com"
                      className={`w-full px-4 py-2.5 rounded-lg border bg-white text-dark text-sm focus:ring-2 focus:ring-primary-200 transition-all ${
                        errors.email
                          ? 'border-danger input-error'
                          : 'border-gray-300 focus:border-primary-500'
                      }`}
                    />
                    {errors.email && (
                      <p className="text-xs text-danger mt-1">{errors.email}</p>
                    )}
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-dark mb-1.5">
                      Phone <span className="text-danger">*</span>
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+1 (555) 123-4567"
                      className={`w-full px-4 py-2.5 rounded-lg border bg-white text-dark text-sm focus:ring-2 focus:ring-primary-200 transition-all ${
                        errors.phone
                          ? 'border-danger input-error'
                          : 'border-gray-300 focus:border-primary-500'
                      }`}
                    />
                    {errors.phone && (
                      <p className="text-xs text-danger mt-1">{errors.phone}</p>
                    )}
                  </div>

                  <div className="sm:col-span-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        name="acceptsMarketing"
                        checked={formData.acceptsMarketing}
                        onChange={handleChange}
                        className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="text-sm text-gray-700">
                        Email me with news and offers
                      </span>
                    </label>
                  </div>
                </div>
              </section>

              {/* Shipping Address */}
              <section className="bg-white rounded-2xl border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <h2 className="font-bold text-dark">Shipping address</h2>
                    <p className="text-xs text-gray-500">
                      Where should we send your order?
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-dark mb-1.5">
                      First name <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      placeholder="John"
                      className={`w-full px-4 py-2.5 rounded-lg border bg-white text-dark text-sm focus:ring-2 focus:ring-primary-200 transition-all ${
                        errors.firstName
                          ? 'border-danger input-error'
                          : 'border-gray-300 focus:border-primary-500'
                      }`}
                    />
                    {errors.firstName && (
                      <p className="text-xs text-danger mt-1">{errors.firstName}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-dark mb-1.5">
                      Last name <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      placeholder="Doe"
                      className={`w-full px-4 py-2.5 rounded-lg border bg-white text-dark text-sm focus:ring-2 focus:ring-primary-200 transition-all ${
                        errors.lastName
                          ? 'border-danger input-error'
                          : 'border-gray-300 focus:border-primary-500'
                      }`}
                    />
                    {errors.lastName && (
                      <p className="text-xs text-danger mt-1">{errors.lastName}</p>
                    )}
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-dark mb-1.5">
                      Street address <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      name="address1"
                      value={formData.address1}
                      onChange={handleChange}
                      placeholder="123 Main St"
                      className={`w-full px-4 py-2.5 rounded-lg border bg-white text-dark text-sm focus:ring-2 focus:ring-primary-200 transition-all ${
                        errors.address1
                          ? 'border-danger input-error'
                          : 'border-gray-300 focus:border-primary-500'
                      }`}
                    />
                    {errors.address1 && (
                      <p className="text-xs text-danger mt-1">{errors.address1}</p>
                    )}
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-dark mb-1.5">
                      Apartment, suite, etc.{' '}
                      <span className="text-gray-400 font-normal">(optional)</span>
                    </label>
                    <input
                      type="text"
                      name="address2"
                      value={formData.address2}
                      onChange={handleChange}
                      placeholder="Apt 4B"
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-dark text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-dark mb-1.5">
                      City <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      placeholder="New York"
                      className={`w-full px-4 py-2.5 rounded-lg border bg-white text-dark text-sm focus:ring-2 focus:ring-primary-200 transition-all ${
                        errors.city
                          ? 'border-danger input-error'
                          : 'border-gray-300 focus:border-primary-500'
                      }`}
                    />
                    {errors.city && (
                      <p className="text-xs text-danger mt-1">{errors.city}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-dark mb-1.5">
                      State / Province{' '}
                      <span className="text-gray-400 font-normal">(optional)</span>
                    </label>
                    <input
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      placeholder="NY"
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-dark text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-dark mb-1.5">
                      Country <span className="text-danger">*</span>
                    </label>
                    <select
                      name="country"
                      value={formData.country}
                      onChange={handleChange}
                      className={`w-full px-4 py-2.5 rounded-lg border bg-white text-dark text-sm focus:ring-2 focus:ring-primary-200 transition-all ${
                        errors.country
                          ? 'border-danger input-error'
                          : 'border-gray-300 focus:border-primary-500'
                      }`}
                    >
                      {COUNTRIES.map((country) => (
                        <option key={country} value={country}>
                          {country}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-dark mb-1.5">
                      ZIP / Postal code <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      name="zipCode"
                      value={formData.zipCode}
                      onChange={handleChange}
                      placeholder="10001"
                      className={`w-full px-4 py-2.5 rounded-lg border bg-white text-dark text-sm focus:ring-2 focus:ring-primary-200 transition-all ${
                        errors.zipCode
                          ? 'border-danger input-error'
                          : 'border-gray-300 focus:border-primary-500'
                      }`}
                    />
                    {errors.zipCode && (
                      <p className="text-xs text-danger mt-1">{errors.zipCode}</p>
                    )}
                  </div>
                </div>
              </section>

              {/* Order Notes */}
              <section className="bg-white rounded-2xl border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center">
                    <ShoppingBag className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <h2 className="font-bold text-dark">Order notes</h2>
                    <p className="text-xs text-gray-500">
                      Any special instructions? (optional)
                    </p>
                  </div>
                </div>

                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={3}
                  placeholder="e.g. Please leave package at the door..."
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-dark text-sm placeholder:text-gray-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all resize-none"
                />
              </section>

              {/* Continue Button */}
              <button
                type="submit"
                disabled={creatingIntent}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {creatingIntent ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Setting up payment...
                  </>
                ) : (
                  <>
                    Continue to payment
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* ============================================
              STEP 2: PAYMENT
              ============================================ */}
          {step === 'payment' && clientSecret && (
            <section className="bg-white rounded-2xl border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center">
                  <Lock className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <h2 className="font-bold text-dark">Payment</h2>
                  <p className="text-xs text-gray-500">
                    Secure payment powered by Stripe
                  </p>
                </div>
              </div>

              <StripeProvider clientSecret={clientSecret}>
                <StripePaymentForm
                  storeSlug={storeSlug}
                  paymentIntentId={paymentIntentId}
                  customerData={formData}
                  shippingAddress={formData}
                  cartItems={cart}
                  notes={formData.notes}
                  totalAmount={total}
                  currencySymbol={currencySymbol}
                />
              </StripeProvider>
            </section>
          )}
        </div>

        {/* RIGHT — Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 sticky top-24">
            <h2 className="font-bold text-dark text-lg mb-5">Order Summary</h2>

            <div className="space-y-3 pb-4 border-b border-gray-200 max-h-80 overflow-y-auto">
              {cart.map((item) => (
                <div key={item.productId} className="flex gap-3">
                  <div className="relative w-16 h-16 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="w-6 h-6 text-gray-300" />
                      </div>
                    )}
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-gray-700 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {item.quantity}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-dark line-clamp-2">
                      {item.title}
                    </p>
                    <p className="text-sm text-gray-600 mt-0.5">
                      {currencySymbol}
                      {(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-2 py-4 border-b border-gray-200 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium text-dark">
                  {currencySymbol}
                  {subtotal.toFixed(2)}
                </span>
              </div>
              {savings > 0 && (
                <div className="flex justify-between">
                  <span className="text-success">Discount</span>
                  <span className="text-success font-semibold">
                    -{currencySymbol}
                    {savings.toFixed(2)}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">Shipping</span>
                <span className="font-medium text-dark">
                  {shipping === 0 ? (
                    <span className="text-success">FREE</span>
                  ) : (
                    `${currencySymbol}${shipping.toFixed(2)}`
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tax (8%)</span>
                <span className="font-medium text-dark">
                  {currencySymbol}
                  {tax.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="flex justify-between items-baseline py-4">
              <span className="font-bold text-dark">Total</span>
              <div className="text-right">
                <p className="text-2xl font-bold text-dark">
                  {currencySymbol}
                  {total.toFixed(2)}
                </p>
                <p className="text-xs text-gray-500">
                  {store?.currency || 'USD'}
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-2 text-xs text-gray-500">
              <div className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-success flex-shrink-0" />
                <span>Secure SSL checkout</span>
              </div>
              <div className="flex items-center gap-2">
                <Truck className="w-3.5 h-3.5 text-success flex-shrink-0" />
                <span>Fast & reliable shipping</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-success flex-shrink-0" />
                <span>30-day money-back guarantee</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}