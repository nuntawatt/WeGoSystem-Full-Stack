import { Link, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useProfile } from '../hooks/useProfile';
import { Plus, LogOut, LayoutDashboard, Compass, User, Sparkles } from 'lucide-react';

const APP_NAME = import.meta.env.VITE_APP_NAME || 'WegoSystem';

function nameFromEmail(email?: string | null) {
  return email ? (email.split('@')[0] || '') : '';
}

export default function Navbar() {
  const { user, logOut } = useAuth();
  const { data: profile } = useProfile(user?._id);
  const location = useLocation();

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
      isActive
        ? 'bg-[#E0F3F1] text-[#11665C]'
        : 'text-[#5F6664] hover:text-[#202124] hover:bg-[#F3F5F4]'
    }`;

  const displayName = (profile?.name && profile.name.trim()) || (user as any)?.username || nameFromEmail(user?.email) || '';
  const profileAvatar = profile?.avatar || '';
  const isTransient = profileAvatar && (profileAvatar.startsWith('blob:') || profileAvatar.startsWith('file:'));
  const avatar = isTransient ? '' : profileAvatar;
  const first = (displayName || '?').charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#E8EBE9] shadow-xs">
      <div className="container-app flex items-center justify-between py-3">
        {/* Brand Logo & Name */}
        <Link to="/" className="flex items-center gap-3 group" aria-label={APP_NAME}>
          <div className="relative w-9 h-9 rounded-xl bg-[#147D70] flex items-center justify-center shadow-xs transition-transform duration-200 group-hover:scale-105">
            <div className="absolute -top-1.5 -left-1.5 w-4 h-4 rounded-full bg-[#D9F36A]" />
            <div className="relative z-10 w-3.5 h-3.5 rounded-full border-2 border-white flex items-center justify-center">
              <div className="w-1 h-1 rounded-full bg-[#D9F36A]" />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-lg tracking-tight text-[#202124] leading-tight">
              Wego<span className="text-[#147D70]">System</span>
            </span>
            <span className="text-[10px] font-medium text-[#858B89] -mt-0.5 tracking-wider uppercase">
              Activity & Community
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="flex items-center gap-2 sm:gap-4">
          <NavLink to="/explore" className={linkClass}>
            <Compass className="w-4 h-4" />
            <span>Explore</span>
          </NavLink>

          <NavLink to="/create" className={linkClass}>
            <Plus className="w-4 h-4" />
            <span>Create Activity</span>
          </NavLink>

          {/* Admin Dashboard Quick Link */}
          {user?.role === 'admin' && (
            <NavLink 
              to="/admin/dashboard" 
              className={({ isActive }) => 
                `flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  isActive 
                    ? 'bg-[#202124] text-white shadow-xs' 
                    : 'bg-[#F3F5F4] text-[#202124] hover:bg-[#202124] hover:text-white'
                }`
              }
            >
              <LayoutDashboard className="w-4 h-4 text-[#D9F36A]" />
              <span>Admin Console</span>
            </NavLink>
          )}

          {/* User Auth Actions */}
          {user ? (
            <div className="flex items-center gap-2 pl-2 sm:pl-4 border-l border-[#E8EBE9]">
              {/* Profile Chip */}
              <Link
                to="/profile"
                className="flex items-center gap-2.5 p-1.5 pr-3 rounded-xl bg-[#F3F5F4] hover:bg-[#E8EBE9] border border-[#E8EBE9] transition-all duration-200 group"
              >
                <div className="h-7 w-7 rounded-lg overflow-hidden grid place-items-center bg-[#147D70] text-white flex-shrink-0">
                  {avatar ? (
                    <img
                      src={avatar}
                      alt="avatar"
                      className="h-full w-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <span className="text-xs font-bold">{first}</span>
                  )}
                </div>
                <span className="text-[#202124] text-xs font-semibold max-w-[110px] truncate group-hover:text-[#147D70]">
                  {displayName}
                </span>
              </Link>

              {/* Log out Button */}
              <button
                onClick={() => logOut()}
                title="Sign out of account"
                className="p-2 rounded-xl text-[#858B89] hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100 transition-colors"
                aria-label="Log out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 pl-2 sm:pl-4 border-l border-[#E8EBE9]">
              <NavLink
                to="/auth/signin"
                className="px-4 py-2 text-sm font-semibold text-[#202124] hover:text-[#147D70] hover:bg-[#F3F5F4] rounded-xl transition-colors"
              >
                Sign In
              </NavLink>
              <NavLink
                to="/auth/signup"
                className="btn-primary py-2 px-4 text-xs font-semibold"
              >
                Get Started
              </NavLink>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
