import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, Check, Truck, ShieldCheck, RotateCcw } from 'lucide-react';
import { storefrontApi } from '../../../../lib/api';
import ProductGallery from '../../../../components/product/ProductGallery';
import AddToCartButton from '../../../../components/product/AddToCartButton';
import ProductCard from '../../../../components/product/ProductCard';

export async function generateMetadata({ params }) {
  try {
    const { product } = await storefrontApi.getProduct(
      params.storeSlug,
      params.slug
    );
    const { store } = await storefrontApi.getStore(params.storeSlug);

    return {
      title: product.seo?.metaTitle || `${product.title} | ${store.name}`,
      description: product.seo?.metaDescription || product.shortDescription || product.description?.slice(0, 160),
    };
  } catch {
    return { title: 'Product Not Found' };
  }
}

export default async function ProductDetailPage({ params }) {
  const { storeSlug, slug } = params;

  let productData;
  let store;

  try {
    [productData, store] = await Promise.all([
      storefrontApi.getProduct(storeSlug, slug),
      storefrontApi.getStore(storeSlug).then(d => d.store),
    ]);
  } catch (error) {
    notFound();
  }

  const { product, relatedProducts } = productData;
  const isOnSale = product.compareAtPrice && product.compareAtPrice > product.price;
  const discount = isOnSale
    ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
    : 0;

  const isInStock = !product.trackInventory || product.allowBackorder || product.inventoryQuantity > 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1 text-sm text-gray-500 mb-6">
        <Link href={`/${storeSlug}`} className="hover:text-primary-600">
          Home
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link href={`/${storeSlug}/products`} className="hover:text-primary-600">
          Products
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-dark font-medium truncate">{product.title}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 mb-16">
        <ProductGallery images={product.images} title={product.title} />

        <div>
          {product.vendor && (
            <p className="text-sm text-gray-500 uppercase tracking-wider mb-2">
              {product.vendor}
            </p>
          )}

          <h1 className="text-3xl sm:text-4xl font-bold text-dark mb-4">
            {product.title}
          </h1>

          <div className="flex items-baseline gap-3 mb-6">
            <span className="text-3xl font-bold text-dark">
              {store.currencySymbol}{Number(product.price).toFixed(2)}
            </span>
            {isOnSale && (
              <>
                <span className="text-xl text-gray-400 line-through">
                  {store.currencySymbol}{Number(product.compareAtPrice).toFixed(2)}
                </span>
                <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded">
                  Save {discount}%
                </span>
              </>
            )}
          </div>

          {product.shortDescription && (
            <p className="text-gray-600 mb-6 text-lg">
              {product.shortDescription}
            </p>
          )}

          <div className="flex items-center gap-2 mb-6">
            {isInStock ? (
              <>
                <Check className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-700">In stock</span>
              </>
            ) : (
              <span className="text-sm font-medium text-red-600">Out of stock</span>
            )}
          </div>

          <div className="mb-8">
            <AddToCartButton product={product} disabled={!isInStock} />
          </div>

          <div className="grid grid-cols-3 gap-3 py-6 border-y border-gray-200 mb-6">
            <div className="text-center">
              <Truck className="w-6 h-6 mx-auto mb-1 text-gray-700" />
              <p className="text-xs text-gray-600">Fast Shipping</p>
            </div>
            <div className="text-center">
              <ShieldCheck className="w-6 h-6 mx-auto mb-1 text-gray-700" />
              <p className="text-xs text-gray-600">Secure Checkout</p>
            </div>
            <div className="text-center">
              <RotateCcw className="w-6 h-6 mx-auto mb-1 text-gray-700" />
              <p className="text-xs text-gray-600">Easy Returns</p>
            </div>
          </div>

          {product.tags && product.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {product.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {product.description && (
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-dark mb-4">Description</h2>
          <div className="prose max-w-none text-gray-700 whitespace-pre-wrap">
            {product.description}
          </div>
        </div>
      )}

      {relatedProducts && relatedProducts.length > 0 && (
        <section className="border-t border-gray-200 pt-12">
          <h2 className="text-2xl font-bold text-dark mb-6">
            You might also like
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {relatedProducts.map((relProd) => (
              <ProductCard
                key={relProd._id}
                product={relProd}
                storeSlug={storeSlug}
                currencySymbol={store.currencySymbol}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}