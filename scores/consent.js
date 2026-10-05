/* Shared FREE / PAID acknowledgement; paid consent is never persisted. */
(() => {
  'use strict';
  const usage = '本站乐谱仅供个人学习、交流与研究使用，请勿二次转发、分享、再次销售或用于其他商业用途。';
  const accepted = new Set();
  let pending = null;
  const dialog = document.createElement('dialog');
  dialog.className = 'score-consent';
  dialog.setAttribute('aria-labelledby','scoreConsentTitle');
  dialog.innerHTML = `<div class="consent-heading"><h2 id="scoreConsentTitle"></h2><button type="button" class="close-button" aria-label="关闭说明">×</button></div>
    <div class="consent-copy"><h3 class="paid-only">乐谱使用</h3><p>${usage}</p>
    <div class="paid-only"><h3>交付与退款</h3><p>目前乐谱由人工确认订单后发送，一般会在<strong>付款后 24 小时内</strong>发送至你填写的邮箱，请留意收件箱。</p>
    <p>如付款超过 <strong>24 小时仍未收到乐谱</strong>，可以申请<strong>取消订单并退款</strong>。乐谱一经发送至邮箱，由于数字商品具有可复制性，将<strong>不再接受退款</strong>。</p>
    <p class="consent-note">24 小时以付款成功时间为起点。</p></div></div>
    <label class="consent-check"><input type="checkbox">我已阅读并理解以上说明</label>
    <button type="button" class="button primary consent-continue" disabled></button>`;
  document.body.append(dialog);
  const checkbox = dialog.querySelector('input');
  const next = dialog.querySelector('.consent-continue');
  let previousOverflow = '', previousFocus;
  checkbox.addEventListener('change',()=>{next.disabled = !checkbox.checked});
  dialog.querySelector('.close-button').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('close',()=>{
    document.body.style.overflow = previousOverflow;
    previousFocus?.focus({preventScroll:true});
    const resolve = pending;pending = null;
    resolve?.(dialog.returnValue === 'accepted');
  });
  next.addEventListener('click',()=>{if(checkbox.checked) dialog.close('accepted')});
  function request(mode){
    if(pending) return Promise.resolve(false);
    dialog.querySelector('#scoreConsentTitle').textContent = mode === 'paid' ? '购买前请确认' : '说明';
    dialog.querySelectorAll('.paid-only').forEach(node=>{node.hidden = mode !== 'paid'});
    next.textContent = mode === 'paid' ? '继续付款 →' : '继续查看乐谱 →';
    checkbox.checked = false;next.disabled = true;dialog.returnValue = '';
    previousFocus = document.activeElement;previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return new Promise(resolve=>{pending = resolve;dialog.showModal();checkbox.focus({preventScroll:true})});
  }
  function hasAccepted(key){
    if(accepted.has(key)) return true;
    try{return sessionStorage.getItem(`score-consent:${key}`) === 'accepted'}catch{return false}
  }
  document.addEventListener('click',async event=>{
    const link = event.target.closest('a[data-score-consent]');
    if(!link || event.defaultPrevented || hasAccepted(link.dataset.scoreConsent)) return;
    event.preventDefault();
    const scoreID = link.dataset.scoreId, scoreTitle = link.dataset.scoreTitle;
    if(!await request('free')) return;
    // Only an explicitly acknowledged FREE continuation counts; cached
    // consent, opening the dialog and checkbox changes never emit this event.
    if(scoreID && scoreTitle && typeof window.gtag === 'function'){
      try{window.gtag('event','score_download',{score_id:scoreID,score_title:scoreTitle,score_type:'free'})}
      catch{ /* Analytics must not block viewing or downloading a score. */ }
    }
    const key = link.dataset.scoreConsent;accepted.add(key);
    try{sessionStorage.setItem(`score-consent:${key}`,'accepted')}catch{}
    // Keep the original URL, preview target and download filename unchanged.
    const continuation = link.cloneNode(true);continuation.removeAttribute('data-score-consent');
    if(event.ctrlKey || event.metaKey || event.shiftKey) continuation.target = '_blank';
    continuation.hidden = true;document.body.append(continuation);continuation.click();continuation.remove();
  });
  window.scoreConsent = {request};
})();
