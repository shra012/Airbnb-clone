const { insertNotification, findNotificationsByUser, markNotificationRead } = require('../repositories/notificationRepository');

function buildNotificationDoc({ userId, role, type, booking }) {
  return {
    userId,
    role,
    type,
    bookingId: booking.bookingId,
    payload: booking,
    read: false,
  };
}

async function createOwnerNotification(booking) {
  if (!booking.ownerId) {
    return null;
  }
  const doc = buildNotificationDoc({
    userId: booking.ownerId,
    role: 'OWNER',
    type: 'BOOKING_REQUESTED',
    booking,
  });
  return insertNotification(doc);
}

async function createTravelerNotification(booking) {
  if (!booking.travelerId) {
    return null;
  }
  const doc = buildNotificationDoc({
    userId: booking.travelerId,
    role: 'TRAVELER',
    type: 'BOOKING_STATUS_UPDATED',
    booking,
  });
  return insertNotification(doc);
}

async function listNotifications(userId) {
  return findNotificationsByUser(userId);
}

async function markNotificationAsRead(userId, notificationId) {
  return markNotificationRead(userId, notificationId);
}

module.exports = {
  createOwnerNotification,
  createTravelerNotification,
  listNotifications,
  markNotificationAsRead,
};
