import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';

export default function TravelerPropertyCard({ property, isFavorite, onToggleFavorite, linkState }) {
  const price = Number(property.pricePerNight ?? 0);
  const guests = Number(property.maxGuests ?? 0);

  const handleFavoriteClick = (event) => {
    event.preventDefault();
    event.stopPropagation();
    onToggleFavorite?.();
  };

  return (
    <Link
      to={`/traveler/properties/${property.id}`}
      state={linkState}
      className="card-surface relative block overflow-hidden transition hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-airbnb-primary/40"
    >
      <button
        type="button"
        onClick={handleFavoriteClick}
        className={`btn btn-circle btn-sm absolute right-3 top-3 z-10 border-none shadow-lg ${
          isFavorite ? 'bg-airbnb-primary text-white' : 'bg-white text-airbnb-charcoal/70'
        }`}
        aria-label={isFavorite ? 'Remove from saved' : 'Save to favorites'}
      >
        {isFavorite ? '♥' : '♡'}
      </button>
      {property.coverPhoto?.url ? (
        <img
          src={property.coverPhoto.url}
          alt={property.title}
          className="h-48 w-full object-cover"
        />
      ) : (
        <div className="flex h-48 w-full items-center justify-center bg-base-200 text-sm text-airbnb-charcoal/50">
          Photo coming soon
        </div>
      )}
      <div className="space-y-2 p-5">
        <h3 className="text-lg font-semibold text-airbnb-charcoal">{property.title}</h3>
        <p className="text-sm text-airbnb-charcoal/60">
          {property.city}, {property.country}
        </p>
        <p className="text-sm text-airbnb-charcoal/70">
          ${price.toLocaleString()} / night · Sleeps {guests}
        </p>
        <p className="text-xs text-airbnb-charcoal/50">
          {property.bedrooms} bedrooms · {property.bathrooms} baths
        </p>
      </div>
    </Link>
  );
}

TravelerPropertyCard.propTypes = {
  property: PropTypes.shape({
    id: PropTypes.number.isRequired,
    title: PropTypes.string.isRequired,
    city: PropTypes.string,
    country: PropTypes.string,
    pricePerNight: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    bedrooms: PropTypes.number,
    bathrooms: PropTypes.number,
    maxGuests: PropTypes.number,
    coverPhoto: PropTypes.shape({
      url: PropTypes.string,
    }),
  }).isRequired,
  isFavorite: PropTypes.bool,
  onToggleFavorite: PropTypes.func,
  linkState: PropTypes.object,
};

TravelerPropertyCard.defaultProps = {
  isFavorite: false,
  onToggleFavorite: undefined,
  linkState: undefined,
};
