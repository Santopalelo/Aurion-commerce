import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Store, Users, TrendingUp, LogOut,
  Shield, ChevronDown, Bell,
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
  const admin = useAuthStore((state) => state.admin);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

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
      {/* Sidebar */}
      <aside className="w-64 bg-dark text-white flex flex-col h-screen sticky top-0">
        {/* Logo */}
        <div className="h-16 px-6 flex items-center border-b border-gray-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold">Aurion Admin</p>
              <p className="text-xs text-gray-400">Platform Control</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-6 space-y-1">
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
              <item.icon className="w-5 h-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Warning */}
        <div className="p-4 border-t border-gray-800">
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

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-16 bg-white border-b border-gray-200 sticky top-0 z-30">
          <div className="h-full px-6 flex items-center justify-end gap-3">
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
                <div className="text-left hidden sm:block">
                  <p className="text-sm font-medium text-dark leading-none">
                    {admin?.firstName} {admin?.lastName}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">Super Admin</p>
                </div>
                <ChevronDown className="w-4 h-4 text-gray-400 hidden sm:block" />
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
        </header>

        <main className="flex-1 p-6 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;