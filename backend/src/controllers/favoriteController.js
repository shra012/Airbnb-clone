const { z } = require('zod');
const { listFavorites, addFavorite, removeFavorite } = require('../services/favoriteService');

const propertyIdParamsSchema = z.object({
  propertyId: z.coerce.number().int().positive(),
});

async function getFavorites(req, res, next) {
  try {
    const travelerId = req.session.user.id;
    const data = await listFavorites(travelerId);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function addFavoriteHandler(req, res, next) {
  try {
    const travelerId = req.session.user.id;
    const { propertyId } = propertyIdParamsSchema.parse(req.params);
    const favorite = await addFavorite(travelerId, propertyId);
    res.status(201).json({ success: true, data: favorite });
  } catch (error) {
    next(error);
  }
}

async function removeFavoriteHandler(req, res, next) {
  try {
    const travelerId = req.session.user.id;
    const { propertyId } = propertyIdParamsSchema.parse(req.params);
    await removeFavorite(travelerId, propertyId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getFavorites,
  addFavoriteHandler,
  removeFavoriteHandler,
};
