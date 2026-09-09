# Corporate inquiry acceptance check

Prepared 2026-09-09 on `fix/corporate-form-success-validation`, based on
`eaafcc13e6e96b0ff99ad6110a5077a3def0eec6` (the previously checked site code).

## Cause and change

The form posts to FormSubmit's `/ajax/` endpoint. Previously every HTTP-success
response containing parseable JSON reset the form, displayed success and pushed
`corporate_inquiry_form_submit`, even when the JSON denied acceptance.

The handler now requires an HTTP-success response and an explicit `success`
value of boolean `true` or the exact string `"true"`. Other values, including
`false`, `"false"`, missing flags and malformed JSON, take the existing error path.
Fields are only reset after acceptance. The existing texts and event name remain
unchanged. A synchronous in-flight guard supplements the disabled button and
stays active until response parsing and result handling finish.

## Provider documentation and its limits

Checked the official sources on 2026-09-09:

- [AJAX documentation](https://formsubmit.co/ajax-documentation) identifies the
  endpoint, JSON response handling and Fetch/Axios/jQuery examples.
- Its linked [official Fetch example](https://gist.github.com/kesarawimal/53d4308a8234638b88275225c32a11b6)
  parses JSON and logs it; it does **not** define success or failure payloads.
- [General API documentation](https://formsubmit.co/api-documentation) demonstrates
  boolean `success: true`, but for API-key/submission-archive endpoints, not the
  AJAX form-acceptance endpoint. Those response examples are not an AJAX contract.

The public official documentation inspected does not provide a complete AJAX
acceptance/rejection schema. We therefore cannot label `success:false` or its
string equivalent as an officially documented AJAX failure fixture. They are
explicit-negative regression cases. The controlled endpoint check below now confirms the exact string `"true"`
for this AJAX endpoint. Boolean `true` remains supported as an explicit positive
value shown in the general API documentation, not as a claimed AJAX specification. No truthiness coercion is used; an unknown response fails closed.

## Controlled AJAX endpoint check (completed)

With explicit user authorization, one POST was made on 2026-09-09 at
09:47:48?09:47:50 UTC to the existing AJAX endpoint and configured DokiPoki
recipient. The request used multipart/form-data, the existing form settings,
synthetic details, and the subject/message prefix `TECHNINIS TESTAS ? IGNORUOTI`.
Test ID: `DP-FORM-A8F27E5-20260909-01`. Automatic retries and redirects were disabled.
No browser, Google tags or analytics requests were involved.

Observed response:

- HTTP status: **200**.
- Content-Type: `text/html; charset=UTF-8` (despite the body containing JSON).
- Body: `{"success":"true","message":"The form was submitted successfully."}`.
- Both `success` and `message` are strings; body length was 67 bytes.
- Raw-body SHA-256: `828f1512573108b6165700fd4bd378c91a6ee04b9d30bd35b7e323c40f66eed1`.

The existing patch accepts this exact string-success response. No production
code adjustment was needed. The sanitized response is saved in
`scripts/fixtures/formsubmit-ajax-accepted.json` and covered by a regression test.
The code deliberately does not require an application/json Content-Type before
parsing JSON, and still rejects explicit failure or missing acceptance flags.

The official AJAX documentation still does not specify a complete response
schema; this is direct observed endpoint evidence, not a new documentation claim.
No failure request was sent, and the single submission was not retried.

**Email delivery remains unverified.** The available mailbox connector is not the
configured recipient mailbox, so receipt was not checked. Provider acceptance is
not proof of inbox delivery. No technical blocker remains for this narrow patch
based on the observed response and isolated tests. The site has not been published.
The audit did not establish that the original bug caused lost inquiries.

## Isolated regression tests

Run from the repository:

```sh
node --test scripts/corporate-inquiry-form.test.cjs
```

Requires Node.js with the built-in test runner; no packages or infrastructure
were added. The actual browser script is executed in a VM with fake DOM controls
and mocked fetch/FormData. Google tags and network clients are not loaded.

15 tests passed (including the exact captured AJAX acceptance response):

- explicit boolean and string acceptance: one existing event, success, reset;
- HTTP 200 with boolean/string rejection, absent/null/invalid acceptance:
  no success/event, preserved inputs, successful retry;
- HTTP, network and JSON errors: preserved inputs and successful retry;
- invalid fields: no request;
- repeated submits while the request is pending: only one request/event;
- repeated submit while JSON parsing is pending: lock remains held.

The handler tests remain isolated. The separately authorized single POST confirms
the provider acceptance response only, not email delivery or production analytics
ingestion. No deployment,
Ads/GA4/GTM mutation, analytics identifiers, UTM fields, visual or text changes
are included. Pre-existing untracked `test-results/` was not modified or staged.
