// POST /.netlify/functions/approve
// body: { paymentId }
// Server-side approval webhook called by the Pi SDK before the user signs.
const { ok, fail, parse, wrap } = require('./_lib/response');
const { approvePayment } = require('./_lib/pi');

exports.handler = wrap(async (event) => {
  const { paymentId } = parse(event);
  if (!paymentId) return fail('paymentId required', 400);
  try {
    const data = await approvePayment(paymentId);
    return ok(data);
  } catch (e) {
    return fail(e.message, 502);
  }
});
