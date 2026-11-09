const json=(body,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store','Referrer-Policy':'no-referrer'}});
export async function campProxy(req,settings=process.env,fetcher=fetch){
 if(!['GET','POST'].includes(req.method))return json({ok:false},405);
 const url=new URL(req.url);let body;
 if(req.method==='GET'){if(url.searchParams.get('action')!=='availability')return json({ok:false},400);body={action:'availability'};}
 else{if(req.headers.get('origin')!==url.origin)return json({ok:false},403);const raw=await req.text();if(raw.length>12000)return json({ok:false},413);try{body=JSON.parse(raw);}catch{return json({ok:false},400);}if(!['checkout','status','details'].includes(body.action))return json({ok:false},400);}
 // The private Hub owns activation and capacity; no client can override payment mode.
 if(!settings.PSP_HUB_SERVICE_TOKEN||!settings.PSP_PURCHASE_INGESTION_TOKEN)return json({ok:false,code:'CHECKOUT_NOT_CONFIGURED'},503);
 try{const response=await fetcher('https://psp-athlete-records.info329282.chatgpt.site/api/camp-bookings',{method:'POST',redirect:'manual',signal:AbortSignal.timeout(25000),headers:{'Content-Type':'application/json','OAI-Sites-Authorization':'Bearer '+settings.PSP_HUB_SERVICE_TOKEN,'x-psp-purchase-key':settings.PSP_PURCHASE_INGESTION_TOKEN},body:JSON.stringify({...body,testMode:false,publicOrigin:url.origin})});return json(await response.json(),response.status);}catch{return json({ok:false,code:'TEMPORARILY_UNAVAILABLE'},503);}
}
export default req=>campProxy(req);
