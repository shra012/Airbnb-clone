const { ObjectId } = require('mongodb');
const { getMongoDb } = require('../config/mongo');

const COLLECTION = 'booking_notifications';

async function insertNotification(doc) {
  const db = await getMongoDb();
  if (!db) {
    return null;
  }
  const record = {
    ...doc,
    createdAt: doc.createdAt || new Date(),
    read: doc.read ?? false,
  };
  const result = await db.collection(COLLECTION).insertOne(record);
  return { ...record, _id: result.insertedId };
}

async function findNotificationsByUser(userId, limit = 50) {
  const db = await getMongoDb();
  if (!db) {
    return [];
  }
  return db
    .collection(COLLECTION)
    .find({ userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();
}

async function markNotificationRead(userId, notificationId) {
  const db = await getMongoDb();
  if (!db) {
    return false;
  }
  let _id;
  try {
    _id = new ObjectId(notificationId);
  } catch (error) {
    return false;
  }
  const result = await db
    .collection(COLLECTION)
    .updateOne({ _id, userId }, { $set: { read: true, readAt: new Date() } });
  return result.matchedCount > 0;
}

module.exports = {
  insertNotification,
  findNotificationsByUser,
  markNotificationRead,
};
