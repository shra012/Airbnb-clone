import { useMemo, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import AppHeader from '../components/AppHeader';
import ConciergeLauncher from '../components/ConciergeLauncher.jsx';
import ConciergePanel from '../components/ConciergePanel.jsx';
import { ConciergeProvider } from '../context/ConciergeContext.jsx';

const links = [
  {
    to: '/traveler/dashboard',
    label: 'Overview',
    match: (path) => path.startsWith('/traveler/dashboard'),
  },
  {
    to: '/traveler/search',
    label: 'Find stays',
    match: (path) => path.startsWith('/traveler/search'),
  },
  {
    to: '/traveler/bookings',
    label: 'Trips',
    match: (path) => path.startsWith('/traveler/bookings'),
  },
  {
    to: '/traveler/history',
    label: 'Past trips',
    match: (path) => path.startsWith('/traveler/history'),
  },
  {
    to: '/traveler/favorites',
    label: 'Saved stays',
    match: (path) => path.startsWith('/traveler/favorites'),
  },
];

function TravelerDashboardLayoutInner() {
  const [isConciergeOpen, setConciergeOpen] = useState(false);
  const [isConciergeBusy, setConciergeBusy] = useState(false);
  const launcherRef = useRef(null);
  const location = useLocation();
  const activePath = location.pathname;
  const activeOrigin = location.state?.from ?? null;

  const activeLinkTo = useMemo(() => {
    if (activePath.startsWith('/traveler/properties')) {
      return activeOrigin === 'favorites' ? '/traveler/favorites' : '/traveler/search';
    }
    const matched = links.find((link) => link.match(activePath));
    return matched?.to ?? null;
  }, [activeOrigin, activePath]);

  const navLinks = useMemo(
    () =>
      links.map((link) => ({
        ...link,
        isActive: link.to === activeLinkTo,
      })),
    [activeLinkTo]
  );
  const isDetailView = activePath.startsWith('/traveler/properties/');

  return (
    <div className="relative min-h-screen bg-base-200">
      <AppHeader />
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10 md:flex-row">
        <aside className="md:w-64">
          <nav className="relative">
            {isDetailView ? (
              <div className="absolute inset-0 z-20 rounded-3xl bg-base-200/60 backdrop-blur-sm" aria-hidden="true" />
            ) : null}
            <ul
              className={`menu card-surface p-5 gap-2 transition ${
                isDetailView ? 'pointer-events-none opacity-60' : 'opacity-100'
              }`}
            >
            {navLinks.map((link) => (
              <li key={link.to}>
                <NavLink
                  to={link.to}
                  state={undefined}
                  className={({ isPending }) =>
                    `rounded-2xl px-4 py-3 text-sm font-medium transition ${
                      link.isActive
                        ? 'bg-airbnb-primary text-white'
                        : isPending
                        ? 'text-airbnb-charcoal/50'
                        : 'text-airbnb-charcoal/70 hover:bg-airbnb-cream'
                    }`
                  }
                  onClick={isDetailView ? undefined : () => setConciergeOpen(false)}
                  aria-disabled={isDetailView ? 'true' : undefined}
                  tabIndex={isDetailView ? -1 : undefined}
                >
                  {link.label}
                </NavLink>
              </li>
            ))}
            </ul>
          </nav>
        </aside>
        <main className="flex-1">
          <div className="card-surface p-6 md:p-8">
            <Outlet key={location.pathname} />
          </div>
        </main>
      </div>
      <ConciergeLauncher
        ref={launcherRef}
        isOpen={isConciergeOpen}
        onOpen={() => setConciergeOpen(true)}
        isBusy={isConciergeBusy}
      />
      <ConciergePanel
        isOpen={isConciergeOpen}
        onClose={() => {
          setConciergeOpen(false);
          setTimeout(() => {
            launcherRef.current?.focus();
          }, 200);
        }}
        onBusyChange={setConciergeBusy}
      />
    </div>
  );
}

export default function TravelerDashboardLayout() {
  return (
    <ConciergeProvider>
      <TravelerDashboardLayoutInner />
    </ConciergeProvider>
  );
}
