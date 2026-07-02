'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Search, Menu, ShoppingBag } from 'lucide-react';
import { useState, useEffect } from 'react';
import useCartStore from '../../lib/cart';
import CustomerMenu from '../customer/CustomerMenu';

export default function Navbar({ store }) {
  const params = useParams();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const cart = useCartStore((state) => state.carts[params.storeSlug] || []);
  const openDrawer = useCartStore((state) => state.openDrawer);
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  useEffect(() => {
    setMounted(true);
  }, []);

  const baseUrl = `/${params.storeSlug}`;

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="h-16 flex items-center justify-between gap-4">
          {/* Mobile menu */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden w-10 h-10 rounded-lg hover:bg-gray-100 flex items-center justify-center"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Logo + Store Name */}
          <Link href={baseUrl} className="flex items-center gap-3 min-w-0">
            {store.logo?.url ? (
              <img
                src={store.logo.url}
                alt={store.name}
                className="w-9 h-9 rounded-lg object-cover"
              />
            ) : (
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-bold flex-shrink-0">
                {store.name?.[0]?.toUpperCase() || 'S'}
              </div>
            )}
            <span className="font-bold text-lg text-dark truncate">
              {store.name}
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href={baseUrl}
              className="text-sm text-gray-700 hover:text-primary-600 font-medium transition-colors"
            >
              Home
            </Link>
            <Link
              href={`${baseUrl}/products`}
              className="text-sm text-gray-700 hover:text-primary-600 font-medium transition-colors"
            >
              Products
            </Link>
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            <button className="w-10 h-10 rounded-lg hover:bg-gray-100 flex items-center justify-center">
              <Search className="w-5 h-5 text-gray-700" />
            </button>

            {/* Customer Menu (Login/Profile) */}
            <CustomerMenu storeSlug={params.storeSlug} />

            {/* Cart Button */}
            <button
              onClick={openDrawer}
              className="relative w-10 h-10 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
              aria-label="Open cart"
            >
              <ShoppingBag className="w-5 h-5 text-gray-700" />
              {mounted && itemCount > 0 && (
                <span className="absolute top-1 right-1 min-w-[18px] h-[18px] bg-primary-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                  {itemCount > 99 ? '99+' : itemCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <nav className="md:hidden border-t border-gray-200 py-3 space-y-1">
            <Link
              href={baseUrl}
              onClick={() => setMenuOpen(false)}
              className="block px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg"
            >
              Home
            </Link>
            <Link
              href={`${baseUrl}/products`}
              onClick={() => setMenuOpen(false)}
              className="block px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg"
            >
              Products
            </Link>
            <Link
              href={`${baseUrl}/cart`}
              onClick={() => setMenuOpen(false)}
              className="block px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg"
            >
              Cart {itemCount > 0 && `(${itemCount})`}
            </Link>
            <Link
              href={`${baseUrl}/account`}
              onClick={() => setMenuOpen(false)}
              className="block px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg"
            >
              My Account
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}