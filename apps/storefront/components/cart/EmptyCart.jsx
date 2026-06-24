import Link from 'next/link';
import { ShoppingBag, ArrowRight } from 'lucide-react';

export default function EmptyCart({ storeSlug, onClose, compact = false }) {
  return (
    <div className={`text-center ${compact ? 'py-12 px-6' : 'py-20 px-6'}`}>
      <div className={`mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center ${compact ? 'w-16 h-16' : 'w-20 h-20'}`}>
        <ShoppingBag className={`text-gray-400 ${compact ? 'w-8 h-8' : 'w-10 h-10'}`} />
      </div>
      <h3 className={`font-semibold text-dark mb-2 ${compact ? 'text-base' : 'text-lg'}`}>
        Your cart is empty
      </h3>
      <p className={`text-gray-600 mb-6 ${compact ? 'text-sm' : ''}`}>
        Looks like you haven't added anything yet.
      </p>
      <Link
        href={`/${storeSlug}/products`}
        onClick={onClose}
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors text-sm"
      >
        Browse products
        <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
}