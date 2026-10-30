export default async function handler(req){
 if(req.method!=='POST')return Response.json({ok:false},{status:405});
 if(!process.env.PSP_HUB_SERVICE_TOKEN)return Response.json({ok:false,code:'NOT_CONFIGURED'},{status:503});
 if(!req.headers.get('tally-signature'))return Response.json({ok:false},{status:401});
 const raw=await req.text();if(raw.length>100000)return Response.json({ok:false},{status:413});
 try{const r=await fetch('https://psp-athlete-records.info329282.chatgpt.site/api/film-audit-webhook',{method:'POST',redirect:'manual',signal:AbortSignal.timeout(9000),headers:{'Content-Type':'application/json','OAI-Sites-Authorization':'Bearer '+process.env.PSP_HUB_SERVICE_TOKEN,'tally-signature':req.headers.get('tally-signature')},body:raw});const body=await r.json().catch(()=>null);const ok=r.ok&&body?.ok===true;return Response.json({ok,...(!ok?{code:'HUB_UNAVAILABLE',upstreamStatus:r.status,hubCode:body?.code||null}:{})},{status:ok?200:r.status===401?401:503});}catch{return Response.json({ok:false,code:'HUB_REQUEST_FAILED'},{status:503});}
}
