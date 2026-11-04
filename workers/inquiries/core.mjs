const allowedOrigins=new Set(['https://dokipoki.lt','https://www.dokipoki.lt',
  'https://dokipoki-review.dokipoki-os-portal.workers.dev','http://127.0.0.1:4177']);
export async function limitedText(request,maximum=8192){
  if(Number(request.headers.get('content-length')||0)>maximum)throw new Error('too_large');
  if(!request.body)return '';
  const reader=request.body.getReader(),decoder=new TextDecoder();let size=0,text='';
  try{
    while(true){const part=await reader.read();if(part.done)break;size+=part.value.byteLength;
      if(size>maximum){await reader.cancel();throw new Error('too_large');}text+=decoder.decode(part.value,{stream:true});}
    return text+decoder.decode();
  }finally{reader.releaseLock();}
}
export async function parseInquiry(request){
  const text=await limitedText(request);
  const cloned=new Request(request.url,{method:'POST',headers:request.headers,body:text});
  const fields=await cloned.formData();
  const value=(name,max=200)=>{const v=fields.get(name)||'';if(typeof v!=='string'||v.length>max||/[\u0000-\u001f\u007f]/.test(v))throw Error('invalid');return v.trim();};
  if(value('_honey'))throw Error('invalid');
  const input={
    reference:value('Užklausos numeris',80),contact:value('Kontaktas',120),city:value('Miestas',80),
    date:value('Šventės data',30),program:value('Programa',160),character:value('Personažas',120),
    sourceUrl:value('Užklausos puslapis',240),entryPath:value('Pradinis puslapis',200),
    channel:value('Užklausos kanalas',40)
  };
  if(!/^[a-zA-Z0-9-]{16,80}$/.test(input.reference)||!input.city||!input.contact||!input.date||!input.program)throw Error('invalid');
  return input;
}
export async function inquiryHash(input){
  const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(input)));
  return [...new Uint8Array(bytes)].map(x=>x.toString(16).padStart(2,'0')).join('');
}
export async function inquiryRequest(request,env){
  const origin=request.headers.get('origin')||'';
  const cors={'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Methods':'POST, OPTIONS',
    'Access-Control-Allow-Headers':'Content-Type, Accept','Vary':'Origin','Cache-Control':'no-store',
    'X-Content-Type-Options':'nosniff'};
  const respond=(body,status=200)=>Response.json(body,{status,headers:cors});
  if(!allowedOrigins.has(origin))return Response.json({success:false},{status:403,headers:{'Cache-Control':'no-store'}});
  if(request.method==='OPTIONS')return new Response(null,{status:204,headers:cors});
  if(request.method!=='POST')return respond({success:false},405);
  if(new URL(request.url).pathname!=='/inquiry')return respond({success:false},404);
  const ip=request.headers.get('cf-connecting-ip')||'unknown';
  const limit=await env.INQUIRY_RATE_LIMIT.limit({key:ip});
  if(!limit.success)return respond({success:false,code:'rate_limit'},429);
  let input;
  try{input=await parseInquiry(request);}catch(error){return respond({success:false,code:'invalid'},error.message==='too_large'?413:422);}
  const id=env.RECEIPTS.idFromName('website-inquiries');
  try {
    const response=await env.RECEIPTS.get(id).fetch('https://internal/submit',{
      method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({input,hash:await inquiryHash(input)})
    });
    return respond(await response.json(),response.status);
  }catch{return respond({success:false,code:'mail_unconfirmed'},503);}
}
