# TripSolved intake API — isolated prototype

Requires Node.js 20+; no third-party dependencies.

Run tests: `node --test apps/tripsolved-api/server.test.mjs`

Run local API: `node apps/tripsolved-api/server.mjs`

- `GET /health`
- `POST /api/trips/intake` JSON example: `{"description":"Seven days at sea","travelers":2,"budgetEur":1500,"departure":"Krakow","dates":"flexible"}`

Returns normalized trip constraints and explicit `searchAvailable:false`, `bookingAvailable:false`, `prices:[]`.

**Not production-ready:** No AI provider, live travel data, checkout, authentication, rate limiting, abuse prevention, monitoring, or data retention policy. Server binds to localhost only. Do not expose it publicly until those are implemented. Existing kiosk and production site are untouched.
