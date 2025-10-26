const { env } = require('../config/env');

async function proxyConciergeRequest(req, res, next) {
  try {
    const requestPayload = { ...req.body };
    if (req.session?.user?.role === 'TRAVELER') {
      requestPayload.traveler_id = req.session.user.id;
    }

    const response = await fetch(`${env.agentServiceUrl}/api/agent/concierge`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestPayload),
    });

    const text = await response.text();
    let payload;
    try {
      payload = text ? JSON.parse(text) : null;
    } catch (error) {
      payload = { message: 'Invalid response from concierge service', raw: text };
    }

    if (!response.ok) {
      const detail = payload?.detail || payload?.message || 'Concierge service error';
      return res.status(response.status).json({
        success: false,
        message: detail,
        ...(payload?.correlation_id && { correlationId: payload.correlation_id }),
      });
    }

    return res.json(payload);
  } catch (error) {
    return next(error);
  }
}

async function proxyAgentChat(req, res, next) {
  try {
    const payload = { ...req.body };
    if (req.session?.user?.role === 'TRAVELER') {
      payload.traveler_id = req.session.user.id;
    }

    const response = await fetch(`${env.agentServiceUrl}/api/agent/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const text = await response.text();
    let payloadResponse;
    try {
      payloadResponse = text ? JSON.parse(text) : null;
    } catch (error) {
      payloadResponse = { message: 'Invalid response from concierge chat service', raw: text };
    }

    if (!response.ok) {
      const detail = payloadResponse?.detail || payloadResponse?.message || 'Concierge chat service error';
      return res.status(response.status).json({
        success: false,
        message: detail,
        ...(payloadResponse?.correlation_id && { correlationId: payloadResponse.correlation_id }),
      });
    }

    return res.json(payloadResponse);
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  proxyConciergeRequest,
  proxyAgentChat,
};
