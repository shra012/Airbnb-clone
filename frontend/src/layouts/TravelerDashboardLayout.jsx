import { NavLink, Outlet } from 'react-router-dom';
import AppHeader from '../components/AppHeader';

const links = [
  { to: '/traveler/dashboard', label: 'Overview' },
  { to: '/traveler/search', label: 'Find stays' },
  { to: '/traveler/bookings', label: 'Trips' },
  { to: '/traveler/history', label: 'Past trips' },
  { to: '/traveler/favorites', label: 'Saved stays' },
];

export default function TravelerDashboardLayout() {
  return (
    <div className="min-h-screen bg-base-200">
      <AppHeader />
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10 md:flex-row">
        <aside className="md:w-64">
          <nav className="menu card-surface p-5 gap-2">
            {links.map((link) => (
              <li key={link.to}>
                <NavLink
                  to={link.to}
                  className={({ isActive }) =>
                    `rounded-2xl px-4 py-3 text-sm font-medium transition ${
                      isActive ? 'bg-airbnb-primary text-white' : 'text-airbnb-charcoal/70 hover:bg-airbnb-cream'
                    }`
                  }
                  end
                >
                  {link.label}
                </NavLink>
              </li>
            ))}
          </nav>
        </aside>
        <main className="flex-1">
          <div className="card-surface p-6 md:p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
