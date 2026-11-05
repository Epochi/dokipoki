import {test} from 'node:test';
import assert from 'node:assert/strict';
import {InquiryReceipts} from '../workers/inquiries/receipt.mjs';
import {inquiryRequest,parseInquiry} from '../workers/inquiries/core.mjs';
function store(){
 const values=new Map();let alarm=null;
 return {values,get:async key=>values.get(key),put:async(key,value)=>{values.set(key,value);},delete:async key=>values.delete(key),getAlarm:async()=>alarm,setAlarm:async time=>{alarm=time;},
 list:async({prefix='',limit=Infinity}={})=>new Map([...values].filter(([key])=>key.startsWith(prefix)).slice(0,limit))};
}
const input={reference:'test-inquiry-20261104-01',city:'Vilnius',contact:'test@example.invalid',date:'Data dar derinama',eventType:'birthday',children:'12',program:'Rumi',character:'',sourceUrl:'https://dokipoki.lt/',entryPath:'/',channel:'organic_search'};
function request(patch={},options={}){
 const fields={'Užklausos numeris':input.reference,'Miestas':input.city,'Kontaktas':input.contact,'Šventės data':input.date,'Programa':input.program,'Personažas':'',
 'Šventės tipas':input.eventType,'Vaikų skaičius':input.children,'Užklausos puslapis':input.sourceUrl,'Pradinis puslapis':'/','Užklausos kanalas':'organic_search',...patch};
 const body=new FormData();for(const [key,value] of Object.entries(fields))body.set(key,value);
 return new Request('https://inquiries.invalid/inquiry',{method:'POST',headers:{Origin:'https://dokipoki.lt',...options.headers},body,...options});
}
test('multipart inquiry retains Unicode fields, phone-only and undecided date',async()=>{
 const parsed=await parseInquiry(request({'Kontaktas':'+370 600 00000'}));assert.equal(parsed.city,'Vilnius');assert.equal(parsed.contact,'+370 600 00000');assert.equal(parsed.date,'Data dar derinama');
 assert.equal(parsed.eventType,'birthday');assert.equal(parsed.children,'12');
});
test('unknown celebration types and invalid child counts are rejected',async()=>{
 for(const patch of [{'Šventės tipas':'invalid'},{'Vaikų skaičius':''},{'Vaikų skaičius':'0'},{'Vaikų skaičius':'-1'},{'Vaikų skaičius':'1.5'},{'Vaikų skaičius':'10000'}])await assert.rejects(parseInquiry(request(patch)));
});
test('oversized requests and honeypots are rejected before the mailer',async()=>{
 await assert.rejects(parseInquiry(request({'_honey':'bot'})));
 await assert.rejects(parseInquiry(request({'Programa':'x'.repeat(9000)})));
});
test('CORS and method checks stop requests without receipt or email access',async()=>{
 const env={};
 assert.equal((await inquiryRequest(request({}, {headers:{Origin:'https://evil.invalid'}}),env)).status,403);
 assert.equal((await inquiryRequest(new Request('https://inquiries.invalid/inquiry',{method:'OPTIONS',headers:{Origin:'https://dokipoki.lt'}}),env)).status,204);
 assert.equal((await inquiryRequest(new Request('https://inquiries.invalid/inquiry',{headers:{Origin:'https://dokipoki.lt'}}),env)).status,405);
});
test('rate limit fails closed before parsing or sending',async()=>{
 const env={INQUIRY_RATE_LIMIT:{limit:async()=>({success:false})}};
 assert.equal((await inquiryRequest(request(),env)).status,429);
});
test('accepted gateway response has the exact allowed CORS origin and no PII',async()=>{
 let parsed;
 const env={INQUIRY_RATE_LIMIT:{limit:async()=>({success:true})},RECEIPTS:{idFromName:name=>name,get:()=>({fetch:async(url,options)=>{
   parsed=JSON.parse(options.body);return Response.json({success:true});
 }})}};
 const response=await inquiryRequest(request(),env);
 assert.equal(response.status,200);assert.equal(response.headers.get('access-control-allow-origin'),'https://dokipoki.lt');
 assert.equal(parsed.input.contact,input.contact);assert.match(parsed.hash,/^[a-f0-9]{64}$/);
 assert.deepEqual(await response.json(),{success:true});
});
test('explicit email acceptance and replay send exactly once, no stored PII',async()=>{
 let count=0;const storage=store(),r=new InquiryReceipts(storage,async()=>{count++;return {accepted:true};});
 assert.equal((await r.submit(input,'hash')).body.success,true);
 assert.equal((await r.submit(input,'hash')).body.success,true);assert.equal(count,1);
 assert.doesNotMatch(JSON.stringify([...storage.values]),/test@example|Vilnius|Rumi/);
 assert.equal((await r.submit({...input,contact:'other@example.invalid'},'different')).status,409);assert.equal(count,1);
});
test('concurrent retries share one actual send',async()=>{
 let done,count=0;const r=new InquiryReceipts(store(),()=>{count++;return new Promise(resolve=>{done=resolve;});});
 const first=r.submit(input,'hash'),second=r.submit(input,'hash');
 await new Promise(resolve=>setTimeout(resolve,5));assert.equal(count,1);
 done({accepted:true});assert.equal((await first).body.success,true);assert.equal((await second).body.success,true);
});
test('definite pre-send failure permits retry; uncertain send never repeats',async()=>{
 for(const uncertain of [false,true]){
  let count=0;const storage=store();const r=new InquiryReceipts(storage,async()=>{count++;return uncertain?{accepted:false,uncertain:true}:{accepted:false,retryable:true};});
  assert.equal((await r.submit(input,'hash')).body.success,false);
  await r.submit(input,'hash');assert.equal(count,uncertain?1:2);
  if(uncertain){const restarted=new InquiryReceipts(storage,async()=>{count++;return {accepted:true};});assert.equal((await restarted.submit(input,'hash')).body.success,false);assert.equal(count,1);}
 }
});
test('daily guard bounds outbound volume and records expire after seven days',async()=>{
 let time=Date.parse('2026-11-04T12:00:00Z'),count=0;const storage=store(),r=new InquiryReceipts(storage,async()=>{count++;return {accepted:true};},()=>time);
 await storage.put('quota:2026-11-04',200);
 assert.equal((await r.submit(input,'hash')).status,429);assert.equal(count,0);
 await storage.put('quota:2026-11-04',0);await r.submit(input,'hash');
 time+=8*24*60*60*1000;await r.cleanup();assert.equal(storage.values.size,0);
});
test('continuous traffic cannot postpone daily expiry cleanup',async()=>{
 let time=Date.parse('2026-11-04T12:00:00Z');const storage=store(),r=new InquiryReceipts(storage,async()=>({accepted:true}),()=>time);
 await r.submit(input,'hash');const firstAlarm=await storage.getAlarm();time+=60000;
 await r.submit({...input,reference:'test-inquiry-20261104-02'},'hash2');
 assert.equal(await storage.getAlarm(),firstAlarm);
});
