import {hub,json} from './lib/bridge.mjs';
export default async function(){if(process.env.LESSON_DISPATCH_ENABLED!=='true')return json({status:'disabled'});try{return json(await hub({action:'dispatch'}));}catch{return json({ok:false,code:'DISPATCH_FAILED'},503);}}
export const config={schedule:'*/5 * * * *'};
