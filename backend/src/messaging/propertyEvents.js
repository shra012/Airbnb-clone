const { sendKafkaMessage, isKafkaEnabled } = require('./kafkaClient');

const PROPERTY_TOPIC = 'property.notifications';

const toNumber = (value) => {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value === 'number') {
    return value;
  }
  if (typeof value.toNumber === 'function') {
    return value.toNumber();
  }
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
};

function buildPropertyPayload(property, type) {
  return {
    eventType: type,
    propertyId: property.id,
    title: property.title,
    city: property.city,
    state: property.state,
    country: property.country,
    pricePerNight: toNumber(property.pricePerNight),
    maxGuests: property.maxGuests,
    updatedAt: property.updatedAt || new Date(),
    ownerId: property.ownerId,
  };
}

async function publishPropertyNotification(property, type) {
  if (!isKafkaEnabled()) {
    return;
  }

  const payload = buildPropertyPayload(property, type);
  await sendKafkaMessage(PROPERTY_TOPIC, {
    key: String(property.id),
    value: JSON.stringify({
      ...payload,
      emittedAt: new Date().toISOString(),
      source: 'backend',
    }),
    headers: {
      'x-event-type': Buffer.from(type),
    },
  });
}

module.exports = {
  publishPropertyNotification,
  PROPERTY_TOPIC,
};
