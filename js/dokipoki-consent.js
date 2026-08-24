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

  function openConsentPreferences(event) {
    if (event) {
      event.preventDefault();
    }

    if (window.klaro && typeof window.klaro.show === 'function') {
      window.klaro.show(undefined, true);
    }

    return false;
  }

  function addPreferencesButton() {
    if (document.querySelector('[data-consent-preferences]')) {
      return;
    }

    var button = document.createElement('button');
    button.type = 'button';
    button.className = 'dp-consent-preferences';
    button.setAttribute('data-consent-preferences', '');
    button.textContent = 'Slapukų nustatymai';
    button.addEventListener('click', openConsentPreferences);
    document.body.appendChild(button);
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
        decline: 'Atmesti nebūtinus',
        ok: 'Priimti visus',
        save: 'Išsaugoti',
        consentNotice: {
          description: 'Nebūtini slapukai įjungiami tik su jūsų sutikimu.',
          learnMore: 'Valdyti pasirinkimus'
        },
        consentModal: {
          description: 'Naudojame būtinus slapukus svetainei veikti. Čia galite pasirinkti, kokius analitikos ir reklamos slapukus leidžiate naudoti.',
          title: 'Slapukų nustatymai'
        },
        purposeItem: {
          service: 'paslauga',
          services: 'paslaugos'
        },
        purposes: {
          functional: {
            title: 'Būtini',
            description: 'Reikalingi svetainei ir slapukų pasirinkimui išsaugoti.'
          },
          analytics: {
            title: 'Analitika',
            description: 'Padeda suprasti svetainės lankomumą ir pagerinti turinį.'
          },
          marketing: {
            title: 'Reklama',
            description: 'Naudojama Google Ads matavimui ir reklamos nustatymams.'
          }
        },
        service: {
          disableAll: {
            title: 'Įjungti arba išjungti visas paslaugas',
            description: 'Naudokite jungiklį visoms nebūtinoms paslaugoms pakeisti.'
          },
          required: {
            title: 'visada reikalinga',
            description: 'Šios paslaugos negalima išjungti.'
          },
          purpose: 'Tikslas',
          purposes: 'Tikslai'
        }
      }
    },
    services: [
      {
        name: 'essential',
        title: 'Butini svetaines slapukai',
        purposes: ['functional'],
        required: true
      },
      {
        name: 'analytics',
        title: 'Analitika',
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
    document.addEventListener('DOMContentLoaded', addPreferencesButton);
  } else {
    addPreferencesButton();
  }
}());
