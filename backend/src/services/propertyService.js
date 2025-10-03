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

function serializeAmenities(amenities) {
  if (!amenities) {
    return [];
  }
  return amenities.map((amenity) => ({
    id: amenity.id,
    label: amenity.label,
  }));
}

function summarizeProperty(property) {
  return {
    id: property.id,
    ownerId: property.ownerId,
    title: property.title,
    description: property.description,
    propertyType: property.propertyType,
    city: property.city,
    state: property.state,
    country: property.country,
    pricePerNight: toNumber(property.pricePerNight),
    cleaningFee: toNumber(property.cleaningFee),
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    maxGuests: property.maxGuests,
    coverPhoto: property.photos && property.photos.length ? serializePhotos(property.photos)[0] : null,
    amenities: serializeAmenities(property.amenities),
    createdAt: property.createdAt,
    updatedAt: property.updatedAt,
  };
}

function serializeAvailability(avail) {
  return {
    id: avail.id,
    startDate: avail.startDate,
    endDate: avail.endDate,
    isBlocked: avail.isBlocked,
    reason: avail.reason,
  };
}

async function searchProperties(filters) {
  const {
    location,
    guests,
    minPrice,
    maxPrice,
    startDate,
    endDate,
    sort,
  } = filters;

  const andFilters = [];

  if (location) {
    andFilters.push({
      OR: [
        { city: { contains: location, mode: 'insensitive' } },
        { state: { contains: location, mode: 'insensitive' } },
        { country: { contains: location, mode: 'insensitive' } },
        { addressLine1: { contains: location, mode: 'insensitive' } },
      ],
    });
  }

  if (guests) {
    andFilters.push({ maxGuests: { gte: guests } });
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    const priceFilter = {};
    if (minPrice !== undefined) {
      priceFilter.gte = minPrice;
    }
    if (maxPrice !== undefined) {
      priceFilter.lte = maxPrice;
    }
    andFilters.push({ pricePerNight: priceFilter });
  }

  if (startDate && endDate) {
    andFilters.push({
      availabilities: {
        some: {
          isBlocked: false,
          startDate: { lte: startDate },
          endDate: { gte: endDate },
        },
      },
    });

    andFilters.push({
      NOT: {
        bookings: {
          some: {
            status: { in: ['PENDING', 'ACCEPTED'] },
            AND: [
              { startDate: { lt: endDate } },
              { endDate: { gt: startDate } },
            ],
          },
        },
      },
    });
  }

  const orderBy = (() => {
    switch (sort) {
      case 'price-asc':
        return { pricePerNight: 'asc' };
      case 'price-desc':
        return { pricePerNight: 'desc' };
      case 'newest':
        return { createdAt: 'desc' };
      default:
        return { updatedAt: 'desc' };
    }
  })();

  const properties = await prisma.property.findMany({
    where: {
      AND: andFilters,
    },
    orderBy,
    include: {
      amenities: true,
      photos: {
        orderBy: [{ isCover: 'desc' }, { id: 'asc' }],
        take: 3,
      },
    },
  });

  return properties.map(summarizeProperty);
}

async function getPropertyById(propertyId) {
  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    include: {
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
          ownerProfile: {
            select: {
              location: true,
              phone: true,
              avatarUrl: true,
              company: true,
            },
          },
        },
      },
      amenities: true,
      photos: {
        orderBy: [{ isCover: 'desc' }, { id: 'asc' }],
      },
      availabilities: {
        orderBy: { startDate: 'asc' },
      },
      bookings: {
        where: { status: { in: ['PENDING', 'ACCEPTED'] } },
        select: {
          id: true,
          status: true,
          startDate: true,
          endDate: true,
          guests: true,
        },
      },
    },
  });

  if (!property) {
    return null;
  }

  return {
    id: property.id,
    owner: property.owner,
    title: property.title,
    description: property.description,
    propertyType: property.propertyType,
    addressLine1: property.addressLine1,
    addressLine2: property.addressLine2,
    city: property.city,
    state: property.state,
    country: property.country,
    postalCode: property.postalCode,
    latitude: property.latitude,
    longitude: property.longitude,
    pricePerNight: toNumber(property.pricePerNight),
    cleaningFee: toNumber(property.cleaningFee),
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    maxGuests: property.maxGuests,
    checkInTime: property.checkInTime,
    checkOutTime: property.checkOutTime,
    amenities: serializeAmenities(property.amenities),
    photos: serializePhotos(property.photos),
    availabilities: property.availabilities.map(serializeAvailability),
    blockedBookings: property.bookings,
    createdAt: property.createdAt,
    updatedAt: property.updatedAt,
  };
}

module.exports = {
  searchProperties,
  getPropertyById,
};
