import http from 'node:http';

const MAX_BODY_BYTES = 12_000;
const MAX_TEXT_LENGTH = 3_000;
export function validateTrip(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return { error: 'Invalid request object' };
  const description = typeof input.description === 'string' ? input.description.trim() : '';
  if (!description || description.length > MAX_TEXT_LENGTH) return { error: 'Trip description must be 1–3000 characters' };
  const travelers = Number(input.travelers ?? 1);
  if (!Number.isInteger(travelers) || travelers < 1 || travelers > 30) return { error: 'Travelers must be between 1 and 30' };
  const budget = input.budgetEur === '' || input.budgetEur == null ? null : Number(input.budgetEur);
  if (budget !== null && (!Number.isFinite(budget) || budget < 1 || budget > 1_000_000)) return { error: 'Invalid budget' };
  const departure = typeof input.departure === 'string' ? input.departure.trim().slice(0, 160) : '';
  const dates = typeof input.dates === 'string' ? input.dates.trim().slice(0, 160) : '';
  return { data: { description, travelers, budgetEur: budget, departure, dates } };
}
export function createHandler() {
  return async (req, res) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    if (req.method === 'GET' && req.url === '/health') {
      res.writeHead(200); res.end(JSON.stringify({ ok: true, mode: 'intake-only' })); return;
    }
    if (req.method !== 'POST' || req.url !== '/api/trips/intake') {
      res.writeHead(404); res.end(JSON.stringify({ error: 'Not found' })); return;
    }
    const type = req.headers['content-type'] || '';
    if (!type.toLowerCase().startsWith('application/json')) {
      res.writeHead(415); res.end(JSON.stringify({ error: 'JSON required' })); return;
    }
    let body = '';
    try {
      for await (const chunk of req) {
        body += chunk.toString('utf8');
        if (Buffer.byteLength(body) > MAX_BODY_BYTES) {
          res.writeHead(413); res.end(JSON.stringify({ error: 'Request too large' })); return;
        }
      }
      const result = validateTrip(JSON.parse(body));
      if (result.error) { res.writeHead(400); res.end(JSON.stringify(result)); return; }
      // No invented provider data. No customer data is persisted or sent to third parties.
      res.writeHead(200);
      res.end(JSON.stringify({
        trip: result.data,
        status: 'intake_accepted',
        searchAvailable: false,
        bookingAvailable: false,
        prices: [],
        nextStep: 'Live supplier search and AI planning are not connected yet.'
      }));
    } catch {
      res.writeHead(400); res.end(JSON.stringify({ error: 'Invalid JSON' }));
    }
  };
}
if (process.argv[1] && import.meta.url === new URL('file://' + process.argv[1]).href) {
  const port = Number(process.env.PORT || 8787);
  http.createServer(createHandler()).listen(port, '127.0.0.1', () => {
    process.stdout.write('TripSolved intake API listening on localhost:' + port + '\n');
  });
}
