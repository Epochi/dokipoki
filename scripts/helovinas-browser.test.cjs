// Run after Jekyll build and serving _site on 127.0.0.1:4175.
// PLAYWRIGHT_MODULE may point to an existing Playwright installation.
const {chromium}=require(process.env.PLAYWRIGHT_MODULE || '@playwright/test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const url='/programos/helovino-programa-vaikams/';
const base=process.env.PREVIEW_URL || 'http://127.0.0.1:4175';
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
  await page.goto(base+url);await page.evaluate(()=>document.fonts.ready);
  await page.evaluate(()=>document.querySelector('#klaro')?.remove());
  assert.equal(await page.locator('h1').count(),1);
  assert.equal(await page.title(),'Helovino programa vaikams | DOKI POKI');
  assert.equal(await page.locator('link[rel=canonical]').getAttribute('href'),'https://dokipoki.lt'+url);
  assert.equal(await page.locator('meta[name=robots]').getAttribute('content'),'index, follow');
  assert.equal(await page.locator('meta[property="og:title"]').getAttribute('content'),title+' | DOKI POKI');
  assert.match(await page.locator('meta[property="og:description"]').getAttribute('content'),/^Žaisminga 1,5 valandos/);
  assert.equal(await page.locator('.ch-featured .ch-features li').count(),5);
  const schemas=(await page.locator('script[type="application/ld+json"]').allTextContents()).map(JSON.parse);
  const service=schemas.find(s=>s['@type']==='Service');assert.ok(service);assert.equal(service.name,title);assert.ok(!service.offers&&!service.aggregateRating);
  assert.ok(await page.locator('.ch-hero-photo img').evaluate(img=>img.naturalWidth>0&&getComputedStyle(img).objectFit==='contain' && Math.abs(img.clientWidth/img.clientHeight-img.naturalWidth/img.naturalHeight)<0.01));
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.screenshot({path:path.join(root,'_preview',`helovinas-${width}.png`),fullPage:true});
  assert.equal(await page.locator('main form').count(),0);
  assert.equal(await page.locator('#helovinas-faq').count(),0);
  const contact=page.locator('main a[data-cta-type="messenger"]');
  assert.equal(await contact.count(),2);
  for(const cta of await contact.all()){
   assert.equal(await cta.getAttribute('href'),'https://m.me/personazaidokipoki');
   assert.equal(await cta.getAttribute('target'),'_blank');
   assert.match(await cta.getAttribute('rel'),/noopener/);
   assert.equal(await cta.innerText(),'Susisiekti per Messenger');
  }
  for(const route of ['/','/programos/']){
   await page.goto(base+route);await page.evaluate(()=>document.fonts.ready);await page.evaluate(()=>document.querySelector('#klaro')?.remove());
   assert.ok(await page.locator(`a[href="${url}"]`).count()>0);
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   const card=route==='/'?page.locator('section[aria-labelledby="helovinas-promo-title"]'):page.locator('article').filter({has:page.locator(`a[href="${url}"]`)});
   await card.screenshot({path:path.join(root,'_preview',`${route==='/'?'home':'programs'}-${width}.png`)});
  }
 }
 assert.match(fs.readFileSync(path.join(root,'_site/sitemap.xml'),'utf8'),/https:\/\/dokipoki.lt\/programos\/helovino-programa-vaikams\//);
 assert.deepEqual(errors,[]);
 await browser.close();console.log('PASS: 1440/390/360px layouts, links, metadata, Service, sitemap, Messenger CTA, no form or FAQ.');
})().catch(e=>{console.error(e);process.exit(1);});
