const { MongoClient } = require('mongodb');
const { env } = require('./env');

let clientPromise = null;

function isMongoEnabled() {
  return Boolean(env.mongoSessionUri);
}

function getDatabaseName() {
  if (env.mongoDatabaseName) {
    return env.mongoDatabaseName;
  }
  return 'airbnb_sessions';
}

async function getMongoClient() {
  if (!isMongoEnabled()) {
    return null;
  }

  if (!clientPromise) {
    const client = new MongoClient(env.mongoSessionUri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
    });
    clientPromise = client
      .connect()
      .then(() => client)
      .catch((error) => {
        console.warn('[Mongo] Failed to connect:', error.message);
        clientPromise = null;
        return null;
      });
  }

  return clientPromise;
}

async function getMongoDb() {
  const client = await getMongoClient();
  if (!client) {
    return null;
  }
  return client.db(getDatabaseName());
}

async function closeMongo() {
  if (clientPromise) {
    const client = await clientPromise;
    if (client) {
      await client.close();
    }
    clientPromise = null;
  }
}

module.exports = {
  isMongoEnabled,
  getMongoDb,
  closeMongo,
};
