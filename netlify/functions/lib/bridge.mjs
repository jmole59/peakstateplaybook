export function json(value,status=200){return Response.json(value,{status,headers:{'Cache-Control':'no-store'}});}
export async function hub(body,fetcher=fetch,settings=process.env){
 const origin=new URL(settings.PSP_HUB_ORIGIN||'https://psp-athlete-records.info329282.chatgpt.site');
 if(origin.protocol!=='https:'||origin.hostname!=='psp-athlete-records.info329282.chatgpt.site'||!settings.PSP_HUB_SERVICE_TOKEN||!settings.PSP_LEAD_INGESTION_TOKEN)throw Error('NOT_CONFIGURED');
 const response=await fetcher(new URL('/api/leads',origin),{method:'POST',redirect:'manual',signal:AbortSignal.timeout(20000),headers:{'Content-Type':'application/json','OAI-Sites-Authorization':'Bearer '+settings.PSP_HUB_SERVICE_TOKEN,'x-psp-lead-key':settings.PSP_LEAD_INGESTION_TOKEN},body:JSON.stringify(body)});
 const result=await response.json();
 if(!response.ok||result.ok===false)throw Error('HUB_UNAVAILABLE');
 return result;
}
