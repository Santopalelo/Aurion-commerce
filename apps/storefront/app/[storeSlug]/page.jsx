import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';
import { storefrontApi } from '../../lib/api';
import ProductCard from '../../components/product/ProductCard';

export default async function StoreHomePage({ params }) {
  const { store, featuredProducts, stats } = await storefrontApi.getStore(
    params.storeSlug
  );

  return (
    <div>
      <section className="relative bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 text-white overflow-hidden">
        {store.banner?.url && (
          <div className="absolute inset-0 opacity-20">
            <img src={store.banner.url} alt="" className="w-full h-full object-cover" />
          </div>
        )}

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-20 sm:py-28 text-center">
          <h1 className="text-4xl sm:text-6xl font-bold mb-6">
            Welcome to {store.name}
          </h1>
          {store.description && (
            <p className="text-lg sm:text-xl text-white/80 max-w-2xl mx-auto mb-10">
              {store.description}
            </p>
          )}
          <Link
            href={`/${store.slug}/products`}
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-primary-700 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
          >
            Shop now
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {featuredProducts && featuredProducts.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 text-primary-700 text-xs font-semibold mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                Featured
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-dark">
                Our top picks
              </h2>
            </div>
            <Link
              href={`/${store.slug}/products`}
              className="hidden sm:inline-flex items-center gap-1 text-sm text-primary-600 font-medium hover:text-primary-700"
            >
              View all
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {featuredProducts.map((product) => (
              <ProductCard
                key={product._id}
                product={product}
                storeSlug={store.slug}
                currencySymbol={store.currencySymbol}
              />
            ))}
          </div>
        </section>
      )}

      {(!featuredProducts || featuredProducts.length === 0) && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16 text-center">
          <p className="text-gray-500 mb-6">
            {stats.productCount > 0
              ? `Browse our ${stats.productCount} products`
              : 'New products coming soon!'}
          </p>
          {stats.productCount > 0 && (
            <Link
              href={`/${store.slug}/products`}
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700"
            >
              View all products
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </section>
      )}
    </div>
  );
}