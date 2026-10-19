import {timingSafeEqual} from 'node:crypto';
import {hub,json} from './lib/bridge.mjs';
export async function starterSignup(req,settings=process.env,fetcher=fetch){
 if(req.method!=='POST')return json({ok:false,code:'METHOD_NOT_ALLOWED'},405);
 const key=settings.PSP_STARTER_ZAPIER_KEY,received=req.headers.get('x-psp-starter-key')||'';
 if(!key||key.length<32)return json({ok:false,code:'NOT_CONFIGURED'},503);
 if(Buffer.byteLength(received)!==Buffer.byteLength(key)||!timingSafeEqual(Buffer.from(received),Buffer.from(key)))return json({ok:false,code:'UNAUTHORISED'},401);
 if(settings.CONTEXT&&settings.CONTEXT!=='production')return json({ok:false,code:'DISABLED'},503);
 const raw=await req.text();if(raw.length>12000)return json({ok:false,code:'TOO_LARGE'},413);
 let body;try{body=JSON.parse(raw);}catch{return json({ok:false,code:'INVALID_REQUEST'},400);}
 if(!body||Array.isArray(body))return json({ok:false,code:'INVALID_REQUEST'},400);
 // A dedicated key can only ingest Starter records, never dispatch mail,
 // change payment records, unsuppress contacts or access the private Hub.
 const payload={action:'starter_signup',communityId:body.communityId,memberId:body.memberId,email:body.email,name:body.name,joinedAt:body.joinedAt,starterMember:body.starterMember,role:body.role,active:body.active,marketingSubscribed:body.marketingSubscribed,consentEvidence:body.consentEvidence};
 try{return json(await hub(payload,fetcher,settings),202);}catch{return json({ok:false,code:'HUB_UNAVAILABLE'},503);}
}
export default function(req){return starterSignup(req);}
