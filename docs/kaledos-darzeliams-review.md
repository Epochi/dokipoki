# Kalėdų darželiams puslapio peržiūra

Šaka: `feature/kaledos-darzeliams-review`, bazė: `origin/master` (`c3137f4`).
Puslapio publikavimas vartotojo patvirtintas 2026-09-09. Reklamą leidžiama tik paruošti pristabdytą.

Vietinė peržiūra: http://127.0.0.1:4175/programos/kaledos-darzeliams/
Darbo kopija: `C:\Users\linas\AppData\Local\Temp\dokipoki-kaledos-review`.
Ekrano nuotraukos: `.preview/screenshots/1440.png`, `390.png`, `320.png`.

Peržiūros serveris prideda CSP, kuri blokuoja išorinę analitiką ir formų siuntimą.
Todėl peržiūroje tikras formos pateikimas parodys klaidą. Sėkmės scenarijus
patikrintas izoliuotai, pakeitus fetch testiniu atsakymu. Tikrų laiškų nesiųsta.

## Pakeisti failai

- `_data/kaledos_darzeliams.json`: keturių programų tekstai, naudojami kortelėse ir pasirinkimuose.
- `_programos/kaledos_darzeliams.html`: naujas puslapis, SEO, forma ir šaltinio žyma laiške.
- `_layouts/programa.html`: sąlyginis programos pasirinkimo scenarijaus įkėlimas.
- `css/main.scss`: esamos neon-gallery galerijos stiliai pritaikyti ir šiam puslapiui; ankstesni atskiri Kalėdų kortelių stiliai pašalinti.
- `js/corporate-inquiry-form.js`: bendros formos darželio laiško tema, mygtuko tekstas ir įmonių įvykio netaikymas darželiui.
- `js/kindergarten-inquiry-form.js`: programos parinkimas paspaudus kortelės mygtuką.
- `programos.html`: sezoninis Kalėdų kvietimas; kortelė automatiškai įtraukiama iš programų kolekcijos.
- `scripts/kindergarten-inquiry-browser.test.cjs`: izoliuota naršyklės patikra.
- `docs/kaledos-darzeliams-review.md`: ši peržiūros informacija.

Aktualioje produkcinėje versijoje programų sąrašo Rugsėjo 1-osios kvietimo jau
nebuvo, todėl Kalėdų kvietimas pridėtas. Rugsėjo 1 puslapiai nepakeisti.
Viršuje naudojamas toks pats `programa` hero kaip neoninėje programoje. Programų kortelės naudoja `dp-grid dp-masonry` šabloną: darbalaukyje 2 × 2, telefone vienu stulpeliu. Vidinei galerijai pernaudotas LEGO ir kitų programų `neon-gallery` / `neon-shot` išdėstymas.
Septynios vartotojo nuotraukos nukopijuotos iš `C:\Users\linas\Downloads\New folder` į `img/programos/kaledos-darzeliams/`; originalai nepakeisti. Sąrašo kortelei naudojama `senelis-ir-elfai.jpg`.

## Patikra

- Jekyll kompiliavimas sėkmingas su vietinėmis Windows suderinamumo parinktimis.
- Visi 15 nepakeistų įmonių formos regresinių testų praėjo.
- Naršyklė: keturi pasirinkimo mygtukai, penki formos pasirinkimai, privalomi laukai,
  netaisyklingas el. paštas, neprivaloma data, visi papildomai užpildyti laukai laiško duomenyse.
- Teigiami boolean/string atsakymai, neigiamas string atsakymas, trūkstamas
  patvirtinimas, HTTP, JSON ir tinklo klaidos; laukų išlaikymas ir pakartojimas.
- Apsauga nuo dvigubo pateikimo iki fetch ir JSON apdorojimo pabaigos.
- Darželio forma nesukuria `corporate_inquiry_form_submit` įvykio; po aiškaus tiekėjo patvirtinimo vieną kartą siunčiamas `kindergarten_christmas_inquiry_submit` į dataLayer.
- 1440, 390 ir 320 px: be horizontalaus slinkimo; telefone vienas stulpelis.
- Tikslūs programų veiklų tekstai, canonical, sitemap, programų sąrašo integracija.
- Hero nuotrauka ir šešios galerijos nuotraukos įkeliamos, patikrintas mobilusis ir darbalaukio vaizdas.
- Naujame puslapyje ir metaduomenyse nėra kainų, trukmės ar papildomų pasiūlymų.
- `git diff --check` praėjo. Esama įmonių puslapio forma ir analitikos failai nepakeisti.

## Vietinio paleidimo pastabos

Standartinis projekto būdas: `bundle exec jekyll serve`.
Šiame Windows kompiuteryje JSON 2.18.1 native biblioteką blokuoja Application
Control. Tik vietiniame `.preview/Gemfile` parinkta jau įdiegta JSON 2.6.3.
`.preview/build.rb` prideda absoliutų Sass kelią dėl Jekyll 3 Windows kelių
apdorojimo. Projekto Gemfile, lockfile ir konfigūracija nepakeisti.

Šios darbo kopijos perkompiliavimas PowerShell aplinkoje:

```powershell
$env:BUNDLE_GEMFILE = (Resolve-Path .preview/Gemfile).Path
bundle exec ruby .preview/build.rb
python .preview/server.py
```

Serveris jau paleistas paslėptame procese; antro tuo pačiu prievadu nepaleisti.
`.preview/` yra tik vietiniai peržiūros failai, ne šakos pakeitimai.

Testai:

```powershell
node --test scripts/corporate-inquiry-form.test.cjs
$env:PLAYWRIGHT_MODULE = 'C:/GitHub/dokipoki-os-portal/node_modules/@playwright/test'
node scripts/kindergarten-inquiry-browser.test.cjs
```

Naršyklės testui reikia vietinio serverio, Playwright su Chromium ir `.preview/`
aplanke esančių tų pačių svetainėje naudojamų jQuery 3.7.1, migrate 3.4.1 ir
jQuery 2.1.1 bibliotekų iš code.jquery.com. Testas jas pateikia iš vietinės
kopijos; formų fetch yra visiškai pakeistas testiniu. Analitikos užklausos
blokuojamos ir CSP, ir naršyklės užklausų filtru.

Hero: `senelis-su-vaikais.jpg`. Kitos šešios nuotraukos galerijoje išdėstytos trimis poromis.

## Minimalus SEO ir matavimo užbaigimas

Pridėta Service schema, kurios provider nurodo esamą `https://dokipoki.lt/#organization`,
ir BreadcrumbList. Organizacija nedubliuojama. OG/Twitter naudoja hero nuotrauką.
Tekstai ir dizainas nepakeisti. Naršyklėje li list-style yra none, rodomas tik vienas
brūkšnelis. Formos pateikimo mygtukas matomas ir veikia, todėl nekeistas.

Matavimas: dataLayer įvykis paruoštas ir izoliuotai patikrintas. Tai dar nėra
sukonfigūruota Ads konversija. Esama Ads jungtis neleidžia conversionAction,
customConversionGoal ir conversionGoalCampaignConfig operacijų; GTM valdymo
jungties nėra. Prieš paleidžiant reikia užbaigti vieną tiesioginį GTM → Ads kelią:

- Sukurti WEBPAGE / SUBMIT_LEAD_FORM konversiją su One ir secondary (ne paskyros
  numatytajam optimizavimui).
- GTM Google Ads conversion žymą paleisti tik nuo
  `kindergarten_christmas_inquiry_submit`, išlaikant esamą Consent Mode.
- Tik naujai kampanijai priskirti custom goal su šia konversija; pašalinti kitus
  jos biddable tikslus, įskaitant YouTube. Esamų kampanijų tikslų nekeisti.
- Neimportuoti tos pačios konversijos iš GA4 kaip antro pagrindinio matavimo kelio.

Pradinis Maximize Clicks nenaudoja konversijų kainų siūlymui. Formų pateikimai
ir telefono/Messenger paspaudimai turi likti atskiros ataskaitų eilutės.
