// Scheduled by netlify.toml — runs every day in the 28-31 window at 23:00 UTC.
// No-ops unless today is the actual last day of the month.
const { executeDraw, currentDrawId } = require('./_lib/draw');
const { ok } = require('./_lib/response');

function isLastDayOfMonth(d = new Date()) {
  const next = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1));
  return next.getUTCMonth() !== d.getUTCMonth();
}

exports.handler = async () => {
  if (!isLastDayOfMonth()) {
    return ok({ skipped: true, reason: 'not last day of month' });
  }
  const result = await executeDraw(currentDrawId(), 'monthly');
  return ok(result);
};
