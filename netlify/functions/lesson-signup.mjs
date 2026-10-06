import {hub,json} from './lib/bridge.mjs';
export async function signup(req,settings=process.env,fetcher=fetch){
 if(req.method!=='POST')return json({ok:false,code:'METHOD_NOT_ALLOWED'},405);
 const productionOrigins=['https://www.peakstateplaybook.com','https://peakstateplaybook.com'];
 // Never activate preview deployments, even if an old test flag or secret remains.
 if((settings.CONTEXT&&settings.CONTEXT!=='production')||!productionOrigins.includes(new URL(req.url).origin))return json({ok:false,code:'SIGNUP_DISABLED'},503);
 if(req.headers.has('x-psp-release-test'))return json({ok:false,code:'TEST_ACCESS_REMOVED'},400);
 if(settings.LESSON_SIGNUP_ENABLED!=='true')return json({ok:false,code:'SIGNUP_DISABLED'},503);
 const allowed=(settings.LESSON_ALLOWED_ORIGINS||'').split(',').map(s=>s.trim()).filter(o=>productionOrigins.includes(o));
 if(!allowed.includes(req.headers.get('origin')))return json({ok:false,code:'ORIGIN_NOT_ALLOWED'},403);
 if(!req.headers.get('content-type')?.startsWith('application/json'))return json({ok:false,code:'INVALID_REQUEST'},400);
 const raw=await req.text();if(raw.length>12000)return json({ok:false,code:'TOO_LARGE'},413);
 let body;try{body=JSON.parse(raw);}catch{return json({ok:false,code:'INVALID_REQUEST'},400);}
 if(!body||typeof body!=='object'||Array.isArray(body)||typeof body.email!=='string'||!body.email.trim()||typeof body.requestId!=='string'||!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(body.requestId)||body.website||typeof body.turnstileToken!=='string'||body.turnstileToken.length>2048)return json({ok:false,code:'INVALID_REQUEST'},400);
 if(!settings.TURNSTILE_SECRET_KEY)return json({ok:false,code:'NOT_CONFIGURED'},503);
 let failureCode='CHALLENGE_UNAVAILABLE';
 try{
  const verification=await fetcher('https://challenges.cloudflare.com/turnstile/v0/siteverify',{method:'POST',redirect:'manual',signal:AbortSignal.timeout(5000),headers:{'Content-Type':'application/json'},body:JSON.stringify({secret:settings.TURNSTILE_SECRET_KEY,response:body.turnstileToken,idempotency_key:body.requestId})});
  const challenge=await verification.json();
  if(Array.isArray(challenge['error-codes'])&&challenge['error-codes'].some(c=>['missing-input-secret','invalid-input-secret'].includes(c)))return json({ok:false,code:'VERIFICATION_KEY_INVALID'},503);
  if(!verification.ok)throw Error('CHALLENGE_UNAVAILABLE');
  if(challenge.success!==true||challenge.action!=='lesson_signup'||!allowed.some(o=>new URL(o).hostname===challenge.hostname))return json({ok:false,code:'CHALLENGE_FAILED'},403);
  // Explicit allowlist: the public browser cannot request dispatch or mutate delivery events.
  failureCode='HUB_SAVE_UNAVAILABLE';
  const saved=await hub({action:'signup',email:body.email,firstName:body.firstName,requestId:body.requestId,marketingConsent:body.marketingConsent,consentVersion:body.consentVersion},fetcher,settings);
  if(saved.saved!==true)throw Error('NOT_SAVED');
  return json({ok:true,saved:true,message:'Your request is saved. Your lesson email will be sent shortly.'},202);
 }catch{return json({ok:false,code:failureCode,message:'We could not confirm your request. Please try again.'},503);}
}
export default function(req){return signup(req);}
