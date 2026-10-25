import { storefrontApi } from '../../../lib/api';
import Link from 'next/link';
import { Grid, Package } from 'lucide-react';

export async function generateMetadata({ params }) {
  try {
    const { store } = await storefrontApi.getStore(params.storeSlug);
    return {
      title: `Categories | ${store.name}`,
      description: `Browse product categories at ${store.name}`,
    };
  } catch {
    return { title: 'Categories' };
  }
}

export default async function CategoriesPage({ params }) {
  const { storeSlug } = params;
  const { store } = await storefrontApi.getStore(storeSlug);
  const categories = await storefrontApi.getCategories(storeSlug);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-dark mb-2">
          Categories
        </h1>
        <p className="text-gray-600">
          Browse products by category
        </p>
      </div>

      {!categories || categories.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
            <Grid className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-dark mb-2">
            No categories found
          </h3>
          <p className="text-gray-600">
            Check back soon for new categories!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => (
            <Link
              key={category._id}
              href={`/${storeSlug}/categories/${category.slug}`}
              className="group block bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
            >
              {category.image?.url ? (
                <div className="aspect-video w-full overflow-hidden">
                  <img
                    src={category.image.url}
                    alt={category.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              ) : (
                <div className="aspect-video w-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center">
                  <Package className="w-12 h-12 text-primary-600" />
                </div>
              )}
              <div className="p-6">
                <h3 className="text-xl font-semibold text-dark mb-2 group-hover:text-primary-600 transition-colors">
                  {category.name}
                </h3>
                {category.description && (
                  <p className="text-gray-600 text-sm line-clamp-2">
                    {category.description}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
