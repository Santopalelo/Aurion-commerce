'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { Lock, Loader2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import useCartStore from '../../lib/cart';
import { storefrontApi } from '../../lib/api';

/**
 * StripePaymentForm
 *
 * Renders Stripe's PaymentElement (credit card form)
 * Handles payment confirmation and order creation
 */
export default function StripePaymentForm({
  storeSlug,
  paymentIntentId,
  customerData,
  shippingAddress,
  cartItems,
  notes,
  totalAmount,
  currencySymbol = '$',
}) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const clearCart = useCartStore((state) => state.clearCart);

  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      // ============================================
      // Step 1: Confirm payment with Stripe
      // ============================================
      const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/${storeSlug}/checkout/success`,
        },
        redirect: 'if_required',
      });

      if (stripeError) {
        setErrorMessage(stripeError.message);
        toast.error(stripeError.message);
        setIsProcessing(false);
        return;
      }

      // ============================================
      // Step 2: Payment succeeded — create order in DB
      // ============================================
      if (paymentIntent && paymentIntent.status === 'succeeded') {
        toast.success('Payment successful! Creating your order...');

        const orderPayload = {
          paymentIntentId: paymentIntent.id,
          paymentMethod: 'stripe', // Added missing paymentMethod required by backend schemas
          items: cartItems.map((item) => ({
            productId: item.productId || item.id || item._id, // Handles different ID field names
            variantId: item.variantId || item.variant || undefined,
            quantity: item.quantity,
          })),
          customer: {
            email: customerData?.email,
            firstName: shippingAddress?.firstName || customerData?.firstName || '',
            lastName: shippingAddress?.lastName || customerData?.lastName || '',
            phone: customerData?.phone || shippingAddress?.phone || '',
            acceptsMarketing: Boolean(customerData?.acceptsMarketing),
          },
          shippingAddress: {
            firstName: shippingAddress?.firstName || '',
            lastName: shippingAddress?.lastName || '',
            line1: shippingAddress?.line1 || shippingAddress?.address1 || '', // Handles line1 vs address1
            line2: shippingAddress?.line2 || shippingAddress?.address2 || '',
            city: shippingAddress?.city || '',
            state: shippingAddress?.state || '',
            country: shippingAddress?.country || '',
            zipCode: shippingAddress?.zipCode || shippingAddress?.postalCode || '',
            phone: customerData?.phone || shippingAddress?.phone || '',
          },
          notes: notes || '',
        };

        const { order } = await storefrontApi.createOrder(
          storeSlug,
          orderPayload
        );

        // ============================================
        // Step 3: Clear cart and redirect
        // ============================================
        clearCart(storeSlug);

        router.push(
          `/${storeSlug}/checkout/success?order=${order.orderNumber}&email=${encodeURIComponent(customerData.email)}`
        );
      }
    } catch (error) {
      console.error('Payment error:', error);

      // Extract detailed Joi error messages from backend response
      const validationDetails =
        error.response?.data?.errors || error.response?.data?.details;

      let message =
        error.response?.data?.message ||
        error.message ||
        'Something went wrong. Please try again.';

      if (Array.isArray(validationDetails) && validationDetails.length > 0) {
        const detailMessages = validationDetails
          .map((d) => `${d.field}: ${d.message}`)
          .join(' | ');
        message = `Validation Failed: ${detailMessages}`;
      }

      setErrorMessage(message);
      toast.error(message);
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Stripe Payment Element */}
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
        <PaymentElement
          options={{
            layout: 'tabs',
          }}
        />
      </div>

      {/* Detailed Error display */}
      {errorMessage && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-800 break-words">{errorMessage}</p>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-base"
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Processing payment...
          </>
        ) : (
          <>
            <Lock className="w-4 h-4" />
            Pay {currencySymbol}
            {totalAmount.toFixed(2)}
          </>
        )}
      </button>

      {/* Test mode notice */}
      <div className="text-center">
        <p className="text-xs text-gray-500">
          🧪 Test mode — Use card{' '}
          <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded">
            4242 4242 4242 4242
          </span>
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Any future expiry, any CVC, any ZIP
        </p>
      </div>
    </form>
  );
}