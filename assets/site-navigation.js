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
  // Keep one real toggle; its placeholder preserves the existing header grid.
  const placeholder = document.createElement('span');
  placeholder.className = 'menu-toggle-placeholder';placeholder.setAttribute('aria-hidden','true');
  function syncTogglePosition(rect = placeholder.getBoundingClientRect()){
    button.style.setProperty('--toggle-left',`${rect.left}px`);
    button.style.setProperty('--toggle-top',`${rect.top}px`);
  }
  window.addEventListener('resize',()=>{if(button.getAttribute('aria-expanded') === 'true') syncTogglePosition()});
  panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');panel.setAttribute('aria-label','网站导航');
  panel.addEventListener('click',event=>{if(!event.target.closest('.menu-inner,.menu-button')) setMenu(false)});
  function setMenu(open,keyboard = false){
    const toggleRect = open ? button.getBoundingClientRect() : null;
    button.setAttribute('aria-expanded',String(open));
    button.setAttribute('aria-label',open ? '关闭菜单' : '打开菜单');
    panel.classList.toggle('is-open',open);
    panel.setAttribute('aria-hidden',String(!open));
    panel.inert = !open;
    document.body.classList.toggle('menu-open',open);
    if(open){
      button.replaceWith(placeholder);panel.append(button);button.classList.add('menu-toggle-open');
      syncTogglePosition(toggleRect);
      previousInert = Array.from(document.body.children)
        .filter(node=>node !== panel && !['SCRIPT','STYLE','TEMPLATE'].includes(node.tagName))
        .map(node=>[node,node.inert]);
      for(const [node] of previousInert) node.inert = true;
      (keyboard ? panel.querySelector('[aria-current="page"]') : button)?.focus({preventScroll:true});
    }else{
      for(const [node,inert] of previousInert) node.inert = inert;
      previousInert = [];
      placeholder.replaceWith(button);button.classList.remove('menu-toggle-open');
      button.style.removeProperty('--toggle-left');button.style.removeProperty('--toggle-top');
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
