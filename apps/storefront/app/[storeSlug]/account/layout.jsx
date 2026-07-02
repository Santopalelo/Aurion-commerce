'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, usePathname } from 'next/navigation';
import AccountSidebar from '../../../components/customer/AccountSidebar';
import useCustomerAuthStore from '../../../lib/customerAuth';

export default function AccountLayout({ children }) {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const storeSlug = params.storeSlug;

  const [mounted, setMounted] = useState(false);
  const isAuthenticated = useCustomerAuthStore((state) =>
    state.isAuthenticated(storeSlug)
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (mounted && !isAuthenticated) {
      const redirect = encodeURIComponent(pathname);
      router.push(`/${storeSlug}/auth/login?redirect=${redirect}`);
    }
  }, [mounted, isAuthenticated, storeSlug, router, pathname]);

  if (!mounted) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <div className="flex flex-col lg:flex-row gap-8">
        <AccountSidebar storeSlug={storeSlug} />
        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </div>
  );
}