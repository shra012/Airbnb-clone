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

function serializeFavorite(favorite) {
  const property = favorite.property;
  return {
    id: favorite.id,
    createdAt: favorite.createdAt,
    property: {
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
      coverPhoto:
        property.photos && property.photos.length
          ? {
              id: property.photos[0].id,
              url: property.photos[0].url,
              caption: property.photos[0].caption,
              isCover: property.photos[0].isCover,
            }
          : null,
    },
  };
}

async function listFavorites(travelerId) {
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
            take: 1,
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

  return favorites.map(serializeFavorite);
}

async function addFavorite(travelerId, propertyId) {
  const property = await prisma.property.findUnique({ where: { id: propertyId } });
  if (!property) {
    const error = new Error('Property not found');
    error.status = 404;
    throw error;
  }

  const favorite = await prisma.favorite.upsert({
    where: {
      travelerId_propertyId: {
        travelerId,
        propertyId,
      },
    },
    update: {},
    create: {
      travelerId,
      propertyId,
    },
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
            take: 1,
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

  return serializeFavorite(favorite);
}

async function removeFavorite(travelerId, propertyId) {
  await prisma.favorite.delete({
    where: {
      travelerId_propertyId: {
        travelerId,
        propertyId,
      },
    },
  });
}

module.exports = {
  listFavorites,
  addFavorite,
  removeFavorite,
};
