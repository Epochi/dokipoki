'use strict';
// Build Jekyll, serve _site at PREVIEW_URL (default :4177), then run with
// PLAYWRIGHT_MODULE pointing to an existing Playwright install. All submissions
// and Google requests are intercepted: this suite never sends mail or real leads.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || '@playwright/test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const base = process.env.PREVIEW_URL || 'http://127.0.0.1:4177';
const screenshots = path.resolve(__dirname, '../_preview/screenshots');
const scenarios = ['/', '/programos/gimtadieniai/', '/personazai/zmogus-voras/', '/programos/rumi-demon-hunters/'];
(async()=>{
  fs.mkdirSync(screenshots,{recursive:true});
  const browser=await chromium.launch({headless:true});
  try {
    const context=await browser.newContext({viewport:{width:1440,height:1000}});
    await context.route('**/*', route=>{
      const host=new URL(route.request().url()).hostname;
      return ['127.0.0.1','code.jquery.com','fonts.googleapis.com','fonts.gstatic.com'].includes(host) ? route.continue() : route.abort();
    });
    await context.addInitScript(()=>{
      window.mockRequests=[]; window.inquiryEvents=[]; window.testConsent=true;
      window.fetch=(url,options)=>new Promise((resolve,reject)=>window.mockRequests.push({url,fields:Object.fromEntries(options.body),resolve,reject}));
    });
    const page=await context.newPage();
    const pageErrors=[];page.on('pageerror',error=>pageErrors.push(error.message));
    async function consent(enabled=true,throwTag=false){
      await page.evaluate(({enabled,throwTag})=>{
        window.testConsent=enabled;
        window.klaro={getManager:()=>({getConsent:()=>window.testConsent})};
        window.gtag=(...args)=>{if(throwTag)throw Error('Tag blocked');window.inquiryEvents.push(args);};
        document.querySelector('#klaro')?.remove();
      },{enabled,throwTag});
    }
    async function fill(contact='audit@example.invalid',unknown=true){
      await page.locator('[data-inquiry-event-type]').selectOption('birthday');
      await page.locator('[data-inquiry-children]').fill('12');
      await page.locator('[data-inquiry-date-unknown]').setChecked(unknown);
      if(!unknown) await page.locator('[data-inquiry-date]').fill('2027-02-20');
      await page.locator('[data-inquiry-city]').fill('Vilnius TESTAS');
      await page.locator('[data-inquiry-contact]').fill(contact);
    }
    async function complete(mode){
      await page.evaluate(mode=>{
        const request=window.mockRequests.at(-1);
        if(mode==='network')request.reject(Error('Network failure'));
        else request.resolve({ok:mode!=='http',json:async()=>{
          if(mode==='json')throw Error('Invalid JSON');
          return mode==='missing'?{}:{success:mode==='string'?'true':mode==='boolean'?true:false};
        }});
      },mode);
      await page.waitForFunction(()=>!document.querySelector('[data-quick-inquiry] button').disabled);
    }
    for(const url of scenarios){
      await page.goto(base+url);await consent();
      assert.equal(await page.locator('[data-quick-inquiry]').count(),1);
      assert.equal(await page.locator('h1').count(),1);
      assert.equal(await page.locator('link[rel=canonical]').getAttribute('href'),'https://dokipoki.lt'+url);
      assert.equal(await page.locator('meta[name=robots]').getAttribute('content'),'index, follow');
      for(const schema of await page.locator('script[type="application/ld+json"]').allTextContents()) JSON.parse(schema);
      await page.locator('[data-quick-inquiry-open]').first().click();
      await page.waitForFunction(()=>{
        const type=document.querySelector('[data-inquiry-event-type]');
        return (type.value?document.querySelector('[data-inquiry-children]'):type)===document.activeElement;
      });
      const submit=page.locator('[data-quick-inquiry] button');
      await submit.click();assert.equal(await page.evaluate(()=>mockRequests.length),0);
      await fill('invalid');await submit.click();assert.equal(await page.evaluate(()=>mockRequests.length),0);
      if(url==='/'){
        await fill();await page.locator('[data-inquiry-event-type]').selectOption('');await submit.click();
        assert.equal(await page.evaluate(()=>mockRequests.length),0);
        await page.locator('[data-inquiry-event-type]').selectOption('birthday');
        for(const count of ['', '0','-1','1.5','10000']){
          await page.locator('[data-inquiry-children]').fill(count);await submit.click();
          assert.equal(await page.evaluate(()=>mockRequests.length),0);
        }
      }
      await fill('+370 600 00000');await submit.click();
      await page.locator('[data-quick-inquiry]').evaluate(form=>form.dispatchEvent(new Event('submit',{cancelable:true})));
      assert.equal(await page.evaluate(()=>mockRequests.length),1);
      assert.equal(await submit.isDisabled(),true);
      const fields=await page.evaluate(()=>mockRequests[0].fields);
      assert.equal(fields['Šventės data'],'Data dar derinama');
      assert.equal(fields['Šventės tipas'],'birthday');assert.equal(fields['Vaikų skaičius'],'12');
      assert.equal(fields['Telefonas'],'+370 600 00000');assert.ok(!fields.email);
      assert.equal(fields['Miestas'],'Vilnius TESTAS');assert.ok(fields['Užklausos numeris']);
      assert.equal(fields._url,'https://dokipoki.lt'+url);
      if(url.includes('zmogus'))assert.equal(fields['Personažas'],'Žmogus Voras');
      await complete('boolean');
      assert.equal(await page.locator('[data-inquiry-status].is-success').count(),1);
      assert.equal(await page.evaluate(()=>inquiryEvents.filter(event=>event[1]==='generate_lead').length),1);
      assert.equal(await page.locator('[data-inquiry-contact]').inputValue(),'');
      assert.equal(await page.locator('[data-inquiry-children]').inputValue(),'');
    }
    await page.goto(base+'/programos/gimtadieniai/?email=private-query@example.invalid');await consent();
    await page.locator('[data-inquiry-service="birthday-rumi-premium"]').click();
    assert.equal(await page.locator('input[data-inquiry-program]').inputValue(),'Rumi Premium');
    const submit=page.locator('[data-quick-inquiry] button');
    for(const mode of ['false','missing','http','json','network','string']){
      await fill();await submit.click();
      assert.equal(await page.evaluate(()=>inquiryEvents.filter(event=>event[1]==='generate_lead').length),0);
      await complete(mode);
      const success=mode==='string';
      assert.equal(await page.locator('[data-inquiry-status].is-success').count(),success?1:0);
      assert.equal(await page.locator('[data-inquiry-contact]').inputValue(),success?'':'audit@example.invalid');
      assert.equal(await page.locator('[data-inquiry-children]').inputValue(),success?'':'12');
    }
    const events=await page.evaluate(()=>inquiryEvents);
    const lead=events.find(event=>event[1]==='generate_lead');
    assert.equal(lead[2].service_id,'birthday-rumi-premium');
    assert.equal(lead[2].page_location,'https://dokipoki.lt/programos/gimtadieniai/');
    assert.equal(lead[2].page_referrer,'');
    assert.deepEqual(Object.keys(lead[2]).sort(),['form_id','inquiry_channel','page_location','page_referrer','send_to','service_id'].sort());
    assert.doesNotMatch(JSON.stringify(events),/audit@example|private-query|Vilnius TESTAS|370 600|2027-02/);
    // Analytics failures or withheld consent must not turn accepted requests into errors.
    for(const variant of ['denied','throws']){
      const previousEvents=await page.evaluate(()=>inquiryEvents.length);
      await consent(variant!=='denied',variant==='throws');await fill();await submit.click();await complete('boolean');
      assert.equal(await page.locator('[data-inquiry-status].is-success').count(),1);
      assert.equal(await page.evaluate(()=>inquiryEvents.length),previousEvents);
    }
    await consent();
    await fill();
    await page.locator('[name=_honey]').evaluate(field=>field.value='bot');
    const before=await page.evaluate(()=>mockRequests.length);await submit.click();assert.equal(await page.evaluate(()=>mockRequests.length),before);
    await page.locator('[name=_honey]').evaluate(field=>field.value='');
    await page.locator('[data-inquiry-date-unknown]').uncheck();
    await page.locator('[data-inquiry-date]').fill('2020-01-01');await submit.click();assert.equal(await page.evaluate(()=>mockRequests.length),before);
    // Lock survives delayed provider JSON, not just the initial response headers.
    await fill();await submit.click();
    await page.evaluate(()=>{window.jsonResolve=null;mockRequests.at(-1).resolve({ok:true,json:()=>new Promise(resolve=>window.jsonResolve=resolve)});});
    await page.waitForFunction(()=>typeof jsonResolve==='function');
    await page.locator('[data-quick-inquiry]').evaluate(form=>form.dispatchEvent(new Event('submit',{cancelable:true})));
    assert.equal(await page.evaluate(()=>mockRequests.length),before+1);
    await page.evaluate(()=>jsonResolve({success:true}));await page.waitForFunction(()=>!document.querySelector('[data-quick-inquiry] button').disabled);
    // Preserve an organic entry across an internal navigation only with consent.
    await consent(false);
    await page.goto(base+'/programos/gimtadieniai/',{referer:'https://www.google.lt/search?q=animatoriai'});
    await consent(true);
    await page.goto(base+'/personazai/zmogus-voras/');await consent(true);
    await fill();await page.locator('[data-quick-inquiry] button').click();
    const attribution=await page.evaluate(()=>mockRequests.at(-1).fields);
    assert.equal(attribution['Užklausos kanalas'],'organic_search');
    assert.equal(attribution['Pradinis puslapis'],'/programos/gimtadieniai/');
    await complete('boolean');
    // Christmas audience choices retain the existing form and select the right offer.
    await page.goto(base+'/kaledos/');await consent(false);
    assert.equal(await page.locator('.ch-audience-cards article').count(),3);
    for(const card of await page.locator('.ch-audience-cards article').all()){
      const cta=card.locator('[data-ch-offer]');const offer=await cta.getAttribute('data-ch-offer');const audience=await cta.getAttribute('data-ch-audience');
      await cta.click();assert.equal(await page.locator('#ch-interest').inputValue(),offer);assert.equal(await page.locator('#ch-audience').inputValue(),audience);
    }
    await page.locator('#ch-name').fill('Techninis testas');
    await page.locator('#ch-email').fill('test@example.invalid');
    await page.locator('[data-christmas-inquiry] button').click();
    assert.equal(await page.evaluate(()=>mockRequests.length),1);
    assert.equal(await page.evaluate(()=>dataLayer.filter(x=>x.event==='christmas_inquiry_form_submit').length),0);
    await page.evaluate(()=>mockRequests[0].resolve({ok:true,json:async()=>({success:false})}));
    await page.waitForFunction(()=>!document.querySelector('[data-christmas-inquiry] button').disabled);
    assert.equal(await page.locator('#ch-email').inputValue(),'test@example.invalid');
    assert.equal(await page.evaluate(()=>dataLayer.filter(x=>x.event==='christmas_inquiry_form_submit').length),0);
    await page.locator('[data-christmas-inquiry] button').click();
    await page.evaluate(()=>mockRequests[1].resolve({ok:true,json:async()=>({success:true})}));
    await page.waitForFunction(()=>!document.querySelector('[data-christmas-inquiry] button').disabled);
    assert.equal(await page.evaluate(()=>dataLayer.filter(x=>x.event==='christmas_inquiry_form_submit').length),1);
    const paths=[...scenarios,'/kaledos/'];
    for(const width of [320,390,768,1440]){
      await page.setViewportSize({width,height:900});
      for(const url of paths){
        await page.goto(base+url);await consent(false);await page.evaluate(()=>document.fonts.ready);
        await page.evaluate(async()=>{
          const images=[...document.querySelectorAll('img')];images.forEach(img=>img.loading='eager');
          await Promise.all(images.map(img=>img.decode().catch(()=>{})));
        });
        const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);
        assert.equal(overflow,false,`Horizontal overflow ${width} ${url}`);
        if(width===390||width===1440)await page.screenshot({path:path.join(screenshots,`${url.replace(/\W/g,'_')||'home'}-${width}.png`),fullPage:true});
        if(url!=='/kaledos/'){
          await page.locator('[data-quick-inquiry-open]').first().click();
          const rect=await page.locator('[data-inquiry-contact]').boundingBox();assert.ok(rect.width>120&&rect.height>=44);
          assert.equal(await page.locator('.quick-inquiry__contact-question').evaluate(el=>getComputedStyle(el).textAlign),'center');
          assert.ok(parseFloat(await page.locator('[data-inquiry-contact]').evaluate(el=>getComputedStyle(el).fontSize))>=16);
          if(width===390)await page.locator('#uzklausa').screenshot({path:path.join(screenshots,`form-${url.replace(/\W/g,'_')||'home'}.png`)});
        }
      }
    }
    // Crawl links and fragment targets on every affected page. Preserve all URLs.
    await page.setViewportSize({width:1440,height:1000});
    for(const url of [...paths,'/personazai/pimpackiukai/','/personazai/piratas/','/personazai/haris-poteris/','/personazai/undinele/','/personazai/elza/']){
      const response=await page.goto(base+url);assert.equal(response.status(),200,url);
      const links=await page.locator('main a[href], .container a[href]').evaluateAll(els=>els.map(el=>el.getAttribute('href')));
      for(const href of new Set(links)){
        if(href.startsWith('#')&&href.length>1)assert.ok(await page.locator(`[id="${href.slice(1)}"]`).count(),url+' '+href);
        else if(href.startsWith('/')&&!href.startsWith('//')){
          const res=await context.request.get(base+href.split('#')[0]);assert.equal(res.status(),200,url+' '+href);
        }
      }
    }
    const sitemap=await (await context.request.get(base+'/sitemap.xml')).text();
    assert.ok(sitemap.includes('https://dokipoki.lt/programos/gimtadieniai/'));assert.ok(sitemap.includes('https://dokipoki.lt/kaledos/'));
    assert.deepEqual(pageErrors,[]);
    console.log('PASS: provider acceptance/errors/retry/lock, phone/email, context, consent and PII; Christmas routing; responsive 320/390/768/1440; links, metadata, JSON-LD, sitemap.');
    await context.close();
  } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
