const {
  getTravelerDashboard,
  listTravelerBookings,
  listTravelerFavorites,
} = require('../services/travelerService');

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

module.exports = {
  travelerDashboard,
  travelerBookings,
  travelerFavorites,
};
