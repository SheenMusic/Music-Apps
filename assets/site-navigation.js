/* Shared homepage menu; never loaded by lessons or interactive course apps. */
(() => {
  'use strict';
  const button = document.getElementById('menuButton');
  const panel = document.getElementById('menuPanel');
  if(!button || !panel) return;
  const section = location.pathname.split('/').filter(Boolean)[0];
  const current = ['scores','courses','articles','works'].includes(section) ? section : 'home';
  for(const link of panel.querySelectorAll('[data-nav-section]')){
    if(link.dataset.navSection === current) link.setAttribute('aria-current','page');
  }
  let previousInert = [];
  function positionPanel(){
    const rect = button.getBoundingClientRect();
    const header = button.closest('header').getBoundingClientRect();
    panel.style.setProperty('--menu-right',`${document.documentElement.clientWidth-rect.right}px`);
    panel.style.setProperty('--menu-top',`${Math.max(12,header.bottom)}px`);
  }
  window.addEventListener('resize',()=>{if(button.getAttribute('aria-expanded') === 'true') positionPanel()});
  panel.addEventListener('click',event=>{if(!event.target.closest('.menu-links')) setMenu(false)});
  function setMenu(open,keyboard = false){
    button.setAttribute('aria-expanded',String(open));
    button.setAttribute('aria-label',open ? '关闭菜单' : '打开菜单');
    panel.classList.toggle('is-open',open);
    panel.setAttribute('aria-hidden',String(!open));
    panel.inert = !open;
    document.body.classList.toggle('menu-open',open);
    if(open){
      positionPanel();
      previousInert = Array.from(document.body.children)
        .filter(node=>node !== panel && !node.contains(button) && !['SCRIPT','STYLE','TEMPLATE'].includes(node.tagName))
        .map(node=>[node,node.inert]);
      for(const [node] of previousInert) node.inert = true;
      if(keyboard) panel.querySelector('[aria-current="page"]')?.focus({preventScroll:true});
    }else{
      for(const [node,inert] of previousInert) node.inert = inert;
      previousInert = [];
      button.focus({preventScroll:true});
    }
  }
  button.addEventListener('click',event=>setMenu(button.getAttribute('aria-expanded') !== 'true',event.detail === 0));
  panel.querySelectorAll('a').forEach(link=>link.addEventListener('click',()=>setMenu(false)));
  document.addEventListener('keydown',event=>{
    if(button.getAttribute('aria-expanded') !== 'true') return;
    if(event.key === 'Escape'){event.preventDefault();setMenu(false)}
    if(event.key === 'Tab'){
      const controls = [button,...panel.querySelectorAll('a[href]')];
      const index = controls.indexOf(document.activeElement);
      if(event.shiftKey && index <= 0){event.preventDefault();controls.at(-1).focus()}
      else if(!event.shiftKey && (index === controls.length-1 || index === -1)){event.preventDefault();button.focus()}
    }
  });
})();
