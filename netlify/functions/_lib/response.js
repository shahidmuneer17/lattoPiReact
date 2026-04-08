const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Admin-Secret',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
};

const ok = (body, statusCode = 200) => ({
  statusCode,
  headers: { 'Content-Type': 'application/json', ...CORS },
  body: JSON.stringify(body),
});

const fail = (message, statusCode = 400) => ok({ error: message }, statusCode);

const parse = (event) => {
  if (!event?.body) return {};
  try {
    return typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
  } catch {
    return {};
  }
};

// Wraps a handler so any uncaught exception becomes a 500 with the error
// message in the JSON body, instead of an opaque Netlify 502.
const wrap = (handler) => async (event, context) => {
  try {
    return await handler(event, context);
  } catch (e) {
    console.error('[fn] uncaught:', e);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', ...CORS },
      body: JSON.stringify({
        error: e.message || String(e),
        stack: process.env.NODE_ENV === 'production' ? undefined : e.stack,
      }),
    };
  }
};

module.exports = { ok, fail, parse, wrap, CORS };
