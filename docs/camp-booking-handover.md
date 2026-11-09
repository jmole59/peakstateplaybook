# Holiday Camps live-booking handover

## Current implementation
Neutral entry for all Book buttons, with no camp or price selected. Choose one age group, then any mix of full blocks and individual days. All days in a block upgrade automatically to its full-block price; all three complete blocks receive the A$600 Summer Pass. Server recalculates every order. One Stripe Checkout uses only the supplied live Price IDs in the central `camp-config.mjs`.

Private Hub `/camps` shows attendance by date/group and booking details. `/camp-setup` securely accepts a restricted live API key and webhook signing secret, verifies the Prices, and manages the single venue value. Secrets are encrypted in the database with a platform-held encryption key; they are never returned to the browser. Saving configuration keeps checkout closed. Explicit owner activation opens it after configuration.

Venue defaults to “To be confirmed”. Changing it once in camp setup updates the camps page, booking page, confirmation page and future emails. No court booking is required to activate checkout.

## Stripe connection still required
The live Prices were verified in the connected PSP account. A server-side restricted live key is still required, with Checkout Sessions read/write, Prices read, PaymentIntents read and Charges read. Do not paste keys in chat. Enter them in the private setup screen.

Webhook: https://peakstateplaybook.com/.netlify/functions/camp-webhook
Events: checkout.session.completed, checkout.session.async_payment_succeeded, checkout.session.async_payment_failed, checkout.session.expired, charge.refunded.
API version: 2026-09-30.endive.

Automatic approval review blocked native creation of this webhook, citing the previous test-only instruction. The later user brief explicitly requests live IDs and publishing. Do not bypass the review rejection; obtain explicit clarification/approval before retrying the native webhook creation.

## Capacity and lifecycle
D1 transaction + insert trigger enforce nine places per date/group. Full block reserves all dates atomically. Holds are made before Checkout and confirmed only by verified Stripe payment events. Checkout expires after one hour; maintenance reconciles every ten minutes in production. Failed/expired sessions release holds. Uncertain session creation responses remain held until recovered from Stripe; a complete authoritative session search after two hours can release an unmatched hold. Full refunds release all places; partial refund amounts are recorded without cancelling dates.

Payment verification checks live mode, booking ID, session ID, AUD total and every reserved date. The success page does not grant bookings. Payment events are replay-safe. Signed booking links connect the short athlete form to its paid booking. Parent email is taken from verified Checkout rather than re-entered. Optional photo consent is separate. Medical information remains private and is absent from Stripe metadata and emails.

Confirmation emails have durable pending/retry/sent state, deterministic Resend idempotency keys and a lease to avoid duplicate concurrent sends. Automatic retries stop after 23 hours and flag review. Existing server-side Resend credentials are reused. Emails are transactional and include dates, time, venue, paid amount and the signed Complete Athlete Details link.

## Validation
Local automated coverage includes exact price combinations, automatic full-block conversion, single-line Summer Pass checkout mapping, rollback on capacity failure, final-seat contention, idempotent retries, paid-event replays, unpaid/expired/refunded handling, consent validation, encrypted configuration and proxy origin/mode guards. Both builds pass. The Hub has pre-existing unrelated TypeScript errors; no camp-route errors were introduced.

Still pending before declaring the end-to-end checklist complete: server key + webhook connection, an owner-completed live payment, actual webhook delivery, confirmation email delivery and post-payment form completion. Do not claim these passed. Keep the public site draft until these required checks or an explicit revised launch instruction are resolved. No payment was made by the assistant.
