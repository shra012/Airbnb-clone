import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useCurrentUser, useAuthActions } from '../hooks/useAuth';

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
              <div className="text-right text-xs text-airbnb-charcoal/70">
                <p className="font-semibold text-airbnb-charcoal">{user.name}</p>
                <p className="uppercase tracking-[0.2em]">{user.role}</p>
              </div>
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
