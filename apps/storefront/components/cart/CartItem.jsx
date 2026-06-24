'use client';

import Link from 'next/link';
import { Minus, Plus, Trash2, ImageIcon } from 'lucide-react';
import useCartStore from '../../lib/cart';

export default function CartItem({ item, storeSlug, currencySymbol = '$', compact = false }) {
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);

  const isOnSale = item.compareAtPrice && item.compareAtPrice > item.price;
  const lineTotal = item.price * item.quantity;

  const handleIncrease = () => {
    updateQuantity(storeSlug, item.productId, item.quantity + 1);
  };

  const handleDecrease = () => {
    updateQuantity(storeSlug, item.productId, item.quantity - 1);
  };

  const handleRemove = () => {
    removeItem(storeSlug, item.productId);
  };

  if (compact) {
    return (
      <div className="flex gap-3 py-4 border-b border-gray-100 last:border-0">
        {/* Image */}
        <Link
          href={`/${storeSlug}/products/${item.slug}`}
          className="flex-shrink-0 w-20 h-20 rounded-lg bg-gray-100 overflow-hidden"
        >
          {item.image ? (
            <img
              src={item.image}
              alt={item.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ImageIcon className="w-8 h-8 text-gray-300" />
            </div>
          )}
        </Link>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <Link
            href={`/${storeSlug}/products/${item.slug}`}
            className="block font-medium text-dark text-sm hover:text-primary-600 line-clamp-2"
          >
            {item.title}
          </Link>

          {item.sku && (
            <p className="text-xs text-gray-500 mt-0.5">SKU: {item.sku}</p>
          )}

          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="font-semibold text-dark text-sm">
              {currencySymbol}{Number(item.price).toFixed(2)}
            </span>
            {isOnSale && (
              <span className="text-xs text-gray-400 line-through">
                {currencySymbol}{Number(item.compareAtPrice).toFixed(2)}
              </span>
            )}
          </div>

          {/* Quantity + Remove */}
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center border border-gray-200 rounded-md">
              <button
                onClick={handleDecrease}
                className="w-7 h-7 flex items-center justify-center text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <Minus className="w-3 h-3" />
              </button>
              <span className="w-8 text-center text-sm font-medium">
                {item.quantity}
              </span>
              <button
                onClick={handleIncrease}
                className="w-7 h-7 flex items-center justify-center text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>

            <button
              onClick={handleRemove}
              className="text-gray-400 hover:text-danger p-1 transition-colors"
              aria-label="Remove from cart"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // FULL VIEW (for /cart page)
  return (
    <div className="flex gap-4 py-6 border-b border-gray-200 last:border-0">
      {/* Image */}
      <Link
        href={`/${storeSlug}/products/${item.slug}`}
        className="flex-shrink-0 w-24 h-24 sm:w-32 sm:h-32 rounded-lg bg-gray-100 overflow-hidden"
      >
        {item.image ? (
          <img
            src={item.image}
            alt={item.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon className="w-10 h-10 text-gray-300" />
          </div>
        )}
      </Link>

      {/* Info */}
      <div className="flex-1 min-w-0 flex flex-col">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link
              href={`/${storeSlug}/products/${item.slug}`}
              className="block font-semibold text-dark hover:text-primary-600"
            >
              {item.title}
            </Link>
            {item.sku && (
              <p className="text-sm text-gray-500 mt-0.5">SKU: {item.sku}</p>
            )}
          </div>

          {/* Remove on desktop */}
          <button
            onClick={handleRemove}
            className="hidden sm:flex text-gray-400 hover:text-danger p-1 transition-colors flex-shrink-0"
            aria-label="Remove from cart"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-baseline gap-2 mt-2">
          <span className="font-semibold text-dark">
            {currencySymbol}{Number(item.price).toFixed(2)}
          </span>
          {isOnSale && (
            <span className="text-sm text-gray-400 line-through">
              {currencySymbol}{Number(item.compareAtPrice).toFixed(2)}
            </span>
          )}
        </div>

        {/* Bottom: Quantity + Line Total + Remove (mobile) */}
        <div className="flex items-center justify-between gap-3 mt-auto pt-4">
          {/* Quantity */}
          <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
            <button
              onClick={handleDecrease}
              className="w-8 h-9 flex items-center justify-center text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-10 text-center text-sm font-semibold">
              {item.quantity}
            </span>
            <button
              onClick={handleIncrease}
              className="w-8 h-9 flex items-center justify-center text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Line Total */}
          <div className="text-right">
            <p className="text-xs text-gray-500">Subtotal</p>
            <p className="font-bold text-dark">
              {currencySymbol}{Number(lineTotal).toFixed(2)}
            </p>
          </div>

          {/* Remove on mobile */}
          <button
            onClick={handleRemove}
            className="sm:hidden text-gray-400 hover:text-danger p-1 transition-colors"
            aria-label="Remove from cart"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}