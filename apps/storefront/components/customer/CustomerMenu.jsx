'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { User, LogOut, ShoppingBag, MapPin, ChevronDown, LogIn } from 'lucide-react';
import toast from 'react-hot-toast';
import useCustomerAuthStore from '../../lib/customerAuth';

export default function CustomerMenu({ storeSlug }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const menuRef = useRef(null);

  const customer = useCustomerAuthStore((state) => state.getCustomer(storeSlug));
  const clearSession = useCustomerAuthStore((state) => state.clearSession);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    clearSession(storeSlug);
    toast.success('Logged out successfully');
    setIsOpen(false);
    router.push(`/${storeSlug}`);
  };

  if (!mounted) {
    return (
      <button className="w-10 h-10 rounded-lg hover:bg-gray-100 flex items-center justify-center">
        <User className="w-5 h-5 text-gray-700" />
      </button>
    );
  }

  // Not logged in — show login button
  if (!customer) {
    return (
      <Link
        href={`/${storeSlug}/auth/login`}
        className="w-10 h-10 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
        aria-label="Sign in"
      >
        <User className="w-5 h-5 text-gray-700" />
      </Link>
    );
  }

  // Logged in — show avatar with dropdown
  const initials = `${customer.firstName?.[0] || ''}${
    customer.lastName?.[0] || ''
  }`.toUpperCase();

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 text-white flex items-center justify-center text-xs font-semibold">
          {initials}
        </div>
        <ChevronDown className="w-3 h-3 text-gray-500 hidden sm:block" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden z-50 animate-fade-in">
          {/* User info */}
          <div className="p-3 border-b border-gray-100">
            <p className="text-sm font-medium text-dark truncate">
              {customer.firstName} {customer.lastName}
            </p>
            <p className="text-xs text-gray-500 truncate">{customer.email}</p>
          </div>

          {/* Menu items */}
          <div className="py-1">
            <Link
              href={`/${storeSlug}/account`}
              onClick={() => setIsOpen(false)}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <User className="w-4 h-4" />
              My Account
            </Link>
            <Link
              href={`/${storeSlug}/account/orders`}
              onClick={() => setIsOpen(false)}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <ShoppingBag className="w-4 h-4" />
              My Orders
            </Link>
            <Link
              href={`/${storeSlug}/account/addresses`}
              onClick={() => setIsOpen(false)}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <MapPin className="w-4 h-4" />
              Addresses
            </Link>
          </div>

          {/* Logout */}
          <div className="border-t border-gray-100 py-1">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}