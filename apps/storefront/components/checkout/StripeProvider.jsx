'use client';

import { useEffect, useState } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

// Load Stripe.js once at module level
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
);

/**
 * StripeProvider
 *
 * Wraps the checkout form to provide Stripe Elements context.
 * Requires a clientSecret from the Payment Intent.
 */
export default function StripeProvider({ clientSecret, children }) {
  if (!clientSecret) return null;

  const options = {
    clientSecret,
    appearance: {
      theme: 'stripe',
      variables: {
        colorPrimary: '#6366F1',
        colorBackground: '#ffffff',
        colorText: '#111827',
        colorDanger: '#EF4444',
        fontFamily: 'Inter, system-ui, sans-serif',
        spacingUnit: '4px',
        borderRadius: '8px',
      },
    },
  };

  return (
    <Elements stripe={stripePromise} options={options}>
      {children}
    </Elements>
  );
}