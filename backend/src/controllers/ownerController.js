const { z } = require('zod');
const {
  getOwnerDashboard,
  listOwnerBookings,
  listOwnerProperties,
  createProperty,
  updateProperty,
  updateOwnerProfile,
} = require('../services/ownerService');

const positiveNumber = (message) => z.coerce.number({ invalid_type_error: message }).gt(0, message);
const nonNegativeNumber = (message) => z.coerce.number({ invalid_type_error: message }).min(0, message);
const positiveInt = (message) => z.coerce.number({ invalid_type_error: message }).int(message).gt(0, message);

const ownerProfileUpdateSchema = z.object({
  about: z.string().optional(),
  location: z.string().optional(),
  phone: z.string().optional(),
  avatarUrl: z.string().url().optional(),
  company: z.string().optional(),
});

const propertyCreateSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  propertyType: z.string().min(1, 'Property type is required'),
  addressLine1: z.string().min(1, 'Address line 1 is required'),
  addressLine2: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  country: z.string().min(1, 'Country is required'),
  postalCode: z.string().optional(),
  latitude: z.coerce.number().optional(),
  longitude: z.coerce.number().optional(),
  pricePerNight: positiveNumber('Price per night must be greater than 0'),
  cleaningFee: nonNegativeNumber('Cleaning fee must be 0 or greater').optional(),
  bedrooms: positiveInt('Bedrooms must be a positive integer'),
  bathrooms: positiveInt('Bathrooms must be a positive integer'),
  maxGuests: positiveInt('Max guests must be a positive integer'),
  checkInTime: z.string().optional(),
  checkOutTime: z.string().optional(),
  amenities: z.array(z.string().min(1)).optional(),
  photos: z
    .array(
      z.object({
        url: z.string().url('Photo URL must be a valid URL'),
        caption: z.string().optional(),
        isCover: z.boolean().optional(),
      })
    )
    .optional(),
  availabilities: z
    .array(
      z.object({
        startDate: z.coerce.date({ invalid_type_error: 'Availability start date is invalid' }),
        endDate: z.coerce.date({ invalid_type_error: 'Availability end date is invalid' }),
        isBlocked: z.boolean().optional(),
        reason: z.string().optional(),
      })
    )
    .optional(),
});

async function ownerDashboard(req, res, next) {
  try {
    const ownerId = req.session.user.id;
    const data = await getOwnerDashboard(ownerId);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function ownerBookings(req, res, next) {
  try {
    const ownerId = req.session.user.id;
    const data = await listOwnerBookings(ownerId);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function ownerProperties(req, res, next) {
  try {
    const ownerId = req.session.user.id;
    const page = req.query.page ? Number.parseInt(req.query.page, 10) : undefined;
    const pageSize = req.query.pageSize ? Number.parseInt(req.query.pageSize, 10) : undefined;
    const data = await listOwnerProperties(ownerId, { page, pageSize });
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function ownerCreateProperty(req, res, next) {
  try {
    const ownerId = req.session.user.id;
    const property = await createProperty(ownerId, req.body);
    res.status(201).json({ success: true, data: property });
  } catch (error) {
    next(error);
  }
}

async function ownerUpdateProperty(req, res, next) {
  try {
    const ownerId = req.session.user.id;
    const propertyId = Number(req.params.propertyId);
    
    if (Number.isNaN(propertyId) || propertyId <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid property ID' });
    }

    const property = await updateProperty(ownerId, propertyId, req.body);
    res.json({ success: true, data: property });
  } catch (error) {
    next(error);
  }
}

async function updateProfile(req, res, next) {
  try {
    const ownerId = req.session.user.id;
    const data = await updateOwnerProfile(ownerId, req.body);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  ownerDashboard,
  ownerBookings,
  ownerProperties,
  ownerCreateProperty,
  ownerUpdateProperty,
  updateProfile,
  propertyCreateSchema,
  ownerProfileUpdateSchema,
};
