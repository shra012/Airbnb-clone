import { Link } from 'react-router-dom';
import { memo } from 'react';
import FirebaseImage from '../../components/FirebaseImage';

const highlights = [
  {
    title: 'Standout stays',
    description: 'Showcase your property with photography-ready layouts and instant availability.',
    imagePath: 'landing/highlights/standout-stays.jpg',
  },
  {
    title: 'Effortless hosting',
    description: 'Coordinate bookings, payments, and guest messaging without leaving the dashboard.',
    imagePath: 'landing/highlights/effortless-hosting.jpg',
  },
  {
    title: 'Traveler delights',
    description: 'Discover curated itineraries, save favourites, and book unforgettable stays.',
    imagePath: 'landing/highlights/traveler-delights.jpg',
  },
];

const ownerFeatures = [
  {
    title: 'Calendar sync',
    description: 'Track guest requests, respond instantly, and keep your occupancy high with smart tools.',
    icon: '📅',
    gradient: 'from-pink-100 to-pink-50',
    imagePath: 'landing/owner-features/calendar-sync.jpg',
  },
  {
    title: 'Automated updates',
    description: 'Get notified of bookings, cancellations, and messages in real-time across all your properties.',
    icon: '',
    gradient: 'from-purple-100 to-purple-50',
    imagePath: 'landing/owner-features/automated-updates.jpg',
  },
  {
    title: 'Performance insights',
    description: 'Analyze revenue trends, occupancy rates, and guest satisfaction with powerful analytics.',
    icon: '',
    gradient: 'from-blue-100 to-blue-50',
    imagePath: 'landing/owner-features/performance-insights.jpg',
  },
];

const FeatureCard = memo(({ feature }) => (
  <div className="group relative overflow-hidden card-surface hover:shadow-2xl transition-all duration-300">
    <div className="relative h-56 overflow-hidden bg-base-200">
      <FirebaseImage 
        path={feature.imagePath}
        alt={feature.title}
        className="absolute inset-0 h-full w-full object-cover transform group-hover:scale-110 transition-transform duration-500"
      />
    </div>
    
    <div className="p-6 bg-base-100">
      <h3 className="text-xl font-semibold text-airbnb-charcoal mb-3">{feature.title}</h3>
      <p className="text-sm text-airbnb-charcoal/70 leading-relaxed">
        {feature.description}
      </p>
    </div>
  </div>
));

FeatureCard.displayName = 'FeatureCard';

export default function LandingPage() {
  return (
    <div className="bg-base-100">
      <section className="mx-auto flex max-w-6xl flex-col items-start gap-10 px-6 py-16 md:flex-row md:items-center md:gap-16">
        <div className="flex-1 space-y-6">
          <h1 className="text-4xl font-semibold leading-tight text-airbnb-charcoal md:text-5xl">
            The easiest way to host and explore stays like it&apos;s AirHost.
          </h1>
          <p className="text-base text-airbnb-charcoal/70 md:text-lg">
            AirHost gives owners a premium toolkit to manage properties while travelers discover
            curated experiences across the globe.
          </p>
          <div className="auth-btn-group flex-wrap gap-4">
            <Link to="/auth/login" className="auth-btn btn btn-primary btn-lg rounded-full">
              I already have an account
            </Link>
            <Link to="/auth/signup" className="auth-btn btn btn-ghost btn-lg rounded-full">
              Sign up for free
            </Link>
          </div>
        </div>
        <div className="flex-1">
          <div className="card-surface p-6">
            <div className="grid gap-6">
              {highlights.map((item) => (
                <div key={item.title} className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl overflow-hidden bg-base-200 flex-shrink-0">
                    <FirebaseImage 
                      path={item.imagePath}
                      alt={item.title}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-airbnb-charcoal">{item.title}</h3>
                    <p className="text-sm text-airbnb-charcoal/65">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="stays" className="bg-base-200 py-16">
        <div className="mx-auto max-w-6xl space-y-10 px-6">
          <div className="text-center">
            <h2 className="text-3xl font-semibold text-airbnb-charcoal">Why owners love AirHost</h2>
            <p className="mt-2 text-airbnb-charcoal/60">Powerful tools to grow your hosting business</p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {ownerFeatures.map((feature) => (
              <FeatureCard key={feature.title} feature={feature} />
            ))}
          </div>
        </div>
      </section>

      <section id="experiences" className="py-16">
        <div className="mx-auto max-w-6xl space-y-6 px-6">
          <h2 className="text-2xl font-semibold text-airbnb-charcoal">For travelers, by travelers</h2>
          <p className="text-sm text-airbnb-charcoal/60 md:w-2/3">
            Save favourites, chat with hosts, and receive tailored itineraries thanks to our integrated
            AI concierge.
          </p>
        </div>
      </section>
    </div>
  );
}
