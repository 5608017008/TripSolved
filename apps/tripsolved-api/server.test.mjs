import test from 'node:test';
import assert from 'node:assert/strict';
import { validateTrip, createHandler } from './server.mjs';
import http from 'node:http';

test('valid flexible trip', () => {
  const result = validateTrip({ description: 'Chceme ísť k moru', travelers: 2, budgetEur: 1500 });
  assert.equal(result.data.travelers, 2);
  assert.equal(result.data.budgetEur, 1500);
});
test('rejects empty trip', () => assert.ok(validateTrip({ description: ' ' }).error));
test('rejects oversized trip', () => assert.ok(validateTrip({ description: 'x'.repeat(3001) }).error));
test('rejects invalid party size', () => assert.ok(validateTrip({ description: 'Trip', travelers: 0 }).error));
test('rejects invalid budget', () => assert.ok(validateTrip({ description: 'Trip', budgetEur: -10 }).error));
test('rejects invalid input object', () => assert.ok(validateTrip([]).error));
test('HTTP intake never fabricates prices', async () => {
  const server = http.createServer(createHandler());
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try {
    const port = server.address().port;
    const response = await fetch('http://127.0.0.1:' + port + '/api/trips/intake', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ description: 'London in December', travelers: 2 })
    });
    assert.equal(response.status, 200);
    const data = await response.json();
    assert.equal(data.searchAvailable, false);
    assert.deepEqual(data.prices, []);
  } finally { await new Promise(resolve => server.close(resolve)); }
});
