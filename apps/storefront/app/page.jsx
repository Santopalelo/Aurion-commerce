import Link from 'next/link';
import {
  Sparkles, ArrowRight, Check, Zap, ShoppingBag, CreditCard,
  Package, Palette, BarChart3, Globe, Shield, Rocket, Users,
  Star, ChevronRight, Play, TrendingUp,
} from 'lucide-react';
import MarketingNavbar from '../components/marketing/MarketingNavbar';
import MarketingFooter from '../components/marketing/MarketingFooter';

const DASHBOARD_URL = process.env.NEXT_PUBLIC_DASHBOARD_URL || 'https://aurion-commerce-merchant-dashboard.vercel.app/dashboard';

export const metadata = {
  title: 'Aurion Commerce — The Modern Way To Sell Online',
  description: 'Launch your online store in minutes. Beautiful storefronts, powerful dashboard, real payments. Free to start.',
  openGraph: {
    title: 'Aurion Commerce — Build Your Online Store',
    description: 'The all-in-one commerce platform for modern entrepreneurs.',
    type: 'website',
  },
};

export default function HomePage() {
  return (
    <div className="bg-white">
      <MarketingNavbar />

      {/* ============================================
          HERO SECTION
          ============================================ */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary-50 via-white to-white pt-16 pb-24 sm:pt-24 sm:pb-32">
        {/* Decorative blobs */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-200/30 rounded-full blur-3xl -translate-y-1/2" />
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-200/30 rounded-full blur-3xl -translate-y-1/2" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-100 text-primary-700 text-sm font-medium mb-8">
            <Sparkles className="w-4 h-4" />
            The all-in-one commerce platform
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold text-dark mb-6 leading-[1.1]">
            Build your dream
            <br />
            <span className="bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent">
              online store today
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto mb-10 leading-relaxed">
            Aurion gives you everything you need to sell online — beautiful storefronts,
            powerful management tools, and real payments. Start free, scale infinitely.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mb-12">
            <a
              href={`${DASHBOARD_URL}/register`}
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition-colors shadow-lg shadow-primary-600/25 text-base"
            >
              Start free trial
              <ArrowRight className="w-5 h-5" />
            </a>
            <Link
              href="/johns-sneakers"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white border border-gray-200 text-dark rounded-xl font-semibold hover:bg-gray-50 transition-colors text-base"
            >
              <Play className="w-4 h-4" />
              See demo store
            </Link>
          </div>

          {/* Trust text */}
          <p className="text-sm text-gray-500">
            ✨ No credit card required · 14-day free trial · Cancel anytime
          </p>

          {/* Hero visual — Store preview mockup */}
          <div className="mt-16 relative">
            <div className="bg-gradient-to-br from-primary-100 to-purple-100 rounded-2xl p-4 sm:p-8 max-w-5xl mx-auto">
              <div className="bg-white rounded-xl shadow-2xl overflow-hidden">
                {/* Browser mock */}
                <div className="bg-gray-100 px-4 py-3 flex items-center gap-2 border-b border-gray-200">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400" />
                    <div className="w-3 h-3 rounded-full bg-yellow-400" />
                    <div className="w-3 h-3 rounded-full bg-green-400" />
                  </div>
                  <div className="flex-1 mx-4 bg-white rounded-md px-3 py-1 text-xs text-gray-500 text-center">
                    yourstore.aurioncommerce.com
                  </div>
                </div>

                {/* Fake store preview */}
                <div className="p-8 bg-gradient-to-br from-primary-600 to-primary-800 text-white text-center">
                  <h3 className="text-2xl sm:text-4xl font-bold mb-3">Welcome to Your Store</h3>
                  <p className="text-white/80 mb-6">Beautiful. Fast. Ready to sell.</p>
                  <button className="px-6 py-2 bg-white text-primary-700 rounded-lg font-semibold text-sm">
                    Shop now →
                  </button>
                </div>

                {/* Fake product grid */}
                <div className="p-6 grid grid-cols-3 gap-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-gray-50 rounded-lg aspect-square" />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================
          STATS BAR
          ============================================ */}
      <section className="py-12 border-y border-gray-100 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <p className="text-3xl font-bold text-dark">$0</p>
              <p className="text-sm text-gray-600 mt-1">Setup cost</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-dark">5 min</p>
              <p className="text-sm text-gray-600 mt-1">To launch</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-dark">99.9%</p>
              <p className="text-sm text-gray-600 mt-1">Uptime</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-dark">24/7</p>
              <p className="text-sm text-gray-600 mt-1">Support</p>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================
          FEATURES SECTION
          ============================================ */}
      <section className="py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 text-primary-700 text-xs font-semibold mb-4">
              <Zap className="w-3.5 h-3.5" />
              FEATURES
            </div>
            <h2 className="text-3xl sm:text-5xl font-bold text-dark mb-4">
              Everything you need to sell
            </h2>
            <p className="text-lg text-gray-600">
              Professional tools that used to cost thousands. All included, all free to start.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: ShoppingBag,
                title: 'Beautiful storefronts',
                description: 'Professional store designs that work on any device. Your customers will love shopping.',
                color: 'primary',
              },
              {
                icon: Package,
                title: 'Product management',
                description: 'Upload products with multiple images. Organize with categories. Track inventory automatically.',
                color: 'blue',
              },
              {
                icon: CreditCard,
                title: 'Stripe payments',
                description: 'Accept credit cards worldwide. Secure, fast, PCI-compliant. Get paid instantly.',
                color: 'green',
              },
              {
                icon: Users,
                title: 'Customer accounts',
                description: 'Let customers create accounts, save addresses, and view order history for repeat business.',
                color: 'orange',
              },
              {
                icon: BarChart3,
                title: 'Real-time analytics',
                description: 'See what\'s selling, track revenue, monitor performance. Make data-driven decisions.',
                color: 'purple',
              },
              {
                icon: Rocket,
                title: 'Order management',
                description: 'Manage orders, add tracking, cancel with auto-restock. Streamlined fulfillment.',
                color: 'pink',
              },
            ].map((feature) => {
              const colors = {
                primary: 'bg-primary-50 text-primary-600',
                blue: 'bg-blue-50 text-blue-600',
                green: 'bg-green-50 text-green-600',
                orange: 'bg-orange-50 text-orange-600',
                purple: 'bg-purple-50 text-purple-600',
                pink: 'bg-pink-50 text-pink-600',
              };
              return (
                <div
                  key={feature.title}
                  className="p-6 rounded-2xl border border-gray-100 hover:border-primary-200 hover:shadow-lg transition-all group"
                >
                  <div className={`w-12 h-12 rounded-xl ${colors[feature.color]} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <feature.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-dark mb-2">{feature.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{feature.description}</p>
                </div>
              );
            })}
          </div>

          {/* View all features link */}
          <div className="text-center mt-12">
            <Link
              href="/features"
              className="inline-flex items-center gap-1 text-primary-600 hover:text-primary-700 font-semibold"
            >
              See all features
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ============================================
          HOW IT WORKS
          ============================================ */}
      <section className="py-24 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 text-primary-700 text-xs font-semibold mb-4">
              <Rocket className="w-3.5 h-3.5" />
              HOW IT WORKS
            </div>
            <h2 className="text-3xl sm:text-5xl font-bold text-dark mb-4">
              Live in 3 steps
            </h2>
            <p className="text-lg text-gray-600">
              From idea to selling in under 10 minutes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Sign up',
                description: 'Create your free account in 30 seconds. No credit card needed.',
              },
              {
                step: '02',
                title: 'Add products',
                description: 'Upload your products with images, prices, and descriptions.',
              },
              {
                step: '03',
                title: 'Start selling',
                description: 'Share your store URL and start accepting orders and payments.',
              },
            ].map((item, idx) => (
              <div key={item.step} className="relative">
                {idx < 2 && (
                  <div className="hidden md:block absolute top-8 left-full w-full h-0.5 bg-gradient-to-r from-primary-200 to-transparent -translate-x-8" />
                )}
                <div className="relative bg-white rounded-2xl p-8 border border-gray-100">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 text-white flex items-center justify-center text-lg font-bold mb-4">
                    {item.step}
                  </div>
                  <h3 className="text-xl font-bold text-dark mb-2">{item.title}</h3>
                  <p className="text-gray-600">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================
          PRICING TEASER
          ============================================ */}
      <section className="py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 text-primary-700 text-xs font-semibold mb-4">
              <TrendingUp className="w-3.5 h-3.5" />
              PRICING
            </div>
            <h2 className="text-3xl sm:text-5xl font-bold text-dark mb-4">
              Start free, scale as you grow
            </h2>
            <p className="text-lg text-gray-600">
              No hidden fees. No credit card required. Upgrade only when you're ready.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* Free */}
            <div className="rounded-2xl border border-gray-200 p-8 bg-white">
              <p className="text-sm text-gray-500 font-semibold uppercase tracking-wider mb-2">Free</p>
              <div className="mb-6">
                <span className="text-5xl font-bold text-dark">$0</span>
                <span className="text-gray-500">/mo</span>
              </div>
              <p className="text-sm text-gray-600 mb-6">Perfect for getting started</p>
              <ul className="space-y-3 mb-8">
                {['10 products', '1 staff member', '500MB storage', '2% transaction fee'].map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{f}</span>
                  </li>
                ))}
              </ul>
              <a
                href={`${DASHBOARD_URL}/register`}
                className="block w-full text-center px-4 py-2.5 bg-gray-100 text-dark rounded-lg font-semibold hover:bg-gray-200 transition-colors"
              >
                Start free
              </a>
            </div>

            {/* Growth - Featured */}
            <div className="rounded-2xl border-2 border-primary-500 p-8 bg-gradient-to-br from-primary-600 to-primary-800 text-white relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-secondary text-white text-xs font-bold rounded-full">
                MOST POPULAR
              </div>
              <p className="text-sm text-primary-200 font-semibold uppercase tracking-wider mb-2">Growth</p>
              <div className="mb-6">
                <span className="text-5xl font-bold">$49</span>
                <span className="text-primary-200">/mo</span>
              </div>
              <p className="text-sm text-primary-100 mb-6">For growing businesses</p>
              <ul className="space-y-3 mb-8">
                {['1,000 products', '10 staff members', '20GB storage', '1% transaction fee', 'Advanced analytics'].map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-300 flex-shrink-0 mt-0.5" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <a
                href={`${DASHBOARD_URL}/register`}
                className="block w-full text-center px-4 py-2.5 bg-white text-primary-700 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                Get started
              </a>
            </div>

            {/* Pro */}
            <div className="rounded-2xl border border-gray-200 p-8 bg-white">
              <p className="text-sm text-gray-500 font-semibold uppercase tracking-wider mb-2">Pro</p>
              <div className="mb-6">
                <span className="text-5xl font-bold text-dark">$99</span>
                <span className="text-gray-500">/mo</span>
              </div>
              <p className="text-sm text-gray-600 mb-6">For serious businesses</p>
              <ul className="space-y-3 mb-8">
                {['Unlimited products', '25 staff members', '100GB storage', '0.5% transaction fee', 'Priority support'].map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{f}</span>
                  </li>
                ))}
              </ul>
              <a
                href={`${DASHBOARD_URL}/register`}
                className="block w-full text-center px-4 py-2.5 bg-gray-100 text-dark rounded-lg font-semibold hover:bg-gray-200 transition-colors"
              >
                Get started
              </a>
            </div>
          </div>

          <div className="text-center mt-8">
            <Link
              href="/pricing"
              className="inline-flex items-center gap-1 text-primary-600 hover:text-primary-700 font-semibold"
            >
              See detailed pricing
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ============================================
          DEMO STORE CALLOUT
          ============================================ */}
      <section className="py-24 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            See it in action
          </div>
          <h2 className="text-3xl sm:text-5xl font-bold mb-6">
            Try a real Aurion store
          </h2>
          <p className="text-lg text-white/80 mb-8 max-w-2xl mx-auto">
            Explore a live demo store. Add products to cart. See the full customer experience.
          </p>
          <Link
            href="/johns-sneakers"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-primary-700 rounded-xl font-semibold hover:bg-gray-100 transition-colors shadow-xl"
          >
            Visit demo store
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* ============================================
          FAQ
          ============================================ */}
      <section className="py-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-5xl font-bold text-dark mb-4">
              Common questions
            </h2>
            <p className="text-lg text-gray-600">
              Everything you need to know before getting started.
            </p>
          </div>

          <div className="space-y-4">
            {[
              {
                q: 'How long does it take to set up a store?',
                a: 'You can have a fully functional store live in under 10 minutes. Sign up, add a few products, and start selling.',
              },
              {
                q: 'Do I need any technical skills?',
                a: 'No. Aurion is designed for entrepreneurs, not developers. If you can use email, you can use Aurion.',
              },
              {
                q: 'What payment methods do you support?',
                a: 'We use Stripe to accept all major credit cards worldwide. Additional payment methods coming soon.',
              },
              {
                q: 'Can I use my own domain?',
                a: 'Yes! Free stores get a yourstore.aurioncommerce.com URL. Paid plans support custom domains.',
              },
              {
                q: 'What happens after the free trial?',
                a: 'You can continue on the Free plan forever (with limits), or upgrade to a paid plan. No charges without your permission.',
              },
              {
                q: 'Can I cancel anytime?',
                a: 'Yes. Cancel your subscription anytime from your dashboard. No hidden fees, no long-term commitments.',
              },
            ].map((faq) => (
              <details
                key={faq.q}
                className="group rounded-xl border border-gray-200 bg-white overflow-hidden"
              >
                <summary className="cursor-pointer p-5 flex items-center justify-between font-semibold text-dark hover:bg-gray-50 transition-colors">
                  {faq.q}
                  <ChevronRight className="w-5 h-5 text-gray-400 group-open:rotate-90 transition-transform" />
                </summary>
                <div className="px-5 pb-5 text-gray-600">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================
          FINAL CTA
          ============================================ */}
      <section className="py-24 bg-gradient-to-b from-white to-primary-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl sm:text-5xl font-bold text-dark mb-4">
            Ready to start selling?
          </h2>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Join entrepreneurs building modern online stores with Aurion.
            Get started in minutes, absolutely free.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href={`${DASHBOARD_URL}/register`}
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition-colors shadow-lg text-base"
            >
              Start free trial
              <ArrowRight className="w-5 h-5" />
            </a>
            <Link
              href="/johns-sneakers"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white border border-gray-200 text-dark rounded-xl font-semibold hover:bg-gray-50 transition-colors text-base"
            >
              <Play className="w-4 h-4" />
              See demo
            </Link>
          </div>
          <p className="text-sm text-gray-500 mt-6">
            ✨ No credit card required · 14-day trial · Cancel anytime
          </p>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}