import Link from 'next/link';
import { Check, X, ArrowRight, Sparkles } from 'lucide-react';
import MarketingNavbar from '../../components/marketing/MarketingNavbar';
import MarketingFooter from '../../components/marketing/MarketingFooter';

const DASHBOARD_URL = process.env.NEXT_PUBLIC_DASHBOARD_URL || 'https://aurion-commerce-merchant-dashboard.vercel.app/dashboard';

export const metadata = {
  title: 'Pricing — Aurion Commerce',
  description: 'Simple, transparent pricing. Start free, scale as you grow. No hidden fees.',
};

const plans = [
  {
    name: 'Free',
    price: 0,
    description: 'Perfect for testing the waters',
    features: [
      { text: '10 products', included: true },
      { text: '1 staff member', included: true },
      { text: '500MB storage', included: true },
      { text: '2% transaction fee', included: true },
      { text: 'Basic analytics', included: true },
      { text: 'Community support', included: true },
      { text: 'Custom domain', included: false },
      { text: 'Advanced analytics', included: false },
      { text: 'Priority support', included: false },
    ],
    highlighted: false,
  },
  {
    name: 'Starter',
    price: 19,
    description: 'For growing businesses',
    features: [
      { text: '100 products', included: true },
      { text: '3 staff members', included: true },
      { text: '5GB storage', included: true },
      { text: '1.5% transaction fee', included: true },
      { text: 'Basic analytics', included: true },
      { text: 'Email support', included: true },
      { text: 'Custom domain', included: true },
      { text: 'Advanced analytics', included: false },
      { text: 'Priority support', included: false },
    ],
    highlighted: false,
  },
  {
    name: 'Growth',
    price: 49,
    description: 'Most popular for serious sellers',
    features: [
      { text: '1,000 products', included: true },
      { text: '10 staff members', included: true },
      { text: '20GB storage', included: true },
      { text: '1% transaction fee', included: true },
      { text: 'Advanced analytics', included: true },
      { text: 'Priority email support', included: true },
      { text: 'Custom domain', included: true },
      { text: 'Multiple currencies', included: true },
      { text: '24/7 phone support', included: false },
    ],
    highlighted: true,
  },
  {
    name: 'Pro',
    price: 99,
    description: 'For high-volume merchants',
    features: [
      { text: 'Unlimited products', included: true },
      { text: '25 staff members', included: true },
      { text: '100GB storage', included: true },
      { text: '0.5% transaction fee', included: true },
      { text: 'Advanced analytics', included: true },
      { text: '24/7 priority support', included: true },
      { text: 'Custom domain', included: true },
      { text: 'Multiple currencies', included: true },
      { text: 'API access', included: true },
    ],
    highlighted: false,
  },
];

export default function PricingPage() {
  return (
    <div className="bg-white">
      <MarketingNavbar />

      {/* Hero */}
      <section className="pt-16 pb-12 bg-gradient-to-b from-primary-50 to-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-primary-100 text-primary-700 text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            Simple, transparent pricing
          </div>
          <h1 className="text-4xl sm:text-6xl font-bold text-dark mb-6">
            Pricing that grows
            <br />
            <span className="bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent">
              with your business
            </span>
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Start free and upgrade only when you need more. No credit card required. Cancel anytime.
          </p>
        </div>
      </section>

      {/* Pricing Grid */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-2xl p-8 relative ${
                  plan.highlighted
                    ? 'bg-gradient-to-br from-primary-600 to-primary-800 text-white shadow-2xl scale-105 border-2 border-primary-500'
                    : 'bg-white border border-gray-200'
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-secondary text-white text-xs font-bold rounded-full">
                    MOST POPULAR
                  </div>
                )}

                <p className={`text-sm font-semibold uppercase tracking-wider mb-2 ${plan.highlighted ? 'text-primary-200' : 'text-gray-500'}`}>
                  {plan.name}
                </p>
                <div className="mb-4">
                  <span className="text-5xl font-bold">${plan.price}</span>
                  <span className={plan.highlighted ? 'text-primary-200' : 'text-gray-500'}>/mo</span>
                </div>
                <p className={`text-sm mb-6 ${plan.highlighted ? 'text-primary-100' : 'text-gray-600'}`}>
                  {plan.description}
                </p>

                <a
                  href={`${DASHBOARD_URL}/register`}
                  className={`block w-full text-center px-4 py-2.5 rounded-lg font-semibold transition-colors mb-8 ${
                    plan.highlighted
                      ? 'bg-white text-primary-700 hover:bg-gray-100'
                      : 'bg-gray-100 text-dark hover:bg-gray-200'
                  }`}
                >
                  Get started
                </a>

                <ul className="space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature.text} className="flex items-start gap-2 text-sm">
                      {feature.included ? (
                        <Check className={`w-4 h-4 flex-shrink-0 mt-0.5 ${plan.highlighted ? 'text-green-300' : 'text-green-600'}`} />
                      ) : (
                        <X className={`w-4 h-4 flex-shrink-0 mt-0.5 ${plan.highlighted ? 'text-primary-300' : 'text-gray-300'}`} />
                      )}
                      <span className={feature.included ? '' : 'opacity-50 line-through'}>
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <p className="text-center text-sm text-gray-500 mt-12">
            Need something bigger? <a href="mailto:sales@aurioncommerce.com" className="text-primary-600 hover:underline">Contact us for Enterprise</a>
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-gradient-to-br from-primary-600 to-primary-800 text-white text-center">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Start your free trial today
          </h2>
          <p className="text-white/80 mb-8">
            No credit card required. Cancel anytime.
          </p>
          <a
            href={`${DASHBOARD_URL}/register`}
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-primary-700 rounded-xl font-semibold hover:bg-gray-100 transition-colors"
          >
            Get started free
            <ArrowRight className="w-5 h-5" />
          </a>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}