'use client';

import { useState } from 'react';
import { ShoppingBag, Minus, Plus, Check } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AddToCartButton({ product, disabled = false }) {
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);

  const handleAddToCart = () => {
    setAdding(true);
    // For now, just show success toast
    // We'll wire this up to the real cart in the next session
    setTimeout(() => {
      toast.success(`Added ${quantity} × ${product.title} to cart!`, {
        duration: 3000,
      });
      setAdding(false);
    }, 500);
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
        disabled={disabled || adding}
        className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {adding ? (
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