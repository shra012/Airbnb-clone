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

  const [
    profile,
    pendingRequests,
    upcomingTrips,
    pastTrips,
    favoritesCount,
    recentUpcoming,
    recentPast,
    favoriteProperties,
  ] =
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
        where: {
          travelerId,
          status: 'ACCEPTED',
          startDate: { gte: now },
        },
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
      prisma.booking.findMany({
        where: {
          travelerId,
          status: 'ACCEPTED',
          endDate: { lt: now },
        },
        orderBy: [{ endDate: 'desc' }, { createdAt: 'desc' }],
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
    upcomingBookings: recentUpcoming.map(serializeBooking),
    pastBookings: recentPast.map(serializeBooking),
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

  const pendingBookings = [];
  const cancelledBookings = [];
  const acceptedBookings = [];

  bookings.forEach((booking) => {
    switch (booking.status) {
      case 'PENDING':
        pendingBookings.push(booking);
        break;
      case 'ACCEPTED':
        acceptedBookings.push(booking);
        break;
      case 'CANCELLED':
        cancelledBookings.push(booking);
        break;
      default:
        break;
    }
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcomingAcceptedRaw = [];
  const pastAcceptedRaw = [];

  acceptedBookings.forEach((booking) => {
    const start = new Date(booking.startDate);
    const end = new Date(booking.endDate);
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    if (end < today) {
      pastAcceptedRaw.push(booking);
    } else {
      upcomingAcceptedRaw.push(booking);
    }
  });

  return {
    bookings: {
      pending: pendingBookings.map(serializeBooking),
      accepted: upcomingAcceptedRaw.map(serializeBooking),
      past: pastAcceptedRaw.map(serializeBooking),
      cancelled: cancelledBookings.map(serializeBooking),
    },
    counts: {
      pending: pendingBookings.length,
      accepted: upcomingAcceptedRaw.length,
      past: pastAcceptedRaw.length,
      cancelled: cancelledBookings.length,
    },
  };
}

async function listTravelerHistory(travelerId) {
  const now = new Date();

  const bookings = await prisma.booking.findMany({
    where: {
      travelerId,
      status: 'ACCEPTED',
      endDate: { lt: now },
    },
    orderBy: [{ endDate: 'desc' }, { startDate: 'desc' }],
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

  return bookings.map(serializeBooking);
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

async function updateTravelerProfile(travelerId, payload) {
  const user = await prisma.user.findUnique({
    where: { id: travelerId },
    include: { travelerProfile: true },
  });

  if (!user) {
    throw new Error('User not found');
  }

  const { name, email, phone, ...profileFields } = payload;

  const userUpdateData = {};
  if (name !== undefined) {
    userUpdateData.name = name;
  }
  if (email !== undefined) {
    userUpdateData.email = email;
  }
  if (phone !== undefined) {
    userUpdateData.phone = phone === '' ? null : phone;
  }

  const profileUpdateData = {};
  const profileKeys = ['about', 'city', 'state', 'country', 'languages', 'gender', 'avatarUrl'];

  profileKeys.forEach((key) => {
    if (Object.prototype.hasOwnProperty.call(profileFields, key)) {
      const value = profileFields[key];
      if (value === undefined) {
        return;
      }
      if (typeof value === 'string') {
        const trimmed = value.trim();
        profileUpdateData[key] = trimmed === '' ? null : trimmed;
      } else {
        profileUpdateData[key] = value;
      }
    }
  });

  await prisma.$transaction(async (tx) => {
    if (Object.keys(userUpdateData).length > 0) {
      await tx.user.update({
        where: { id: travelerId },
        data: userUpdateData,
      });
    }

    if (user.travelerProfile) {
      if (Object.keys(profileUpdateData).length > 0) {
        await tx.travelerProfile.update({
          where: { userId: travelerId },
          data: profileUpdateData,
        });
      }
    } else {
      await tx.travelerProfile.create({
        data: {
          userId: travelerId,
          ...profileUpdateData,
        },
      });
    }
  });

  return prisma.user.findUnique({
    where: { id: travelerId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      phone: true,
      travelerProfile: true,
    },
  });
}

module.exports = {
  getTravelerDashboard,
  listTravelerBookings,
  listTravelerHistory,
  listTravelerFavorites,
  updateTravelerProfile,
};
