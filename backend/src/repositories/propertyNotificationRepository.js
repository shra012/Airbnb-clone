const { getMongoDb } = require('../config/mongo');

const COLLECTION = 'property_notifications';

async function insertPropertyNotification(doc) {
  const db = await getMongoDb();
  if (!db) return null;
  const record = {
    ...doc,
    createdAt: doc.createdAt || new Date(),
  };
  const result = await db.collection(COLLECTION).insertOne(record);
  return { ...record, _id: result.insertedId };
}

async function listPropertyNotifications(propertyId, limit = 20) {
  const db = await getMongoDb();
  if (!db) return [];
  return db
    .collection(COLLECTION)
    .find({ propertyId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();
}

module.exports = {
  insertPropertyNotification,
  listPropertyNotifications,
};
