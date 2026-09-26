document.addEventListener('DOMContentLoaded',function(){
  const header=document.querySelector('.site-header');
  const menu=document.querySelector('.menu-btn');
  const dropdowns=[...document.querySelectorAll('.nav-dropdown')];
  if(header&&menu){menu.addEventListener('click',function(){const o=header.classList.toggle('open');menu.setAttribute('aria-expanded',String(o));menu.textContent=o?'×':'☰';});}
  dropdowns.forEach(function(d){const trigger=d.querySelector('.nav-dropdown-trigger');if(!trigger)return;trigger.addEventListener('click',function(e){if(window.innerWidth<=1100){e.preventDefault();const o=d.classList.toggle('open');trigger.setAttribute('aria-expanded',String(o));}else{trigger.blur();}});});
  document.querySelectorAll('.site-links a').forEach(function(a){a.addEventListener('click',function(){if(header)header.classList.remove('open');dropdowns.forEach(function(d){d.classList.remove('open');});if(menu){menu.setAttribute('aria-expanded','false');menu.textContent='☰';}});});
});