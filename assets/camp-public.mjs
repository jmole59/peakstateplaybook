import {CAMPS,CAMP_VENUES} from './camp-model.mjs';
// Read-only venue display; booking, capacity and payments stay in the existing flow.
function show(venues){document.querySelectorAll('[data-camp-venue]').forEach(el=>{const id=el.dataset.campVenue;el.textContent=id?venues[id]||'To be confirmed':CAMPS.map(c=>c.name+': '+(venues[c.id]||'To be confirmed')).join(' · ');});}
show(CAMP_VENUES);
fetch('/.netlify/functions/camp-bookings?action=availability',{cache:'no-store'}).then(async response=>{if(!response.ok)return;const data=await response.json();if(data.ok&&data.venues)show(data.venues);}).catch(()=>{});
