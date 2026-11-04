(function (root) {
  'use strict';
  function accepted(result) {
    return !!result && (result.success === true || result.success === 'true');
  }
  function contactType(value) {
    var contact = value.trim();
    if (contact.length <= 120 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact)) return 'email';
    var digits = contact.replace(/\D/g, '');
    if (/^\+?[\d\s().-]+$/.test(contact) && digits.length >= 7 && digits.length <= 15) return 'phone';
    return null;
  }
  function channelFor(pageUrl, referrer) {
    try {
      var current = new URL(pageUrl);
      if (['gclid', 'dclid', 'gbraid', 'wbraid'].some(function (key) { return current.searchParams.has(key); })) return 'paid';
      var medium = (current.searchParams.get('utm_medium') || '').toLowerCase();
      if (['cpc', 'ppc', 'paid', 'paid_search', 'paid_social'].indexOf(medium) !== -1) return 'paid';
      if (medium === 'email') return 'email';
      if (!referrer) return 'direct_or_unknown';
      var from = new URL(referrer);
      if (from.hostname === current.hostname) return 'unknown_internal';
      if (/^(?:www\.)?(?:google\.(?:com|lt|de|fr|co\.uk|com\.au)|bing\.com|duckduckgo\.com|search\.yahoo\.com)$/.test(from.hostname)) return 'organic_search';
      return 'referral';
    } catch (_) { return 'direct_or_unknown'; }
  }
  if (typeof module === 'object' && module.exports) module.exports = { accepted: accepted, contactType: contactType, channelFor: channelFor };
  if (!root.document) return;
  var document = root.document;
  var storageKey = 'dokipoki_inquiry_entry_v1';
  var firstPage = { channel: channelFor(root.location.href, document.referrer), path: root.location.pathname, at: Date.now() };
  function analyticsConsent() {
    try { return !!root.klaro && root.klaro.getManager().getConsent('analytics') === true; } catch (_) { return false; }
  }
  function attribution() {
    if (!analyticsConsent()) return firstPage;
    try {
      var saved = JSON.parse(root.sessionStorage.getItem(storageKey) || 'null');
      if (saved && Date.now() - saved.at >= 0 && Date.now() - saved.at < 30 * 60 * 1000 &&
          ['organic_search', 'paid', 'email', 'referral', 'direct_or_unknown', 'unknown_internal'].indexOf(saved.channel) !== -1 &&
          /^\/[a-zA-Z0-9/_-]*$/.test(saved.path)) return saved;
      root.sessionStorage.setItem(storageKey, JSON.stringify(firstPage));
    } catch (_) { /* The inquiry still works when storage is unavailable. */ }
    return firstPage;
  }
  root.addEventListener('pagehide', function () {
    if (analyticsConsent()) attribution();
    else { try { root.sessionStorage.removeItem(storageKey); } catch (_) {} }
  });
  document.querySelectorAll('[data-quick-inquiry]').forEach(function (form) {
    var date = form.querySelector('[data-inquiry-date]');
    var unknown = form.querySelector('[data-inquiry-date-unknown]');
    var city = form.querySelector('[data-inquiry-city]');
    var contact = form.querySelector('[data-inquiry-contact]');
    var program = form.querySelector('[data-inquiry-program]');
    var character = form.querySelector('[data-inquiry-character]');
    var status = form.querySelector('[data-inquiry-status]');
    var button = form.querySelector('button[type="submit"]');
    var busy = false;
    var serviceId = form.dataset.serviceId;
    var requestReference = reference();
    var now = new Date();
    date.min = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
    function reference() { return root.crypto && root.crypto.randomUUID ? root.crypto.randomUUID() : Date.now().toString(36) + '-' + Math.random().toString(36).slice(2); }
    function message(text, kind) {
      status.textContent = text;
      status.classList.toggle('is-success', kind === 'success');
      status.classList.toggle('is-error', kind === 'error');
    }
    function syncDate() {
      date.disabled = unknown.checked;
      date.required = !unknown.checked;
      date.setCustomValidity('');
    }
    function emit(name) {
      try {
      if (!analyticsConsent() || typeof root.gtag !== 'function' || !/^G-[A-Z0-9]+$/.test(form.dataset.analyticsId || '')) return;
      var canonical = document.querySelector('link[rel="canonical"]');
      // Only fixed page/service identifiers and an enumerated channel reach GA4.
      // Contact, date, city, free text, request reference and query strings never do.
      root.gtag('event', name, {
        send_to: form.dataset.analyticsId,
        form_id: 'quick_inquiry_' + form.dataset.scope,
        service_id: /^[a-z0-9_-]+$/.test(serviceId || '') ? serviceId : 'unspecified',
        inquiry_channel: attribution().channel,
        page_location: canonical ? canonical.href.split(/[?#]/)[0] : form.dataset.siteOrigin + form.dataset.pagePath,
        page_referrer: ''
      });
      } catch (_) { /* Analytics must never change the result of an accepted inquiry. */ }
    }
    unknown.addEventListener('change', syncDate);
    [date, city, contact].forEach(function (field) {
      field.addEventListener('input', function () { field.setCustomValidity(''); field.removeAttribute('aria-invalid'); });
    });
    document.querySelectorAll('[data-quick-inquiry-open]').forEach(function (link) {
      link.addEventListener('click', function () {
        if (link.dataset.inquiryProgram) program.value = link.dataset.inquiryProgram;
        if (link.dataset.inquiryService) serviceId = link.dataset.inquiryService;
        var context = form.closest('section').querySelector('[data-inquiry-context]');
        if (context) context.textContent = character.value || program.value;
        emit('inquiry_cta_click');
        root.setTimeout(function () { date.disabled ? city.focus() : date.focus(); }, 0);
      });
    });
    button.addEventListener('click', function () { if (!busy) emit('inquiry_submit_click'); });
    syncDate();
    attribution();
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      if (busy) return;
      message('', '');
      city.setCustomValidity(city.value.trim() ? '' : 'Įrašykite miestą.');
      var type = contactType(contact.value);
      contact.setCustomValidity(type ? '' : 'Įrašykite galiojantį el. paštą arba telefono numerį.');
      if (!unknown.checked && (!date.value || date.value < date.min)) date.setCustomValidity('Pasirinkite šventės datą arba pažymėkite, kad data dar derinama.');
      var invalid = [date, city, contact].find(function (field) { return !field.disabled && !field.checkValidity(); });
      if (invalid) {
        invalid.setAttribute('aria-invalid', 'true');
        message(invalid.validationMessage || 'Užpildykite trūkstamą informaciją.', 'error');
        invalid.focus();
        return;
      }
      if (form.querySelector('[name="_honey"]').value) { message('Užklausos išsiųsti nepavyko. Susisiekite kitu žemiau nurodytu būdu.', 'error'); return; }
      var payload = new FormData(form);
      payload.set('Šventės data', unknown.checked ? 'Data dar derinama' : date.value);
      payload.set('Miestas', city.value.trim());
      payload.set('Kontaktas', contact.value.trim());
      payload.set('Užklausos numeris', requestReference);
      payload.set('Užklausos kanalas', attribution().channel);
      payload.set('Pradinis puslapis', attribution().path);
      payload.set('_subject', 'DOKI POKI užklausa - ' + (unknown.checked ? 'data derinama' : date.value) + ' - ' + (character.value || program.value));
      if (type === 'email') { payload.set('email', contact.value.trim()); payload.set('_replyto', contact.value.trim()); }
      else payload.set('Telefonas', contact.value.trim());
      busy = true;
      button.disabled = true;
      button.textContent = 'Siunčiama...';
      var controller = new AbortController();
      var timeout = root.setTimeout(function () { controller.abort(); }, 35000);
      fetch(form.action, { method: 'POST', body: payload, headers: { Accept: 'application/json' }, signal: controller.signal })
        .then(function (response) { if (!response.ok) throw new Error('Provider rejected request'); return response.json(); })
        .then(function (result) {
          if (!accepted(result)) throw new Error('Provider did not confirm acceptance');
          emit('generate_lead');
          var selectedProgram = program.value;
          var selectedCharacter = character.value;
          form.reset();
          program.value = selectedProgram;
          character.value = selectedCharacter;
          syncDate();
          requestReference = reference();
          message('Ačiū! Užklausą gavome. Susisieksime Jūsų nurodytu kontaktu. Datos rezervaciją patvirtinsime atskirai.', 'success');
          status.focus();
        })
        .catch(function () { message('Negavome užklausos priėmimo patvirtinimo. Pabandykite dar kartą arba susisiekite per Messenger ar telefonu.', 'error'); })
        .finally(function () { root.clearTimeout(timeout); busy = false; button.disabled = false; button.textContent = 'Patikrinti datą ir gauti pasiūlymą'; });
    });
  });
}(typeof window !== 'undefined' ? window : globalThis));
