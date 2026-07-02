'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User, ShoppingBag, MapPin, LogOut, LayoutDashboard } from 'lucide-react';
import clsx from 'clsx';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import useCustomerAuthStore from '../../lib/customerAuth';

export default function AccountSidebar({ storeSlug }) {
  const pathname = usePathname();
  const router = useRouter();
  const clearSession = useCustomerAuthStore((state) => state.clearSession);

  const baseUrl = `/${storeSlug}/account`;

  const navItems = [
    { href: `${baseUrl}`, label: 'Overview', icon: LayoutDashboard, exact: true },
    { href: `${baseUrl}/orders`, label: 'My Orders', icon: ShoppingBag },
    { href: `${baseUrl}/addresses`, label: 'Addresses', icon: MapPin },
    { href: `${baseUrl}/profile`, label: 'Profile', icon: User },
  ];

  const isActive = (item) => {
    if (item.exact) return pathname === item.href;
    return pathname.startsWith(item.href);
  };

  const handleLogout = () => {
    clearSession(storeSlug);
    toast.success('Logged out successfully');
    router.push(`/${storeSlug}`);
  };

  return (
    <aside className="w-full lg:w-64 flex-shrink-0">
      <nav className="bg-white rounded-2xl border border-gray-200 p-2 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={clsx(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
              isActive(item)
                ? 'bg-primary-50 text-primary-700'
                : 'text-gray-600 hover:bg-gray-50 hover:text-dark'
            )}
          >
            <item.icon className="w-4 h-4 flex-shrink-0" />
            {item.label}
          </Link>
        ))}

        {/* Divider */}
        <div className="border-t border-gray-100 my-1" />

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          Sign out
        </button>
      </nav>
    </aside>
  );
}