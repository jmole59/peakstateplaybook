# Holiday Camps booking system, test-only draft

Public source: `holiday-camps-current-site` / PR 38. Backend: Athlete Hub, new camp tables and routes, isolated from existing athlete records. Both copies of camp-model.mjs must match.

## Completed
- One athlete and age group per booking, editable camp selections and full/day modes.
- Server-authoritative prices. Two blocks add normally. Selecting every day in a block automatically uses its full-block price. All three complete blocks, however selected, receive the $600 Summer Pass.
- One Stripe Checkout Session for the order, with inline price_data. No combination payment links or discount codes.
- Atomic D1 transaction and capacity trigger enforce nine reservations per date, group and environment. Full blocks reserve every included date. SQL failure rolls the entire order back.
- Reservations happen before Checkout. Payment webhooks confirm a reservation, never the return page. Processing payments keep their reservation. Expired/failed sessions release it. Full refunds release dates; partial refund amounts are recorded without cancelling all dates.
- Idempotent order creation, replay-safe payment transitions, signed booking links, short post-payment athlete form and private owner-only attendance view at the Hub's /camps.
- Durable email status and deterministic Resend idempotency keys. Failed emails retry for at most 23 hours automatically; then flag review rather than risk duplicates. Test emails are restricted to CAMP_TEST_EMAIL. Medical notes never appear in email.
- Ten-minute maintenance function reconciles linked held/processing sessions and retries eligible test confirmations. Unlinked holds after an uncertain Stripe response remain held and flagged for review rather than being released unsafely.

## Connection still required before an end-to-end Stripe sandbox test
No test key or test webhook secret was available through the connected Stripe account (live-only PSP account). Checkout is deliberately disabled without them. No live keys are accepted by this implementation.

Hub secrets: CAMP_STRIPE_TEST_KEY (restricted sandbox key with Checkout Sessions write/read, PaymentIntents read, Charges read, Products/Prices permissions needed by inline price_data), CAMP_TEST_WEBHOOK_SECRET, CAMP_LINK_SECRET (random >=32 chars). Hub settings: CAMPS_TEST_ENABLED=true, CAMP_TEST_EMAIL=info@peakstateplaybook.com. Existing RESEND_API_KEY and purchase-ingestion token are reused server-side only.
Netlify preview configuration: CAMPS_TEST_ENABLED=true plus existing PSP_HUB_SERVICE_TOKEN and PSP_PURCHASE_INGESTION_TOKEN. Do not expose these in client code or commit environment files.
Register the sandbox webhook at the preview's /.netlify/functions/camp-webhook for checkout.session.completed, checkout.session.async_payment_succeeded, checkout.session.async_payment_failed, checkout.session.expired, charge.refunded. Put its signing secret in Hub runtime settings. All events are signature-verified at the Hub.
Deploy the new Hub migration and routes before enabling the proxy. Saved backend source does not imply deployed backend. The frontend handles an unconnected backend honestly, with no fabricated counts or successful booking claims.

## Acceptance checks still requiring real sandbox connection
Use test cards in hosted Stripe Checkout. Confirm single checkout for multiple blocks; paid and unpaid return states; webhook replay; last place contention using separate browser sessions; abandoned checkout release; delayed payment success/failure; full and partial refunds; signed form completion; one confirmation to the authorised test address; owner-only roster access. Local automated coverage verifies the pricing matrix, transactional capacity, final-seat contention, rollback, replay, refunds, validation and proxy gate.

## Before opening live bookings
User chose to keep test mode while venue is pending. Confirm court and dates first. Review camp-specific cancellation/terms, arrival and what-to-bring instructions, and emergency-consent wording. The draft references existing site terms; no new cancellation policy has been invented. Launch requires a separate explicit live-mode implementation/configuration, live Stripe key and webhook, separate live capacity and a production-origin gate. Current proxy and backend force test mode and cannot accept live payments. Add public checkout abuse protection before live launch.

## Operational notes
Unlinked held checkouts require owner review: retry the same request ID to recover Stripe's idempotent creation result. Do not manually delete a hold until Stripe confirms no payable session exists. Fully refunded bookings stay in the audit record, but release capacity. Parent details are write-once through the signed form; changes go via info@peakstateplaybook.com. Never put medical notes into Stripe metadata, email or public availability responses.
