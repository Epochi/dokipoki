# Organic inquiry changes

The birthday page explains the classical activity alternatives and three Rumi
variants, duration and performer count. Public pricing follows the owner's
instruction: Vilnius from 100 EUR; other amounts are quoted individually.
December pricing is individual. The event example reuses the existing Rumi
gallery without inventing a venue, date or client testimonial.

The Christmas hub separates home visits (up to 40 minutes, owner confirmed),
kindergarten Santa-and-elves (one hour) and bespoke corporate children's events.
The kindergarten and corporate URLs keep their distinct purposes. No URLs were
changed. Six relevant character pages and the Rumi program link to the birthday
comparison while retaining direct contact.

## Form and measurement

Owner's visual direction: contact actions and offer/navigation choices added in
this change use the site's existing button styles, rather than bare blue text
links. Homepage buttons align with a visible gap on desktop and stack on mobile.
The button styling preserves anchor destinations and inquiry-selection data.

The shared form needs a celebration type, approximate number of children, date
or an undecided-date checkbox, city, and one email or phone contact. Birthday and
Rumi pages preselect birthday; other pages ask the visitor to choose. The current
program or character is transmitted automatically. Type and child count are
validated and forwarded to the prepared mailer, never to analytics. The direct
contact question is explicitly centered at desktop and phone widths.
The endpoint is configured in _data/inquiry.yml. The replacement gateway sends
through a private Cloudflare service binding to the portal's existing Gmail
authorization. Sender and recipient are fixed to info@dokipoki.lt; no secrets
are copied to the public site. Canonical source is included explicitly.
Messenger and phone remain available. A provider error retains the entered
values and allows retry; a pending request cannot be submitted twice.

The generate_lead event is emitted only after an HTTP-success response containing
success: true or success: "true". The replacement gateway returns true only after
Gmail returns a message ID. It means provider acceptance, not a qualified
inquiry, delivered email or confirmed booking. The inquiry_cta_click and
inquiry_submit_click events are separate interactions. Google's automatic
form_start/form_submit events must not be used as successful inquiries.

The fixed GA4 destination is configured in _data/inquiry.yml. Analytics requires
the existing Klaro analytics consent. Only fixed service/form identifiers, an
enumerated entry channel and a canonical URL without query strings are sent.
Date, city, contact, free text and the request reference are excluded.

With consent, session storage preserves the entry page/channel across internal
navigation for up to 30 minutes. Without consent, no attribution is stored; only
the current page's referrer is available in the emailed inquiry. This is a limited
attribution aid, not a replacement for GA4 session attribution.

## Verification

- Jekyll production content builds successfully. The local Windows build uses
  an ignored Sass-path compatibility helper; production configuration is unchanged.
- Website unit suites pass 29 checks, including legacy corporate
  acceptance/error behavior and the new gateway's parsing, CORS, rate limiting,
  deduplication, uncertain-send handling and bounded receipt expiry.
- The quick-inquiry browser suite tests intercepted submissions, rejection,
  retry, delayed JSON lock, date validation, one phone/email, selected context,
  consent, cross-page organic attribution and analytics payload privacy.
- Responsive review at 320, 390, 768 and 1440 pixels; links, fragment targets,
  canonical URLs, robots metadata, JSON-LD and sitemap inclusion checked.
- GSC URL Inspection returned PASS for the existing home, birthday, Christmas
  and Rumi URLs, with indexing allowed and matching Google canonical URLs.
  That checks the current live version; unpublished preview content cannot yet
  have been recrawled by Google.
- A separate check loaded the actual Google tag and intercepted its collection
  requests: the new lead and click events reached GA4 transport without inquiry
  PII. Those requests were stopped before Google; no test conversions were sent.
- Initial FormSubmit delivery remains unverified: the local provider request timed out. A
  one-time GitHub-hosted connectivity check returned a Cloudflare challenge (403)
  and stopped without posting a test inquiry. The test workflow was removed.
  No received test email was found. Do not report this as a delivered inquiry.
  After adding _url, a controlled browser test again made a POST but received no
  provider response (net::ERR_FAILED); the UI kept the inputs and showed failure.
  The owner clarified that they had not submitted the form themselves, so their
  earlier answer is not evidence of a failed manual-browser submission.
  The owner subsequently submitted the form from the local preview and received
  its error message. A separately hosted HTTPS preview test also failed.

Replacement mail delivery is prepared but not deployed. Portal PR
[12](https://github.com/infodokipoki/dokipoki-os-portal/pull/12) adds only a private
named RPC entrypoint with a fixed mailbox. Its 25 isolated mailer checks,
typecheck and production build passed. Automatic approval review rejected the
production portal deployment and required explicit owner approval; no bypass
was attempted. A live Gmail receipt is still required after that approval.

The gateway persists only receipt state, a payload hash and timestamps, not
contact or inquiry contents. Identical retries share one send; unknown outcomes
cannot silently send twice. Daily cleanup retains roughly 7–8 days, with at most
200 send attempts per UTC day and 20 requests per minute per IP/location.
These are bounded safeguards, not a guarantee against every abuse pattern.
The SQLite-backed namespace and binding do not change account billing limits.
No database queries are added to the portal's existing UI requests.

HTTPS content preview:
https://dokipoki-review.dokipoki-os-portal.workers.dev/
It is blocked from indexing by both HTTP headers and robots.txt and has analytics
disabled. The production website remains on GitHub Pages.

The existing corporate unit-test DOM stub was updated to match the unchanged
shared Christmas/corporate form selector. No production legacy form logic changed.

## Baseline and 28-day evaluation

Before edits, private GSC Performance and Generative AI exports were preserved in
.seo/gsc-data/baseline-2026-11-04/ (ignored, not published). An affected-page
subset and a private review worksheet accompany the raw exports. Missing page
rows are unknown, not assumed zero.

Evaluate 28 complete days after publication, using finalized GSC dates (allow for
reporting lag), the preceding 28 days, and the equivalent prior-year period.
Separate Christmas pages from evergreen birthdays, branded from commercial
non-branded queries, and mobile from desktop. Where an exact URL did not exist
last year, use the comparable service group and disclose that limitation.

Primary results: organic search clicks to relevant pages, real qualified organic
inquiries, and staff-confirmed bookings. Qualification requires a real event,
serviceable location and reachable customer; an undecided date alone does not
disqualify it. Exclude tests, spam and duplicates.

AI impressions and average position are supporting visibility measures only.
AI impressions are already represented within overall Search performance; do
not add them to total impressions or infer AI clicks/orders from them.

There is currently no verified CRM/order-to-organic attribution integration.
The emailed request reference and channel can support a manual status ledger;
they do not automatically connect a booking to GA4. Phone/Messenger outcomes
also need manual attribution. Until those gaps are closed, report accepted leads,
qualified inquiries and bookings separately, with attribution confidence.

Expect clearer commercial snippets and service comparisons to attract more
relevant clicks, and fewer form fields to improve inquiry completion. This is a
testable expectation, not a ranking, traffic or revenue guarantee.
