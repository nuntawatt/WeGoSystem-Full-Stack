// apps/frontend/src/components/Navbar.tsx
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useProfile } from '../hooks/useProfile';
import clsx from 'clsx';

const APP_NAME = import.meta.env.VITE_APP_NAME || 'WeGo';

function nameFromEmail(email?: string | null) {
  return email ? (email.split('@')[0] || '') : '';
}

export default function Navbar() {
  const { user, logOut } = useAuth();
  const { data: profile } = useProfile(user?._id);

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    clsx(
      'px-2 py-1 rounded-md text-white/90 hover:text-white transition font-semibold',
      'hover:underline underline-offset-8 decoration-2',
      isActive && 'underline decoration-2 text-white'
    );

  const displayName = nameFromEmail(user?.email) || '';
  const profileAvatar = profile?.avatar || '';
  const isTransient = profileAvatar && (profileAvatar.startsWith('blob:') || profileAvatar.startsWith('file:'));
  const avatar = isTransient ? '' : profileAvatar;
  const first = (displayName || '?').charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-primary-900/70 backdrop-blur">
      <div className="container-app flex items-center justify-between py-2">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-3" aria-label={APP_NAME}>
          <span className="text-2xl md:text-3xl font-extrabold leading-none">
            <span className="bg-gradient-to-r from-emerald-400 via-amber-300 to-pink-400 bg-clip-text text-transparent">
              We
            </span>
            <span className="text-white">Go</span>
          </span>
        </Link>

        {/* Nav */}
        <nav className="hidden md:flex items-center gap-6 lg:gap-8">
          <NavLink to="/explore" className={linkClass}>Explore</NavLink>
          <NavLink to="/create" className={linkClass}>Create</NavLink>
          
          {/* Admin Dashboard Link (only for admin) */}
          {user?.role === 'admin' && (
            <NavLink to="/admin/dashboard" className={linkClass}>Dashboard</NavLink>
          )}

          {user ? (
            <div className="flex items-center gap-3">
              {/* Avatar + Name */}
              <Link
                to="/profile"
                className="flex items-center gap-2 rounded-full bg-white/5 hover:bg-white/10 px-3 py-1.5 transition"
              >
                <div className="h-8 w-8 rounded-full overflow-hidden grid place-items-center bg-white/10">
                  {avatar ? (
                    <img
                      src={avatar}
                      alt="avatar"
                      className="h-full w-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <span className="text-sm font-semibold">{first}</span>
                  )}
                </div>
                <span className="text-white/90 text-sm font-semibold max-w-[140px] truncate">
                  {displayName}
                </span>
              </Link>

              {/* Log out */}
              <button
                onClick={() => logOut()}
                className="btn-primary rounded-full px-5 py-2"
              >
                Log out
              </button>
            </div>
          ) : (
            <>
              <NavLink to="/auth/signin" className="ml-2 btn-primary rounded-full px-5 py-2">Sign in</NavLink>
              <NavLink to="/auth/signup" className="btn-ghost rounded-full px-4 py-2">Sign up</NavLink>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
