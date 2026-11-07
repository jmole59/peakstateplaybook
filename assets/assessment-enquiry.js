
(() => {
 const form = document.getElementById('assessmentEnquiry');
 const service = document.getElementById('assessmentService');
 const status = document.getElementById('assessmentStatus');
 const button = document.getElementById('assessmentSubmit');
 document.querySelectorAll('[data-assessment-choice]').forEach(link => link.addEventListener('click', () => { service.value = link.dataset.assessmentChoice; }));
 // Reuse the existing registered Netlify "contact" form and its delivery destination.
 // No new email recipient, payment, booking, CRM record or notification is configured.
 form.addEventListener('submit', async event => {
   event.preventDefault();
   if (!form.reportValidity()) return;
   const values = new FormData(form);
   const labels = [['athlete-name','Athlete'],['age-group','Age / group'],['team','Team'],['competition','Competition'],['position','Position'],['game-date','Preferred game date'],['tip-off','Tip-off time (Melbourne)'],['venue','Venue'],['suburb','Suburb'],['home-away','Home / away'],['development-goal','Development goal'],['review-focus','Review focus']];
   const selectedService = service.selectedOptions[0].textContent;
   const message = ['LIVE GAME ASSESSMENT ENQUIRY','Service: '+selectedService,'Parent / guardian: '+values.get('parent-name'),'Mobile: '+values.get('mobile'),...labels.map(([key,label]) => label+': '+(values.get(key)||'Not provided')),'Parent/guardian consent: Yes','Booking status: Enquiry only; availability and venue requirements must be confirmed before payment.'].join('\n');
   const payload = new URLSearchParams({'form-name':'contact','first-name':values.get('parent-name'),'last-name':'','email':values.get('email'),'service':'Other','message':message,'website':values.get('website')||''});
   button.disabled = true; status.textContent = 'Sending your enquiry…';
   try {
     const response = await fetch('/', {method:'POST', headers:{'Content-Type':'application/x-www-form-urlencoded'}, body:payload.toString()});
     if (!response.ok) throw new Error('Enquiry not accepted');
     status.textContent = 'Thanks for your enquiry. I’ll review the game details and get back to you to confirm availability and the next steps.';
     form.reset();
   } catch (_) {
     status.textContent = 'Your enquiry could not be sent. Your details are still here. Please try again or email info@peakstateplaybook.com.';
   } finally { button.disabled = false; }
 });
})();
