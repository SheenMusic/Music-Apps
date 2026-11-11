/* Checkout through Stripe Payment Links (card, Apple Pay, Google Pay).
   English / Japanese pages use it directly; the Chinese checkout dialogs use it as
   the overseas option next to Alipay / WeChat Pay (checkout.js).
   Stripe picks USD or JPY from the buyer's location; the price shown on the page
   follows the page language.

   Before leaving for Stripe, the order (order ID, tracks, amount) is emailed to the
   seller through Formspree. The same order ID goes to Stripe as client_reference_id,
   so a Stripe payment can be matched with its order email. */
(() => {
  'use strict';
  const ENDPOINT = 'https://formspree.io/f/xyezovwb';
  const LINKS = {
    full: 'https://buy.stripe.com/7sYdRacSR7a7aga0HJ8so00',
    intro: [
      'https://buy.stripe.com/3cIdRacSR3XVdsm8ab8so01',  // 1 score
      'https://buy.stripe.com/bJefZiaKJ0LJfAu1LN8so02',  // 2 scores
      'https://buy.stripe.com/aFadRacSR0LJagaduv8so03',  // 3 scores
      'https://buy.stripe.com/fZubJ21a98ebagaaij8so04',  // 4 scores
      'https://buy.stripe.com/4gMeVe4mldyvaga7678so05',  // 5 scores
      'https://buy.stripe.com/3cI00kcSR663dsmgGH8so06'   // 6 scores or more
    ]
  };
  const PRICE = {intro:{usd:1, jpy:150, max:6}, full:{usd:3, jpy:450}};
  const text = {
    en:{sending:'Preparing your order…', failed:'Your order could not be sent. Please check your connection and try again.'},
    ja:{sending:'ご注文を準備しています…', failed:'ご注文を送信できませんでした。通信環境をご確認のうえ、もう一度お試しください。'}
  };
  const pad = n => String(n).padStart(2, '0');
  const numberLabel = n => String(n).padStart(3, '0');
  function makeOrderId(prefix){
    const d = new Date(), chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let random = '';
    for (let i = 0; i < 4; i++) random += chars[Math.floor(Math.random() * chars.length)];
    return `${prefix}-${String(d.getFullYear()).slice(2)}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${random}`;
  }
  // Price for a number of paid intros, in both currencies.
  function introPrice(count){
    const n = Math.min(count, PRICE.intro.max);
    return {usd:n * PRICE.intro.usd, jpy:n * PRICE.intro.jpy};
  }
  // Emails the order to the seller. Resolves true when Formspree accepted it.
  async function sendOrder(order){
    const controller = new AbortController(), timer = setTimeout(() => controller.abort(), 12000);
    try {
      const response = await fetch(ENDPOINT, {
        method:'POST', headers:{'Content-Type':'application/json', Accept:'application/json'},
        body:JSON.stringify(order), signal:controller.signal
      });
      return response.ok;
    } catch {
      return false;
    } finally {
      clearTimeout(timer);
    }
  }
  // Stripe accepts letters, digits, '-' and '_' (up to 200 characters).
  function redirect(url, reference, email){
    const params = new URLSearchParams({client_reference_id:String(reference).replace(/[^A-Za-z0-9_-]/g, '-').slice(0, 200)});
    if (email) params.set('prefilled_email', email);
    location.href = `${url}?${params}`;
  }
  // English / Japanese pages: confirm, email the order, then go to Stripe.
  async function checkout({url, kind, items, reference, button, analyticsItems}){
    const language = document.documentElement.dataset.siteLanguage === 'ja' ? 'ja' : 'en';
    const orderId = makeOrderId('ST');
    const price = kind === 'full' ? PRICE.full : introPrice(items.length);
    // GA4 (checkout-analytics.js) records the currency shown on the page: JPY in Japanese, USD in English.
    const analytics = window.checkoutAnalytics;
    const value = language === 'ja' ? price.jpy : price.usd;
    const analyticsData = {order:orderId, currency:language === 'ja' ? 'JPY' : 'USD', value, items:analytics ? analyticsItems(value) : []};
    if (analytics) analytics.track('begin_checkout', analyticsData);
    if (window.scoreConsent && !(await window.scoreConsent.request('paid'))) return;
    const label = button?.textContent;
    if (button) { button.disabled = true; button.textContent = text[language].sending; }
    const sent = await sendOrder({
      _subject:`New order (Stripe, awaiting payment) | ${items.length} item(s) | $${price.usd} / ¥${price.jpy} | ${orderId}`,
      order_id:orderId, status:'Sent to Stripe, awaiting payment — ship only after the Stripe payment notification',
      payment_method:'Stripe (card / Apple Pay / Google Pay)', page_language:language,
      amount:`$${price.usd} or ¥${price.jpy} (Stripe chooses the currency by region)`,
      items:items.join('\n'), item_count:items.length,
      submitted_at:new Date().toLocaleString('ja-JP', {timeZone:'Asia/Tokyo'})
    });
    if (button) { button.disabled = false; button.textContent = label; }
    if (!sent) { alert(text[language].failed); return; }
    // Means "order submitted", not "payment confirmed".
    if (analytics) await analytics.trackBeforeLeaving('purchase', {...analyticsData, payment_type:'Stripe'});
    redirect(url, `${orderId}_${reference}`);
  }
  // Piano Intros (English / Japanese): count selects the link.
  function intros(tracks, button){
    if (!tracks.length) return;
    checkout({
      url:LINKS.intro[Math.min(tracks.length, PRICE.intro.max) - 1], kind:'intro', button,
      reference:'PI-' + tracks.map(track => numberLabel(track.number)).join('-'),
      items:tracks.map(track => `${numberLabel(track.number)} ${track.title} · ${track.artist}`),
      analyticsItems:value => window.checkoutAnalytics.introItems(tracks, value, 'Stripe')
    });
  }
  // Full songs (English / Japanese): <button data-stripe-full="PUSA-MAN" data-stripe-title="菩萨蛮">.
  for (const button of document.querySelectorAll('[data-stripe-full]')) {
    button.addEventListener('click', () => checkout({
      url:LINKS.full, kind:'full', button, reference:button.dataset.stripeFull,
      items:[`${button.dataset.stripeFull} ${button.dataset.stripeTitle || ''}`.trim()],
      // data-stripe-full="PUSA-MAN" → item_id "pusa-man", the same ID as the Chinese checkout.
      analyticsItems:value => window.checkoutAnalytics.fullScoreItems(button.dataset.stripeFull.toLowerCase(), button.dataset.stripeTitle || button.dataset.stripeFull, value)
    }));
  }
  window.stripeCheckout = {LINKS, PRICE, introPrice, sendOrder, redirect, intros};
})();
