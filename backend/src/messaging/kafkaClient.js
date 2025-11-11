const { Kafka, logLevel } = require('kafkajs');
const { env } = require('../config/env');

let producerPromise = null;

function isKafkaEnabled() {
  return Array.isArray(env.kafkaBrokers) && env.kafkaBrokers.length > 0;
}

function createKafkaInstance() {
  return new Kafka({
    clientId: env.kafkaClientId,
    brokers: env.kafkaBrokers,
    logLevel: logLevel.NOTHING,
  });
}

async function getKafkaProducer() {
  if (!isKafkaEnabled()) {
    return null;
  }

  if (!producerPromise) {
    const kafka = createKafkaInstance();
    const producer = kafka.producer();
    producerPromise = producer
      .connect()
      .then(() => producer)
      .catch((error) => {
        console.warn('[Kafka] Failed to connect producer:', error.message);
        producerPromise = null;
        return null;
      });
  }

  return producerPromise;
}

async function sendKafkaMessage(topic, message) {
  const producer = await getKafkaProducer();
  if (!producer) {
    return false;
  }

  try {
    await producer.send({
      topic,
      messages: [message],
    });
    return true;
  } catch (error) {
    console.warn(`[Kafka] Failed to send message to ${topic}:`, error.message);
    return false;
  }
}

async function disconnectKafka() {
  if (producerPromise) {
    const producer = await producerPromise;
    if (producer) {
      try {
        await producer.disconnect();
      } catch (error) {
        console.warn('[Kafka] Error disconnecting producer:', error.message);
      }
    }
    producerPromise = null;
  }
}

process.once('beforeExit', disconnectKafka);
process.once('SIGINT', async () => {
  await disconnectKafka();
  process.exit(0);
});
process.once('SIGTERM', async () => {
  await disconnectKafka();
  process.exit(0);
});

module.exports = {
  isKafkaEnabled,
  getKafkaProducer,
  sendKafkaMessage,
};
