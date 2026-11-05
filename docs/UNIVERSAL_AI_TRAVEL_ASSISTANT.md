# TripSolved — Universal AI Travel Assistant (approved direction)

## Product
A user-led travel assistant. Do not force destination categories, fixed itineraries, or predefined trip types. Inspiration content is optional. Existing kiosk and photography remain unchanged.

## Customer journey
1. Customer describes the desired trip in natural language, optionally by voice.
2. Ask only for missing constraints that materially affect results (dates or flexibility, departure region, party size, budget).
3. Search flights, lodging and local transportation using authorized, current sources.
4. Present 2–3 comparable, feasible alternatives with total cost, currency, checked-at timestamp, source links, and clear exclusions.
5. Allow conversational revisions without losing constraints.
6. Offer a paid, saved travel plan with itinerary, map links, reservations, and offline-accessible essentials.
7. Send the user to the supplier for booking unless a separately approved booking integration exists.

## Commercial rules
- €9.90 is a test price, not a guaranteed viable margin.
- Never invent live prices, availability, reservations, reviews, or payment success.
- Disclose that third-party prices can change.
- Keep free discovery distinct from paid deliverables.
- Record verifiable funnel events: visit, qualified request, checkout start, payment confirmation, refund and support cost.
- Check EU consumer, privacy, and platform billing requirements before monetization.

## Architecture direction
- One responsive web app and shared API/data model.
- Mobile apps for Android/iOS only after core web checkout and trip quality are verified.
- Use a cross-platform approach; avoid separate Android/iOS business logic.
- Preserve current production routes and kiosk assets; no production deployment from this specification.
- No API secrets in frontend or repository.
- Progressive enhancement: usable text input first; voice and offline mode later.

## Delivery order / acceptance gates
P0: Audit existing repository, production routes, checkout, content, and current APIs; baseline tests.
P1: Natural-language trip intake, constraint persistence and source-backed results with error states.
P2: Checkout and fulfillment, verified payment webhooks, cost accounting, GDPR basics.
P3: End-to-end production trial with genuine customer consent and evidence of payment.
P4: Android/iOS release preparation, platform policy review, store accounts and review.
Do not announce any gate as complete without reproducible evidence.

## Explicit non-goals
No forced trip templates, no speculative booking availability, no autonomous spending, no kiosk redesign, no paid advertising without approval.
