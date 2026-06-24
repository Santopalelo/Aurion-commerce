'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { ShoppingBag, Minus, Plus, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import useCartStore from '../../lib/cart';

export default function AddToCartButton({ product, disabled = false }) {
  // ✅ Get storeSlug from URL params
  const params = useParams();
  const storeSlug = params.storeSlug;

  const [quantity, setQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);

  const addItem = useCartStore((state) => state.addItem);
  const openDrawer = useCartStore((state) => state.openDrawer);

  const handleAddToCart = () => {
    if (!storeSlug) {
      console.error('Store slug is missing!');
      toast.error('Something went wrong. Please refresh the page.');
      return;
    }

    // Add to cart
    addItem(storeSlug, product, quantity);

    // Show success state
    setJustAdded(true);
    toast.success(`Added ${quantity} × ${product.title} to cart!`);

    // Reset button after 1.5 seconds
    setTimeout(() => {
      setJustAdded(false);
    }, 1500);

    // Open the cart drawer after a brief delay
    setTimeout(() => {
      openDrawer();
    }, 300);
  };

  const decreaseQty = () => setQuantity((q) => Math.max(1, q - 1));
  const increaseQty = () => setQuantity((q) => q + 1);

  return (
    <div className="flex gap-3">
      {/* Quantity selector */}
      <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
        <button
          onClick={decreaseQty}
          disabled={disabled || quantity === 1}
          className="w-10 h-12 flex items-center justify-center text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Minus className="w-4 h-4" />
        </button>
        <span className="w-12 text-center font-semibold text-dark">
          {quantity}
        </span>
        <button
          onClick={increaseQty}
          disabled={disabled}
          className="w-10 h-12 flex items-center justify-center text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Add to cart */}
      <button
        onClick={handleAddToCart}
        disabled={disabled}
        className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {justAdded ? (
          <>
            <Check className="w-4 h-4" />
            Added!
          </>
        ) : (
          <>
            <ShoppingBag className="w-4 h-4" />
            {disabled ? 'Out of stock' : 'Add to cart'}
          </>
        )}
      </button>
    </div>
  );
}