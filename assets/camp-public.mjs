// Venue is configured once in the private camp setup screen.
fetch('/.netlify/functions/camp-bookings?action=availability',{cache:'no-store'}).then(async response=>{if(!response.ok)return;const data=await response.json();if(data.ok&&typeof data.venue==='string')document.querySelectorAll('[data-camp-venue]').forEach(el=>el.textContent=data.venue);}).catch(()=>{});
