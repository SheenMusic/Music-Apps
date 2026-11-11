/* Shared FREE / PAID acknowledgement; paid consent is never persisted. */
(() => {
  'use strict';
  // Text follows the site language; Japanese and English share the same structure.
  const text = {
    zh:{usage:'本站乐谱仅供个人学习、交流与研究使用，请勿二次转发、分享、再次销售或用于其他商业用途。',
      usageTitle:'乐谱使用',deliveryTitle:'交付与退款',
      delivery:'目前乐谱由人工确认订单后发送，一般会在<strong>付款后 24 小时内</strong>发送至你填写的邮箱，请留意收件箱。',
      refund:'如付款超过 <strong>24 小时仍未收到乐谱</strong>，可以申请<strong>取消订单并退款</strong>。乐谱一经发送至邮箱，由于数字商品具有可复制性，将<strong>不再接受退款</strong>。',
      note:'24 小时以付款成功时间为起点。',close:'关闭说明',check:'我已阅读并理解以上说明',
      paidTitle:'购买前请确认',freeTitle:'说明',paidNext:'继续付款 →',freeNext:'继续查看乐谱 →'},
    en:{usage:'Scores on this site are for personal study, practice and research only. Please do not share, redistribute or resell them, or use them for any other commercial purpose.',
      usageTitle:'Use of scores',deliveryTitle:'Delivery and refunds',
      delivery:'Orders are checked by hand, and the PDF is usually sent to your email <strong>within 24 hours of payment</strong>.',
      refund:'If you have <strong>not received your score within 24 hours</strong>, you can <strong>cancel the order for a full refund</strong>. Once the PDF has been sent, it <strong>cannot be refunded</strong>, as digital files cannot be returned.',
      note:'The 24 hours start from the time of payment.',close:'Close',check:'I have read and understood the above',
      paidTitle:'Before you buy',freeTitle:'Please note',paidNext:'Continue to payment →',freeNext:'Continue to the score →'},
    ja:{usage:'本サイトの楽譜は、個人での学習・練習・研究のためにご利用ください。転載・共有・再販売、その他の商用利用はご遠慮ください。',
      usageTitle:'楽譜のご利用について',deliveryTitle:'お届けと返金',
      delivery:'ご注文は手作業で確認し、通常<strong>お支払い後 24 時間以内</strong>にご入力のメールアドレスへ PDF をお送りします。',
      refund:'お支払いから <strong>24 時間以内に楽譜が届かない場合</strong>は、<strong>キャンセル・全額返金</strong>を承ります。デジタル商品のため、PDF の送付後は<strong>返金できません</strong>。',
      note:'24 時間はお支払い完了時点から数えます。',close:'閉じる',check:'上記の内容を確認しました',
      paidTitle:'ご購入前にご確認ください',freeTitle:'ご利用にあたって',paidNext:'お支払いへ進む →',freeNext:'楽譜を見る →'}
  };
  const currentText = () => {
    const language = document.documentElement.dataset.siteLanguage;
    return text[language] || text.zh;
  };
  let pending = null;
  const dialog = document.createElement('dialog');
  dialog.className = 'score-consent';
  dialog.setAttribute('aria-labelledby','scoreConsentTitle');
  dialog.innerHTML = `<div class="consent-heading"><h2 id="scoreConsentTitle"></h2><button type="button" class="close-button"></button></div>
    <div class="consent-copy"><h3 class="paid-only" data-text="usageTitle"></h3><p data-text="usage"></p>
    <div class="paid-only"><h3 data-text="deliveryTitle"></h3><p data-text="delivery"></p>
    <p data-text="refund"></p>
    <p class="consent-note" data-text="note"></p></div></div>
    <label class="consent-check"><input type="checkbox"><span data-text="check"></span></label>
    <button type="button" class="button primary consent-continue" disabled></button>`;
  dialog.querySelector('.close-button').textContent = '×';
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
    const t = currentText();
    dialog.lang = t === text.zh ? 'zh-CN' : t === text.ja ? 'ja' : 'en';
    for (const node of dialog.querySelectorAll('[data-text]')) node.innerHTML = t[node.dataset.text];
    dialog.querySelector('.close-button').setAttribute('aria-label',t.close);
    dialog.querySelector('#scoreConsentTitle').textContent = mode === 'paid' ? t.paidTitle : t.freeTitle;
    dialog.querySelectorAll('.paid-only').forEach(node=>{node.hidden = mode !== 'paid'});
    next.textContent = mode === 'paid' ? t.paidNext : t.freeNext;
    checkbox.checked = false;next.disabled = true;dialog.returnValue = '';
    previousFocus = document.activeElement;previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return new Promise(resolve=>{pending = resolve;dialog.showModal();checkbox.focus({preventScroll:true})});
  }
  document.addEventListener('click',async event=>{
    const link = event.target.closest('a[data-score-consent]');
    if(!link || event.defaultPrevented) return;
    event.preventDefault();
    const scoreID = link.dataset.scoreId, scoreTitle = link.dataset.scoreTitle;
    if(!await request('free')) return;
    // Only this operation's explicit FREE continuation counts.
    if(scoreID && scoreTitle && typeof window.gtag === 'function'){
      try{window.gtag('event','score_download',{score_id:scoreID,score_title:scoreTitle,score_type:'free',score_action:link.hasAttribute('download') ? 'download' : 'view'})}
      catch{ /* Analytics must not block viewing or downloading a score. */ }
    }
    // Keep the original URL, preview target and download filename unchanged.
    const continuation = link.cloneNode(true);continuation.removeAttribute('data-score-consent');
    if(event.ctrlKey || event.metaKey || event.shiftKey) continuation.target = '_blank';
    continuation.hidden = true;document.body.append(continuation);continuation.click();continuation.remove();
  });
  window.scoreConsent = {request};
})();
