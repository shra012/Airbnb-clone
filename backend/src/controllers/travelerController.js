const { z } = require('zod');
const {
  getTravelerDashboard,
  listTravelerBookings,
  listTravelerFavorites,
  listTravelerHistory,
  updateTravelerProfile,
} = require('../services/travelerService');

const travelerProfileUpdateSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  email: z.string().trim().email('Invalid email'),
  phone: z.string().trim().max(30, 'Phone number is too long').optional(),
  about: z.string().optional(),
  city: z.string().optional(),
  state: z
    .string()
    .trim()
    .transform((val) => val.toUpperCase())
    .refine((val) => val === '' || val.length === 2, 'State must be a 2-letter abbreviation')
    .optional(),
  country: z
    .string()
    .trim()
    .transform((val) => val.toUpperCase())
    .refine((val) => val === '' || val === 'US' || val === 'IN', 'Country must be India or United States')
    .optional(),
  languages: z.string().optional(),
  gender: z.string().optional(),
  avatarUrl: z.string().url().optional(),
});

async function travelerDashboard(req, res, next) {
  try {
    const travelerId = req.session.user.id;
    const data = await getTravelerDashboard(travelerId);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function travelerBookings(req, res, next) {
  try {
    const travelerId = req.session.user.id;
    const data = await listTravelerBookings(travelerId);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function travelerFavorites(req, res, next) {
  try {
    const travelerId = req.session.user.id;
    const data = await listTravelerFavorites(travelerId);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function travelerHistory(req, res, next) {
  try {
    const travelerId = req.session.user.id;
    const data = await listTravelerHistory(travelerId);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function updateProfile(req, res, next) {
  try {
    const travelerId = req.session.user.id;
    const data = await updateTravelerProfile(travelerId, req.body);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  travelerDashboard,
  travelerBookings,
  travelerFavorites,
  travelerHistory,
  updateProfile,
  travelerProfileUpdateSchema,
};
