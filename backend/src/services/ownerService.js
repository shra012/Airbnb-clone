const { Prisma } = require('@prisma/client');
const { prisma } = require('../config/prisma');
const { publishPropertyNotification } = require('../messaging/propertyEvents');

function decimalOrNull(value) {
  return value === undefined || value === null ? null : new Prisma.Decimal(value);
}

function createEmptyMetrics() {
  return {
    bookings: {
      total: 0,
      last30Days: 0,
      last7Days: 0,
    },
    guests: {
      total: 0,
      last30Days: 0,
      last7Days: 0,
    },
  };
}

async function getMetricsForProperties(ownerId, propertyIds) {
  if (!propertyIds.length) {
    return {};
  }

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [lifetime, lastThirtyDays, lastSevenDays] = await prisma.$transaction([
    prisma.booking.groupBy({
      by: ['propertyId'],
      where: {
        propertyId: { in: propertyIds },
        property: { ownerId },
        status: 'ACCEPTED',
      },
      _count: { _all: true },
      _sum: { guests: true },
    }),
    prisma.booking.groupBy({
      by: ['propertyId'],
      where: {
        propertyId: { in: propertyIds },
        property: { ownerId },
        status: 'ACCEPTED',
        createdAt: { gte: thirtyDaysAgo },
      },
      _count: { _all: true },
      _sum: { guests: true },
    }),
    prisma.booking.groupBy({
      by: ['propertyId'],
      where: {
        propertyId: { in: propertyIds },
        property: { ownerId },
        status: 'ACCEPTED',
        createdAt: { gte: sevenDaysAgo },
      },
      _count: { _all: true },
      _sum: { guests: true },
    }),
  ]);

  const metricsMap = {};

  propertyIds.forEach((propertyId) => {
    metricsMap[propertyId] = createEmptyMetrics();
  });

  const applyMetrics = (rows, key) => {
    rows.forEach((row) => {
      if (!metricsMap[row.propertyId]) {
        metricsMap[row.propertyId] = createEmptyMetrics();
      }
      metricsMap[row.propertyId].bookings[key] = row._count?._all ?? 0;
      metricsMap[row.propertyId].guests[key] = Number(row._sum?.guests ?? 0);
    });
  };

  applyMetrics(lifetime, 'total');
  applyMetrics(lastThirtyDays, 'last30Days');
  applyMetrics(lastSevenDays, 'last7Days');

  return metricsMap;
}

async function attachMetricsToProperties(ownerId, properties) {
  if (!properties.length) {
    return [];
  }

  const propertyIds = properties.map((property) => property.id);
  const metricsById = await getMetricsForProperties(ownerId, propertyIds);

  return properties.map((property) => ({
    ...property,
    metrics: metricsById[property.id] ? { ...metricsById[property.id] } : createEmptyMetrics(),
  }));
}

function mapAmenities(amenities) {
  if (!amenities || amenities.length === 0) {
    return undefined;
  }
  return {
    create: amenities.map((label) => ({ label })),
  };
}

function mapPhotos(photos) {
  if (!photos || photos.length === 0) {
    return undefined;
  }
  return {
    create: photos.map((photo) => ({
      url: photo.url,
      caption: photo.caption ?? null,
      isCover: photo.isCover ?? false,
    })),
  };
}

function mapAvailabilities(availabilities) {
  if (!availabilities || availabilities.length === 0) {
    return undefined;
  }
  return {
    create: availabilities.map((slot) => ({
      startDate: slot.startDate,
      endDate: slot.endDate,
      isBlocked: slot.isBlocked ?? false,
      reason: slot.reason ?? null,
    })),
  };
}

async function createProperty(ownerId, payload) {
  const property = await prisma.property.create({
    data: {
      ownerId,
      title: payload.title,
      description: payload.description,
      propertyType: payload.propertyType,
      addressLine1: payload.addressLine1,
      addressLine2: payload.addressLine2 ?? null,
      city: payload.city,
      state: payload.state,
      country: payload.country,
      postalCode: payload.postalCode ?? null,
      latitude: payload.latitude ?? null,
      longitude: payload.longitude ?? null,
      pricePerNight: new Prisma.Decimal(payload.pricePerNight),
      cleaningFee: decimalOrNull(payload.cleaningFee),
      bedrooms: payload.bedrooms,
      bathrooms: payload.bathrooms,
      maxGuests: payload.maxGuests,
      checkInTime: payload.checkInTime ?? null,
      checkOutTime: payload.checkOutTime ?? null,
      amenities: mapAmenities(payload.amenities),
      photos: mapPhotos(payload.photos),
      availabilities: mapAvailabilities(payload.availabilities),
    },
    include: {
      amenities: true,
      photos: true,
      availabilities: true,
    },
  });

  await publishPropertyNotification(property, 'PROPERTY_CREATED');
  return property;
}

async function listOwnerBookings(ownerId) {
  const bookings = await prisma.booking.findMany({
    where: {
      property: {
        ownerId,
      },
    },
    orderBy: [{ startDate: 'asc' }, { createdAt: 'desc' }],
    include: {
      property: {
        select: {
          id: true,
          title: true,
          city: true,
          state: true,
          country: true,
        },
      },
      traveler: {
        select: {
          id: true,
          name: true,
          email: true,
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
      grouped[key].push(booking);
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

async function getOwnerDashboard(ownerId) {
  const now = new Date();

  const [
    totalProperties,
    totalBookings,
    pendingRequests,
    upcomingBookings,
    topPropertiesRaw,
    recentRequests,
    recentBookings,
  ] = await prisma.$transaction([
    prisma.property.count({ where: { ownerId } }),
    prisma.booking.count({ where: { property: { ownerId } } }),
    prisma.booking.count({ where: { property: { ownerId }, status: 'PENDING' } }),
    prisma.booking.count({
      where: {
        property: { ownerId },
        status: 'ACCEPTED',
        startDate: { gte: now },
      },
    }),
    prisma.property.findMany({
      where: { ownerId },
      orderBy: { updatedAt: 'desc' },
      take: 2,
      select: {
        id: true,
        title: true,
        city: true,
        state: true,
        country: true,
        pricePerNight: true,
        bedrooms: true,
        bathrooms: true,
        maxGuests: true,
        createdAt: true,
        updatedAt: true,
        photos: {
          select: {
            id: true,
            url: true,
            caption: true,
            isCover: true,
          },
        },
      },
    }),
    prisma.booking.findMany({
      where: { property: { ownerId }, status: 'PENDING' },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        property: { select: { id: true, title: true } },
        traveler: { select: { id: true, name: true, email: true } },
      },
    }),
    prisma.booking.findMany({
      where: { property: { ownerId }, status: 'ACCEPTED' },
      orderBy: { startDate: 'desc' },
      take: 5,
      include: {
        property: { select: { id: true, title: true } },
        traveler: { select: { id: true, name: true, email: true } },
      },
    }),
  ]);

  const topProperties = await attachMetricsToProperties(ownerId, topPropertiesRaw);

  return {
    summary: {
      totalProperties,
      totalBookings,
      pendingRequests,
      upcomingBookings,
    },
    recentRequests,
    recentBookings,
    topProperties,
  };
}

async function listOwnerProperties(ownerId, { page = 1, pageSize = 6 }) {
  const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
  const safePageSize = Number.isFinite(pageSize) && pageSize > 0 ? Math.min(Math.floor(pageSize), 50) : 6;
  const skip = (safePage - 1) * safePageSize;

  const [totalItems, propertiesRaw] = await prisma.$transaction([
    prisma.property.count({ where: { ownerId } }),
    prisma.property.findMany({
      where: { ownerId },
      orderBy: { updatedAt: 'desc' },
      skip,
      take: safePageSize,
      select: {
        id: true,
        title: true,
        city: true,
        state: true,
        country: true,
        pricePerNight: true,
        bedrooms: true,
        bathrooms: true,
        maxGuests: true,
        createdAt: true,
        updatedAt: true,
        photos: {
          select: {
            id: true,
            url: true,
            caption: true,
            isCover: true,
          },
        },
      },
    }),
  ]);

  const items = await attachMetricsToProperties(ownerId, propertiesRaw);
  const totalPages = totalItems === 0 ? 0 : Math.ceil(totalItems / safePageSize);

  return {
    items,
    pagination: {
      page: safePage,
      pageSize: safePageSize,
      totalItems,
      totalPages,
      hasNextPage: safePage < totalPages,
      hasPreviousPage: safePage > 1 && totalPages > 0,
    },
  };
}

async function updateProperty(ownerId, propertyId, payload) {
  // First verify the property belongs to this owner
  const existingProperty = await prisma.property.findFirst({
    where: { id: propertyId, ownerId },
    include: {
      amenities: true,
      photos: true,
      availabilities: true,
    },
  });

  if (!existingProperty) {
    throw new Error('Property not found or you do not have permission to update it');
  }

  // Delete existing related records to replace them
  await prisma.$transaction([
    prisma.propertyAmenity.deleteMany({ where: { propertyId } }),
    prisma.propertyPhoto.deleteMany({ where: { propertyId } }),
    prisma.propertyAvailability.deleteMany({ where: { propertyId } }),
  ]);

  // Update the property with new data
  const property = await prisma.property.update({
    where: { id: propertyId },
    data: {
      title: payload.title,
      description: payload.description,
      propertyType: payload.propertyType,
      addressLine1: payload.addressLine1,
      addressLine2: payload.addressLine2 ?? null,
      city: payload.city,
      state: payload.state,
      country: payload.country,
      postalCode: payload.postalCode ?? null,
      latitude: payload.latitude ?? null,
      longitude: payload.longitude ?? null,
      pricePerNight: new Prisma.Decimal(payload.pricePerNight),
      cleaningFee: decimalOrNull(payload.cleaningFee),
      bedrooms: payload.bedrooms,
      bathrooms: payload.bathrooms,
      maxGuests: payload.maxGuests,
      checkInTime: payload.checkInTime ?? null,
      checkOutTime: payload.checkOutTime ?? null,
      amenities: mapAmenities(payload.amenities),
      photos: mapPhotos(payload.photos),
      availabilities: mapAvailabilities(payload.availabilities),
    },
    include: {
      amenities: true,
      photos: true,
      availabilities: true,
    },
  });

  await publishPropertyNotification(property, 'PROPERTY_UPDATED');
  return property;
}

async function updateOwnerProfile(ownerId, profileData) {
  const user = await prisma.user.findUnique({
    where: { id: ownerId },
    include: { ownerProfile: true },
  });

  if (!user) {
    throw new Error('User not found');
  }

  let profile;
  if (user.ownerProfile) {
    profile = await prisma.ownerProfile.update({
      where: { userId: ownerId },
      data: profileData,
    });
  } else {
    profile = await prisma.ownerProfile.create({
      data: {
        userId: ownerId,
        ...profileData,
      },
    });
  }

  return {
    id: profile.id,
    about: profile.about,
    location: profile.location,
    phone: profile.phone,
    avatarUrl: profile.avatarUrl,
    company: profile.company,
    updatedAt: profile.updatedAt,
  };
}

module.exports = {
  createProperty,
  updateProperty,
  listOwnerBookings,
  getOwnerDashboard,
  listOwnerProperties,
  updateOwnerProfile,
};
