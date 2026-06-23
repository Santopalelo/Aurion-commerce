'use client';

import { useState } from 'react';
import { ImageIcon } from 'lucide-react';

export default function ProductGallery({ images = [], title }) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  if (!images || images.length === 0) {
    return (
      <div className="aspect-square rounded-2xl bg-gray-100 flex items-center justify-center">
        <ImageIcon className="w-16 h-16 text-gray-300" />
      </div>
    );
  }

  const sortedImages = [...images].sort((a, b) => {
    if (a.isPrimary) return -1;
    if (b.isPrimary) return 1;
    return (a.order || 0) - (b.order || 0);
  });

  return (
    <div className="space-y-3">
      {/* Main Image */}
      <div className="relative aspect-square rounded-2xl bg-gray-100 overflow-hidden">
        <img
          src={sortedImages[selectedIndex]?.url}
          alt={sortedImages[selectedIndex]?.altText || title}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Thumbnails */}
      {sortedImages.length > 1 && (
        <div className="grid grid-cols-5 gap-2">
          {sortedImages.map((img, index) => (
            <button
              key={img.publicId || index}
              onClick={() => setSelectedIndex(index)}
              className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                index === selectedIndex
                  ? 'border-primary-600 ring-2 ring-primary-200'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <img
                src={img.url}
                alt={`${title} thumbnail ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}