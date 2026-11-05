# Optional AI planning — activation gate

The preview is **rule-based by default**. The endpoint `/api/trips/ai` returns HTTP 503 with `ai_disabled` unless **both** server-side environment variables are present:

- `TRIPSOLVED_AI_ENABLED=true`
- `OPENAI_API_KEY` (secret; never in source, browser or logs)

**Owner approval is required before configuring these variables** because the OpenAI API is a metered paid service. The code does not activate a subscription or make paid calls on its own.

Safeguards: input length/number validation, no request persistence (`store:false`), 650 maximum output tokens, 12-second provider timeout, fixed low-cost model `gpt-4.1-mini`, no browsing or supplier calls, no fabricated live prices, no payment or booking capability. There is no per-user quota or authentication yet, so **do not enable this on a publicly accessible deployment** before adding rate limiting, abuse protection, an owner-approved spend ceiling, and monitoring. The frontend always preserves the free rule-based draft if AI is unavailable.

The AI proposal is a draft, not a live travel quote. Separate verified provider integrations are required before claiming availability or prices.


## Customer inquiry delivery activation (separate from paid AI)

The server-side POST `/api/trips/inquiry` is deployed but **fails closed** by default. It must not be advertised as live until all gates below pass:

1. Configure `RESEND_API_KEY` server-side only, verified sender domain, and `TRIPSOLVED_INQUIRY_TO` pointing to an inbox that the sales operator can demonstrably read (do not assume office@nexisdata.eu forwarding works).
2. Configure Cloudflare Turnstile with `TURNSTILE_SECRET_KEY` and exact `TRIPSOLVED_TURNSTILE_HOSTNAME`. Implement a client widget using its public site key. Verify both valid and invalid tokens, including hostname mismatches.
3. Deploy shared per-IP and per-email throttling with a hard daily quota (persistent/edge storage, not in-memory serverless counters), and abuse alerts. Only then set `TRIPSOLVED_INQUIRY_SECURITY_READY=true`.
4. Complete the website form, consent/privacy text and customer acknowledgement; never display success based only on an unconfirmed email send.
5. Test end-to-end with a clearly labelled internal message. Confirm provider delivery status **and** receipt in the configured monitored inbox. Exclude test messages from sales reporting.
6. Only after these checks, explicitly authorize and set `TRIPSOLVED_INQUIRIES_ENABLED=true` in the isolated preview environment. Do not enable on the kiosk production project.

Current status: not activated. The preview UI continues to use a manual mailto fallback; do not imply that it submits directly to the server.
