import Link from 'next/link';
import { ImageIcon } from 'lucide-react';
import { formatPrice } from '../../lib/format';

export default function ProductCard({ product, storeSlug, currencySymbol = '$' }) {
  const primaryImage = product.images?.find((img) => img.isPrimary) || product.images?.[0];
  const isOnSale = product.compareAtPrice && product.compareAtPrice > product.price;
  const discount = isOnSale
    ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
    : 0;

  return (
    <Link
      href={`/${storeSlug}/products/${product.slug}`}
      className="group block"
    >
      {/* Image */}
      <div className="relative aspect-square rounded-xl bg-gray-100 overflow-hidden mb-3">
        {primaryImage ? (
          <img
            src={primaryImage.url}
            alt={product.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon className="w-12 h-12 text-gray-300" />
          </div>
        )}

        {/* Sale badge */}
        {isOnSale && (
          <div className="absolute top-3 left-3 px-2 py-1 bg-dark text-white text-xs font-bold rounded">
            -{discount}%
          </div>
        )}
      </div>

      {/* Info */}
      <h3 className="font-medium text-dark text-sm group-hover:text-primary-600 transition-colors line-clamp-2">
        {product.title}
      </h3>

      <div className="flex items-baseline gap-2 mt-1.5">
        <span className="font-bold text-dark">
          {currencySymbol}{Number(product.price).toFixed(2)}
        </span>
        {isOnSale && (
          <span className="text-sm text-gray-400 line-through">
            {currencySymbol}{Number(product.compareAtPrice).toFixed(2)}
          </span>
        )}
      </div>
    </Link>
  );
}