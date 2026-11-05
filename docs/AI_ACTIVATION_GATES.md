# Optional AI planning — activation gate

The preview is **rule-based by default**. The endpoint `/api/trips/ai` returns HTTP 503 with `ai_disabled` unless **both** server-side environment variables are present:

- `TRIPSOLVED_AI_ENABLED=true`
- `OPENAI_API_KEY` (secret; never in source, browser or logs)

**Owner approval is required before configuring these variables** because the OpenAI API is a metered paid service. The code does not activate a subscription or make paid calls on its own.

Safeguards: input length/number validation, no request persistence (`store:false`), 650 maximum output tokens, 12-second provider timeout, fixed low-cost model `gpt-4.1-mini`, no browsing or supplier calls, no fabricated live prices, no payment or booking capability. There is no per-user quota or authentication yet, so **do not enable this on a publicly accessible deployment** before adding rate limiting, abuse protection, an owner-approved spend ceiling, and monitoring. The frontend always preserves the free rule-based draft if AI is unavailable.

The AI proposal is a draft, not a live travel quote. Separate verified provider integrations are required before claiming availability or prices.
