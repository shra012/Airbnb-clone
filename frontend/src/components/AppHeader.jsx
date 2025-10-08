import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useCurrentUser, useAuthActions } from '../hooks/useAuth';
import { useState } from 'react';

const navItems = [
  { label: 'Places to stay', href: '/#stays' },
  { label: 'Experiences', href: '/#experiences' },
  { label: 'About us', href: '/#about' },
];

export default function AppHeader() {
  const navigate = useNavigate();
  const location = useLocation();
  const { data: user } = useCurrentUser({ suspense: false });
  const { logout } = useAuthActions();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const isSignupPage = location.pathname === '/auth/signup';
  const initials = (() => {
    if (!user?.name) return '';
    const parts = user.name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  })();

  const [imgError, setImgError] = useState(false);
  const avatarUrl = user?.travelerProfile?.avatarUrl || user?.ownerProfile?.avatarUrl;
  const hasAvatar = Boolean(avatarUrl && avatarUrl.trim() !== '' && !imgError);

  return (
    <header className="border-b border-base-200 bg-base-100/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link to="/" className="text-xl font-semibold text-airbnb-primary">
          <span className="rounded-full bg-airbnb-primary/10 px-3 py-1 text-sm font-medium text-airbnb-primary">
            AirHost
          </span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-medium text-airbnb-charcoal/70 md:flex">
          {navItems.map((item) => (
            <a key={item.label} href={item.href} className="hover:text-airbnb-primary">
              {item.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <NavLink
                to={user.role === 'OWNER' ? '/owner/dashboard' : '/traveler/dashboard'}
                className="btn btn-ghost btn-sm rounded-full"
              >
                Dashboard
              </NavLink>
              <NavLink to="/profile" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                <div className="avatar">
                  <div className="h-8 w-8 rounded-full border border-base-300 overflow-hidden bg-airbnb-primary/10 flex items-center justify-center">
                    {hasAvatar ? (
                      <img
                        src={avatarUrl}
                        alt={initials || user.name}
                        onError={() => setImgError(true)}
                        onLoad={() => setImgError(false)}
                        className="block h-full w-full object-cover"
                      />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-sm font-semibold leading-none text-airbnb-primary select-none text-center">
                        {initials}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right text-xs text-airbnb-charcoal/70">
                  <p className="font-semibold text-airbnb-charcoal">{user.name}</p>
                  <p className="uppercase tracking-[0.2em]">{user.role}</p>
                </div>
              </NavLink>
              <button
                type="button"
                className="btn btn-primary btn-sm rounded-full"
                onClick={handleLogout}
              >
                Logout
              </button>
            </>
          ) : (
            <div className="auth-btn-group">
              <NavLink 
                to="/auth/login" 
                className={`auth-btn btn btn-sm rounded-full ${isSignupPage ? 'btn-ghost' : 'btn-primary'}`}
              >
                Log in
              </NavLink>
              <NavLink 
                to="/auth/signup" 
                className={`auth-btn btn btn-sm rounded-full ${isSignupPage ? 'btn-primary' : 'btn-ghost'}`}
              >
                Sign up
              </NavLink>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
