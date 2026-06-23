import { storefrontApi } from '../../../lib/api';
import ProductCard from '../../../components/product/ProductCard';
import ProductsHeader from '../../../components/product/ProductsHeader';
import { Package } from 'lucide-react';

// SEO Metadata
export async function generateMetadata({ params }) {
  try {
    const { store } = await storefrontApi.getStore(params.storeSlug);
    return {
      title: `All Products | ${store.name}`,
      description: `Browse all products at ${store.name}`,
    };
  } catch {
    return { title: 'Products' };
  }
}

export default async function ProductsPage({ params, searchParams }) {
  const { storeSlug } = params;

  // Get store info
  const { store } = await storefrontApi.getStore(storeSlug);

  // Get products with current filters
  const queryParams = {
    page: searchParams.page || 1,
    limit: 24,
    sortBy: searchParams.sort || 'newest',
    ...(searchParams.search && { search: searchParams.search }),
    ...(searchParams.minPrice && { minPrice: searchParams.minPrice }),
    ...(searchParams.maxPrice && { maxPrice: searchParams.maxPrice }),
  };

  const response = await storefrontApi.getProducts(storeSlug, queryParams);
  const products = response.data || [];
  const meta = response.meta || { total: 0, page: 1, totalPages: 1 };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-dark mb-2">
          All Products
        </h1>
        <p className="text-gray-600">
          {meta.total} {meta.total === 1 ? 'product' : 'products'} available
        </p>
      </div>

      {/* Sort dropdown */}
      <ProductsHeader
        currentSort={searchParams.sort || 'newest'}
        totalProducts={meta.total}
      />

      {/* Products Grid */}
      {products.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
            <Package className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-dark mb-2">
            No products found
          </h3>
          <p className="text-gray-600">
            {searchParams.search
              ? `No products match "${searchParams.search}"`
              : 'Check back soon for new arrivals!'}
          </p>
        </div>
      ) : (
        <>
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

          {/* Pagination */}
          {meta.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-12">
              {Array.from({ length: meta.totalPages }, (_, i) => i + 1).map((p) => (
                <a
                  key={p}
                  href={`?page=${p}${searchParams.sort ? `&sort=${searchParams.sort}` : ''}`}
                  className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-medium transition-colors ${
                    p === meta.page
                      ? 'bg-primary-600 text-white'
                      : 'bg-white border border-gray-200 text-dark hover:bg-gray-50'
                  }`}
                >
                  {p}
                </a>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}