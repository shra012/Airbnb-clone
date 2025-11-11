const { Kafka, logLevel } = require('kafkajs');
const { env } = require('../config/env');
const { createOwnerNotification, createTravelerNotification } = require('../services/notificationService');
const { recordPropertyNotification } = require('../services/propertyNotificationService');
const { emitToUser, emitToRole, emitToProperty } = require('../realtime/socketServer');

const consumers = [];

function isKafkaEnabled() {
  return Array.isArray(env.kafkaBrokers) && env.kafkaBrokers.length > 0;
}

function buildKafkaClient() {
  return new Kafka({
    clientId: `${env.kafkaClientId}-consumer`,
    brokers: env.kafkaBrokers,
    logLevel: logLevel.NOTHING,
  });
}

async function handleBookingRequest(message) {
  try {
    const payload = JSON.parse(message.value.toString());
    const notification = await createOwnerNotification(payload);
    if (payload.ownerId) {
      emitToUser(payload.ownerId, 'booking:request', {
        booking: payload,
        notification,
      });
    }
  } catch (error) {
    console.warn('[Kafka] Failed to process booking request event:', error.message);
  }
}

async function handleBookingStatus(message) {
  try {
    const payload = JSON.parse(message.value.toString());
    const notification = await createTravelerNotification(payload);
    if (payload.travelerId) {
      emitToUser(payload.travelerId, 'booking:status', {
        booking: payload,
        notification,
      });
    }
  } catch (error) {
    console.warn('[Kafka] Failed to process booking status event:', error.message);
  }
}

async function handlePropertyNotification(message) {
  try {
    const payload = JSON.parse(message.value.toString());
    await recordPropertyNotification(payload);
    if (payload.propertyId) {
      emitToProperty(payload.propertyId, 'property:update', payload);
    }
    emitToRole('TRAVELER', 'property:update', payload);
  } catch (error) {
    console.warn('[Kafka] Failed to process property notification event:', error.message);
  }
}

async function startConsumer(topic, groupId, handler) {
  const kafka = buildKafkaClient();
  const consumer = kafka.consumer({ groupId });
  await consumer.connect();
  await consumer.subscribe({ topic, fromBeginning: false });
  await consumer.run({
    eachMessage: async ({ message }) => {
      if (!message.value) {
        return;
      }
      await handler(message);
    },
  });
  consumers.push(consumer);
}

async function startBookingConsumers() {
  if (!isKafkaEnabled()) {
    console.info('[Kafka] Disabled, skipping consumer startup');
    return;
  }

  await Promise.allSettled([
    startConsumer('booking.requests', `${env.kafkaClientId}-requests`, handleBookingRequest),
    startConsumer('booking.status', `${env.kafkaClientId}-status`, handleBookingStatus),
    startConsumer('property.notifications', `${env.kafkaClientId}-properties`, handlePropertyNotification),
  ]);
}

async function stopBookingConsumers() {
  await Promise.all(
    consumers.map(async (consumer) => {
      try {
        await consumer.disconnect();
      } catch (error) {
        console.warn('[Kafka] Error disconnecting consumer:', error.message);
      }
    })
  );
  consumers.length = 0;
}

module.exports = {
  startBookingConsumers,
  stopBookingConsumers,
};
