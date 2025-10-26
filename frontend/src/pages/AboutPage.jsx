import { NavLink } from 'react-router-dom';

export default function AboutPage() {
  const pillars = [
    {
      title: 'Thoughtful stays',
      description:
        'Every listing on AirHost goes through a quality check so travelers can expect comfortable, well-equipped homes that match the photos.',
    },
    {
      title: 'Trust first',
      description:
        'We verify hosts, facilitate secure payments, and offer responsive support so both sides can book with confidence.',
    },
    {
      title: 'Local expertise',
      description:
        'Our concierge agent pairs travel data with local knowledge to recommend unique experiences tailored to your stay.',
    },
  ];

  return (
    <div className="min-h-screen bg-base-200">
      <section className="bg-gradient-to-br from-airbnb-primary/10 via-base-100 to-base-200">
        <div className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-20 text-center sm:gap-10">
          <p className="text-xs uppercase tracking-[0.3em] text-airbnb-primary/80">About AirHost</p>
          <h1 className="text-4xl font-semibold text-airbnb-charcoal sm:text-5xl">
            Travel powered by people and meaningful stays.
          </h1>
          <p className="mx-auto max-w-3xl text-base text-airbnb-charcoal/70 sm:text-lg">
            AirHost is a modern hospitality platform connecting discerning travelers with verified hosts.
            We believe that flexible travel should feel effortless, from finding the right stay to planning every day of your trip.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-16 sm:py-20">
        <div className="grid gap-6 md:grid-cols-3">
          {pillars.map((pillar) => (
            <div
              key={pillar.title}
              className="card-surface h-full space-y-3 border border-base-200/70 p-6 text-left shadow-sm"
            >
              <p className="text-xs uppercase tracking-[0.3em] text-airbnb-primary/70">{pillar.title}</p>
              <p className="text-sm text-airbnb-charcoal/70">{pillar.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-base-100">
        <div className="mx-auto grid max-w-5xl gap-8 px-6 py-16 md:grid-cols-[1.2fr,1fr]">
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-airbnb-charcoal">How we support hosts</h2>
            <p className="text-sm leading-relaxed text-airbnb-charcoal/70">
              We equip hosts with powerful tools—pricing intelligence, automated communications, and
              instant concierge escalation—so they can focus on hospitality. Our owner dashboard keeps
              every request and booking organized in one place, while our support team monitors key
              metrics to keep listings performing.
            </p>
            <p className="text-sm leading-relaxed text-airbnb-charcoal/70">
              Whether you manage one property or a portfolio, AirHost helps you create experiences guests rave about.
            </p>
          </div>
          <div className="card-surface space-y-4 p-6">
            <h3 className="text-lg font-semibold text-airbnb-charcoal">Numbers we&rsquo;re proud of</h3>
            <ul className="space-y-3 text-sm text-airbnb-charcoal/70">
              <li>
                <span className="font-semibold text-airbnb-charcoal">15K+</span> nights booked through AirHost in 2024
              </li>
              <li>
                <span className="font-semibold text-airbnb-charcoal">92%</span> of stays rated 5 stars by travelers
              </li>
              <li>
                <span className="font-semibold text-airbnb-charcoal">24/7</span> concierge coverage for guest itineraries
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 pb-20 pt-16">
        <div className="card-surface space-y-6 p-8 text-center">
          <h2 className="text-2xl font-semibold text-airbnb-charcoal">Join the AirHost community</h2>
          <p className="mx-auto max-w-3xl text-sm leading-relaxed text-airbnb-charcoal/70">
            Looking to see the world differently? Whether you&rsquo;re planning your next trip or preparing
            to welcome guests, AirHost is here to help. Explore curated stays, craft itineraries with our concierge,
            and discover travel communities built on trust.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <NavLinkButton to="/traveler/search" label="Explore stays" variant="primary" />
            <NavLinkButton to="/auth/owner/signup" label="Become a host" variant="ghost" />
          </div>
        </div>
      </section>
    </div>
  );
}

function NavLinkButton({ to, label, variant }) {
  const baseClasses = 'btn rounded-full px-6';
  const variantClasses =
    variant === 'primary'
      ? 'btn-primary text-white'
      : 'btn-ghost border border-base-300 text-airbnb-charcoal/80 hover:border-airbnb-primary/40';

  return (
    <NavLink
      to={to}
      className={`${baseClasses} ${variantClasses}`}
    >
      {label}
    </NavLink>
  );
}
