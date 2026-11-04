// Seven-day deduplication, bounded daily volume and no stored inquiry contents.
export class InquiryReceipts {
  constructor(storage,send,clock=()=>Date.now()) {
    this.storage=storage;this.send=send;this.clock=clock;this.active=new Map();this.quota=Promise.resolve();
  }
  submit(input,hash) {
    if(this.active.has(input.reference))return this.active.get(input.reference);
    const operation=this.process(input,hash).finally(()=>this.active.delete(input.reference));
    this.active.set(input.reference,operation);return operation;
  }
  async allowance() {
    const previous=this.quota;let release;this.quota=new Promise(resolve=>{release=resolve;});await previous;
    try {
      const day=new Date(this.clock()).toISOString().slice(0,10),key='quota:'+day;
      const count=(await this.storage.get(key))||0;
      if(count>=200)return false;
      await this.storage.put(key,count+1);return true;
    }finally{release();}
  }
  async process(input,hash) {
    const key='receipt:'+input.reference,existing=await this.storage.get(key);
    if(existing){
      if(existing.hash!==hash)return {status:409,body:{success:false,code:'reference_conflict'}};
      if(existing.state==='accepted')return {status:200,body:{success:true}};
      return {status:503,body:{success:false,code:'mail_unconfirmed'}};
    }
    if(!await this.allowance())return {status:429,body:{success:false,code:'daily_limit'}};
    const receipt={hash,state:'pending',at:this.clock()};
    await this.storage.put(key,receipt);
    if(!await this.storage.getAlarm())await this.storage.setAlarm(this.clock()+24*60*60*1000);
    let result;
    try{result=await this.send(input);}catch{result={accepted:false,uncertain:true};}
    if(result?.accepted===true){
      await this.storage.put(key,{...receipt,state:'accepted'});
      return {status:200,body:{success:true}};
    }
    if(result?.retryable===true||result?.code==='invalid')await this.storage.delete(key);
    else await this.storage.put(key,{...receipt,state:'uncertain'});
    return {status:result?.code==='invalid'?422:503,body:{success:false,code:result?.uncertain?'mail_unconfirmed':'mail_unavailable'}};
  }
  async cleanup() {
    const cutoff=this.clock()-7*24*60*60*1000;
    const receipts=await this.storage.list({prefix:'receipt:'});
    for(const [key,value] of receipts)if(value.at<cutoff)await this.storage.delete(key);
    const quotas=await this.storage.list({prefix:'quota:'});
    for(const [key] of quotas)if(Date.parse(key.slice(6))<cutoff)await this.storage.delete(key);
    if((await this.storage.list({limit:1})).size)await this.storage.setAlarm(this.clock()+24*60*60*1000);
  }
}
