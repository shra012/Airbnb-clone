const { z } = require('zod');
const {
  registerTraveler,
  registerOwner,
  authenticate,
  getProfile,
} = require('../services/authService');
const { serializeUser } = require('../utils/session');

const travelerSignupSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  about: z.string().optional(),
  city: z.string().optional(),
  state: z.string().length(2, 'State should use 2-letter abbreviation').optional(),
  country: z.string().optional(),
  languages: z.string().optional(),
  gender: z.string().optional(),
  avatarUrl: z.string().url().optional(),
});

const ownerSignupSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  about: z.string().optional(),
  location: z.string().optional(),
  phone: z.string().optional(),
  avatarUrl: z.string().url().optional(),
  company: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

async function travelerSignup(req, res, next) {
  try {
    const payload = travelerSignupSchema.parse(req.body);
    const user = await registerTraveler(payload);
    req.session.user = user;
    res.status(201).json({ success: true, data: user });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: 'Invalid payload', errors: error.errors });
    }
    return next(error);
  }
}

async function ownerSignup(req, res, next) {
  try {
    const payload = ownerSignupSchema.parse(req.body);
    const user = await registerOwner(payload);
    req.session.user = user;
    res.status(201).json({ success: true, data: user });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: 'Invalid payload', errors: error.errors });
    }
    return next(error);
  }
}

async function login(req, res, next) {
  try {
    const payload = loginSchema.parse(req.body);
    const user = await authenticate(payload.email, payload.password);
    req.session.user = user;
    res.json({ success: true, data: user });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: 'Invalid payload', errors: error.errors });
    }
    return next(error);
  }
}

async function logout(req, res, next) {
  try {
    req.session.destroy((err) => {
      if (err) {
        return next(err);
      }
      res.clearCookie('connect.sid');
      return res.json({ success: true });
    });
  } catch (error) {
    next(error);
  }
}

async function currentUser(req, res, next) {
  try {
    if (!req.session.user) {
      return res.status(401).json({ success: false, message: 'Unauthenticated' });
    }
    const profile = await getProfile(req.session.user.id, req.session.user.role);
    return res.json({ success: true, data: profile || serializeUser(req.session.user) });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  travelerSignup,
  ownerSignup,
  login,
  logout,
  currentUser,
};
