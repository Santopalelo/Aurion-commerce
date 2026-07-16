import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Store, Users, TrendingUp, LogOut,
  Shield, ChevronDown, Bell, Menu, X,
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import useAuthStore from '../store/useAuthStore';
import { authService } from '../services/admin.service';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Overview' },
  { to: '/stores', icon: Store, label: 'Stores' },
  { to: '/users', icon: Users, label: 'Users' },
  { to: '/analytics', icon: TrendingUp, label: 'Analytics' },
];

const Layout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const admin = useAuthStore((state) => state.admin);
  const clearAuth = useAuthStore((state) => state.clearAuth);

  const [menuOpen, setMenuOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const menuRef = useRef(null);

  // Close user menu on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // Lock body scroll when sidebar is open (mobile)
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [sidebarOpen]);

  // Close on Escape key
  useEffect(() => {
    if (!sidebarOpen) return;
    const handleEscape = (e) => {
      if (e.key === 'Escape') setSidebarOpen(false);
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [sidebarOpen]);

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch {}
    clearAuth();
    toast.success('Logged out');
    navigate('/login');
  };

  const initials = admin
    ? `${admin.firstName?.[0] || ''}${admin.lastName?.[0] || ''}`.toUpperCase()
    : 'A';

  return (
    <div className="flex min-h-screen bg-gray-soft">
      {/* ============================================
          MOBILE BACKDROP
          ============================================ */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden animate-fade-in"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ============================================
          SIDEBAR
          Mobile: slide-in drawer
          Desktop: always visible sticky
          ============================================ */}
      <aside
        className={clsx(
          'fixed lg:sticky top-0 left-0 z-50 h-screen w-64 bg-dark text-white flex flex-col transition-transform duration-300 ease-out',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Logo + Close button */}
        <div className="h-16 px-6 flex items-center justify-between border-b border-gray-800 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold">Aurion Admin</p>
              <p className="text-xs text-gray-400">Platform Control</p>
            </div>
          </div>

          {/* Close button — mobile only */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden w-8 h-8 rounded-lg hover:bg-gray-800 flex items-center justify-center"
            aria-label="Close menu"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                  isActive
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                )
              }
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Warning */}
        <div className="p-4 border-t border-gray-800 flex-shrink-0">
          <div className="bg-primary-900/50 border border-primary-800 rounded-lg p-3">
            <p className="text-xs text-primary-200 font-medium">
              ⚠️ Platform admin access
            </p>
            <p className="text-xs text-primary-300 mt-1">
              Changes affect all stores
            </p>
          </div>
        </div>
      </aside>

      {/* ============================================
          MAIN CONTENT
          ============================================ */}
      <div className="flex-1 flex flex-col min-w-0 w-full">
        {/* Topbar */}
        <header className="h-16 bg-white border-b border-gray-200 sticky top-0 z-30">
          <div className="h-full px-4 sm:px-6 flex items-center justify-between gap-3">
            {/* LEFT — Hamburger (mobile only) */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden w-10 h-10 rounded-lg hover:bg-gray-100 flex items-center justify-center"
                aria-label="Open menu"
              >
                <Menu className="w-5 h-5 text-gray-700" />
              </button>

              {/* Mobile logo */}
              <div className="lg:hidden flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
                  <Shield className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold text-dark text-sm">Aurion Admin</span>
              </div>
            </div>

            {/* RIGHT — Actions */}
            <div className="flex items-center gap-2">
              <button className="w-10 h-10 rounded-lg hover:bg-gray-100 flex items-center justify-center">
                <Bell className="w-5 h-5 text-gray-600" />
              </button>

              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 text-white flex items-center justify-center text-sm font-semibold">
                    {initials}
                  </div>
                  <div className="text-left hidden md:block">
                    <p className="text-sm font-medium text-dark leading-none">
                      {admin?.firstName} {admin?.lastName}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">Super Admin</p>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-400 hidden md:block" />
                </button>

                {menuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden z-50">
                    <div className="p-3 border-b border-gray-100">
                      <p className="text-sm font-medium text-dark">
                        {admin?.firstName} {admin?.lastName}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{admin?.email}</p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;