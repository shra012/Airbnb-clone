const { Prisma } = require('@prisma/client');
const { prisma } = require('../config/prisma');
const { publishBookingRequestEvent, publishBookingStatusEvent } = require('../messaging/bookingEvents');

const MS_PER_DAY = 1000 * 60 * 60 * 24;
const BOOKING_BLOCK_REASON_PREFIX = 'Booking';

const bookingInclude = {
  property: {
    select: {
      id: true,
      ownerId: true,
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
  traveler: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
};

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

function summarizeProperty(property) {
  return {
    id: property.id,
    ownerId: property.ownerId,
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
    cancellationReason: booking.cancellationReason,
    createdAt: booking.createdAt,
    updatedAt: booking.updatedAt,
    property: summarizeProperty(booking.property),
    traveler: booking.traveler
      ? {
          id: booking.traveler.id,
          name: booking.traveler.name,
          email: booking.traveler.email,
        }
      : null,
  };
}

function nightsBetween(startDate, endDate) {
  const diff = endDate.getTime() - startDate.getTime();
  return Math.max(1, Math.ceil(diff / MS_PER_DAY));
}

function buildBookingBlockReason(bookingId) {
  return `${BOOKING_BLOCK_REASON_PREFIX} ${bookingId}`;
}

async function loadBooking(tx, bookingId) {
  const booking = await tx.booking.findUnique({
    where: { id: bookingId },
    include: bookingInclude,
  });
  if (!booking) {
    const error = new Error('Booking not found');
    error.status = 404;
    throw error;
  }
  return booking;
}

async function createBooking(travelerId, payload) {
  const startDate = new Date(payload.startDate);
  const endDate = new Date(payload.endDate);

  if (!(startDate < endDate)) {
    const error = new Error('End date must be after start date');
    error.status = 400;
    throw error;
  }

  const booking = await prisma.$transaction(async (tx) => {
    const property = await tx.property.findUnique({
      where: { id: payload.propertyId },
      select: {
        id: true,
        ownerId: true,
        pricePerNight: true,
        cleaningFee: true,
        maxGuests: true,
      },
    });

    if (!property) {
      const error = new Error('Property not found');
      error.status = 404;
      throw error;
    }

    if (payload.guests > property.maxGuests) {
      const error = new Error('Requested guests exceed property capacity');
      error.status = 400;
      throw error;
    }

    const overlappingPending = await tx.booking.findFirst({
      where: {
        propertyId: payload.propertyId,
        travelerId,
        status: 'PENDING',
        AND: [{ startDate: { lt: endDate } }, { endDate: { gt: startDate } }],
      },
    });

    if (overlappingPending) {
      const pendingError = new Error(
        `You already have a pending request for this stay from ${overlappingPending.startDate.toISOString().slice(0, 10)} to ${overlappingPending.endDate
          .toISOString()
          .slice(0, 10)}.`
      );
      pendingError.status = 409;
      throw pendingError;
    }

    const overlappingAccepted = await tx.booking.findFirst({
      where: {
        propertyId: payload.propertyId,
        status: 'ACCEPTED',
        AND: [{ startDate: { lt: endDate } }, { endDate: { gt: startDate } }],
      },
    });

    if (overlappingAccepted) {
      const overlapError = new Error(
        `This stay already has a confirmed booking from ${overlappingAccepted.startDate.toISOString().slice(0, 10)} to ${overlappingAccepted.endDate
          .toISOString()
          .slice(0, 10)}. Please pick different dates.`
      );
      overlapError.status = 409;
      throw overlapError;
    }

    const nights = nightsBetween(startDate, endDate);
    const pricePerNight = toNumber(property.pricePerNight) || 0;
    const cleaningFee = toNumber(property.cleaningFee) || 0;
    const totalPrice = nights * pricePerNight + cleaningFee;

    const created = await tx.booking.create({
      data: {
        travelerId,
        propertyId: payload.propertyId,
        startDate,
        endDate,
        guests: payload.guests,
        notes: payload.notes ?? null,
        totalPrice: new Prisma.Decimal(totalPrice),
        status: 'PENDING',
      },
    });

    const booking = await loadBooking(tx, created.id);
    return serializeBooking(booking);
  });

  await publishBookingRequestEvent(booking);
  return booking;
}

async function acceptBooking(ownerId, bookingId) {
  const booking = await prisma.$transaction(async (tx) => {
    const booking = await loadBooking(tx, bookingId);

    if (booking.property.ownerId !== ownerId) {
      const error = new Error('Forbidden');
      error.status = 403;
      throw error;
    }

    if (booking.status === 'CANCELLED') {
      const error = new Error('Cannot accept a cancelled booking');
      error.status = 400;
      throw error;
    }

    const overlap = await tx.booking.findFirst({
      where: {
        propertyId: booking.property.id,
        id: { not: bookingId },
        status: 'ACCEPTED',
        AND: [{ startDate: { lt: booking.endDate } }, { endDate: { gt: booking.startDate } }],
      },
    });

    if (overlap) {
      const error = new Error('Property already has an accepted booking for these dates');
      error.status = 409;
      throw error;
    }

    const updated = await tx.booking.update({
      where: { id: bookingId },
      data: { status: 'ACCEPTED' },
      include: bookingInclude,
    });

    const reason = buildBookingBlockReason(bookingId);

    const existingBlock = await tx.propertyAvailability.findFirst({
      where: {
        propertyId: booking.property.id,
        reason,
      },
    });

    if (!existingBlock) {
      await tx.propertyAvailability.create({
        data: {
          propertyId: booking.property.id,
          startDate: booking.startDate,
          endDate: booking.endDate,
          isBlocked: true,
          reason,
        },
      });
    }

    await tx.booking.updateMany({
      where: {
        propertyId: booking.property.id,
        id: { not: bookingId },
        status: 'PENDING',
        AND: [{ startDate: { lt: booking.endDate } }, { endDate: { gt: booking.startDate } }],
      },
      data: {
        status: 'CANCELLED',
        cancellationReason: `Declined automatically: overlapping with booking ${bookingId}`,
      },
    });

    return serializeBooking(updated);
  });

  await publishBookingStatusEvent(booking);
  return booking;
}

async function cancelBooking(actor, bookingId, reason) {
  const booking = await prisma.$transaction(async (tx) => {
    const booking = await loadBooking(tx, bookingId);

    const isOwner = actor.role === 'OWNER' && booking.property.ownerId === actor.id;
    const isTraveler = actor.role === 'TRAVELER' && booking.traveler && booking.traveler.id === actor.id;

    if (!isOwner && !isTraveler) {
      const error = new Error('Forbidden');
      error.status = 403;
      throw error;
    }

    if (booking.status === 'CANCELLED') {
      return serializeBooking(booking);
    }

    const updated = await tx.booking.update({
      where: { id: bookingId },
      data: {
        status: 'CANCELLED',
        cancellationReason: reason ?? null,
      },
      include: bookingInclude,
    });

    if (booking.status === 'ACCEPTED') {
      const reason = buildBookingBlockReason(bookingId);
      await tx.propertyAvailability.deleteMany({
        where: {
          propertyId: booking.property.id,
          reason,
        },
      });
    }

    return serializeBooking(updated);
  });

  await publishBookingStatusEvent(booking);
  return booking;
}

module.exports = {
  createBooking,
  acceptBooking,
  cancelBooking,
};
