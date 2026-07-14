import Link from 'next/link';
import {
  ShoppingBag, Package, CreditCard, Users, BarChart3, Rocket,
  Palette, Globe, Shield, Zap, ArrowRight, Check,
} from 'lucide-react';
import MarketingNavbar from '../../components/marketing/MarketingNavbar';
import MarketingFooter from '../../components/marketing/MarketingFooter';

const DASHBOARD_URL = process.env.NEXT_PUBLIC_DASHBOARD_URL || 'https://aurion-commerce-merchant-dashboard.vercel.app';

export const metadata = {
  title: 'Features — Aurion Commerce',
  description: 'Everything you need to build, manage, and grow your online store.',
};

const featureCategories = [
  {
    title: 'For Merchants',
    subtitle: 'Powerful tools to manage your store',
    features: [
      { icon: Package, title: 'Product Management', description: 'Upload unlimited products with multi-image support, variants, and inventory tracking.' },
      { icon: BarChart3, title: 'Real-Time Analytics', description: 'See revenue, top products, and customer insights in beautiful dashboards.' },
      { icon: Users, title: 'Order Management', description: 'View all orders, update status, add tracking numbers, and manage fulfillment.' },
      { icon: Rocket, title: 'Team Collaboration', description: 'Invite staff members with role-based permissions for secure delegation.' },
    ],
  },
  {
    title: 'For Customers',
    subtitle: 'A shopping experience they\'ll love',
    features: [
      { icon: ShoppingBag, title: 'Beautiful Storefronts', description: 'Fast, SEO-optimized stores that work perfectly on mobile and desktop.' },
      { icon: CreditCard, title: 'Secure Checkout', description: 'PCI-compliant Stripe checkout with support for all major credit cards.' },
      { icon: Users, title: 'Customer Accounts', description: 'Let customers save addresses, view order history, and reorder easily.' },
      { icon: Zap, title: 'Fast Performance', description: 'Server-side rendering and CDN delivery for lightning-fast page loads.' },
    ],
  },
  {
    title: 'Enterprise Features',
    subtitle: 'Built for scale from day one',
    features: [
      { icon: Shield, title: 'Bank-Grade Security', description: 'JWT authentication, SSL everywhere, and role-based access control.' },
      { icon: Globe, title: 'Global Ready', description: 'Multi-currency support, international shipping, and localized checkout.' },
      { icon: Palette, title: 'Custom Branding', description: 'Match your brand with custom colors, logos, and future theme options.' },
      { icon: Rocket, title: '99.9% Uptime', description: 'Deployed on enterprise-grade infrastructure that scales automatically.' },
    ],
  },
];

export default function FeaturesPage() {
  return (
    <div className="bg-white">
      <MarketingNavbar />

      {/* Hero */}
      <section className="pt-16 pb-12 bg-gradient-to-b from-primary-50 to-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h1 className="text-4xl sm:text-6xl font-bold text-dark mb-6">
            Everything you need,
            <br />
            <span className="bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent">
              nothing you don't
            </span>
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Professional-grade features included in every plan. No add-ons, no upsells, no surprises.
          </p>
        </div>
      </section>

      {/* Features */}
      {featureCategories.map((category, catIdx) => (
        <section key={category.title} className={`py-20 ${catIdx % 2 === 1 ? 'bg-gray-50' : 'bg-white'}`}>
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-dark mb-3">
                {category.title}
              </h2>
              <p className="text-lg text-gray-600">{category.subtitle}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {category.features.map((feature) => (
                <div
                  key={feature.title}
                  className="flex gap-4 p-6 rounded-2xl bg-white border border-gray-100 hover:border-primary-200 hover:shadow-md transition-all"
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white flex-shrink-0">
                    <feature.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-dark mb-2">{feature.title}</h3>
                    <p className="text-sm text-gray-600">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      ))}

      {/* CTA */}
      <section className="py-24 bg-gradient-to-br from-primary-600 to-primary-800 text-white text-center">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Ready to explore?
          </h2>
          <p className="text-white/80 mb-8">
            Start with our free plan and upgrade as you grow.
          </p>
          <a
            href={`${DASHBOARD_URL}/register`}
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-primary-700 rounded-xl font-semibold hover:bg-gray-100 transition-colors"
          >
            Start free trial
            <ArrowRight className="w-5 h-5" />
          </a>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}