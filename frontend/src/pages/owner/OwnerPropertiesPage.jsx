import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ErrorState from '../../components/ErrorState';
import LoadingScreen from '../../components/LoadingScreen';
import { useOwnerProperties } from '../../hooks/useOwnerProperties';

function MetricTile({ label, value, hint }) {
  return (
    <div className="rounded-2xl border border-airbnb-cream bg-airbnb-cream/40 px-4 py-3">
      <p className="text-xs uppercase tracking-[0.15em] text-airbnb-charcoal/60">{label}</p>
      <p className="text-xl font-semibold text-airbnb-charcoal">{value}</p>
      {hint ? <p className="text-xs text-airbnb-charcoal/50">{hint}</p> : null}
    </div>
  );
}

function PropertyPerformanceCard({ property, onEdit }) {
  const coverPhoto =
    property.photos?.find((photo) => photo.isCover)?.url ?? property.photos?.[0]?.url ?? null;

  const metricTiles = useMemo(() => {
    const safeMetrics = property.metrics ?? {
      bookings: { total: 0, last30Days: 0, last7Days: 0 },
      guests: { total: 0, last30Days: 0, last7Days: 0 },
    };

    return [
      {
        label: 'Bookings to date',
        value: safeMetrics.bookings.total,
        hint: `30d: ${safeMetrics.bookings.last30Days} • 7d: ${safeMetrics.bookings.last7Days}`,
      },
      {
        label: 'Guests hosted',
        value: safeMetrics.guests.total,
        hint: `30d: ${safeMetrics.guests.last30Days} • 7d: ${safeMetrics.guests.last7Days}`,
      },
      {
        label: 'Bedrooms',
        value: property.bedrooms,
        hint: 'Sleeping arrangements',
      },
      {
        label: 'Bathrooms',
        value: property.bathrooms,
        hint: 'Full & half baths',
      },
      {
        label: 'Sleeps',
        value: property.maxGuests,
        hint: 'Max guests per stay',
      },
      {
        label: 'Nightly rate',
        value: `$${Number(property.pricePerNight).toLocaleString()}`,
        hint: 'Base price',
      },
    ];
  }, [property.bathrooms, property.bedrooms, property.maxGuests, property.metrics, property.pricePerNight]);

  return (
    <div className="card-surface space-y-4 p-4">
      {coverPhoto ? (
        <div className="relative h-48 overflow-hidden rounded-2xl">
          <img src={coverPhoto} alt={property.title} className="h-full w-full object-cover" />
        </div>
      ) : null}

      <div className="space-y-2 px-1">
        <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between md:gap-6">
          <div>
            <h3 className="text-xl font-semibold text-airbnb-charcoal">{property.title}</h3>
            <p className="text-sm text-airbnb-charcoal/60">
              {property.city}, {property.state} · {property.country}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onEdit(property.id)}
            className="btn btn-outline btn-sm rounded-full border-airbnb-primary/40 px-4 text-airbnb-primary"
          >
            Edit listing
          </button>
        </div>
        <p className="text-xs text-airbnb-charcoal/50">
          Updated {new Date(property.updatedAt).toLocaleDateString()}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {metricTiles.map((tile) => (
          <MetricTile key={tile.label} label={tile.label} value={tile.value} hint={tile.hint} />
        ))}
      </div>
    </div>
  );
}

export default function OwnerPropertiesPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const pageSize = 6;
  const { data, isLoading, isError, error, refetch, isFetching } = useOwnerProperties(page, pageSize);

  const properties = data?.items ?? [];
  const pagination = data?.pagination ?? {
    page,
    pageSize,
    totalItems: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  };

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (pagination.totalPages === 0 && page !== 1) {
      setPage(1);
      return;
    }

    if (pagination.totalPages > 0 && page > pagination.totalPages) {
      setPage(pagination.totalPages);
    }
  }, [isLoading, page, pagination.totalPages]);

  const handleAddNew = () => navigate('/owner/properties/new');
  const handleEdit = (propertyId) => navigate(`/owner/properties/${propertyId}/edit`);
  const handlePrev = () => {
    if (pagination.hasPreviousPage) {
      setPage((prev) => Math.max(prev - 1, 1));
    }
  };
  const handleNext = () => {
    if (pagination.hasNextPage) {
      setPage((prev) => prev + 1);
    }
  };

  if (isLoading) {
    return <LoadingScreen message="Loading properties" />;
  }

  if (isError) {
    return <ErrorState message={error.message} retry={refetch} />;
  }

  const hasProperties = properties.length > 0;

  return (
    <div className="space-y-10">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-airbnb-charcoal">All properties</h1>
          <p className="text-sm text-airbnb-charcoal/60">
            Track performance across every listing with booking and guest insights.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleAddNew}
            className="btn btn-primary rounded-full border-none px-5 text-white"
          >
            Add new property
          </button>
        </div>
      </header>

      {isFetching ? (
        <div className="text-xs font-medium uppercase tracking-[0.2em] text-airbnb-charcoal/40">
          Refreshing metrics…
        </div>
      ) : null}

      {hasProperties ? (
        <div className="grid gap-5 lg:grid-cols-2">
          {properties.map((property) => (
            <PropertyPerformanceCard key={property.id} property={property} onEdit={handleEdit} />
          ))}
        </div>
      ) : (
        <div className="dashed-shell text-center">
          <h2 className="text-lg font-semibold text-airbnb-charcoal">
            You haven&apos;t posted any properties yet.
          </h2>
          <p className="mt-2 text-sm text-airbnb-charcoal/60">
            Create your first listing to start collecting performance insights.
          </p>
          <button
            type="button"
            onClick={handleAddNew}
            className="btn btn-primary mt-4 rounded-full border-none px-5 text-white"
          >
            Add new property
          </button>
        </div>
      )}

      {pagination.totalPages > 1 ? (
        <div className="flex flex-col gap-3 rounded-2xl border border-airbnb-cream bg-airbnb-cream/40 px-4 py-3 text-sm text-airbnb-charcoal/70 sm:flex-row sm:items-center sm:justify-between">
          <div>
            Page {pagination.page} of {pagination.totalPages} • {pagination.totalItems} listings
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handlePrev}
              disabled={!pagination.hasPreviousPage}
              className="btn btn-outline btn-sm rounded-full border-airbnb-primary/30 px-4 text-airbnb-primary disabled:border-base-200 disabled:text-base-content/40"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={handleNext}
              disabled={!pagination.hasNextPage}
              className="btn btn-outline btn-sm rounded-full border-airbnb-primary/30 px-4 text-airbnb-primary disabled:border-base-200 disabled:text-base-content/40"
            >
              Next
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
