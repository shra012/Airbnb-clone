const { Prisma } = require('@prisma/client');
const { prisma } = require('../config/prisma');

function decimalOrNull(value) {
  return value === undefined || value === null ? null : new Prisma.Decimal(value);
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

  const [totalProperties, totalBookings, pendingRequests, upcomingBookings, properties, recentRequests, recentBookings] =
    await Promise.all([
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

  return {
    summary: {
      totalProperties,
      totalBookings,
      pendingRequests,
      upcomingBookings,
    },
    recentRequests,
    recentBookings,
    properties,
  };
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
  listOwnerBookings,
  getOwnerDashboard,
  updateOwnerProfile,
};
