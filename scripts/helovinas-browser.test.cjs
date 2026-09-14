// Run after Jekyll build and serving _site on 127.0.0.1:4175.
// PLAYWRIGHT_MODULE may point to an existing Playwright installation.
const {chromium}=require(process.env.PLAYWRIGHT_MODULE || '@playwright/test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const url='/programos/helovino-programa-vaikams/';
const title='Velniukų Helovino vakarėlis';
(async()=>{
 const browser=await chromium.launch({headless:true});
 const context=await browser.newContext();
 await context.route('**/*',route=>{
  const u=new URL(route.request().url());
  if(u.hostname==='code.jquery.com')return route.fulfill({path:path.join(root,'_preview',path.basename(u.pathname)),contentType:'application/javascript'});
  return u.hostname==='127.0.0.1'?route.continue():route.abort();
 });
 await context.addInitScript(()=>{window.mockRequests=[];window.fetch=(url,options)=>new Promise(resolve=>window.mockRequests.push({url,fields:Object.fromEntries(options.body),resolve}));});
 const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 for(const width of [1440,390,360]){
  await page.setViewportSize({width,height:1000});
  await page.goto('http://127.0.0.1:4175'+url);await page.evaluate(()=>document.fonts.ready);
  await page.evaluate(()=>document.querySelector('#klaro')?.remove());
  assert.equal(await page.locator('h1').count(),1);
  assert.equal(await page.title(),'Helovino programa vaikams | DOKI POKI');
  assert.equal(await page.locator('link[rel=canonical]').getAttribute('href'),'https://dokipoki.lt'+url);
  assert.equal(await page.locator('meta[name=robots]').getAttribute('content'),'index, follow');
  assert.equal(await page.locator('meta[property="og:title"]').getAttribute('content'),title+' | DOKI POKI');
  assert.match(await page.locator('meta[property="og:description"]').getAttribute('content'),/^Žaisminga 1,5 valandos/);
  assert.equal(await page.locator('.helovinas-activities article').count(),5);
  const schemas=(await page.locator('script[type="application/ld+json"]').allTextContents()).map(JSON.parse);
  const service=schemas.find(s=>s['@type']==='Service');assert.ok(service);assert.equal(service.name,title);assert.ok(!service.offers&&!service.aggregateRating);
  assert.ok(await page.locator('.helovinas-photo').evaluate(img=>img.naturalWidth>0&&getComputedStyle(img).objectFit==='contain'));
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.screenshot({path:path.join(root,'_preview',`helovinas-${width}.png`),fullPage:true});
  for(const cta of await page.locator('a[href="#helovino-uzklausa"]').all()){
   await cta.click();assert.ok(page.url().endsWith('#helovino-uzklausa'));assert.equal(await page.locator('[name="Dominanti programa"]').inputValue(),title);
  }
  const form=page.locator('form.corporate-inquiry-form');
  await form.evaluate(f=>f.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true})));
  assert.equal(await page.evaluate(()=>mockRequests.length),0);
  await page.locator('[name="Kontaktinis vardas"]').fill('Testas');await page.locator('[name=email]').fill('test@example.invalid');
  await page.locator('[name="Pageidaujama data"]').fill('2026-10-25');
  await page.locator('[name="Miestas / renginio vieta"]').fill('Vilnius');
  await page.locator('[name="Apytikslis vaikų skaičius ir amžius"]').fill('10 vaikų, 6 metai');
  await form.evaluate(f=>{f.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));f.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));});
  assert.equal(await page.evaluate(()=>mockRequests.length),1);
  assert.equal(await page.evaluate(()=>mockRequests[0].fields['Dominanti programa']),title);
  assert.equal(await page.evaluate(()=>mockRequests[0].fields._subject),title+' – DOKI POKI');
  await page.evaluate(()=>mockRequests[0].resolve({ok:true,json:async()=>({success:false})}));
  await page.waitForFunction(()=>!document.querySelector('button[type=submit]').disabled);
  assert.equal(await page.locator('[name=email]').inputValue(),'test@example.invalid');
  assert.equal(await page.evaluate(()=>(window.dataLayer||[]).filter(e=>e.event==='corporate_inquiry_form_submit').length),0);
  await form.evaluate(f=>f.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true})));
  await page.evaluate(()=>mockRequests[1].resolve({ok:true,json:async()=>({success:'true'})}));
  await page.waitForFunction(()=>!document.querySelector('button[type=submit]').disabled);
  assert.equal(await page.evaluate(()=>dataLayer.filter(e=>e.event==='corporate_inquiry_form_submit').length),1);
  assert.equal(await page.locator('[name="Dominanti programa"]').inputValue(),title);
  for(const route of ['/','/programos/']){
   await page.goto('http://127.0.0.1:4175'+route);await page.evaluate(()=>document.fonts.ready);await page.evaluate(()=>document.querySelector('#klaro')?.remove());
   assert.ok(await page.locator(`a[href="${url}"]`).count()>0);
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   const card=route==='/'?page.locator('section[aria-labelledby="helovinas-promo-title"]'):page.locator('article').filter({hasText:title});
   await card.screenshot({path:path.join(root,'_preview',`${route==='/'?'home':'programs'}-${width}.png`)});
  }
 }
 assert.match(fs.readFileSync(path.join(root,'_site/sitemap.xml'),'utf8'),/https:\/\/dokipoki.lt\/programos\/helovino-programa-vaikams\//);
 assert.deepEqual(errors,[]);
 await browser.close();console.log('PASS: 1440/390/360px layouts, links, metadata, Service, sitemap, CTA, mocked failure/retry/double-submit and one existing conversion event.');
})().catch(e=>{console.error(e);process.exit(1);});
