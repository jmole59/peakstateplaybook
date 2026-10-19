import {hub,json} from './lib/bridge.mjs';
export default async function(){
 if(process.env.STARTER_DISPATCH_ENABLED!=='true')return json({ok:true,enabled:false});
 try{return json(await hub({action:'starter_dispatch'}));}catch{return json({ok:false,code:'DISPATCH_FAILED'},503);}
}
export const config={schedule:'*/5 * * * *'};
