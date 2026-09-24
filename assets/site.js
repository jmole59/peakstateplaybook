document.addEventListener('DOMContentLoaded',()=>{
  const header=document.querySelector('.site-header');
  const btn=document.querySelector('.menu-btn');
  const dropdowns=[...document.querySelectorAll('.nav-dropdown')];

  if(header&&btn){
    btn.addEventListener('click',()=>{
      const open=header.classList.toggle('open');
      btn.setAttribute('aria-expanded',String(open));
      btn.textContent=open?'×':'☰';
    });
  }

  dropdowns.forEach(dropdown=>{
    const trigger=dropdown.querySelector('.nav-dropdown-trigger');
    if(!trigger) return;
    trigger.addEventListener('click',e=>{
      if(window.innerWidth<=1100){
        e.preventDefault();
        const open=dropdown.classList.toggle('open');
        trigger.setAttribute('aria-expanded',String(open));
      } else {
        trigger.blur();
      }
    });
  });

  document.querySelectorAll('.site-links a').forEach(a=>a.addEventListener('click',()=>{
    if(header) header.classList.remove('open');
    dropdowns.forEach(d=>d.classList.remove('open'));
    if(btn){btn.setAttribute('aria-expanded','false');btn.textContent='☰';}
  }));

  document.querySelectorAll('.faq-q').forEach(q=>q.addEventListener('click',()=>q.closest('.faq-item')?.classList.toggle('open')));
});