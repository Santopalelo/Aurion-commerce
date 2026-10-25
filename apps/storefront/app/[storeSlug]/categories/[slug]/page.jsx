import { storefrontApi } from '../../../../lib/api';
import ProductCard from '../../../../components/product/ProductCard';
import { Package } from 'lucide-react';
import Link from 'next/link';

export async function generateMetadata({ params }) {
  try {
    const { store } = await storefrontApi.getStore(params.storeSlug);
    const category = await storefrontApi.getCategory(
      params.storeSlug,
      params.slug
    );
    return {
      title: `${category.name} | ${store.name}`,
      description: category.description || `Browse ${category.name} at ${store.name}`,
    };
  } catch {
    return { title: 'Category' };
  }
}

export default async function CategoryDetailPage({ params, searchParams }) {
  const { storeSlug, slug } = params;
  const { store } = await storefrontApi.getStore(storeSlug);
  const category = await storefrontApi.getCategory(storeSlug, slug, searchParams);

  const products = category.products || [];
  const meta = category.meta || { total: products.length };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <div className="mb-6">
        <nav className="text-sm text-gray-600 mb-4">
          <Link href={`/${storeSlug}`} className="hover:text-primary-600">
            Home
          </Link>
          {' / '}
          <Link href={`/${storeSlug}/categories`} className="hover:text-primary-600">
            Categories
          </Link>
          {' / '}
          <span className="text-dark">{category.name}</span>
        </nav>
        <h1 className="text-3xl sm:text-4xl font-bold text-dark mb-2">
          {category.name}
        </h1>
        {category.description && (
          <p className="text-gray-600 max-w-3xl">{category.description}</p>
        )}
        <p className="text-gray-600 mt-2">
          {meta.total} {meta.total === 1 ? 'product' : 'products'}
        </p>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
            <Package className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-dark mb-2">
            No products in this category
          </h3>
          <p className="text-gray-600">
            Check back soon for new arrivals!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {products.map((product) => (
            <ProductCard
              key={product._id}
              product={product}
              storeSlug={storeSlug}
              currencySymbol={store.currencySymbol}
            />
          ))}
        </div>
      )}
    </div>
  );
}
