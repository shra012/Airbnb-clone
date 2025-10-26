import { useMemo, useState } from 'react';
import ErrorState from '../../components/ErrorState';
import { usePropertySearch } from '../../hooks/usePropertySearch';
import { useTravelerDashboard, useToggleFavorite } from '../../hooks/useTravelerData';
import TravelerPropertyCard from '../../components/TravelerPropertyCard';

export default function TravelerSearchPage() {
  const defaultFilters = useMemo(() => ({ sort: 'updated' }), []);
  const [formState, setFormState] = useState({
    location: '',
    startDate: '',
    endDate: '',
    guests: '',
    minPrice: '',
    maxPrice: '',
  });
  const [activeFilters, setActiveFilters] = useState(defaultFilters);

  const {
    data: propertyResults,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = usePropertySearch(activeFilters, { keepPreviousData: true });
  const { data: dashboard } = useTravelerDashboard();
  const toggleFavorite = useToggleFavorite();
  const favoritePropertyIds = useMemo(() => {
    const favorites = dashboard?.favoriteProperties;
    if (!Array.isArray(favorites) || favorites.length === 0) {
      return new Set();
    }

    return new Set(
      favorites
        .map((favorite) => {
          if (!favorite) {
            return null;
          }

          if (favorite.property?.id) {
            return favorite.property.id;
          }

          if (favorite.propertyId) {
            return favorite.propertyId;
          }

          return favorite.property === undefined ? favorite.id ?? null : null;
        })
        .filter(Boolean)
    );
  }, [dashboard?.favoriteProperties]);

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    const nextFilters = { sort: 'updated' };

    const trimmedLocation = formState.location.trim();
    if (trimmedLocation) {
      nextFilters.location = trimmedLocation;
    }

    if (formState.guests) {
      nextFilters.guests = Number(formState.guests);
    }

    if (formState.startDate && formState.endDate) {
      nextFilters.startDate = formState.startDate;
      nextFilters.endDate = formState.endDate;
    }

    if (formState.minPrice) {
      nextFilters.minPrice = Number(formState.minPrice);
    }

    if (formState.maxPrice) {
      nextFilters.maxPrice = Number(formState.maxPrice);
    }

    setActiveFilters(nextFilters);
  };

  const handleResetFilters = () => {
    setFormState({
      location: '',
      startDate: '',
      endDate: '',
      guests: '',
      minPrice: '',
      maxPrice: '',
    });
    setActiveFilters(defaultFilters);
  };

  const results = propertyResults ?? [];
  const isRefreshing = isFetching && !isLoading;

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold text-airbnb-charcoal">Find your next stay</h1>
        <p className="text-sm text-airbnb-charcoal/60">
          Search for homes and experiences that fit your travel plans.
        </p>
      </header>

      <div className="card-surface p-6">
        <form onSubmit={handleSearchSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="form-control">
              <label className="label">
                <span className="label-text text-sm font-medium text-airbnb-charcoal/80">Location</span>
              </label>
              <input
                type="text"
                name="location"
                value={formState.location}
                onChange={handleFormChange}
                placeholder="Where to?"
                className="input input-bordered w-full focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text text-sm font-medium text-airbnb-charcoal/80">Check-in</span>
              </label>
              <input
                type="date"
                name="startDate"
                value={formState.startDate}
                onChange={handleFormChange}
                className="input input-bordered w-full focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text text-sm font-medium text-airbnb-charcoal/80">Check-out</span>
              </label>
              <input
                type="date"
                name="endDate"
                value={formState.endDate}
                onChange={handleFormChange}
                className="input input-bordered w-full focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text text-sm font-medium text-airbnb-charcoal/80">Guests</span>
              </label>
              <input
                type="number"
                name="guests"
                min="1"
                value={formState.guests}
                onChange={handleFormChange}
                placeholder="2"
                className="input input-bordered w-full focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text text-sm font-medium text-airbnb-charcoal/80">Min price / night</span>
              </label>
              <input
                type="number"
                name="minPrice"
                min="0"
                value={formState.minPrice}
                onChange={handleFormChange}
                placeholder="Any"
                className="input input-bordered w-full focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text text-sm font-medium text-airbnb-charcoal/80">Max price / night</span>
              </label>
              <input
                type="number"
                name="maxPrice"
                min="0"
                value={formState.maxPrice}
                onChange={handleFormChange}
                placeholder="Any"
                className="input input-bordered w-full focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              className="btn btn-primary rounded-full border-none px-6 text-white"
            >
              Search stays
            </button>
            <button
              type="button"
              onClick={handleResetFilters}
              className="btn btn-ghost rounded-full border-none px-6 text-airbnb-charcoal/70"
            >
              Clear
            </button>
            {isRefreshing ? (
              <span className="text-xs uppercase tracking-[0.2em] text-airbnb-charcoal/40">
                Refreshing results…
              </span>
            ) : null}
          </div>
        </form>

        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-airbnb-charcoal">Search results</h2>
            <span className="badge rounded-full border-none bg-airbnb-primary/10 text-airbnb-primary">
              {results.length}
            </span>
          </div>
          {isError ? (
            <ErrorState message={error?.message ?? 'Unable to load properties'} retry={refetch} />
          ) : isLoading ? (
            <div className="flex h-32 items-center justify-center">
              <span className="loading loading-spinner loading-lg text-airbnb-primary"></span>
            </div>
          ) : results.length === 0 ? (
            <div className="dashed-shell text-sm">
              No stays match your filters yet. Adjust your search and try again.
            </div>
          ) : (
            <div className="grid gap-5 lg:grid-cols-2">
              {results.map((property) => (
                <TravelerPropertyCard
                  key={property.id}
                  property={property}
                  isFavorite={favoritePropertyIds.has(property.id)}
                  linkState={{ from: 'search' }}
                  onToggleFavorite={() =>
                    toggleFavorite.mutate({
                      propertyId: property.id,
                      isFavorite: favoritePropertyIds.has(property.id),
                      property,
                    })
                  }
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
