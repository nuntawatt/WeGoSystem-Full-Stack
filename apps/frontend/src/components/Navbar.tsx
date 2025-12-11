import { Link, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useProfile } from '../hooks/useProfile';
import { Plus, LogOut, LayoutDashboard, Search } from 'lucide-react';
import clsx from 'clsx';
import logo from '../../image/logo-wego.png';

const APP_NAME = import.meta.env.VITE_APP_NAME || 'WeGo';

function nameFromEmail(email?: string | null) {
  return email ? (email.split('@')[0] || '') : '';
}

export default function Navbar() {
  const { user, logOut } = useAuth();
  const { data: profile } = useProfile(user?._id);
  const location = useLocation();
  const isHome = location.pathname === '/';

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    clsx(
      'px-4 py-2 text-sm font-medium transition-all duration-200',
      isActive
        ? 'text-slate-900 dark:text-white border-b-2 border-teal-600 dark:border-teal-400'
        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
    );

  const displayName = (profile?.name && profile.name.trim()) || (user as any)?.username || nameFromEmail(user?.email) || '';
  const profileAvatar = profile?.avatar || '';
  const isTransient = profileAvatar && (profileAvatar.startsWith('blob:') || profileAvatar.startsWith('file:'));
  const avatar = isTransient ? '' : profileAvatar;
  const first = (displayName || '?').charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800">
      <div className="container-app flex items-center justify-between py-2">

        <Link to="/" className="flex items-center gap-2 group" aria-label={APP_NAME}>
          <div className="flex items-center transition-transform duration-200 group-hover:scale-105">
            <img src={logo} alt="WeGo" className="h-9 sm:h-10 w-auto object-contain block" />
          </div>
          <div className="flex flex-col justify-center">
          </div>
        </Link>

        {/* Nav - Clean minimal links */}
        <nav className="hidden md:flex items-center gap-6">
          <NavLink to="/explore" className={linkClass}>
            <span className="flex items-center gap-2">
              <Search className="w-4 h-4" /> Explore
            </span>
          </NavLink>
          <NavLink to="/create" className={linkClass}>
            <span className="flex items-center gap-2">
              <Plus className="w-4 h-4" /> Create
            </span>
          </NavLink>

          {/* Admin Dashboard Link */}
          {user?.role === 'admin' && (
            <NavLink to="/admin/dashboard" className={linkClass}>
              <span className="flex items-center gap-2">
                <LayoutDashboard className="w-4 h-4" /> Dashboard
              </span>
            </NavLink>
          )}

          {user ? (
            <div className="flex items-center gap-3 ml-4 pl-4 border-l border-slate-200 dark:border-slate-700">
              {/* Profile button - Clean style */}
              <Link
                to="/profile"
                className="flex items-center gap-2.5 px-3 py-1.5 rounded-md transition-all duration-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <div className="h-8 w-8 rounded-full overflow-hidden grid place-items-center bg-teal-100 dark:bg-teal-900 flex-shrink-0">
                  {avatar ? (
                    <img
                      src={avatar}
                      alt="avatar"
                      className="h-full w-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <span className="text-sm font-medium text-teal-700 dark:text-teal-300">{first}</span>
                  )}
                </div>
                <span className="text-slate-700 dark:text-slate-300 text-sm font-medium max-w-[100px] truncate">
                  {displayName}
                </span>
              </Link>

              {/* Log out - Subtle style */}
              <button
                onClick={() => logOut()}
                className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200"
              >
                <LogOut className="w-4 h-4" />
                Log out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3 ml-4 pl-4 border-l border-slate-200 dark:border-slate-700">
              <NavLink
                to="/auth/signin"
                className="px-5 py-2 rounded-full text-sm font-medium text-white bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 shadow-md shadow-teal-500/20 hover:shadow-lg hover:shadow-teal-500/30 transition-all duration-300"
              >
                Sign in
              </NavLink>
              <NavLink
                to="/auth/signup"
                className="px-5 py-2 rounded-full text-sm font-medium text-teal-600 dark:text-teal-400 border-2 border-teal-500 dark:border-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/30 hover:text-teal-700 dark:hover:text-teal-300 transition-all duration-300"
              >
                Sign up
              </NavLink>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
