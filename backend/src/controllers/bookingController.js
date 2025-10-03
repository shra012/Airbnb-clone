const { z } = require('zod');
const { createBooking, acceptBooking, cancelBooking } = require('../services/bookingService');
const { listTravelerBookings } = require('../services/travelerService');
const { listOwnerBookings } = require('../services/ownerService');

const createBookingSchema = z
  .object({
    propertyId: z.coerce.number().int().positive(),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    guests: z.coerce.number().int().positive(),
    notes: z.string().max(1000).optional(),
  })
  .refine((data) => data.endDate > data.startDate, {
    message: 'End date must be after start date',
    path: ['endDate'],
  });

const bookingIdParamsSchema = z.object({
  bookingId: z.coerce.number().int().positive(),
});

const cancelBookingBodySchema = z
  .object({
    reason: z.string().max(500).optional(),
  })
  .optional();

async function createBookingHandler(req, res, next) {
  try {
    const payload = createBookingSchema.parse(req.body);
    const travelerId = req.session.user.id;
    const booking = await createBooking(travelerId, payload);
    res.status(201).json({ success: true, data: booking });
  } catch (error) {
    next(error);
  }
}

async function listBookingsHandler(req, res, next) {
  try {
    const user = req.session.user;
    if (user.role === 'TRAVELER') {
      const data = await listTravelerBookings(user.id);
      return res.json({ success: true, data });
    }
    if (user.role === 'OWNER') {
      const data = await listOwnerBookings(user.id);
      return res.json({ success: true, data });
    }
    return res.status(403).json({ success: false, message: 'Forbidden' });
  } catch (error) {
    return next(error);
  }
}

async function acceptBookingHandler(req, res, next) {
  try {
    const { bookingId } = bookingIdParamsSchema.parse(req.params);
    const booking = await acceptBooking(req.session.user.id, bookingId);
    res.json({ success: true, data: booking });
  } catch (error) {
    next(error);
  }
}

async function cancelBookingHandler(req, res, next) {
  try {
    const { bookingId } = bookingIdParamsSchema.parse(req.params);
    cancelBookingBodySchema.parse(req.body ?? {});
    const booking = await cancelBooking(req.session.user, bookingId);
    res.json({ success: true, data: booking });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createBookingHandler,
  listBookingsHandler,
  acceptBookingHandler,
  cancelBookingHandler,
};
