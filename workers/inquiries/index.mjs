import {DurableObject} from 'cloudflare:workers';
import {inquiryRequest} from './core.mjs';
import {InquiryReceipts} from './receipt.mjs';
export class WebsiteInquiryReceipts extends DurableObject {
  constructor(ctx,env){
    super(ctx,env);
    this.receipts=new InquiryReceipts(ctx.storage,input=>env.MAILER.sendInquiry(input));
  }
  async fetch(request){
    const {input,hash}=await request.json();
    const operation=this.receipts.submit(input,hash);
    this.ctx.waitUntil(operation);
    const result=await operation;
    return Response.json(result.body,{status:result.status});
  }
  alarm(){return this.receipts.cleanup();}
}
export default {fetch:inquiryRequest};
