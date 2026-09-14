# Velniukų Helovino vakarėlis

Paruošta nuo naujausio `origin/master` commit `e8fba372eff7b0353d9cd50330af900f3057dbc8`. Repozitorijoje nėra `main`; naudotojas patvirtino PR į `master`. Nemerginti savarankiškai.

Puslapis: https://dokipoki.lt/programos/helovino-programa-vaikams/

## Svetainė

- Tikslūs pateikti tekstai, penkios veiklos, 1,5 valandos, vienas arba du Velniukai, be kainų. Papildomos SEO pastraipos nepridėtos, nes pirmenybė teikiama reikalavimui išsaugoti tikslius tekstus.
- Esamas `programa` išdėstymas, kortelių ir DUK formatas. Programų sąraše po Kalėdų sezoninės kortelės ir prieš bendrines programas. Pagrindiniame puslapyje prie esamo Kalėdų bloko, prieš paslaugas.
- Tikra nuotrauka iš `img/personazai/300velniukai.jpg.jpg`: abu raudonai ir juodai apsirengę Velniukai. Nekirpta; WebP 1000, 600 ir 360 px pločio (59 472, 27 762 ir 13 602 baitai). Responsive dydžiai, `object-fit: contain`.
- Meta ir OG tekstai, canonical, index/follow, vienas H1, Service JSON-LD, automatinis `jekyll-sitemap`. DUK JSON-LD nepridėtas, nes esamas DUK naudoja HTML antraštes ir atsakymus.
- CTA pasiekia tame pačiame puslapyje esančią esamos formos realizaciją. Programa užpildyta ir perduodama kartu su užklausos šaltiniu. Bendras `corporate-inquiry-form.js` nekeistas. Sėkmė naudoja vieną esamą `corporate_inquiry_form_submit` įvykį; jokių naujų GA4 / Ads konversijų.

## Patikrinimas

- `bundle check` – priklausomybės įdiegtos.
- `bundle exec jekyll build` – sėkmingas; esami įspėjimai apie neprieinamą GitHub Metadata API ir `faraday-retry`.
- `git diff --check` – sėkmingas. Projektas neturi atskiros lint komandos.
- `node scripts/helovinas-browser.test.cjs` – sėkmingas: 1440, 390 ir 360 px vaizdai, vidinės nuorodos, CTA, meta, canonical, robots, Service JSON-LD, sitemap, nuotraukos, horizontalus persipildymas, formos validacija, nesėkmė ir pakartojimas, apsauga nuo dvigubo siuntimo, vienas sėkmės įvykis. Siuntimas imituojamas, jokie laiškai ar tikros konversijos nesiunčiami. Ekrano vaizdai lokaliame `_preview/`.
- Esamas `node --test scripts/corporate-inquiry-form.test.cjs`: 15 testų nepraeina, nes senas DOM maketas neturi `form.hasAttribute`. Šie testai ir formos JS nepakeisti.
- Esamas `node scripts/kindergarten-inquiry-browser.test.cjs`: patikrina formą ir ekranų dydžius, bet sustoja 109 eilutėje ties sena programų puslapio Kalėdų nuorodos teksto prielaida. Dabartinėje `master` jau naudojama nuoroda į `/kaledos/`. Nesusijęs testas netaisytas.

Naršyklės testui paleisti: aptarnauti `_site` per `python -m http.server 4175 --bind 127.0.0.1 --directory _site`, į `_preview/` įdėti esamas CDN jQuery 3.7.1, migrate 3.4.1 ir 2.1.1 bibliotekas. Playwright galima nurodyti per `PLAYWRIGHT_MODULE`.

## Google Ads

Paskyra `7294988670` (Dokipoki, EUR). API validuotas kampanijos juodraštis; pritaikymui prijungtas įrankis reikalauja vietinio žmogaus patvirtinimo. Vien validacija kampanijos nesukuria.

| Nustatymas | Reikšmė |
|---|---|
| Kampanija | Search \| Helovinas \| 2026 |
| Būsena kuriant | PAUSED |
| Biudžetas | Atskiras 5 €/dieną |
| Bidding | Maximize clicks, CPC ne daugiau kaip 0,80 € |
| Vieta | Vilniaus centras 54.6872, 25.2797, 30 km spindulys |
| Vietovės parinktis | PRESENCE |
| Kalba | Lietuvių, languageConstants/1029 |
| Tinklai | Tik Google Search; partners ir Display išjungti |
| Pabaiga | 2026-11-01 23:59:59 paskyros laiku |
| Grupė | Helovino programa vaikams |
| Skelbimai | Vienas RSA, 11 antraščių ir 4 aprašymai |
| Raktažodžiai | 6 EXACT ir 9 PHRASE |
| Neigiami | 15 kampanijos PHRASE, konfliktų su tiksliniais nerasta |
| Path | helovinas / vaikams |

Tikslūs tekstai ir operacijos yra `helovinas-2026-ads.json`. Antraščių ilgiai: 25, 27, 23, 24, 22, 27, 22, 25, 25, 20, 17. Aprašymų ilgiai: 76, 82, 70, 71. Visi atitinka [Google 30/90/15 simbolių ribas](https://support.google.com/google-ads/answer/7684791).

2026-09-14 paskyroje rasta pirminė `Imoniu renginio forma` konversija (7668547585), bet per LAST_30_DAYS ataskaitą gauti tik Phone Button Click ir Messenger Click rezultatai. Todėl veikiančios pirminės formos konversijos patvirtinti negalima ir naudojamas Maximize clicks. Lokalus formos įvykio testas nepatvirtina produkcinio GTM → Ads duomenų perdavimo.

Paskyros lygmens kontaktinis išteklius `266219001045` (+370 6888 6006) yra ENABLED / ELIGIBLE ir paveldimas. Naujo dublikato nereikia.

**Įrankio apribojimas:** `assetOperation` ir `campaignAssetOperation` atmetamos kaip nepalaikomos. Todėl jos yra tik JSON parengtyje, o ne API validuotame kampanijos juodraštyje. Rankiniu būdu liks prijungti esamus, patikrintus ELIGIBLE sitelink `335126738428` (Visos programos) ir `133517948965` (Kontaktai) bei keturis naujus callout: „1,5 valandos programa“, „1 arba 2 Velniukai“, „Vaikams pritaikyta“, „Vilnius ir visa Lietuva“. Kitų išteklių nekeisti.

Aktyvuoti tik po PR sujungimo ir produkcinio URL patikrinimo. Kitos kampanijos, jų raktažodžiai, auditorijos, konversijos ir biudžetai nekeičiami.
