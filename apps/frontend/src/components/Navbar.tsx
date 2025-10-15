// apps/frontend/src/components/Navbar.tsx
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useProfile } from '../hooks/useProfile';
import { Compass } from 'lucide-react';
import clsx from 'clsx';

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
      'px-3 py-2 font-semibold transition-colors',
      'hover:underline underline-offset-8 decoration-2',
      isActive 
        ? 'text-white underline decoration-2' 
        : 'text-slate-300 hover:text-white'
    );

  // Prefer profile.name (full display name), then User.username (sanitized username), then email prefix
  const displayName = (profile?.name && profile.name.trim()) || (user as any)?.username || nameFromEmail(user?.email) || '';
  const profileAvatar = profile?.avatar || '';
  const isTransient = profileAvatar && (profileAvatar.startsWith('blob:') || profileAvatar.startsWith('file:'));
  const avatar = isTransient ? '' : profileAvatar;
  const first = (displayName || '?').charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-primary-900/70 backdrop-blur-xl">
      <div className="container-app flex items-center justify-between py-3">
        {/* Brand with Logo */}
        <Link to="/" className="flex items-center gap-2 group" aria-label={APP_NAME}>
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-400 rounded-xl blur-md opacity-60 group-hover:opacity-90 transition-opacity" />
            <div className="relative bg-gradient-to-br from-purple-500 via-pink-500 to-cyan-400 p-2 rounded-xl shadow-lg group-hover:shadow-purple-500/50 transition-all">
              <Compass className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
          </div>
          <span className="text-2xl font-bold font-['Poppins'] bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-300 bg-clip-text text-transparent">
            WeGo
          </span>
        </Link>

        {/* Nav */}
        <nav className="hidden md:flex items-center gap-2 lg:gap-3">
          <NavLink to="/explore" className={linkClass}>Explore</NavLink>
          <NavLink to="/create" className={linkClass}>Create</NavLink>
          
          {/* Admin Dashboard Link (only for admin) */}
          {user?.role === 'admin' && (
            <NavLink to="/admin/dashboard" className={linkClass}>Dashboard</NavLink>
          )}

          {user ? (
            <div className="flex items-center gap-3 ml-2">
              {/* Avatar + Name */}
              <Link
                to="/profile"
                className="flex items-center gap-2.5 rounded-xl bg-gradient-to-r from-slate-800/60 to-slate-700/60 hover:from-slate-700/80 hover:to-slate-600/80 px-4 py-2 transition-all hover:scale-105 border border-amber-500/20 hover:border-amber-500/40 shadow-lg hover:shadow-xl h-10"
              >
                <div className="h-7 w-7 rounded-full overflow-hidden grid place-items-center bg-gradient-to-br from-amber-500/30 to-yellow-500/30 ring-2 ring-amber-400/50 shadow-md flex-shrink-0">
                  {avatar ? (
                    <img
                      src={avatar}
                      alt="avatar"
                      className="h-full w-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <span className="text-xs font-bold text-amber-300">{first}</span>
                  )}
                </div>
                <span className="text-white text-sm font-semibold max-w-[100px] truncate">
                  {displayName}
                </span>
              </Link>

              {/* Log out */}
              <button
                onClick={() => logOut()}
                className="px-5 py-2 rounded-xl font-semibold bg-gradient-to-r from-red-500/20 to-red-600/20 hover:from-red-500/30 hover:to-red-600/30 border-2 border-red-400/30 hover:border-red-400/50 text-red-300 hover:text-red-200 transition-all hover:scale-105 shadow-lg hover:shadow-red-500/20 h-10"
              >
                Log out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3 ml-2">
              <NavLink 
                to="/auth/signin" 
                className="px-5 py-2 rounded-xl font-semibold bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-900 hover:from-amber-500/90 hover:to-yellow-500/90 transition-all hover:scale-105 hover:shadow-md hover:shadow-amber-500/20"
              >
                Sign in
              </NavLink>
              <NavLink 
                to="/auth/signup" 
                className="px-5 py-2 rounded-xl font-semibold border-2 border-white/30 text-white hover:bg-white/5 hover:border-white/40 transition-all hover:scale-105"
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
