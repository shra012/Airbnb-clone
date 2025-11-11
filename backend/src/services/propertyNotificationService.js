const { insertPropertyNotification, listPropertyNotifications } = require('../repositories/propertyNotificationRepository');

async function recordPropertyNotification(event) {
  const propertyId = Number(event.propertyId);
  if (!Number.isFinite(propertyId)) {
    return null;
  }
  return insertPropertyNotification({
    ...event,
    propertyId,
  });
}

async function getPropertyNotifications(propertyId, limit) {
  return listPropertyNotifications(propertyId, limit);
}

module.exports = {
  recordPropertyNotification,
  getPropertyNotifications,
};
