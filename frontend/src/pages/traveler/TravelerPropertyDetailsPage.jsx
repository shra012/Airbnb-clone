import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ErrorState from '../../components/ErrorState';
import LoadingScreen from '../../components/LoadingScreen';
import { useProperty } from '../../hooks/usePropertyCreation';
import { useCreateBooking } from '../../hooks/useBookings';
import { useTravelerFavorites, useToggleFavorite } from '../../hooks/useTravelerData';

export function ImageCarousel({ photos }) {
  const [index, setIndex] = useState(0);
  const total = photos.length;

  const next = () => setIndex((prev) => (prev + 1) % total);
  const prev = () => setIndex((prev) => (prev - 1 + total) % total);

  if (!total) {
    return (
      <div className="flex h-72 items-center justify-center rounded-3xl bg-base-200 text-sm text-airbnb-charcoal/50">
        No photos available yet.
      </div>
    );
  }

  const currentPhoto = photos[index];

  return (
    <div className="relative overflow-hidden rounded-3xl bg-base-200">
      <img
        src={currentPhoto.url}
        alt={currentPhoto.caption || `Property photo ${index + 1}`}
        className="h-72 w-full object-cover md:h-96"
      />
      {total > 1 && (
        <>
          <button
            type="button"
            onClick={prev}
            className="btn btn-circle btn-sm absolute left-4 top-1/2 -translate-y-1/2 bg-base-100/80 text-airbnb-charcoal/80 backdrop-blur hover:bg-base-100"
            aria-label="Previous photo"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={next}
            className="btn btn-circle btn-sm absolute right-4 top-1/2 -translate-y-1/2 bg-base-100/80 text-airbnb-charcoal/80 backdrop-blur hover:bg-base-100"
            aria-label="Next photo"
          >
            ›
          </button>
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-base-100/80 px-3 py-1 text-xs font-medium text-airbnb-charcoal/70">
            {index + 1} / {total}
          </div>
        </>
      )}
    </div>
  );
}

function AmenitiesList({ amenities }) {
  if (!amenities?.length) {
    return <p className="text-sm text-airbnb-charcoal/60">Amenities information not provided.</p>;
  }

  return (
    <div className="flex flex-wrap gap-3">
      {amenities.map((amenity) => (
        <span
          key={amenity.id || amenity.label}
          className="badge rounded-full border-none bg-airbnb-primary/10 text-airbnb-primary"
        >
          {amenity.label}
        </span>
      ))}
    </div>
  );
}

function PropertyMap({ latitude, longitude, title }) {
  if (typeof latitude !== 'number' || typeof longitude !== 'number') {
    return (
      <div className="dashed-shell text-sm text-airbnb-charcoal/60">
        Coordinates not available for this listing.
      </div>
    );
  }

  const mapUrl = `https://maps.google.com/maps?q=${latitude},${longitude}&z=14&output=embed`;

  return (
    <div className="overflow-hidden rounded-3xl border border-base-200">
      <iframe
        title={`Map view of ${title}`}
        src={mapUrl}
        width="100%"
        height="360"
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
    </div>
  );
}

export default function TravelerPropertyDetailsPage() {
  const { propertyId } = useParams();
  const numericId = Number(propertyId);
  const navigate = useNavigate();

  const { data: property, isLoading, isError, error, refetch } = useProperty(numericId);
  const { data: favorites } = useTravelerFavorites();
  const toggleFavorite = useToggleFavorite();
  const bookingMutation = useCreateBooking();
  const [bookingForm, setBookingForm] = useState({
    startDate: '',
    endDate: '',
    guests: '1',
    notes: '',
  });
  const [bookingError, setBookingError] = useState(null);
  const [bookingSuccess, setBookingSuccess] = useState(null);
  const today = useMemo(() => new Date().toISOString().split('T')[0], []);

  const photos = useMemo(() => property?.photos ?? [], [property?.photos]);
  const isFavorite = useMemo(() => {
    if (!property || !Array.isArray(favorites)) return false;
    return favorites.some((fav) => fav.property.id === property.id);
  }, [favorites, property]);

  const handleBookingChange = (event) => {
    const { name, value } = event.target;

    if (name === 'guests') {
      if (value === '') {
        setBookingForm((prev) => ({ ...prev, guests: '' }));
        return;
      }

      const numeric = Math.max(1, Number(value));
      const capped = property?.maxGuests ? Math.min(property.maxGuests, numeric) : numeric;
      setBookingForm((prev) => ({ ...prev, guests: String(capped) }));
      return;
    }

    setBookingForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleBookingSubmit = (event) => {
    event.preventDefault();
    setBookingError(null);
    setBookingSuccess(null);

    const { startDate, endDate, guests, notes } = bookingForm;

    if (!startDate || !endDate) {
      setBookingError('Please pick check-in and check-out dates.');
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (!(end > start)) {
      setBookingError('Check-out must be after check-in.');
      return;
    }

    const guestsNumber = Number(guests);
    if (!guestsNumber || guestsNumber < 1) {
      setBookingError('Guest count must be at least 1.');
      return;
    }

    if (property?.maxGuests && guestsNumber > property.maxGuests) {
      setBookingError(`Guest count exceeds the maximum of ${property.maxGuests}.`);
      return;
    }

    bookingMutation.mutate(
      {
        propertyId: property.id,
        startDate,
        endDate,
        guests: guestsNumber,
        notes,
      },
      {
        onSuccess: () => {
          setBookingSuccess('Booking request sent! The host will review it shortly.');
          setBookingForm((prev) => ({ ...prev, startDate: '', endDate: '', notes: '' }));
        },
        onError: (mutationError) => {
          setBookingError(mutationError?.message ?? 'Could not place booking request.');
        },
      }
    );
  };

  if (Number.isNaN(numericId) || numericId <= 0) {
    return <ErrorState message="Invalid property identifier." retry={() => navigate(-1)} />;
  }

  if (isLoading) {
    return <LoadingScreen message="Loading property" />;
  }

  if (isError) {
    return <ErrorState message={error?.message ?? 'Unable to load property'} retry={refetch} />;
  }

  if (!property) {
    return <ErrorState message="Property not found" retry={() => navigate(-1)} />;
  }

  const pricePerNight = Number(property.pricePerNight ?? 0);
  const cleaningFee = Number(property.cleaningFee ?? 0);

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="btn btn-ghost btn-sm rounded-full px-4 text-airbnb-charcoal/70"
        >
          ← Back
        </button>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-3xl font-semibold text-airbnb-charcoal">{property.title}</h1>
            <p className="text-sm text-airbnb-charcoal/60">
              {property.city}, {property.state} · {property.country}
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              toggleFavorite.mutate({
                propertyId: property.id,
                isFavorite,
                property,
              })
            }
            className={`btn btn-outline btn-sm rounded-full border-airbnb-primary/40 px-4 ${
              isFavorite ? 'bg-airbnb-primary text-white' : 'text-airbnb-primary'
            }`}
          >
            {isFavorite ? 'Saved' : 'Save stay'}
          </button>
        </div>
      </header>

      <ImageCarousel photos={photos} />

      <section className="grid gap-8 lg:grid-cols-[2fr,1fr]">
        <div className="space-y-6">
          <div className="card-surface space-y-4 p-6">
            <h2 className="text-xl font-semibold text-airbnb-charcoal">About this place</h2>
            <p className="text-sm leading-relaxed text-airbnb-charcoal/70">{property.description}</p>
            <div className="grid grid-cols-2 gap-3 text-sm text-airbnb-charcoal/80">
              <span>Bedrooms: {property.bedrooms}</span>
              <span>Bathrooms: {property.bathrooms}</span>
              <span>Max guests: {property.maxGuests}</span>
              <span>Property type: {property.propertyType}</span>
              {property.checkInTime ? <span>Check-in: {property.checkInTime}</span> : null}
              {property.checkOutTime ? <span>Check-out: {property.checkOutTime}</span> : null}
            </div>
          </div>

          <div className="card-surface space-y-4 p-6">
            <h2 className="text-xl font-semibold text-airbnb-charcoal">Amenities</h2>
            <AmenitiesList amenities={property.amenities} />
          </div>

          <div className="card-surface space-y-4 p-6">
            <h2 className="text-xl font-semibold text-airbnb-charcoal">Where you will be</h2>
            <PropertyMap
              latitude={property.latitude}
              longitude={property.longitude}
              title={property.title}
            />
          </div>
        </div>

        <aside className="space-y-6">
          <div className="card-surface space-y-4 p-6">
            <h2 className="text-xl font-semibold text-airbnb-charcoal">Pricing</h2>
            <p className="text-sm text-airbnb-charcoal/70">
              <span className="text-2xl font-semibold text-airbnb-charcoal">
                ${pricePerNight.toLocaleString()}
              </span>{' '}
              per night
            </p>
            <p className="text-sm text-airbnb-charcoal/70">
              Cleaning fee:{' '}
              {cleaningFee
                ? `$${cleaningFee.toLocaleString()}`
                : 'Included'}
            </p>
            <div className="divider my-3" />
            <h3 className="text-lg font-semibold text-airbnb-charcoal">Request to book</h3>
            <form onSubmit={handleBookingSubmit} className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text text-xs font-semibold uppercase tracking-[0.2em] text-airbnb-charcoal/60">Check-in</span>
                  </label>
                  <input
                    type="date"
                    name="startDate"
                    min={today}
                    value={bookingForm.startDate}
                    onChange={handleBookingChange}
                    className="input input-bordered w-full focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text text-xs font-semibold uppercase tracking-[0.2em] text-airbnb-charcoal/60">Check-out</span>
                  </label>
                  <input
                    type="date"
                    name="endDate"
                    min={bookingForm.startDate || today}
                    value={bookingForm.endDate}
                    onChange={handleBookingChange}
                    className="input input-bordered w-full focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text text-xs font-semibold uppercase tracking-[0.2em] text-airbnb-charcoal/60">Guests</span>
                </label>
                <input
                  type="number"
                  name="guests"
                  min="1"
                  max={property.maxGuests ?? undefined}
                  value={bookingForm.guests}
                  onChange={handleBookingChange}
                  className="input input-bordered w-full focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
                {property.maxGuests ? (
                  <span className="mt-1 text-xs text-airbnb-charcoal/50">Max {property.maxGuests} guests</span>
                ) : null}
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text text-xs font-semibold uppercase tracking-[0.2em] text-airbnb-charcoal/60">Notes (optional)</span>
                </label>
                <textarea
                  name="notes"
                  value={bookingForm.notes}
                  onChange={handleBookingChange}
                  rows={3}
                  className="textarea textarea-bordered w-full focus:outline-none focus:ring-2 focus:ring-primary/40"
                  placeholder="Share anything the host should know about your trip"
                />
              </div>
              {bookingError ? (
                <div className="rounded-xl bg-error/10 px-3 py-2 text-xs text-error">{bookingError}</div>
              ) : null}
              {bookingSuccess ? (
                <div className="rounded-xl bg-success/10 px-3 py-2 text-xs text-success">{bookingSuccess}</div>
              ) : null}
              <button
                type="submit"
                className="btn btn-primary w-full rounded-full text-white"
                disabled={bookingMutation.isLoading}
              >
                {bookingMutation.isLoading ? 'Sending request…' : 'Request to book'}
              </button>
              <p className="text-xs text-airbnb-charcoal/50">
                You’ll be charged once the host accepts your booking.
              </p>
            </form>
          </div>

          <div className="card-surface space-y-4 p-6">
            <h2 className="text-xl font-semibold text-airbnb-charcoal">Hosted by</h2>
            <div className="space-y-2 text-sm text-airbnb-charcoal/70">
              <p className="font-semibold text-airbnb-charcoal">{property.owner?.name ?? 'Host details coming soon'}</p>
              <p>{property.owner?.email}</p>
              {property.owner?.ownerProfile?.phone ? <p>Phone: {property.owner.ownerProfile.phone}</p> : null}
              {property.owner?.ownerProfile?.company ? <p>Company: {property.owner.ownerProfile.company}</p> : null}
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}
