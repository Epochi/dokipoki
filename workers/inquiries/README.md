# Website inquiry gateway

This server component replaces the new short form's dependency on FormSubmit.
It uses a private service binding to WebsiteInquiryMailer in the existing
dokipoki-os-portal Worker. Credentials never leave that service. The private
mailer is prepared in portal PR 12; its production deployment currently requires
explicit owner approval following an automatic approval-review rejection.

No deployment should be reported as completed until the mailer and gateway are
deployed, a synthetic browser submission succeeds, and the actual message is
found in the owner's mailbox.

## Bounds

- Allowed browser origins: production website, the named HTTPS content preview,
  and the local 127.0.0.1:4177 preview.
- POST multipart only, body at most 8192 bytes; fixed field mapping; honeypot.
- 20 requests/minute/IP/location; at most 200 mail attempts per UTC day.
- Sender and recipient fixed in the private mailer to info@dokipoki.lt.
- A SQLite-backed Durable Object retains only reference/hash/state/timestamp.
  Contact and inquiry contents are not persisted in it or logged.
- Persistent receipt state prevents concurrent, replayed or uncertain sends from
  duplicating email. Definite pre-send failures permit retry.
- Daily cleanup retains approximately 7–8 days. New traffic cannot postpone it.
- A message is accepted only after Gmail returns a message ID. API response to
  the browser is only success: true; no mailbox message ID or secret is exposed.

This is an inquiry receiver, not a public mail-sending API or a booking system.
Legacy Christmas/corporate forms are unchanged.

## Deployment sequence

1. Obtain the requested production-portal approval and deploy portal PR 12.
2. Deploy using the existing account and workers/inquiries/wrangler.jsonc.
3. Rebuild the HTTPS content preview with analytics disabled and noindex intact.
4. Submit one clearly marked synthetic inquiry with Google collection blocked.
   Verify the form response and the separately read mailbox message.
5. Publish website PR 32 only after that delivery check succeeds.

No DNS routes, MX records or account billing limits are changed. The gateway's
dry-run bundle is 7.86 KiB (2.71 KiB gzip). One accepted inquiry adds three Google
HTTP calls in the private mailer and no portal DB queries. The daily bound also
bounds those calls; local tests do not establish whole-system capacity.
