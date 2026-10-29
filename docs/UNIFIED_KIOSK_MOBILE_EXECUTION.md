# TripSolved unified mobile + kiosk — execution contract

Issue: #10. Owner directive 2026-10-29. Branch: fix/unified-kiosk-mobile-20261029.

## P0 evidence gate
- Locate actual source of n-8951.chatgpt.site; do not assume this preview is in this repo.
- Locate production deployment and its source revision. Never overwrite without identifying current route and rollback.
- Inventory approved original Slovakia photos, including Pieniny/Zamagurie, Strbske Pleso, High Tatras and Banska Bystrica. Preserve bytes and filenames; do not replace with synthetic or stock photos.
- If any of these are unavailable, mark BLOCKED with exact paths/URLs required; no invented PASS.

## Implementation
- One canonical responsive page, 9 locales, €9.90 fee explicitly for plan only; no false reservation/checkout claims.
- Kiosk idle mode: fullscreen slideshow, gentle 8–12s dwell, place caption, responsive crop without altering originals, accessible reduced-motion fallback, QR to live booking form, offline caching only of legally usable approved assets.
- Mobile: destination inspiration, request form, consent/privacy text, spam guard, email delivery verification. Payment only after explicitly verified payment flow; no collection of card data in form.
- Avoid publishing owner/family photos unless expressly approved for that placement.
- Do not regress other business products.

## Verification before merge
- Test each of 9 locales, mobile width 360px, desktop, kiosk 1920x1080, offline fallback, QR scan destination, form submission and email receipt, payment status, broken image behavior.
- Record commit SHA, deployment URL, screenshot proof and rollback.
- Do not claim deployed until HTTP checks and user acceptance on actual kiosk.
