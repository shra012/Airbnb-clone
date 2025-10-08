const { z } = require('zod');
const {
  getTravelerDashboard,
  listTravelerBookings,
  listTravelerFavorites,
  updateTravelerProfile,
} = require('../services/travelerService');

const travelerProfileUpdateSchema = z.object({
  about: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
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
  updateProfile,
  travelerProfileUpdateSchema,
};
