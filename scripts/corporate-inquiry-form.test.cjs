'use strict';
// Run: node --test scripts/corporate-inquiry-form.test.cjs
// The browser script runs in a VM with a fake DOM and mocked fetch/FormData.
// No Google tags, network clients, provider requests or email delivery are loaded.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');
const source = fs.readFileSync(path.join(__dirname, '../js/corporate-inquiry-form.js'), 'utf8');
const flush = () => new Promise(resolve => setImmediate(resolve));
function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
function harness() {
  function field(value) {
    const classes = new Set();
    return { value, valid: true, textContent: '', innerHTML: '', disabled: false,
      classList: { add: x => classes.add(x), remove: (...xs) => xs.forEach(x => classes.delete(x)), contains: x => classes.has(x) },
      checkValidity() { return this.valid; }, setCustomValidity() {}, focus() {}, addEventListener() {} };
  }
  const name = field('Audit name'), email = field('audit@example.invalid'), company = field('Audit company');
  const date = field('2026-12-10'), dateHidden = field('2026-12-10'), note = field('Keep this inquiry');
  const reply = field(''), subject = field(''), button = field(''), message = field('');
  const inputs = [name, email, company, date, dateHidden, note, reply, subject];
  const selectors = {
    'button[type="submit"]': button, '.corporate-inquiry-form__validation': message,
    'input[name="_replyto"]': reply, 'input[name="email"]': email,
    'input[name="Įmonės pavadinimas"]': company, '[data-subject-field]': subject,
    '[data-date-field]': date, '[data-date-submit]': dateHidden
  };
  let onSubmit, resetCount = 0;
  const form = {
    action: 'https://provider.invalid/never-sent',
    querySelector: selector => selectors[selector] || null,
    querySelectorAll: selector => selector === '[required]' ? [name, email, date, note] : inputs,
    addEventListener(type, listener) { assert.equal(type, 'submit'); onSubmit = listener; },
    getAttribute(key) { return key === 'data-success-message' ? 'Accepted' : 'Try again'; },
    reset() { resetCount++; inputs.forEach(x => { x.value = ''; }); }
  };
  const window = { dataLayer: [] }, requests = [];
  vm.runInNewContext(source, {
    window, document: { querySelector: () => form },
    fetch(url, options) { const pending = deferred(); requests.push({ url, options, pending }); return pending.promise; },
    FormData: class { constructor() { this.values = inputs.map(x => x.value); } }
  });
  return { button, message, requests, name, email, date, dateHidden, note,
    submit() { onSubmit({ preventDefault() {} }); },
    values() { return [name, email, date, dateHidden, note].map(x => x.value); },
    events: () => window.dataLayer,
    resets: () => resetCount
  };
}
function acceptedOnce(h) {
  assert.equal(h.resets(), 1);
  assert.deepEqual(JSON.parse(JSON.stringify(h.events())), [{ event: 'corporate_inquiry_form_submit' }]);
  assert.equal(h.message.classList.contains('is-success'), true);
  assert.equal(h.button.disabled, false);
}
for (const success of [true, 'true']) {
  test(`explicit acceptance ${JSON.stringify(success)} emits exactly one existing event`, async () => {
    const h = harness(); h.submit();
    h.requests[0].pending.resolve({ ok: true, json: async () => ({ success }) }); await flush();
    acceptedOnce(h);
    assert.ok(h.values().every(value => value === ''));
  });
}
for (const payload of [{ success: false }, { success: 'false' }, {}, null, { success: 1 }, { success: 'TRUE' }]) {
  test(`HTTP 200 rejection ${JSON.stringify(payload)} preserves inputs and permits retry`, async () => {
    const h = harness(), before = h.values(); h.submit();
    h.requests[0].pending.resolve({ ok: true, json: async () => payload }); await flush();
    assert.equal(h.resets(), 0); assert.equal(h.events().length, 0);
    assert.deepEqual(h.values(), before); assert.equal(h.button.disabled, false);
    assert.equal(h.message.classList.contains('is-success'), false);
    assert.equal(h.message.classList.contains('is-error'), true);
    h.submit(); assert.equal(h.requests.length, 2);
    h.requests[1].pending.resolve({ ok: true, json: async () => ({ success: true }) }); await flush();
    acceptedOnce(h);
  });
}
for (const failure of ['http', 'network', 'invalid-json']) {
  test(`${failure} error preserves inputs, emits nothing and allows successful retry`, async () => {
    const h = harness(), before = h.values(); h.submit();
    if (failure === 'network') h.requests[0].pending.reject(new TypeError('Mock network failure'));
    else h.requests[0].pending.resolve({ ok: failure !== 'http', json: async () => { throw new SyntaxError('Mock invalid JSON'); } });
    await flush();
    assert.deepEqual(h.values(), before); assert.equal(h.resets(), 0); assert.equal(h.events().length, 0);
    assert.equal(h.message.classList.contains('is-success'), false); assert.equal(h.button.disabled, false);
    h.submit(); assert.equal(h.requests.length, 2);
    h.requests[1].pending.resolve({ ok: true, json: async () => ({ success: 'true' }) }); await flush();
    acceptedOnce(h);
  });
}
test('invalid fields make no request or success event', () => {
  const h = harness(); h.name.valid = false; h.submit();
  assert.equal(h.requests.length, 0); assert.equal(h.events().length, 0); assert.equal(h.resets(), 0);
});
test('a second submit while fetch is pending cannot create a second request or event', async () => {
  const h = harness(); h.submit(); assert.equal(h.button.disabled, true);
  h.submit(); h.submit(); assert.equal(h.requests.length, 1); assert.equal(h.events().length, 0);
  h.requests[0].pending.resolve({ ok: true, json: async () => ({ success: true }) }); await flush();
  acceptedOnce(h);
});
test('the submission lock remains held while response JSON is pending', async () => {
  const h = harness(), json = deferred(); h.submit();
  h.requests[0].pending.resolve({ ok: true, json: () => json.promise }); await flush();
  h.submit(); assert.equal(h.requests.length, 1); assert.equal(h.button.disabled, true);
  assert.equal(h.events().length, 0); assert.equal(h.resets(), 0);
  json.resolve({ success: true }); await flush(); acceptedOnce(h);
});
