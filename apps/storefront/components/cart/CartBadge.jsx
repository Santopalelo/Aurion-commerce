'use client';

import { ShoppingBag } from 'lucide-react';
import { useEffect, useState } from 'react';
import useCartStore from '../../lib/cart';

export default function CartBadge({ storeSlug, onClick }) {
  const [mounted, setMounted] = useState(false);
  
  // SELECTOR: We select the specific cart for this store.
  // When this slice of state changes, the component will re-render automatically.
  const cart = useCartStore((state) => state.carts[storeSlug] || []);
  
  const itemCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <button
      onClick={onClick}
      className="relative w-10 h-10 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
      aria-label="Open cart"
    >
      <ShoppingBag className="w-5 h-5 text-gray-700" />

      {itemCount > 0 && (
        <span className="absolute top-1 right-1 min-w-[18px] h-[18px] bg-primary-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
          {itemCount > 99 ? '99+' : itemCount}
        </span>
      )}
    </button>
  );
}