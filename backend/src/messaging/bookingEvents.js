const { sendKafkaMessage, isKafkaEnabled } = require('./kafkaClient');

const BOOKING_REQUESTS_TOPIC = 'booking.requests';
const BOOKING_STATUS_TOPIC = 'booking.status';

function buildBasePayload(booking) {
  return {
    bookingId: booking.id,
    propertyId: booking.property?.id ?? null,
    propertyTitle: booking.property?.title ?? null,
    ownerId: booking.property?.ownerId ?? null,
    travelerId: booking.traveler?.id ?? null,
    status: booking.status,
    guests: booking.guests,
    startDate: booking.startDate,
    endDate: booking.endDate,
    totalPrice: booking.totalPrice,
    notes: booking.notes ?? null,
    cancellationReason: booking.cancellationReason ?? null,
    updatedAt: booking.updatedAt,
    createdAt: booking.createdAt,
  };
}

async function sendEvent(topic, payload, type) {
  if (!isKafkaEnabled()) {
    return;
  }

  const message = {
    key: String(payload.bookingId),
    value: JSON.stringify({
      ...payload,
      type,
      emittedAt: new Date().toISOString(),
      source: 'backend',
    }),
    headers: {
      'x-event-type': Buffer.from(type),
    },
  };

  await sendKafkaMessage(topic, message);
}

async function publishBookingRequestEvent(booking) {
  const payload = buildBasePayload(booking);
  await sendEvent(BOOKING_REQUESTS_TOPIC, payload, 'BOOKING_REQUESTED');
}

async function publishBookingStatusEvent(booking) {
  const payload = buildBasePayload(booking);
  await sendEvent(BOOKING_STATUS_TOPIC, payload, 'BOOKING_STATUS_UPDATED');
}

module.exports = {
  publishBookingRequestEvent,
  publishBookingStatusEvent,
  BOOKING_REQUESTS_TOPIC,
  BOOKING_STATUS_TOPIC,
};
