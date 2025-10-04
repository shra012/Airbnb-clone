import { Outlet, useLocation } from 'react-router-dom';
import AppHeader from '../components/AppHeader';

export default function AuthLayout() {
  const location = useLocation();
  const isSignup = location.pathname.endsWith('/signup');

  const heading = isSignup ? 'Sign up to AirHost' : 'Login in to AirHost';
  const subtitle = isSignup
    ? ''
    : 'Access your personalized dashboard whether you travel, host, or do both.';
  const badge = isSignup ? 'Join the community' : 'Welcome back';
  const heroHeading = isSignup ? 'Join the AirHost community' : 'Welcome to AirHost';
  const heroDescription = isSignup
    ? 'Create an account to unlock the full AirHost experience, whether you want to host properties or discover amazing stays around the world.'
    : 'Your all-in-one platform for hosting properties and booking unforgettable experiences around the world.';
  const heroFeatures = isSignup
    ? [
        'Seamless booking and property management tools.',
        'Discover unique stays and unforgettable experiences.',
        'Real-time updates and secure communication platform.',
      ]
    : [
        'Manage bookings and track your properties effortlessly.',
        'Discover and book amazing stays worldwide.',
        'Real-time updates, insights, and secure messaging.',
      ];

  return (
    <div className="min-h-screen bg-base-200">
      <AppHeader />
      <div className="flex items-center justify-center px-4 py-16">
        <div className="grid w-full max-w-6xl gap-12 md:grid-cols-[1.15fr,0.85fr]">
          <div className="hidden flex-col justify-between overflow-hidden rounded-[32px] bg-gradient-to-br from-airbnb-cream via-white to-airbnb-creamLight p-10 shadow-[0_30px_60px_-30px_rgba(172,139,108,0.3)] md:flex">
            <div className="space-y-6">
              <span className="pill-badge w-fit bg-white/70 text-airbnb-primary shadow-none">{badge}</span>
              <h1 className="text-3xl font-semibold leading-snug text-airbnb-charcoal">
                {heroHeading}
              </h1>
              <p className="text-sm text-airbnb-charcoal/70">
                {heroDescription}
              </p>
              <ul className="space-y-3 text-sm text-airbnb-charcoal/70">
                {heroFeatures.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-1 inline-flex h-2 w-2 flex-shrink-0 rounded-full bg-airbnb-primary" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="flex items-center justify-center">
            <div className="card-surface w-full max-w-md p-12">
              <div className="mb-8 space-y-2 text-center">
                <span className="inline-flex items-center gap-2 rounded-full bg-airbnb-cream px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-airbnb-primary">
                  {isSignup ? 'Welcome' : 'Welcome'}
                </span>
                <h2 className="text-2xl font-semibold text-airbnb-charcoal">{heading}</h2>
                <p className="text-sm text-airbnb-charcoal/70">{subtitle}</p>
              </div>
              <Outlet />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
