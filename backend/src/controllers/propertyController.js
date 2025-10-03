const { z } = require('zod');
const { searchProperties, getPropertyById } = require('../services/propertyService');

const propertySearchSchema = z
  .object({
  location: z.string().trim().min(1).optional(),
  guests: z.coerce.number().int().positive().optional(),
  minPrice: z.coerce.number().nonnegative().optional(),
  maxPrice: z.coerce.number().nonnegative().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  sort: z.enum(['price-asc', 'price-desc', 'newest', 'updated']).optional(),
  })
  .refine(
    (data) => {
      if ((data.startDate && !data.endDate) || (!data.startDate && data.endDate)) {
        return false;
      }
      if (data.startDate && data.endDate) {
        return data.endDate >= data.startDate;
      }
      return true;
    },
    {
      message: 'Start and end dates must be provided together and end date must be after start date',
      path: ['endDate'],
    }
  )
  .refine(
    (data) => {
      if (data.minPrice !== undefined && data.maxPrice !== undefined) {
        return data.minPrice <= data.maxPrice;
      }
      return true;
    },
    {
      message: 'minPrice cannot be greater than maxPrice',
      path: ['minPrice'],
    }
  );

async function listProperties(req, res, next) {
  try {
    const data = await searchProperties(req.query);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function getProperty(req, res, next) {
  try {
    const propertyId = Number(req.params.propertyId);
    if (Number.isNaN(propertyId) || propertyId <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid property id' });
    }
    const property = await getPropertyById(propertyId);
    if (!property) {
      return res.status(404).json({ success: false, message: 'Property not found' });
    }
    return res.json({ success: true, data: property });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  propertySearchSchema,
  listProperties,
  getProperty,
};
