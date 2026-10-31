/* Adapted from the retained Jiangnan checkout: same QR assets, Alipay URL,
   Formspree JSON submission, 12s timeout and manual-verification fallback. */
(() => {
  'use strict';
  const ENDPOINT = 'https://formspree.io/f/xyezovwb';
  const PAY_LINK = 'https://qr.alipay.com/fkx13921kb0l57ujqpulsb8';
  const byID = id => document.getElementById(id);
  const dialog = byID('purchaseDialog');
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || (navigator.maxTouchPoints > 1 && /Macintosh/i.test(navigator.userAgent));
  let purchase, order, method = '支付宝', email = '', submitting = false;
  let lastFocus, previousOverflow;
  const numberLabel = n => String(n).padStart(3,'0');

  function makeOrder(){
    const d = new Date(), pad = n => String(n).padStart(2,'0'), chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let random = '';
    for(let i=0;i<4;i++) random += chars[Math.floor(Math.random()*chars.length)];
    return `PI-${String(d.getFullYear()).slice(2)}${pad(d.getMonth()+1)}${pad(d.getDate())}-${random}`;
  }
  function showStep(id){
    for(const step of dialog.querySelectorAll('.checkout-step')) step.hidden = step.id !== id;
    dialog.scrollTop = 0;
  }
  function syncViewport(){
    const viewport = window.visualViewport;
    dialog.style.setProperty('--checkout-height',`${viewport ? viewport.height : innerHeight}px`);
    dialog.style.setProperty('--checkout-top',`${viewport ? viewport.offsetTop : 0}px`);
  }
  function syncPaymentUI(){
    const wechat = method === '微信';
    const image = wechat ? '../assets/payment/wechat-pay.jpg' : '../assets/payment/alipay.jpg';
    byID('qrImg').src = image;byID('qrImg').alt = `${method}收款二维码`;
    byID('saveQr').href = image;byID('saveQr').download = `${method}收款码.jpg`;
    byID('openPay').href = PAY_LINK;byID('openPay').hidden = !isMobile || wechat;
    byID('payHint').textContent = wechat && isMobile
      ? `请支付 ¥${purchase.price}。保存收款码，再打开微信「扫一扫」从相册识别。`
      : isMobile ? `请支付 ¥${purchase.price}。可打开支付宝付款，也可保存收款码识别。`
      : `请使用${method}扫码支付 ¥${purchase.price}，付款完成后提交订单。`;
    for(const button of dialog.querySelectorAll('.payment-method')) button.setAttribute('aria-pressed',String(button.dataset.method === method));
  }
  function open(options){
    if(submitting || dialog.open || !options.tracks.length || !Number.isFinite(options.price) || options.price <= 0) return;
    const bundle = options.packageType.startsWith('Piano Intros Vol.');
    if(!bundle && options.tracks.some(track=>track.free)) return;
    const requestedTracks = options.requestedTracks ?? options.tracks.filter(track=>!track.free);
    // Snapshot the approved price and all tracks, independent of later search/filter state.
    purchase = Object.freeze({
      price:options.price, packageType:options.packageType, pricingMethod:options.pricingMethod,
      paidCount:options.tracks.filter(track=>!track.free).length,
      requestedPaidCount:requestedTracks.length,
      requestedTracks:Object.freeze(requestedTracks.map(track=>Object.freeze({...track}))),
      product:bundle ? `${options.label} · 全${options.tracks.length}首` : `钢琴前奏 · ${options.packageType}`,
      tracks:Object.freeze(options.tracks.map(track=>Object.freeze({...track})))
    });
    order = makeOrder();email = '';method = '支付宝';
    byID('purchaseSummary').textContent = `${purchase.product} · ¥${purchase.price}`;
    byID('purchaseTracks').replaceChildren(...purchase.tracks.map(track=>{
      const item = document.createElement('li');
      item.textContent = `${numberLabel(track.number)} ${track.artist}《${track.title}》${track.free ? ' · FREE' : ''}`;
      return item;
    }));
    dialog.querySelector('details').open = false;
    byID('checkoutEmailForm').reset();byID('paymentName').value = '';
    byID('emailError').hidden = true;byID('submitError').hidden = true;byID('orderFallback').hidden = true;
    byID('paidBtn').textContent = '我已完成付款';byID('copyOrder').textContent = '复制订单信息';
    lastFocus = document.activeElement;previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';syncViewport();showStep('checkoutDetails');dialog.showModal();
  }
  byID('checkoutEmailForm').addEventListener('submit',async event=>{
    event.preventDefault();
    const input = byID('buyerEmail');
    const value = input.value.trim();
    if(!input.checkValidity() || !/^\S+@\S+\.\S+$/.test(value)){
      byID('emailError').hidden = false;input.focus({preventScroll:true});input.scrollIntoView({block:'center'});return;
    }
    email = value;byID('emailError').hidden = true;
    byID('orderId').textContent = order;byID('emailShow').textContent = email;
    byID('submitError').hidden = true;byID('orderFallback').hidden = true;
    if(!await window.scoreConsent.request('paid')) return;
    if(!dialog.open) return;
    showStep('checkoutPayment');syncPaymentUI();byID('paidBtn').focus({preventScroll:true});dialog.scrollTop = 0;
  });
  byID('buyerEmail').addEventListener('invalid',event=>{event.preventDefault();byID('emailError').hidden=false;byID('buyerEmail').focus()});
  byID('buyerEmail').addEventListener('input',()=>{byID('emailError').hidden=true});
  for(const button of dialog.querySelectorAll('.payment-method')) button.addEventListener('click',()=>{
    if(submitting) return;method = button.dataset.method;syncPaymentUI();
  });
  byID('backToEmail').addEventListener('click',()=>{if(!submitting){showStep('checkoutDetails');byID('buyerEmail').focus({preventScroll:true})}});
  function orderData(){
    const tracks = purchase.tracks.map(track=>({number:numberLabel(track.number),title:track.title,artist:track.artist,free:Boolean(track.free)}));
    return {
      _subject:`新订单｜${purchase.product}｜¥${purchase.price}｜${order}`,
      order_id:order, product:purchase.product, amount:`¥${purchase.price}`,
      package_type:purchase.packageType, purchase_type:purchase.packageType,
      pricing_method:purchase.pricingMethod, selected_paid_count:purchase.paidCount,
      requested_paid_count:purchase.requestedPaidCount,
      requested_tracks:purchase.requestedTracks.map(track=>`${numberLabel(track.number)} ${track.title}`).join('\n'),
      track_count:tracks.length, selected_tracks:tracks.map(track=>`${track.number} ${track.title}`).join('\n'), tracks,
      payment_method:method, buyer_email:email,
      payment_name:byID('paymentName').value.trim() || '未填写',
      submitted_at:new Date().toLocaleString('zh-CN',{timeZone:'Asia/Shanghai'})
    };
  }
  function orderText(data){
    return `订单号：${data.order_id}\n商品：${data.product}\n套餐：${data.package_type}\n计价方式：${data.pricing_method}\n金额：${data.amount}\n实际勾选：${data.requested_paid_count}首\n勾选曲目：\n${data.requested_tracks}\n付费曲目：${data.selected_paid_count}首\n曲目（${data.track_count}首）：\n${data.selected_tracks}\n支付方式：${data.payment_method}\n接收邮箱：${data.buyer_email}\n付款昵称：${data.payment_name}`;
  }
  byID('copyOrder').addEventListener('click',async()=>{
    const text = byID('orderCopy').textContent, button = byID('copyOrder');
    try{await navigator.clipboard.writeText(text);button.textContent='已复制'}
    catch{
      const range = document.createRange();range.selectNodeContents(byID('orderCopy'));
      const selection = window.getSelection();selection.removeAllRanges();selection.addRange(range);
      button.textContent = '请长按复制上方信息';
    }
  });
  byID('paidBtn').addEventListener('click',async()=>{
    if(submitting || !email || !purchase) return;
    submitting = true;
    const data = orderData(), button = byID('paidBtn');
    let succeeded = false;
    button.textContent = '正在提交…';byID('submitError').hidden = true;byID('orderFallback').hidden = true;
    for(const control of dialog.querySelectorAll('button,input')) control.disabled = true;
    dialog.setAttribute('aria-busy','true');
    const controller = new AbortController(), timer = setTimeout(()=>controller.abort(),12000);
    try{
      const response = await fetch(ENDPOINT,{
        method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},
        body:JSON.stringify(data),signal:controller.signal
      });
      let body = null;try{body = await response.json()}catch{}
      if(!response.ok) throw new Error(body?.error || `HTTP ${response.status}`);
      byID('doneOrder').textContent = order;byID('doneEmail').textContent = email;
      showStep('checkoutSuccess');succeeded = true;
    }catch{
      byID('submitError').hidden = false;byID('orderFallback').hidden = false;
      byID('orderCopy').textContent = orderText(data);
      button.textContent = '重新提交订单';
      byID('submitError').scrollIntoView({block:'center'});
    }finally{
      clearTimeout(timer);submitting = false;
      for(const control of dialog.querySelectorAll('button,input')) control.disabled = false;
      dialog.removeAttribute('aria-busy');
      if(succeeded) byID('doneBtn').focus({preventScroll:true});
    }
  });
  for(const id of ['closeDialog','doneBtn']) byID(id).addEventListener('click',()=>{if(!submitting)dialog.close()});
  dialog.addEventListener('cancel',event=>{if(submitting)event.preventDefault()});
  dialog.addEventListener('close',()=>{document.body.style.overflow=previousOverflow||'';lastFocus?.focus()});
  window.addEventListener('resize',syncViewport);
  if(window.visualViewport){visualViewport.addEventListener('resize',syncViewport);visualViewport.addEventListener('scroll',syncViewport)}
  window.scoreCheckout = {open};
})();
