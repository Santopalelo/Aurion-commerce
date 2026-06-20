import { NavLink, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import {
  LayoutDashboard,
  Package,
  FolderTree,
  ShoppingCart,
  Users,
  Tag,
  BarChart3,
  Store,
  Settings,
  Sparkles,
  X,
} from 'lucide-react';
import clsx from 'clsx';
import Logo from '../ui/Logo';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Overview' },
  { to: '/products', icon: Package, label: 'Products' },
  { to: '/categories', icon: FolderTree, label: 'Categories' },
  { to: '/orders', icon: ShoppingCart, label: 'Orders' },
  { to: '/customers', icon: Users, label: 'Customers' },
  { to: '/discounts', icon: Tag, label: 'Discounts' },
  { to: '/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/aurion-store', icon: Sparkles, label: 'Aurion Store' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation();

  // ============================================
  // Auto-close sidebar on route change (mobile)
  // ============================================
  useEffect(() => {
    onClose();
  }, [location.pathname]);

  // ============================================
  // Lock body scroll when sidebar is open (mobile)
  // ============================================
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // ============================================
  // Close on Escape key (mobile)
  // ============================================
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  return (
    <>
      {/* ============================================ */}
      {/* MOBILE BACKDROP (only visible when open) */}
      {/* ============================================ */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden animate-fade-in"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* ============================================ */}
      {/* SIDEBAR */}
      {/* Mobile: slide-in drawer */}
      {/* Desktop: always visible sticky */}
      {/* ============================================ */}
      <aside
        className={clsx(
          'fixed lg:sticky top-0 left-0 z-50 h-screen w-64 bg-white border-r border-gray-200 flex flex-col transition-transform duration-300 ease-out',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Header */}
        <div className="h-16 px-6 flex items-center justify-between border-b border-gray-200 flex-shrink-0">
          <Logo size="md" />

          {/* Mobile close button */}
          <button
            onClick={onClose}
            className="lg:hidden w-9 h-9 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
            aria-label="Close menu"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-dark'
                )
              }
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Bottom — Store info */}
        <div className="p-4 border-t border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-gray-50">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white flex-shrink-0">
              <Store className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500">Current store</p>
              <p className="text-sm font-medium text-dark truncate">My Store</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;