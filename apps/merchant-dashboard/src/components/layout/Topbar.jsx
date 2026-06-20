import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell, Search, ChevronDown, LogOut, User as UserIcon, Settings,
  Menu,
} from 'lucide-react';
import toast from 'react-hot-toast';
import useAuthStore from '../../store/useAuthStore';
import { authService } from '../../services/auth.service';

const Topbar = ({ onMenuClick }) => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await authService.logout();
      clearAuth();
      toast.success('Logged out successfully');
      navigate('/login');
    } catch (error) {
      clearAuth();
      navigate('/login');
    }
  };

  const initials = user
    ? `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase()
    : '?';

  return (
    <header className="h-16 bg-white border-b border-gray-200 sticky top-0 z-30">
      <div className="h-full px-4 sm:px-6 flex items-center justify-between gap-3">
        {/* LEFT SIDE */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Hamburger Menu (mobile only) */}
          <button
            onClick={onMenuClick}
            className="lg:hidden w-10 h-10 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors flex-shrink-0"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5 text-gray-700" />
          </button>

          {/* Search (hidden on small mobile, visible on sm+) */}
          <div className="hidden sm:block flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search..."
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-transparent rounded-lg text-sm placeholder:text-gray-400 focus:bg-white focus:border-gray-300 focus:ring-0 outline-none transition-all"
              />
            </div>
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          {/* Mobile Search Button */}
          <button className="sm:hidden w-10 h-10 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors">
            <Search className="w-5 h-5 text-gray-600" />
          </button>

          {/* Notifications */}
          <button className="relative w-10 h-10 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors">
            <Bell className="w-5 h-5 text-gray-600" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-danger rounded-full"></span>
          </button>

          {/* User menu */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-2 sm:gap-3 px-1 sm:px-2 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 text-white flex items-center justify-center text-sm font-semibold flex-shrink-0">
                {initials}
              </div>
              <div className="text-left hidden md:block">
                <p className="text-sm font-medium text-dark leading-none">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-gray-500 mt-0.5 truncate max-w-[150px]">
                  {user?.email}
                </p>
              </div>
              <ChevronDown className="w-4 h-4 text-gray-400 hidden sm:block" />
            </button>

            {/* Dropdown */}
            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setMenuOpen(false)}
                ></div>

                <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden z-50 animate-slide-up">
                  <div className="p-3 border-b border-gray-100">
                    <p className="text-sm font-medium text-dark">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                  </div>
                  <div className="py-1">
                    <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                      <UserIcon className="w-4 h-4" />
                      Profile
                    </button>
                    <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                      <Settings className="w-4 h-4" />
                      Settings
                    </button>
                  </div>
                  <div className="border-t border-gray-100 py-1">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm text-danger hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Log out
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Topbar;