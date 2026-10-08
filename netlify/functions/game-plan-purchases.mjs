import {createHmac,timingSafeEqual} from 'node:crypto';
const product='prod_VMHqgkptMAFwQg';
const id=v=>typeof v==='string'?v:v?.id||'';
export function verifyStripe(raw,signature,secret,now=Date.now()){
 const parts=String(signature||'').split(',').map(p=>p.split('=')),t=parts.find(p=>p[0]==='t')?.[1],signatures=parts.filter(p=>p[0]==='v1').map(p=>p[1]);
 if(!secret?.startsWith('whsec_')||!/^\d+$/.test(t||'')||Math.abs(now/1000-Number(t))>300)throw Error('BAD_SIGNATURE');
 const expected=createHmac('sha256',secret).update(t+'.'+raw).digest();
 if(!signatures.some(s=>/^[a-f0-9]{64}$/i.test(s)&&timingSafeEqual(expected,Buffer.from(s,'hex'))))throw Error('BAD_SIGNATURE');
 return JSON.parse(raw);
}
export async function normalise(event,settings,fetcher=fetch){
 if(event.livemode!==true)return null;
 if(!['invoice.payment_succeeded','charge.refunded'].includes(event.type))return null;
 const api=async path=>{if(!settings.STRIPE_READ_KEY)throw Error('READ_KEY_REQUIRED');const r=await fetcher('https://api.stripe.com/v1/'+path,{headers:{Authorization:'Bearer '+settings.STRIPE_READ_KEY,'Stripe-Version':'2025-06-30.basil'},signal:AbortSignal.timeout(15000)});if(!r.ok)throw Error('STRIPE_LOOKUP_FAILED');return r.json();};
 const base={eventId:event.id,livemode:true,occurredAt:new Date(event.created*1000).toISOString()},o=event.data?.object;
 if(event.type==='charge.refunded')return {...base,type:'refund',refund:{chargeId:o.id,invoiceId:id(o.invoice),paymentIntentId:id(o.payment_intent),amount:o.amount,amountRefunded:o.amount_refunded}};
 if(!/^in_[A-Za-z0-9]+$/.test(o?.id||'')||o.status!=='paid'||o.paid_out_of_band||!(o.amount_paid>0))return null;
 let lines=o.lines;if(!lines?.data)lines=await api('invoices/'+encodeURIComponent(o.id)+'/lines?limit=100');
 let all=[...lines.data],page=lines;for(let n=0;page.has_more;n++){if(n>=10||!page.data.length)throw Error('INCOMPLETE_LINES');page=await api('invoices/'+encodeURIComponent(o.id)+'/lines?limit=100&starting_after='+encodeURIComponent(page.data.at(-1).id));all.push(...page.data);}
 const products=[];for(const line of all){let p=id(line.pricing?.price_details?.product||line.price?.product||line.plan?.product);if(!p){const price=id(line.pricing?.price_details?.price||line.price);if(!price)throw Error('PRODUCT_UNCONFIRMED');p=id((await api('prices/'+encodeURIComponent(price))).product);}products.push(p);}
 if(!products.includes(product))return null;
 let email=o.customer_email,name=o.customer_name;if(!email){const c=await api('customers/'+encodeURIComponent(id(o.customer)));email=c.email;name=c.name;}
 let pi=id(o.payment_intent),charge=id(o.charge);
 if(!pi&&!charge){let payments=o.payments||await api('invoice_payments?invoice='+encodeURIComponent(o.id)+'&status=paid&limit=100');const paid=payments.data.filter(p=>p.status==='paid');if(payments.has_more||paid.length!==1)throw Error('PAYMENT_LINK_REVIEW');pi=id(paid[0].payment?.payment_intent);charge=id(paid[0].payment?.charge);if(!pi&&!charge)throw Error('PAYMENT_LINK_REVIEW');}
 return {...base,type:'purchase',purchase:{productId:product,invoiceId:o.id,email,name,amountPaid:o.amount_paid,currency:o.currency,chargeId:charge,paymentIntentId:pi,purchasedAt:new Date((o.status_transitions?.paid_at||event.created)*1000).toISOString()}};
}
export async function purchaseWebhook(req,settings=process.env,fetcher=fetch){
 const reply=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
 if(req.method!=='POST')return reply({ok:false},405);
 if(settings.GAME_PLAN_PURCHASES_ENABLED!=='true'||!settings.STRIPE_PURCHASE_WEBHOOK_SECRET||!settings.PSP_PURCHASE_INGESTION_TOKEN||!settings.PSP_HUB_SERVICE_TOKEN)return reply({ok:false,code:'NOT_CONFIGURED'},503);
 if(Number(req.headers.get('content-length'))>1000000)return reply({ok:false},413);
 const raw=await req.text();if(raw.length>1000000)return reply({ok:false},413);
 let event;try{event=verifyStripe(raw,req.headers.get('stripe-signature'),settings.STRIPE_PURCHASE_WEBHOOK_SECRET);}catch{return reply({ok:false,code:'INVALID_SIGNATURE'},400);}
 try{const body=await normalise(event,settings,fetcher);if(!body)return reply({ok:true,ignored:true});
 const r=await fetcher('https://psp-athlete-records.info329282.chatgpt.site/api/purchases',{method:'POST',redirect:'manual',signal:AbortSignal.timeout(20000),headers:{'Content-Type':'application/json','OAI-Sites-Authorization':'Bearer '+settings.PSP_HUB_SERVICE_TOKEN,'x-psp-purchase-key':settings.PSP_PURCHASE_INGESTION_TOKEN},body:JSON.stringify(body)});
 if(!r.ok||!(await r.json()).ok)throw Error('HUB_UNAVAILABLE');return reply({ok:true});
 }catch{return reply({ok:false,code:'RETRY_REQUIRED'},503);}
}
export default req=>purchaseWebhook(req);
