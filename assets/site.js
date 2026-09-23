document.addEventListener('DOMContentLoaded',()=>{
 const header=document.querySelector('.site-header');
 const btn=document.querySelector('.menu-btn');
 if(header&&btn){btn.addEventListener('click',()=>{const o=header.classList.toggle('open');btn.setAttribute('aria-expanded',String(o));btn.textContent=o?'×':'☰'});}
 document.querySelectorAll('.nav-dropdown-trigger').forEach(trigger=>{
   trigger.addEventListener('click',e=>{
     if(window.innerWidth<=1100){e.preventDefault();trigger.closest('.nav-dropdown')?.classList.toggle('open');}
   });
 });
 document.querySelectorAll('.site-links a').forEach(a=>a.addEventListener('click',()=>{
   if(header)header.classList.remove('open');
   document.querySelectorAll('.nav-dropdown').forEach(d=>d.classList.remove('open'));
   if(btn){btn.setAttribute('aria-expanded','false');btn.textContent='☰'}
 }));
 document.querySelectorAll('.faq-q').forEach(q=>q.addEventListener('click',()=>q.closest('.faq-item').classList.toggle('open')));
});