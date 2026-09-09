'use strict';
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || '@playwright/test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const programs = JSON.parse(fs.readFileSync(path.join(root, '_data/kaledos_darzeliams.json'), 'utf8'));
(async () => {
  const browser = await chromium.launch({headless:true});
  const context = await browser.newContext({viewport:{width:1440,height:1000}});
  await context.route('**/*', route => {
    const url = new URL(route.request().url());
    if (url.hostname === 'code.jquery.com') return route.fulfill({path:path.join(root,'.preview',path.basename(url.pathname)),contentType:'application/javascript'});
    return ['127.0.0.1','code.jquery.com','fonts.googleapis.com','fonts.gstatic.com'].includes(url.hostname) ? route.continue() : route.abort();
  });
  await context.addInitScript(() => {
    window.mockRequests = [];
    window.fetch = (url, options) => new Promise((resolve, reject) => window.mockRequests.push({url, fields:Object.fromEntries(options.body), resolve,reject}));
  });
  const page = await context.newPage();
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:4175/programos/kaledos-darzeliams/');
  await page.evaluate(() => document.fonts.ready);
  const decline=page.getByRole('button',{name:'Atmesti nebūtinus'});
  await decline.waitFor({state:'visible'});
  if(await decline.isVisible()) await decline.click();
  assert.equal(await page.title(),'Kalėdinės programos darželiams | DOKI POKI');
  assert.equal(await page.locator('link[rel=canonical]').getAttribute('href'),'https://dokipoki.lt/programos/kaledos-darzeliams/');
  assert.equal(await page.locator('.dp-grid .card').count(),4);
  assert.equal(await page.locator('select option').count(),5);
  const html=await page.content();assert.doesNotMatch(html,/€|priceCurrency|priceSpecification|trukm|valandos|trumpesnio apsilankymo/i);
  for (let i=0;i<4;i++) {
    const card=page.locator('.dp-grid .card').nth(i);
    assert.deepEqual((await card.locator('li').allTextContents()).map(text=>text.replace(/^- /,'')),programs[i].activities);
    await card.locator('a').click();
    assert.equal(await page.locator('select').inputValue(),programs[i].title);
    assert.ok(page.url().endsWith('#darzelio-uzklausa'));
  }
  const submit=page.locator('button[type=submit]');
  await submit.click();assert.equal(await page.evaluate(()=>mockRequests.length),0);
  const values={'Kontaktinis vardas':'Testas','Darželio pavadinimas':'Testinis darželis','email':'test@example.invalid','Miestas / renginio vieta':'Vilnius','Apytikslis vaikų skaičius ir amžius':'20 vaikų, 4–5 metų'};
  for(const [name,value] of Object.entries(values)) await page.locator(`[name="${name}"]`).fill(value);
  await page.locator('[name=email]').fill('invalid');await submit.click();assert.equal(await page.evaluate(()=>mockRequests.length),0);
  await page.locator('[name=email]').fill(values.email);
  for(const mode of ['false','missing','http','json','network','string','boolean']) {
    await submit.click();
    await page.locator('form').evaluate(f=>f.dispatchEvent(new Event('submit',{cancelable:true})));
    assert.equal(await page.evaluate(()=>mockRequests.length),1);
    assert.equal(await submit.isDisabled(),true);
    const payload=await page.evaluate(()=>mockRequests[0].fields);
    for(const [key,value] of Object.entries(values)) assert.equal(payload[key],value);
    assert.match(payload._subject,/Kalėdų darželiams/);assert.match(payload['Užklausos šaltinis'],/kaledos-darzeliams/);
    await page.evaluate(mode=>{
      const r=mockRequests[0];
      if(mode==='network')r.reject(new Error('mock'));
      else r.resolve({ok:mode!=='http',json:async()=>{if(mode==='json')throw new Error('mock JSON');return mode==='missing'?{}:{success:mode==='string'?'true':mode==='boolean'?true:'false'};}});
    },mode);
    await page.waitForFunction(()=>!document.querySelector('button[type=submit]').disabled);
    assert.equal(await page.evaluate(()=>dataLayer.filter(x=>x.event==='corporate_inquiry_form_submit').length),0);
    const success=['string','boolean'].includes(mode);
    assert.equal(await page.locator('.corporate-inquiry-form__validation').textContent(),success?'Ačiū! Jūsų užklausą gavome. Susisieksime nurodytu el. paštu. 🤍':'Užklausos išsiųsti nepavyko. Pabandykite dar kartą arba susisiekite telefonu.');
    assert.equal(await submit.textContent(),'Gauti pasiūlymą darželiui');
    for(const [name,value] of Object.entries(values)) {
      assert.equal(await page.locator(`[name="${name}"]`).inputValue(),success?'':value);
      if(success)await page.locator(`[name="${name}"]`).fill(value);
    }
    await page.evaluate(()=>mockRequests=[]);
  }
  const optional={'Telefono numeris':'+37060000000','Pageidaujama data':'2026-12-15','Papildoma informacija':'Testo pastaba'};
  for(const [name,value] of Object.entries(optional))await page.locator(`[name="${name}"]`).fill(value);
  await submit.click();
  const complete=await page.evaluate(()=>mockRequests[0].fields);
  for(const [name,value] of Object.entries({...values,...optional}))assert.equal(complete[name],value);
  await page.evaluate(()=>mockRequests[0].resolve({ok:true,json:()=>new Promise(resolve=>window.resolveJson=resolve)}));
  await page.waitForFunction(()=>!!window.resolveJson);
  await page.locator('form').evaluate(f=>f.dispatchEvent(new Event('submit',{cancelable:true})));
  assert.equal(await page.evaluate(()=>mockRequests.length),1);
  await page.evaluate(()=>resolveJson({success:'true'}));
  await page.waitForFunction(()=>!document.querySelector('button[type=submit]').disabled);
  await page.reload();await page.evaluate(()=>document.fonts.ready);
  assert.equal(await page.locator('.neon-gallery img').count(),7);
  for (const img of await page.locator('.neon-gallery img').all()) {
    await img.scrollIntoViewIfNeeded();
    await img.evaluate(e => e.decode());
    assert.equal(await img.evaluate(e => e.naturalWidth > 0),true);
  }
  fs.mkdirSync(path.join(root,'.preview/screenshots'),{recursive:true});
  for(const width of [1440,390,320]) {
    await page.setViewportSize({width,height:1000});
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,`overflow at ${width}`);
    const columns=await page.locator('.dp-grid.dp-masonry').evaluate(e=>getComputedStyle(e).gridTemplateColumns.split(' ').length);
    assert.equal(columns,width<=600?1:3);
    await page.evaluate(()=>scrollTo(0,0));
    await page.screenshot({path:path.join(root,`.preview/screenshots/${width}.png`),fullPage:true});
  }
  await page.goto('http://127.0.0.1:4175/programos/');
  assert.equal(await page.getByText('Peržiūrėkite Kalėdų programas darželiams.').count(),1);
  assert.equal(await page.locator('.dp-programos-card a[href="/programos/kaledos-darzeliams/"]').count(),3);
  assert.match(fs.readFileSync(path.join(root,'_site/sitemap.xml'),'utf8'),/https:\/\/dokipoki.lt\/programos\/kaledos-darzeliams\//);
  assert.deepEqual(errors,[]);
  console.log('PASS: content, metadata, sitemap, hub, 4 choices, validation, 7 provider outcomes, preserved fields, retries, double-submit guard, no corporate events, 3 viewports.');
  await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
