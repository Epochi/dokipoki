(function () {
  var CONSENT_EVENT_NAME = 'dokipoki_consent_update';
  var consentUpdateTimer = null;

  function getManager() {
    if (!window.klaro || typeof window.klaro.getManager !== 'function') {
      return null;
    }

    try {
      return window.klaro.getManager();
    } catch (error) {
      return null;
    }
  }

  function hasConsent(serviceName) {
    var manager = getManager();

    if (!manager) {
      return false;
    }

    return manager.getConsent(serviceName) === true;
  }

  function consentValue(isGranted) {
    return isGranted ? 'granted' : 'denied';
  }

  function updateGoogleConsent() {
    var analyticsGranted = hasConsent('analytics');
    var adsGranted = hasConsent('google-ads');
    var update = {
      analytics_storage: consentValue(analyticsGranted),
      ad_storage: consentValue(adsGranted),
      ad_user_data: consentValue(adsGranted),
      ad_personalization: consentValue(adsGranted)
    };

    window.dataLayer = window.dataLayer || [];

    if (typeof window.gtag === 'function') {
      window.gtag('consent', 'update', update);
    } else {
      window.dataLayer.push(['consent', 'update', update]);
    }

    window.dataLayer.push(Object.assign({ event: CONSENT_EVENT_NAME }, update));
  }

  function scheduleGoogleConsentUpdate() {
    if (consentUpdateTimer) {
      window.clearTimeout(consentUpdateTimer);
    }

    consentUpdateTimer = window.setTimeout(updateGoogleConsent, 0);
  }

  function normalizeKlaroSwitchStyles() {
    var sliders = document.querySelectorAll('.klaro .cm-list-label .slider');

    sliders.forEach(function (slider) {
      slider.style.setProperty('bottom', 'auto', 'important');
      slider.style.setProperty('display', 'inline-block', 'important');
      slider.style.setProperty('float', 'none', 'important');
      slider.style.setProperty('height', '30px', 'important');
      slider.style.setProperty('left', '0', 'important');
      slider.style.setProperty('line-height', '30px', 'important');
      slider.style.setProperty('margin', '0', 'important');
      slider.style.setProperty('max-height', '30px', 'important');
      slider.style.setProperty('min-height', '30px', 'important');
      slider.style.setProperty('min-width', '50px', 'important');
      slider.style.setProperty('overflow', 'visible', 'important');
      slider.style.setProperty('padding', '0', 'important');
      slider.style.setProperty('position', 'absolute', 'important');
      slider.style.setProperty('right', 'auto', 'important');
      slider.style.setProperty('top', '0', 'important');
      slider.style.setProperty('width', '50px', 'important');
    });
  }

  function watchKlaroSwitchStyles() {
    normalizeKlaroSwitchStyles();

    if (typeof window.MutationObserver !== 'function') {
      return;
    }

    var observer = new MutationObserver(function () {
      normalizeKlaroSwitchStyles();
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true
    });
  }

  function openConsentPreferences(event) {
    if (event) {
      event.preventDefault();
    }

    if (window.klaro && typeof window.klaro.show === 'function') {
      window.klaro.show(undefined, true);
      window.setTimeout(normalizeKlaroSwitchStyles, 0);
    }

    return false;
  }

  function bindPreferencesLinks() {
    var links = document.querySelectorAll('[data-consent-preferences]');

    links.forEach(function (link) {
      if (link.getAttribute('data-consent-preferences-bound') === 'true') {
        return;
      }

      link.setAttribute('data-consent-preferences-bound', 'true');
      link.addEventListener('click', openConsentPreferences);
    });
  }

  window.dokipokiConsent = {
    updateGoogleConsent: updateGoogleConsent,
    openPreferences: openConsentPreferences
  };

  window.klaroConfig = {
    version: 1,
    elementID: 'klaro',
    storageMethod: 'cookie',
    storageName: 'dokipoki_cookie_consent',
    cookieName: 'dokipoki_cookie_consent',
    cookieExpiresAfterDays: 180,
    htmlTexts: false,
    embedded: false,
    groupByPurpose: true,
    acceptAll: true,
    hideDeclineAll: false,
    hideLearnMore: false,
    mustConsent: false,
    noticeAsModal: false,
    disablePoweredBy: true,
    default: false,
    lang: 'lt',
    translations: {
      lt: {
        acceptAll: 'Priimti visus',
        acceptSelected: 'Išsaugoti pasirinkimą',
        close: 'Uždaryti',
        decline: 'Atmesti nebūtinuosius',
        ok: 'Priimti visus',
        save: 'Išsaugoti pasirinkimą',
        consentNotice: {
          description: 'Naudojame būtinuosius slapukus svetainei veikti. Jums sutikus, analitikos ir reklamos slapukai padeda vertinti lankomumą, reklamos veiksmingumą ir pritaikyti reklamą. Galite priimti visus, atmesti nebūtinuosius arba pasirinkti slapukų nustatymus.',
          learnMore: 'Slapukų nustatymai'
        },
        consentModal: {
          description: 'Pasirinkite, ar leidžiate naudoti analitikos ir reklamos slapukus. Būtinieji slapukai visada aktyvūs. Sutikimą bet kada galite pakeisti ar atšaukti paspaudę „Slapukų nustatymai“ svetainės apačioje.',
          title: 'Slapukų nustatymai'
        },
        purposeItem: {
          service: 'paslauga',
          services: 'paslaugos'
        },
        purposes: {
          functional: {
            title: 'Būtinieji slapukai',
            description: 'Užtikrina pagrindines svetainės funkcijas ir išsaugo jūsų slapukų pasirinkimą. Jiems sutikimo nereikia.'
          },
          analytics: {
            title: 'Analitikos slapukai',
            description: '„Google Analytics“ padeda suprasti, kaip lankytojai naudojasi svetaine ir kurie puslapiai lankomi. Šią informaciją naudojame turiniui tobulinti. Aktyvuojami tik jums sutikus.'
          },
          marketing: {
            title: 'Reklamos slapukai',
            description: '„Google Ads“ slapukai naudojami reklamos veiksmingumui matuoti ir reklamai pritaikyti pagal jūsų veiklą. Aktyvuojami tik jums sutikus.'
          }
        },
        service: {
          disableAll: {
            title: 'Visi nebūtinieji slapukai',
            description: 'Vienu jungikliu leiskite arba neleiskite naudoti analitikos ir reklamos slapukų.'
          },
          required: {
            title: 'Visada aktyvi',
            description: 'Ši paslauga būtina svetainės veikimui, todėl jos išjungti negalima.'
          },
          purpose: 'Tikslas',
          purposes: 'Tikslai'
        }
      }
    },
    services: [
      {
        name: 'essential',
        title: 'Būtinieji svetainės slapukai',
        purposes: ['functional'],
        required: true
      },
      {
        name: 'analytics',
        title: 'Google Analytics',
        purposes: ['analytics'],
        default: false,
        cookies: [
          /^_ga(_.*)?$/,
          '_gid',
          '_gat',
          /^__utm/
        ],
        callback: scheduleGoogleConsentUpdate
      },
      {
        name: 'google-ads',
        title: 'Google Ads',
        purposes: ['marketing'],
        default: false,
        cookies: [
          /^_gcl_.*$/,
          /^_gac_.*$/,
          /^_gcl$/,
          'IDE',
          'test_cookie'
        ],
        callback: scheduleGoogleConsentUpdate
      }
    ]
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      bindPreferencesLinks();
      watchKlaroSwitchStyles();
    });
  } else {
    bindPreferencesLinks();
    watchKlaroSwitchStyles();
  }
}());
