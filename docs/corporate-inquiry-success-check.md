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
explicit-negative regression cases. Accepting exact string `"true"` as well as
boolean `true` is a narrow compatibility choice, not a claimed official AJAX
specification. No truthiness coercion is used; an unknown response fails closed.

Before publication, the remaining provider-specific check is confirmation of
this AJAX response contract from existing legitimate response evidence or the
provider. No real submission was made to obtain that evidence. A positive result
is an acceptance signal, not proof of email delivery. The audit did not establish
that the original bug caused lost inquiries.

## Isolated regression tests

Run from the repository:

```sh
node --test scripts/corporate-inquiry-form.test.cjs
```

Requires Node.js with the built-in test runner; no packages or infrastructure
were added. The actual browser script is executed in a VM with fake DOM controls
and mocked fetch/FormData. Google tags and network clients are not loaded.

14 tests passed:

- explicit boolean and string acceptance: one existing event, success, reset;
- HTTP 200 with boolean/string rejection, absent/null/invalid acceptance:
  no success/event, preserved inputs, successful retry;
- HTTP, network and JSON errors: preserved inputs and successful retry;
- invalid fields: no request;
- repeated submits while the request is pending: only one request/event;
- repeated submit while JSON parsing is pending: lock remains held.

These are isolated handler tests, not end-to-end confirmation of provider
acceptance, email delivery or production analytics ingestion. No deployment,
Ads/GA4/GTM mutation, analytics identifiers, UTM fields, visual or text changes
are included. Pre-existing untracked `test-results/` was not modified or staged.
