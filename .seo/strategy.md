# DOKIPOKI SEO + GEO Strategy

This document is the persistent strategy for future Codex sessions.

Definitions:

- SEO: visibility in classic Google organic results.
- GEO: visibility in generative answers such as AI Overviews, AI Mode, ChatGPT, Gemini, Perplexity-style summaries, and answer engines.
- Local SEO: city and service-area visibility for Vilnius, Kaunas, and Lithuania. This is handled inside the SEO plan.

Primary sources used for this strategy:

- Google SEO Starter Guide: https://developers.google.com/search/docs/fundamentals/seo-starter-guide
- Google helpful content guidance: https://developers.google.com/search/docs/fundamentals/creating-helpful-content
- Google structured data intro: https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data
- Google Search Console API docs: https://developers.google.com/webmaster-tools/v1/searchanalytics/query

## Business Goal

Increase qualified inquiries for children's parties and events without relying on restricted character/IP keywords.

Primary conversion actions:

- Messenger click
- phone click
- visit to contact section

Primary commercial pages:

- `/`
- `/personazai/`
- `/programos/`
- `/programos/gimtadieniai/`
- `/programos/darzelio_isleistuves/`
- `/programos/imoniu_renginiai/`

Primary markets:

- Vilnius
- Kaunas
- Lithuania-wide events where travel is realistic

## Seasonality Context

DOKIPOKI demand is seasonal. Future SEO analysis must not interpret every traffic drop as an SEO problem.

Core seasonal service windows:

- Darželio išleistuvės: planning and demand peak in spring, usually March-June. Traffic naturally drops after the graduation season.
- Rugsėjo 1 / Mokslo ir žinių diena: kindergartens start booking already in June-July; content and SEO updates must be live before August; September is too late except for last-minute demand.
- Helovynas: planning starts in September, demand peaks in October.
- Kalėdos: B2B/company planning starts right after summer, usually September; family/consumer demand rises later in October-November; demand peaks in November-December.
- Birthdays and character pages: more stable year-round baseline.
- Company/family events: can spike around summer festivals and December events.

When comparing GSC results:

- Compare against the previous 28 days for short-term changes.
- Also compare against the same season last year whenever 16-month data is available.
- For seasonal pages, impressions falling after the season is expected and should not automatically trigger title/content rewrites.
- For seasonal pages, the correct action after the season is usually preparation for the next season, not panic optimization.

Season-aware priorities:

- In June-July: reduce emphasis on darželio išleistuvės as an immediate growth KPI; prioritize Rugsėjo 1 content for kindergartens and early autumn bookings.
- In August: keep Rugsėjo 1 content strong for remaining demand, but avoid waiting until August for core SEO changes.
- In September: Rugsėjo 1 is mostly too late for SEO; prioritize Helovynas and early B2B Kalėdos / company Christmas planning.
- In October-December: prioritize Kalėdos, with separate messaging for companies and families.
- Year-round: keep improving birthdays, personažai, animatoriai vaikams, and company event pages.

## Positioning

DOKIPOKI should be presented as:

- premium but warm children's event entertainers
- strong in both birthdays and larger organized events
- reliable for kindergartens, company events, city events, and family festivals
- flexible by age, group size, location, and energy level

Avoid:

- restricted IP positioning
- pages that promise a theme/program that is not actually offered
- thin pages that only list characters without giving parents decision help

## Core SEO Pillars

### 1. Commercial Page Clarity

Every money page must answer these within the first screen or early page content:

- What is this service?
- Who is it for?
- Where do you work?
- What does the child/group actually experience?
- How do I book?

Target page roles:

- Home: broad brand + "animatoriai vaikams".
- `/personazai/`: character selection hub.
- `/programos/`: program selection hub.
- `/programos/gimtadieniai/`: birthday purchase-intent page.
- `/programos/darzelio_isleistuves/`: kindergarten graduation page.
- `/programos/imoniu_renginiai/`: company/corporate event page.

### 2. Query-to-Page Matching

Use GSC data to map queries to one best page.

Examples:

- "animatoriai vaikams vilniuje" -> `/`
- "personažai vaikų gimtadieniui" -> `/personazai/`
- "vaikų gimtadienio programa" -> `/programos/gimtadieniai/`
- "darželio išleistuvės animatoriai" -> `/programos/darzelio_isleistuves/`
- "vaikų zona įmonės renginyje" -> `/programos/imoniu_renginiai/`

If one query gets impressions for multiple pages, choose one canonical target and strengthen internal links to that page.

### 3. Internal Linking

Every new or edited page should intentionally link to 1-3 commercial targets.

Anchor examples:

- `animatoriai vaikams Vilniuje`
- `personažai vaikų gimtadieniui`
- `vaikų gimtadienio programa`
- `darželio išleistuvių programa`
- `vaikų zona įmonės renginyje`

Do not overuse the same exact anchor everywhere.

### 4. Local SEO Signals

Sitewide and page-level content should make location clear:

- Vilnius
- Kaunas
- atvykstame į kitus Lietuvos miestus

Add local context where natural:

- birthdays at playrooms
- kindergarten celebrations
- company family events
- city/festival events

Avoid creating empty city doorway pages. Create a city page only when it can include real services, examples, photos, FAQs, and conversion content.

### 5. Structured Data

Keep and improve structured data:

- Organization
- LocalBusiness
- Service for program/persona pages
- BreadcrumbList
- ItemList for hubs

Potential improvement later:

- Event-style schema only for actual dated public events.
- FAQ-style on-page sections can help users, but do not rely on FAQ rich results as a primary SEO lever.

## Core GEO Pillars

GEO goal: make DOKIPOKI easy for answer engines to cite, summarize, and recommend.

### 1. Answer-Ready Content

Each important page should contain concise, extractable answers:

- What is included?
- Who is it best for?
- How long does it last?
- What age range?
- What cities?
- What does it cost from?
- How to book?

Use plain factual paragraphs and short lists. Avoid making all important information only visual or hidden in modals.

### 2. Entity Consistency

Repeat the same entity facts across the site:

- Brand: DOKIPOKI / DokiPoki
- Service: animatoriai vaikams, personažai vaikų šventėms, programos vaikams
- Area: Vilnius, Kaunas, Lietuva
- Contact: phone, Messenger, Instagram/Facebook

Answer engines prefer consistent entity descriptions over scattered marketing variations.

### 3. Comparison and Decision Help

Create content that helps parents choose, not just browse.

High-value GEO formats:

- "Kaip išsirinkti animatorių pagal vaiko amžių?"
- "Kuo skiriasi personažo programa nuo teminės programos?"
- "Kokia programa tinka darželio išleistuvėms?"
- "Ką pasirinkti mažai grupei, o ką dideliam renginiui?"

These pages can be cited by AI systems because they answer multi-part questions directly.

### 4. Trust and Proof

Add specific trust signals:

- real event types served
- years/experience if true
- safety and age adaptation
- how booking works
- what happens if weather changes
- social proof from real events, without overexposing restricted IP content

### 5. Content Chunking

For AI extraction, important pages should have clear sections:

- Summary
- What is included
- Best for
- Age/group size
- Location
- Price/from
- Booking
- FAQ

This helps both classic SEO and generative answers.

## Measurement Loop

Run:

```powershell
.\.venv\Scripts\python.exe scripts\gsc_sync.py
```

Cadence:

- baseline before changes
- weekly check every 7 days
- decision check every 14 days
- deeper review monthly

Primary metrics:

- clicks
- impressions
- CTR
- average position
- query/page combinations

Decision rules:

- High impressions + low CTR: improve title/meta/snippet and page intro.
- Position 4-15 + relevant query: strengthen content section and internal links.
- Page gets impressions for wrong query: clarify page purpose or move/link content.
- Good ranking but poor conversions: improve CTA and first-screen clarity.
- Seasonal page traffic drop after its peak window: mark as expected unless rankings collapse or CTR drops abnormally versus same-season data.

## 90-Day Roadmap

### Days 0-14: Baseline and Safety

- Set up GSC sync.
- Verify live deploy after restricted-content removal.
- Clean remaining non-Instagram restricted references if needed.
- Identify top 20 query/page opportunities.
- Update titles and descriptions for main commercial pages.

Expected visible result:

- cleaner indexing surface
- improved CTR on pages that already have impressions
- clearer commercial funnel

### Days 15-30: Commercial Page Upgrades

- Rewrite `/programos/gimtadieniai/` as the strongest birthday landing page.
- Improve `/personazai/` decision help.
- Add stronger internal links from blog posts to commercial pages.
- Add compact FAQs to main money pages.

Expected visible result:

- more impressions matching commercial intent
- better average position for mid-ranking queries

### Days 31-60: GEO Content Assets

Create 3 decision-support pages/posts:

- "Kaip išsirinkti animatorių vaikų gimtadieniui?"
- "Kokia programa tinka darželio išleistuvėms?"
- "Vaikų zona įmonės renginyje: ką suplanuoti?"

Each should link to the relevant commercial page.

Expected visible result:

- more long-tail impressions
- more AI-answer-ready source material

### Days 61-90: Local and Authority Expansion

- Add real event proof and examples where possible.
- Consider Vilnius-focused section if GSC shows local query demand.
- Improve image alt text and filenames where they support real services.
- Refresh older blog posts that already have impressions.

Expected visible result:

- stronger local relevance
- more stable rankings across related queries

## Today's Default 3 Actions

When no GSC data exists yet:

1. Improve title/meta/intro for `/personazai/`.
2. Improve title/meta/intro for `/programos/gimtadieniai/`.
3. Add internal links from 3 existing blog posts to `/programos/gimtadieniai/`, `/personazai/`, and `/programos/darzelio_isleistuves/`.

When GSC data exists:

1. Pick the top low-CTR opportunity from `.seo/latest-report.md`.
2. Pick the top striking-distance query/page from `.seo/latest-report.md`.
3. Pick one commercial page with impressions but weak clicks and improve title, intro, and internal links.

## Future Codex Prompt

Use this when starting a new chat:

```text
Read .seo/README.md, .seo/strategy.md, and .seo/latest-report.md if present.
Analyze the latest GSC snapshot and propose exactly 3 SEO/GEO changes for this week.
Prioritize changes that can be implemented in this repo today and measured in 7-14 days.
```
