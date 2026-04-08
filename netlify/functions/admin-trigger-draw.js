// POST /.netlify/functions/admin-trigger-draw  body: { drawId? }
const { ok, fail, parse, wrap } = require('./_lib/response');
const { requireAdmin } = require('./_lib/auth');
const { executeDraw, currentDrawId } = require('./_lib/draw');

exports.handler = wrap(async (event) => {
  if (!requireAdmin(event)) return fail('forbidden', 403);
  const { drawId } = parse(event);
  const result = await executeDraw(drawId || currentDrawId(), 'admin');
  return ok(result);
});
