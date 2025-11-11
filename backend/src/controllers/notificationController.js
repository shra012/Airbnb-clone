const { listNotifications, markNotificationAsRead } = require('../services/notificationService');
const { z } = require('zod');

async function listNotificationsHandler(req, res, next) {
  try {
    const notifications = await listNotifications(req.session.user.id);
    return res.json({ success: true, data: notifications });
  } catch (error) {
    return next(error);
  }
}

const markReadSchema = z.object({
  id: z.string().length(24, 'Invalid notification id'),
});

async function markNotificationReadHandler(req, res, next) {
  try {
    const { id } = markReadSchema.parse(req.params);
    const updated = await markNotificationAsRead(req.session.user.id, id);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }
    return res.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: 'Invalid notification id' });
    }
    return next(error);
  }
}

module.exports = {
  listNotificationsHandler,
  markNotificationReadHandler,
};
