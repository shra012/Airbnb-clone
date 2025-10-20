const { env } = require('../config/env');

async function proxyConciergeRequest(req, res, next) {
  try {
    const response = await fetch(`${env.agentServiceUrl}/api/agent/concierge`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body),
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

module.exports = {
  proxyConciergeRequest,
};
