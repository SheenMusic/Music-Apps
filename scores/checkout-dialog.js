/* Shared purchase dialog for every paid score, in Chinese, English and Japanese.

   Step 1 「确认订单」: purchase notes (scroll to the end, then tick), payment method and email,
           then 「开始付款」.
   Step 2: the order is recorded in the seller's Google Sheet (order-sheet.js), then
           - Alipay / WeChat Pay: a short "order received" note and the QR code;
           - card / Apple Pay / Google Pay: straight on to Stripe (stripe-checkout.js).
   Payment is checked by hand and the PDF is sent by hand.

   Usage (see pusa-man/checkout.js and piano-intros/checkout.js):
     window.scoreCheckout.open({
       name: {zh, en, ja},              // product name shown in the dialog
       sheetName: '…',                  // product name written to the order sheet (Chinese)
       contents: {zh: [...], en: [...], ja: [...]},   // lines under "what's included"
       cny: 12,                         // Alipay / WeChat Pay price in CNY
       stripe: {url, reference, usd, jpy},
       analyticsItems: value => [...],  // GA4 items for checkout-analytics.js
       intros: true                     // Piano Intros wording ("selected intros")
     });
   Needs consent.js (paidTerms), order-sheet.js and stripe-checkout.js on the page. */
(() => {
  'use strict';
  const PAY_LINK = 'https://qr.alipay.com/fkx13921kb0l57ujqpulsb8';
  const QR = {alipay:'/scores/assets/payment/alipay.jpg', wechat:'/scores/assets/payment/wechat-pay.jpg'};
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || (navigator.maxTouchPoints > 1 && /Macintosh/i.test(navigator.userAgent));

  const TEXT = {
    zh:{
      title:'确认订单', close:'关闭订单', contents:'查看商品内容', introContents:'查看所选曲目',
      termsLabel:'购买前请确认', termsHint:'请把上面的说明滑到底部，再勾选确认。',
      termsError:'请先阅读说明并勾选确认。', method:'付款方式',
      methods:{alipay:'支付宝（推荐）', wechat:'微信', stripe:'信用卡 / Apple Pay / Google Pay'},
      email:'接收 PDF 的 Email', placeholder:'填写后将记录为购买行为', emailError:'请填写有效的邮箱地址。',
      next:'开始付款', busy:'请稍候…', nextHint:'勾选说明、选择付款方式并填写邮箱后，即可开始付款。',
      received:'已经收到你的订单请求，乐谱会在 24 小时内经人工确认后发送到你的邮箱。',
      emailShow:'接收邮箱：', back:'返回修改',
      cny:n => `¥${n} 人民币`, stripePrice:p => `$${p.usd} 美元`,
      alipayHint:n => isMobile ? `请支付 ¥${n}。点下方按钮直接打开支付宝付款，无需保存收款码。` : `请用支付宝扫码支付 ¥${n}。`,
      wechatHint:n => isMobile ? `请支付 ¥${n}。微信需要先把收款码保存到相册，再用「扫一扫」从相册识别。` : `请用微信扫码支付 ¥${n}。`,
      openAlipay:'打开支付宝付款', saveQr:'保存收款码', saveWechat:'将二维码保存到本地，扫码后付款',
      qrAlt:{alipay:'支付宝收款二维码', wechat:'微信收款二维码'}, qrFile:{alipay:'支付宝收款码.jpg', wechat:'微信收款码.jpg'},
      help:'支付遇到问题？', helpLink:'请联系抖音私信 ↗', helpUrl:'https://v.douyin.com/2Kz3u1Obq9c/'
    },
    en:{
      title:'Your order', close:'Close', contents:"What's included", introContents:'Selected intros',
      termsLabel:'Before you buy', termsHint:'Scroll to the end of the terms to continue.',
      termsError:"Please confirm you've read the terms.", method:'Pay with',
      methods:{stripe:'Card / Apple Pay / Google Pay', alipay:'Alipay', wechat:'WeChat Pay'},
      email:'Email (your PDF will be sent here)', placeholder:'Your order is recorded under this email', emailError:'Please enter a valid email address.',
      next:'Continue to payment', busy:'Just a moment…', nextHint:'Tick the box, choose how to pay and enter your email to continue.',
      received:'Thanks, your order is in. Once your payment is confirmed, your score will be emailed to you within 24 hours.',
      emailShow:'Sending to: ', back:'Back',
      cny:n => `${n} CNY`, stripePrice:p => `$${p.usd}`,
      cnyOnly:(n, p) => `Alipay and WeChat Pay accept Chinese yuan only, so please enter ${n} CNY (about $${p.usd}) in the app.`,
      alipayHint:n => isMobile ? `Tap the button below to pay in Alipay. No need to save the QR code.` : `Scan the code with Alipay.`,
      wechatHint:n => isMobile ? `WeChat can only scan saved images: save the QR code, then tap Scan and choose it from your photos.` : `Scan the code with WeChat.`,
      openAlipay:'Open Alipay', saveQr:'Save QR code', saveWechat:'Save QR code to pay in WeChat',
      qrAlt:{alipay:'Alipay QR code', wechat:'WeChat Pay QR code'}, qrFile:{alipay:'alipay-qr.jpg', wechat:'wechat-pay-qr.jpg'},
      help:'Problem with your payment? ', helpLink:'Get in touch ↗', helpUrl:'/en/#contact'
    },
    ja:{
      title:'ご注文内容', close:'閉じる', contents:'商品の内容', introContents:'選択した曲',
      termsLabel:'ご購入前にご確認ください', termsHint:'上の説明を最後までスクロールしてから、チェックを入れてください。',
      termsError:'説明をお読みのうえ、チェックを入れてください。', method:'お支払い方法',
      methods:{stripe:'クレジットカード / Apple Pay / Google Pay', alipay:'Alipay（支付宝）', wechat:'WeChat Pay（微信）'},
      email:'PDF をお送りするメールアドレス', placeholder:'入力すると購入として記録されます', emailError:'有効なメールアドレスを入力してください。',
      next:'お支払いへ進む', busy:'準備しています…', nextHint:'チェックを入れ、お支払い方法を選び、メールアドレスを入力すると進めます。',
      received:'ご注文を受け付けました。確認のうえ、24 時間以内に楽譜をメールでお送りします。',
      emailShow:'メールアドレス：', back:'戻る',
      cny:n => `${n} 人民元`, stripePrice:p => `¥${p.jpy}（税込）`,
      cnyOnly:(n, p) => `Alipay と WeChat Pay は人民元でのお支払いのみ対応しています。アプリで ${n} 元（約 ¥${p.jpy}）を入力してお支払いください。`,
      alipayHint:n => isMobile ? `下のボタンから Alipay を開いてお支払いください。QR コードの保存は不要です。` : `Alipay で QR コードを読み取ってください。`,
      wechatHint:n => isMobile ? `WeChat では、QR コードを写真に保存してから「スキャン」でアルバムから読み取ってください。` : `WeChat で QR コードを読み取ってください。`,
      openAlipay:'Alipay を開く', saveQr:'QR コードを保存', saveWechat:'QR コードを保存して、読み取ってお支払い',
      qrAlt:{alipay:'Alipay の QR コード', wechat:'WeChat Pay の QR コード'}, qrFile:{alipay:'alipay-qr.jpg', wechat:'wechat-pay-qr.jpg'},
      help:'お支払いでお困りの場合は', helpLink:'こちらからご連絡ください ↗', helpUrl:'/ja/#contact'
    }
  };
  // Order sheet: method names in Chinese, plus the page language when it is not Chinese.
  const SHEET_METHOD = {alipay:'支付宝', wechat:'微信', stripe:'Stripe（信用卡 / Apple Pay / Google Pay）'};
  const SHEET_LANGUAGE = {en:'英文页', ja:'日文页'};

  let dialog, config, language, t, method, order, busy = false, lastFocus, previousOverflow;
  const $ = selector => dialog.querySelector(selector);
  const currentLanguage = () => TEXT[document.documentElement.dataset.siteLanguage] ? document.documentElement.dataset.siteLanguage : 'zh';
  const escapeHTML = value => String(value).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c]);
  // Chinese pages list Alipay first (recommended); English / Japanese pages list Stripe first.
  const methodOrder = () => language === 'zh' ? ['alipay','wechat','stripe'] : ['stripe','alipay','wechat'];

  // Alipay / WeChat Pay amount in CNY. Chinese pages use the Chinese price; English / Japanese
  // pages keep one price for every method ($3 / ¥450), so Alipay / WeChat Pay take its CNY
  // equivalent at a fixed 20 CNY = $3 (2026-11: $3 ≈ 20 CNY, ¥450 ≈ 19 CNY).
  const cnyAmount = () => language === 'zh' ? config.cny : Math.round(config.stripe.usd * 20 / 3);
  function priceText(){
    if(language !== 'zh') return t.stripePrice(config.stripe);
    return method === 'stripe' ? t.stripePrice(config.stripe) : t.cny(config.cny);
  }
  function makeOrder(){
    const d = new Date(), pad = n => String(n).padStart(2,'0'), chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let random = '';
    for(let i = 0; i < 4; i++) random += chars[Math.floor(Math.random() * chars.length)];
    return `${config.orderPrefix || 'SC'}-${String(d.getFullYear()).slice(2)}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${random}`;
  }

  // GA4 (checkout-analytics.js): CNY for Alipay / WeChat Pay; Stripe in the page's currency.
  function analyticsData(extra = {}){
    const stripe = method === 'stripe';
    const currency = stripe ? (language === 'ja' ? 'JPY' : 'USD') : 'CNY';
    const value = stripe ? (language === 'ja' ? config.stripe.jpy : config.stripe.usd) : cnyAmount();
    return {order, currency, value, items:config.analyticsItems ? config.analyticsItems(value) : [], ...extra};
  }
  function track(name, extra){
    if(window.checkoutAnalytics) window.checkoutAnalytics.track(name, analyticsData(extra));
  }

  function build(){
    dialog = document.getElementById('purchaseDialog') || document.createElement('dialog');
    dialog.id = 'purchaseDialog';dialog.className = 'purchase-dialog';
    dialog.setAttribute('aria-labelledby','purchaseHeading');
    if(!dialog.isConnected) document.body.append(dialog);
    dialog.addEventListener('cancel',event => {if(busy) event.preventDefault()});
    dialog.addEventListener('close',() => {document.body.style.overflow = previousOverflow || '';lastFocus?.focus()});
    const syncViewport = () => {
      const viewport = window.visualViewport;
      dialog.style.setProperty('--checkout-height',`${viewport ? viewport.height : innerHeight}px`);
      dialog.style.setProperty('--checkout-top',`${viewport ? viewport.offsetTop : 0}px`);
    };
    window.addEventListener('resize',syncViewport);
    if(window.visualViewport){visualViewport.addEventListener('resize',syncViewport);visualViewport.addEventListener('scroll',syncViewport)}
    syncViewport();
    // Back from Stripe with the browser's back button: make the dialog usable again.
    window.addEventListener('pageshow',event => {
      if(event.persisted && dialog.open){busy = false;$('#toPayment').textContent = t.next;syncReady()}
    });
  }

  // The whole dialog is rebuilt on every open, in the page's current language.
  function render(){
    const consent = window.scoreConsent;
    const methods = methodOrder().map(id =>
      `<button class="button payment-method" type="button" data-method="${id}" aria-pressed="false">${t.methods[id]}</button>`).join('');
    const contents = (config.contents[language] || config.contents.zh).map(line => `<li>${escapeHTML(line)}</li>`).join('');
    dialog.lang = language === 'zh' ? 'zh-CN' : language;
    dialog.innerHTML = `
      <div class="dialog-heading"><h2 id="purchaseHeading">${t.title}</h2><button class="close-button" id="closeDialog" type="button" aria-label="${t.close}">×</button></div>
      <p id="purchaseSummary" class="purchase-summary"></p>
      <section id="checkoutDetails" class="checkout-step">
        <details class="checkout-tracks"><summary>${config.intros ? t.introContents : t.contents}</summary><ol id="purchaseTracks" class="purchase-tracks">${contents}</ol></details>
        <div id="checkoutTerms" class="checkout-terms" tabindex="0" role="region" aria-label="${t.termsLabel}">${consent ? consent.paidTerms() : ''}</div>
        <p id="termsHint" class="checkout-terms-hint">${t.termsHint}</p>
        <form id="checkoutEmailForm" novalidate>
          <label class="consent-check"><input id="termsCheck" type="checkbox" disabled><span>${consent ? consent.checkLabel() : ''}</span></label>
          <p id="termsError" class="checkout-error" role="alert" hidden>${t.termsError}</p>
          <span class="checkout-label" id="methodLabel">${t.method}</span>
          <div class="payment-methods" role="group" aria-labelledby="methodLabel">${methods}</div>
          <div class="checkout-field"><label for="buyerEmail">${t.email}</label><input id="buyerEmail" type="email" inputmode="email" autocomplete="email" maxlength="254" placeholder="${t.placeholder}" required aria-describedby="emailError"></div>
          <p id="emailError" class="checkout-error" role="alert" hidden>${t.emailError}</p>
          <button id="toPayment" class="button primary" type="submit" disabled aria-describedby="nextHint">${t.next}</button>
          <p id="nextHint" class="checkout-terms-hint">${t.nextHint}</p>
        </form>
      </section>
      <section id="checkoutPayment" class="checkout-step" hidden>
        <p class="checkout-received" role="status">${t.received}</p>
        <p id="cnyNote" class="checkout-cny-note" hidden></p>
        <p class="checkout-order">${t.emailShow}<span id="emailShow"></span></p>
        <div class="payment-qr"><img id="qrImg" src="${QR.alipay}" width="260" height="260" alt=""></div>
        <p class="payment-hint" id="payHint"></p>
        <div class="checkout-pay-actions">
          <a id="openPay" class="button primary" href="${PAY_LINK}" target="_blank" rel="noopener noreferrer" hidden>${t.openAlipay}</a>
          <a id="saveQr" class="save-qr" href="${QR.alipay}" download></a>
        </div>
        <p class="detail-note">${t.help}<a href="${t.helpUrl}" target="_blank" rel="noopener noreferrer">${t.helpLink}</a></p>
        <div class="checkout-actions"><button id="backToEmail" class="text-button" type="button">${t.back}</button></div>
      </section>`;
    bind();
  }

  function syncMethod(){
    for(const button of dialog.querySelectorAll('.payment-method')) button.setAttribute('aria-pressed',String(button.dataset.method === method));
    $('#purchaseSummary').textContent = `${config.name[language] || config.name.zh} · ${priceText()}`;
  }
  function showStep(id){
    for(const step of dialog.querySelectorAll('.checkout-step')) step.hidden = step.id !== id;
    dialog.scrollTop = 0;
  }
  // 「开始付款」 lights up only when the notes are ticked, a payment method is chosen and the email looks valid.
  const validEmail = value => /^\S+@\S+\.\S+$/.test(value.trim()) && $('#buyerEmail').checkValidity();
  function syncReady(){
    const ready = $('#termsCheck').checked && Boolean(method) && validEmail($('#buyerEmail').value);
    $('#toPayment').disabled = busy || !ready;
    $('#nextHint').hidden = ready;
    return ready;
  }
  // The tick box unlocks once the notes have been scrolled to the end (or fit without scrolling).
  function unlockTerms(){
    const terms = $('#checkoutTerms'), check = $('#termsCheck');
    if(!check.disabled) return;
    if(terms.scrollTop + terms.clientHeight >= terms.scrollHeight - 4){check.disabled = false;$('#termsHint').hidden = true}
  }
  // Step 2 for Alipay / WeChat Pay.
  function showQr(email){
    const wechat = method === 'wechat', image = QR[method];
    $('#emailShow').textContent = email;
    $('#qrImg').src = image;$('#qrImg').alt = t.qrAlt[method];
    const save = $('#saveQr');
    save.href = image;save.download = t.qrFile[method];
    // Alipay: on a phone the button opens Alipay directly; on a computer the code is scanned
    // from the screen. Either way nothing needs saving, so only WeChat shows the save link.
    // WeChat on a phone can only scan a saved image, so saving is the main action there.
    save.hidden = !wechat;
    // A phone cannot scan its own screen: for Alipay the button replaces the QR code.
    $('.payment-qr').hidden = isMobile && !wechat;
    const wechatPhone = wechat && isMobile;
    save.textContent = wechatPhone ? t.saveWechat : t.saveQr;
    save.className = wechatPhone ? 'button primary' : 'save-qr';
    $('#openPay').hidden = !isMobile || wechat;
    $('#payHint').textContent = wechat ? t.wechatHint(cnyAmount()) : t.alipayHint(cnyAmount());
    // English / Japanese: the apps only take CNY, so say exactly how much to enter.
    $('#cnyNote').hidden = !t.cnyOnly;
    if(t.cnyOnly) $('#cnyNote').textContent = t.cnyOnly(cnyAmount(), config.stripe);
    showStep('checkoutPayment');
  }

  function bind(){
    $('#checkoutTerms').addEventListener('scroll',unlockTerms);
    $('#termsCheck').addEventListener('change',event => {if(event.target.checked) $('#termsError').hidden = true;syncReady()});
    const email = $('#buyerEmail');
    email.addEventListener('input',() => {$('#emailError').hidden = true;syncReady()});
    // Point out a mistyped email once the buyer leaves the field.
    email.addEventListener('blur',() => {$('#emailError').hidden = !email.value.trim() || validEmail(email.value)});
    for(const button of dialog.querySelectorAll('.payment-method')) button.addEventListener('click',() => {
      if(busy) return;method = button.dataset.method;syncMethod();syncReady();
    });
    $('#closeDialog').addEventListener('click',() => {if(!busy) dialog.close()});
    $('#backToEmail').addEventListener('click',() => {if(!busy){showStep('checkoutDetails');$('#buyerEmail').focus({preventScroll:true})}});
    $('#checkoutEmailForm').addEventListener('submit',submit);
  }

  async function submit(event){
    event.preventDefault();
    if(busy || !syncReady()) return;
    if(!$('#termsCheck').checked){$('#termsError').hidden = false;$('#termsError').scrollIntoView({block:'center'});return}
    const input = $('#buyerEmail'), email = input.value.trim();
    if(!input.checkValidity() || !/^\S+@\S+\.\S+$/.test(email)){
      $('#emailError').hidden = false;input.focus({preventScroll:true});input.scrollIntoView({block:'center'});return;
    }
    busy = true;
    const button = $('#toPayment');
    button.disabled = true;button.textContent = t.busy;
    // Recorded as soon as the buyer goes on to pay: the only point where we still have the email.
    const stripe = method === 'stripe';
    const recorded = window.orderSheet ? window.orderSheet.record({
      product:config.sheetName,
      amount:stripe ? `$${config.stripe.usd} / ¥${config.stripe.jpy}（Stripe）`
        : `¥${cnyAmount()} 人民币` + (language === 'zh' ? '' : `（≈ $${config.stripe.usd} / ¥${config.stripe.jpy}）`),
      method:SHEET_METHOD[method] + (SHEET_LANGUAGE[language] ? ` · ${SHEET_LANGUAGE[language]}` : ''),
      email
    }) : Promise.resolve(false);
    track('add_payment_info');
    if(stripe){
      await recorded;
      if(window.checkoutAnalytics) await window.checkoutAnalytics.trackBeforeLeaving('purchase', analyticsData({payment_type:'Stripe'}));
      window.stripeCheckout.redirect(config.stripe.url, `${order}_${config.stripe.reference}`, email);
      return;
    }
    // "purchase" here means "went on to pay", not "payment confirmed".
    track('purchase',{payment_type:method === 'wechat' ? '微信' : '支付宝'});
    showQr(email);
    busy = false;button.textContent = t.next;syncReady();
  }

  function open(options){
    if(busy || (dialog && dialog.open)) return;
    if(!dialog) build();
    config = options;language = currentLanguage();t = TEXT[language];
    // No payment method is pre-selected: the buyer chooses one.
    method = null;order = makeOrder();
    render();syncMethod();
    lastFocus = document.activeElement;previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';showStep('checkoutDetails');dialog.showModal();
    requestAnimationFrame(unlockTerms);
    track('begin_checkout');
  }

  window.scoreCheckout = {open};
})();
