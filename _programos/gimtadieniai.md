---
layout: programa
title: "Gimtadieniai"
order: 1
intro: "Vaikų gimtadieniai su Doki Poki – daug juoko, judrių žaidimų ir nepamirštamų emocijų!"
image: "/gallery/top/IMG_0604.webp"
permalink: /programos/gimtadieniai/
body_class: page-programa page-programa-gimtadieniai
link: /programos/gimtadieniai/
seo_title: "Vaikų gimtadieniai su animatoriais Vilniuje ir Kaune | Doki Poki"
description: "Smagūs vaikų gimtadieniai su animatoriais: personažai, žaidimai, šokiai, burbulai ir pritaikyta programa pagal vaikų amžių."
---

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Pagrindinis", "item": "{{ "/" | absolute_url }}" },
        { "@type": "ListItem", "position": 2, "name": "Programos", "item": "{{ "/programos/" | absolute_url }}" },
        { "@type": "ListItem", "position": 3, "name": "{{ page.title }}", "item": "{{ page.url | absolute_url }}" }
      ]
    },
    {
      "@type": "Service",
      "name": "{{ page.title }}",
      "url": "{{ page.url | absolute_url }}",
      "image": "{{ page.image | absolute_url }}",
      "description": "{{ page.intro | strip_newlines | escape }}",
      "provider": {
        "@type": "Organization",
        "name": "DokiPoki",
        "url": "{{ "/" | absolute_url }}"
      },
      "areaServed": [
        { "@type": "City", "name": "Vilnius" },
        { "@type": "City", "name": "Kaunas" },
        { "@type": "Country", "name": "Lietuva" }
      ]
    }
  ]
}
</script>

<div class="row" style="margin-top: 18px;">
  <div class="col s12">
    <h2 class="section-header center-align">Programos variantai</h2>
  </div>
</div>

<div class="row">
  <div class="col s12">
    <div class="dp-grid dp-masonry">

      <div class="dp-item">
        <div class="card">
          <div class="card-image">
            <img src="/gallery/top/IMG_0635.webp" alt="Gimtadienio programa su aktyviais žaidimais" loading="lazy" decoding="async" width="1500" height="1071">
          </div>

          <div class="card-content">
            <h3 class="section-header">Gimtadienis su Doki Poki personažais</h3>

            <ul class="kg-font kg-font--small dp-bullets">
              <li>- Judrūs komandiniai žaidimai, šokiai ir muzika</li>
              <li>- Veidukų piešimas arba blizgučių terapija</li>
              <li>- Balionėlių lankstymas</li>
              <li>- Laikinos tatuiruotės</li>
            </ul>

            <p class="kg-font kg-font--small">
              Programą pritaikome pagal vaikų amžių ir šventės vietą.
              Rinktis galite iš visų mūsų <a href="/personazai/">personažų</a>.
            </p>
          </div>
        </div>
      </div>

      <div class="dp-item">
        <div class="card">
          <div class="card-image">
            <img src="/gallery/geriausianimatoriai.webp" alt="Teminis vaikų gimtadienis su personažais" loading="lazy" decoding="async" width="911" height="1500">
          </div>

          <div class="card-content">
            <h3 class="section-header">Teminis gimtadienis pagal vaiko pomėgius</h3>

            <ul class="kg-font kg-font--small dp-bullets">
              <li>- Herojų ir pasakų tematikos</li>
              <li>- Personalizuotos užduotys</li>
              <li>- Įtraukianti gimtadienio eiga</li>
              <li>- Daug juoko ir šventinės energijos</li>
            </ul>

            <p class="kg-font kg-font--small">
              Padėsime Jums išsirinkti <a href="/personazai/">personažą</a>, atitinkantį šventės tematiką.
            </p>
          </div>
        </div>
      </div>

      <div class="dp-item dp-cta-item">
        <div class="card">
          <div class="card-image dp-cta-logo-wrap">
            <img src="/img/social/og-default.webp" alt="Doki Poki personažai logotipas" loading="lazy" decoding="async">
          </div>

          <div class="card-content center-align" style="padding: 28px 26px 34px 26px;">
            <h3 class="section-header">REZERVUOKITE DATĄ</h3>

            <p class="kg-font kg-font--small" style="margin: 12px 0 20px 0;">
              Parašykite į Messenger ir padėsime išsirinkti tinkamiausią gimtadienio programą.
            </p>

            <a
              href="{{ site.messenger_url }}"
              class="btn-large waves-effect waves-light dp-btn section-header cta-btn"
              data-cta-scope="programa"
              data-cta-type="messenger"
              data-programa="gimtadieniai"
              target="_blank"
              rel="noopener"
            >
              Susisiekti per Messenger →
            </a>
          </div>
        </div>
      </div>

    </div>
  </div>
</div>
