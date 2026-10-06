import {hub,json} from './lib/bridge.mjs';
import {verifyWebhook} from './lib/signature.mjs';
export default async function(req){
 if(req.method!=='POST')return json({ok:false},405);
 if(!process.env.RESEND_WEBHOOK_SECRET)return json({ok:false},503);
 const raw=await req.text();if(raw.length>200000)return json({ok:false},413);
 let verified;try{verified=verifyWebhook(raw,req.headers,process.env.RESEND_WEBHOOK_SECRET);}catch{return json({ok:false,code:'INVALID_SIGNATURE'},400);}
 const {id,event}=verified;
 try{await hub({action:'event',eventId:id,providerId:event.data?.email_id,type:event.type,occurredAt:event.created_at});return json({ok:true});}catch{return json({ok:false,code:'EVENT_SAVE_FAILED'},503);}
}
