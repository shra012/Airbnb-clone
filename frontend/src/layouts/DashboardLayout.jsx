import { NavLink, Outlet } from 'react-router-dom';
import AppHeader from '../components/AppHeader';

export default function DashboardLayout() {
  return (
    <div className="min-h-screen">
      <AppHeader />
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10 md:flex-row">
        <aside className="md:w-64">
          <nav className="menu card-surface p-5 gap-2">
            <li>
              <NavLink
                to="/owner/dashboard"
                end
                className={({ isActive }) =>
                  `rounded-2xl px-4 py-3 text-sm font-medium transition ${
                    isActive
                      ? 'bg-airbnb-primary text-white'
                      : 'text-airbnb-charcoal/70 hover:bg-airbnb-cream'
                  }`
                }
              >
                Dashboard overview
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/owner/bookings"
                className={({ isActive }) =>
                  `rounded-2xl px-4 py-3 text-sm font-medium transition ${
                    isActive
                      ? 'bg-airbnb-primary text-white'
                      : 'text-airbnb-charcoal/70 hover:bg-airbnb-cream'
                  }`
                }
              >
                Bookings board
              </NavLink>
            </li>
          </nav>
        </aside>
        <main className="flex-1">
          <div className="rounded-3xl bg-white p-6 shadow-soft">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
