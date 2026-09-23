document.addEventListener('DOMContentLoaded',function(){
 const header=document.querySelector('.site-header'),menu=document.querySelector('.menu-btn');
 if(header&&menu){menu.addEventListener('click',function(){const o=header.classList.toggle('open');menu.setAttribute('aria-expanded',String(o));menu.textContent=o?'×':'☰';});}
 document.querySelectorAll('.nav-dropdown-trigger').forEach(function(trigger){trigger.addEventListener('click',function(e){if(window.innerWidth<=1100){e.preventDefault();const d=trigger.closest('.nav-dropdown');const o=d.classList.toggle('open');trigger.setAttribute('aria-expanded',String(o));}});});
 document.querySelectorAll('.site-links a').forEach(function(a){a.addEventListener('click',function(){if(header)header.classList.remove('open');if(menu){menu.setAttribute('aria-expanded','false');menu.textContent='☰';}});});
});