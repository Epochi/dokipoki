# Kalėdų darželiams puslapio peržiūra

Šaka: `feature/kaledos-darzeliams-review`, bazė: `origin/master` (`c3137f4`).
Puslapis nepublikuotas; nuotolinė šaka nesukurta, produkcija ir reklamos nekeistos.

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
Programų išdėstymui pernaudotas išleistuvių `dp-hero-lite` ir `dp-grid dp-masonry` šablonas. Vidinei galerijai pernaudotas LEGO ir kitų programų `neon-gallery` / `neon-shot` išdėstymas.
Septynios vartotojo nuotraukos nukopijuotos iš `C:\Users\linas\Downloads\New folder` į `img/programos/kaledos-darzeliams/`; originalai nepakeisti. Sąrašo kortelei naudojama `senelis-ir-elfai.jpg`.

## Patikra

- Jekyll kompiliavimas sėkmingas su vietinėmis Windows suderinamumo parinktimis.
- Visi 15 nepakeistų įmonių formos regresinių testų praėjo.
- Naršyklė: keturi pasirinkimo mygtukai, penki formos pasirinkimai, privalomi laukai,
  netaisyklingas el. paštas, neprivaloma data, visi papildomai užpildyti laukai laiško duomenyse.
- Teigiami boolean/string atsakymai, neigiamas string atsakymas, trūkstamas
  patvirtinimas, HTTP, JSON ir tinklo klaidos; laukų išlaikymas ir pakartojimas.
- Apsauga nuo dvigubo pateikimo iki fetch ir JSON apdorojimo pabaigos.
- Darželio forma nesukuria `corporate_inquiry_form_submit` įvykio.
- 1440, 390 ir 320 px: be horizontalaus slinkimo; telefone vienas stulpelis.
- Tikslūs programų veiklų tekstai, canonical, sitemap, programų sąrašo integracija.
- Visos septynios galerijos nuotraukos įkeliamos, patikrintas mobilusis ir darbalaukio vaizdas.
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
