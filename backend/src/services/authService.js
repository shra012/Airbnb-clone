const { PrismaClientKnownRequestError } = require('@prisma/client/runtime/library');
const { prisma } = require('../config/prisma');
const { hashPassword, verifyPassword } = require('../utils/password');
const { serializeUser } = require('../utils/session');

async function registerTraveler(payload) {
  const passwordHash = await hashPassword(payload.password);
  try {
    const user = await prisma.user.create({
      data: {
        email: payload.email,
        name: payload.name,
        passwordHash,
        role: 'TRAVELER',
        travelerProfile: {
          create: {
            about: payload.about || null,
            city: payload.city || null,
            state: payload.state || null,
            country: payload.country || null,
            languages: payload.languages || null,
            gender: payload.gender || null,
            avatarUrl: payload.avatarUrl || null,
          },
        },
      },
    });
    return serializeUser(user);
  } catch (error) {
    if (error instanceof PrismaClientKnownRequestError && error.code === 'P2002') {
      throw Object.assign(new Error('Email already in use'), { status: 409 });
    }
    throw error;
  }
}

async function registerOwner(payload) {
  const passwordHash = await hashPassword(payload.password);
  try {
    const user = await prisma.user.create({
      data: {
        email: payload.email,
        name: payload.name,
        passwordHash,
        role: 'OWNER',
        ownerProfile: {
          create: {
            about: payload.about || null,
            location: payload.location || null,
            phone: payload.phone || null,
            avatarUrl: payload.avatarUrl || null,
            company: payload.company || null,
          },
        },
      },
    });
    return serializeUser(user);
  } catch (error) {
    if (error instanceof PrismaClientKnownRequestError && error.code === 'P2002') {
      throw Object.assign(new Error('Email already in use'), { status: 409 });
    }
    throw error;
  }
}

async function authenticate(email, password) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw Object.assign(new Error('Invalid credentials'), { status: 401 });
  }
  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    throw Object.assign(new Error('Invalid credentials'), { status: 401 });
  }
  return serializeUser(user);
}

async function getProfile(userId, role) {
  if (role === 'TRAVELER') {
    return prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        travelerProfile: true,
      },
    });
  }
  if (role === 'OWNER') {
    return prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        ownerProfile: true,
      },
    });
  }
  throw Object.assign(new Error('Unknown role'), { status: 400 });
}

module.exports = {
  registerTraveler,
  registerOwner,
  authenticate,
  getProfile,
};
