// Isolated preview API. Does not call AI, suppliers, booking or payments.
export default function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const contentType = req.headers['content-type'] || '';
  if (!contentType.toLowerCase().startsWith('application/json')) {
    return res.status(415).json({ error: 'JSON required' });
  }
  const body = req.body;
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return res.status(400).json({ error: 'Invalid request' });
  }
  const description = typeof body.description === 'string' ? body.description.trim() : '';
  const travelers = body.travelers === undefined ? 1 : Number(body.travelers);
  const budget = body.budgetEur == null || body.budgetEur === '' ? null : Number(body.budgetEur);
  const departure = typeof body.departure === 'string' ? body.departure.trim() : '';
  const dates = typeof body.dates === 'string' ? body.dates.trim() : '';
  if (!description || description.length > 3000 ||
      !Number.isInteger(travelers) || travelers < 1 || travelers > 30 ||
      (budget !== null && (!Number.isFinite(budget) || budget < 1 || budget > 1000000)) ||
      departure.length > 160 || dates.length > 160) {
    return res.status(400).json({ error: 'Invalid trip constraints' });
  }
  return res.status(200).json({
    status: 'intake_accepted',
    trip: { description, travelers, budgetEur: budget, departure, dates },
    searchAvailable: false,
    bookingAvailable: false,
    prices: [],
    nextStep: 'AI planning and verified travel sources are not connected yet.'
  });
}
