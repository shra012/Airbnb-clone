const { prisma } = require('../config/prisma');

function toNumber(value) {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value === 'number') {
    return value;
  }
  if (typeof value.toNumber === 'function') {
    return value.toNumber();
  }
  return Number(value);
}

function serializePhotos(photos) {
  if (!photos) {
    return [];
  }
  return photos.map((photo) => ({
    id: photo.id,
    url: photo.url,
    caption: photo.caption,
    isCover: photo.isCover,
  }));
}

function serializePropertySummary(property) {
  if (!property) {
    return null;
  }
  return {
    id: property.id,
    title: property.title,
    city: property.city,
    state: property.state,
    country: property.country,
    pricePerNight: toNumber(property.pricePerNight),
    cleaningFee: toNumber(property.cleaningFee),
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    maxGuests: property.maxGuests,
    coverPhoto: property.photos && property.photos.length ? serializePhotos(property.photos)[0] : null,
  };
}

function serializeBooking(booking) {
  return {
    id: booking.id,
    status: booking.status,
    startDate: booking.startDate,
    endDate: booking.endDate,
    guests: booking.guests,
    totalPrice: toNumber(booking.totalPrice),
    notes: booking.notes,
    createdAt: booking.createdAt,
    updatedAt: booking.updatedAt,
    property: serializePropertySummary(booking.property),
  };
}

async function getTravelerDashboard(travelerId) {
  const now = new Date();

  const [profile, pendingRequests, upcomingTrips, pastTrips, favoritesCount, recentBookings, favoriteProperties] =
    await Promise.all([
      prisma.user.findUnique({
        where: { id: travelerId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          travelerProfile: {
            select: {
              about: true,
              city: true,
              state: true,
              country: true,
              languages: true,
              gender: true,
              avatarUrl: true,
              createdAt: true,
              updatedAt: true,
            },
          },
        },
      }),
      prisma.booking.count({ where: { travelerId, status: 'PENDING' } }),
      prisma.booking.count({ where: { travelerId, status: 'ACCEPTED', startDate: { gte: now } } }),
      prisma.booking.count({ where: { travelerId, status: 'ACCEPTED', endDate: { lt: now } } }),
      prisma.favorite.count({ where: { travelerId } }),
      prisma.booking.findMany({
        where: { travelerId },
        orderBy: [{ startDate: 'asc' }, { createdAt: 'desc' }],
        take: 5,
        include: {
          property: {
            select: {
              id: true,
              title: true,
              city: true,
              state: true,
              country: true,
              pricePerNight: true,
              cleaningFee: true,
              bedrooms: true,
              bathrooms: true,
              maxGuests: true,
              photos: {
                orderBy: [{ isCover: 'desc' }, { id: 'asc' }],
                take: 3,
                select: {
                  id: true,
                  url: true,
                  caption: true,
                  isCover: true,
                },
              },
            },
          },
        },
      }),
      prisma.favorite.findMany({
        where: { travelerId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          property: {
            select: {
              id: true,
              title: true,
              city: true,
              state: true,
              country: true,
              pricePerNight: true,
              cleaningFee: true,
              bedrooms: true,
              bathrooms: true,
              maxGuests: true,
              photos: {
                orderBy: [{ isCover: 'desc' }, { id: 'asc' }],
                take: 3,
                select: {
                  id: true,
                  url: true,
                  caption: true,
                  isCover: true,
                },
              },
            },
          },
        },
      }),
    ]);

  return {
    profile,
    summary: {
      pendingRequests,
      upcomingTrips,
      pastTrips,
      favorites: favoritesCount,
    },
    upcomingBookings: recentBookings.map(serializeBooking),
    favoriteProperties: favoriteProperties.map((favorite) => ({
      id: favorite.id,
      createdAt: favorite.createdAt,
      property: serializePropertySummary(favorite.property),
    })),
  };
}

async function listTravelerBookings(travelerId) {
  const bookings = await prisma.booking.findMany({
    where: { travelerId },
    orderBy: [{ startDate: 'asc' }, { createdAt: 'desc' }],
    include: {
      property: {
        select: {
          id: true,
          title: true,
          city: true,
          state: true,
          country: true,
          pricePerNight: true,
          cleaningFee: true,
          bedrooms: true,
          bathrooms: true,
          maxGuests: true,
          photos: {
            orderBy: [{ isCover: 'desc' }, { id: 'asc' }],
            take: 3,
            select: {
              id: true,
              url: true,
              caption: true,
              isCover: true,
            },
          },
        },
      },
    },
  });

  const grouped = {
    pending: [],
    accepted: [],
    cancelled: [],
  };

  bookings.forEach((booking) => {
    const key = booking.status.toLowerCase();
    if (grouped[key]) {
      grouped[key].push(serializeBooking(booking));
    }
  });

  return {
    bookings: grouped,
    counts: {
      pending: grouped.pending.length,
      accepted: grouped.accepted.length,
      cancelled: grouped.cancelled.length,
    },
  };
}

async function listTravelerFavorites(travelerId) {
  const favorites = await prisma.favorite.findMany({
    where: { travelerId },
    orderBy: { createdAt: 'desc' },
    include: {
      property: {
        select: {
          id: true,
          title: true,
          city: true,
          state: true,
          country: true,
          pricePerNight: true,
          cleaningFee: true,
          bedrooms: true,
          bathrooms: true,
          maxGuests: true,
          photos: {
            orderBy: [{ isCover: 'desc' }, { id: 'asc' }],
            take: 3,
            select: {
              id: true,
              url: true,
              caption: true,
              isCover: true,
            },
          },
        },
      },
    },
  });

  return favorites.map((favorite) => ({
    id: favorite.id,
    createdAt: favorite.createdAt,
    property: serializePropertySummary(favorite.property),
  }));
}

module.exports = {
  getTravelerDashboard,
  listTravelerBookings,
  listTravelerFavorites,
};
