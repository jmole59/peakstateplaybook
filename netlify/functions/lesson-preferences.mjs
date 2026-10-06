import {hub} from './lib/bridge.mjs';
function page(text,token='',status=200){return new Response(`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Email preferences | Peak State Playbook</title><body><main><h1>Peak State Playbook</h1><p>${text}</p>${token?`<form method="post"><input type="hidden" name="token" value="${token}"><button type="submit">Unsubscribe from promotional emails</button></form>`:''}</main></body></html>`,{status,headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','Referrer-Policy':'no-referrer','Content-Security-Policy':"default-src 'none'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'"}});}
export default async function(req){
 if(!['GET','POST'].includes(req.method))return page('Method not allowed.','',405);
 const token=req.method==='GET'?new URL(req.url).searchParams.get('token'):(await req.formData()).get('token');
 if(typeof token!=='string'||! /^[0-9a-f-]{72}$/i.test(token))return page('This preferences link is invalid.','',400);
 // A link preview or email scanner must not change consent.
 if(req.method==='GET')return page('You can stop occasional tips and program updates below. Your requested lesson remains available.',token);
 try{await hub({action:'unsubscribe',token});return page('You have been unsubscribed from promotional emails.');}catch{return page('We could not confirm the change. Please try again.','',503);}
}
