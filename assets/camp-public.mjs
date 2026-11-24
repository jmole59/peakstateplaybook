import {CAMPS,CAMP_VENUES,CAMP_CAPACITY} from './camp-model.mjs';

// Full blocks and Summer Passes are limited by their least available date.
export function spotsFor(campId,group,remaining){
 const camps=campId==='summer'?CAMPS:CAMPS.filter(c=>c.id===campId);
 const counts=camps.flatMap(c=>c.dates.map(date=>remaining?.[`${group}:${date}`]));
 if(!counts.length||counts.some(n=>!Number.isInteger(n)||n<0||n>CAMP_CAPACITY))return null;
 return Math.min(...counts);
}

export function spotLabel(count){
 if(count===null)return 'Check availability when booking';
 if(count===0)return 'Full block sold out';
 return `${count<=3?'Only ':''}${count} ${count===1?'spot':'spots'} left`;
}

export function showAvailability(root,data){
 root.querySelectorAll('[data-camp-availability]').forEach(el=>{
  const count=data?.ok&&data.checkoutEnabled?spotsFor(el.dataset.campAvailability,el.dataset.campGroup,data.remaining):null;
  el.textContent=data?.ok&&!data.checkoutEnabled?'Bookings opening soon':el.dataset.campAvailability==='summer'&&count===0?'Summer Pass sold out':spotLabel(count);
  el.dataset.availabilityState=count===0?'sold-out':count!==null&&count<=3?'low':'available';
 });
}

if(typeof document!=='undefined'){
 function showVenues(venues){document.querySelectorAll('[data-camp-venue]').forEach(el=>{const id=el.dataset.campVenue;el.textContent=id?venues[id]||'To be confirmed':CAMPS.map(c=>c.name+': '+(venues[c.id]||'To be confirmed')).join(' · ');});}
 showVenues(CAMP_VENUES);
 let loading=false;
 async function refresh(){
  if(loading||document.hidden)return;
  loading=true;
  try{
   const response=await fetch('/.netlify/functions/camp-bookings?action=availability',{cache:'no-store',signal:AbortSignal.timeout(12000)});
   if(!response.ok)throw Error('Availability unavailable');
   const data=await response.json();
   if(!data.ok)throw Error('Availability unavailable');
   if(data.venues)showVenues(data.venues);
   showAvailability(document,data);
  }catch{showAvailability(document,null);}finally{loading=false;}
 }
 refresh();
 setInterval(refresh,30000);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh();});
 window.addEventListener('pageshow',refresh);
}
