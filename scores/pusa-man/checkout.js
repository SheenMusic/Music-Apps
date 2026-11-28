/* 《菩萨蛮》: buy buttons on this page open the shared purchase dialog (../checkout-dialog.js).
   Chinese: #buyScore. English / Japanese: the [data-stripe-full] buttons.
   The other full-score pages use the same code; only the constants at the top differ. */
(() => {
  'use strict';
  const PRODUCT_ID = 'pusa-man';
  const ORDER_PREFIX = 'PSM';
  const NAME = {zh:'菩萨蛮 · 人声与钢琴扒谱', en:'Pusa Man 菩萨蛮 — voice & piano', ja:'菩萨蛮 · 歌とピアノの楽譜'};
  const CONTENTS = {
    zh:['3 页 PDF（1 页封面 + 2 页乐谱）· 人工核对后邮箱交付'],
    en:['3-page PDF (cover + 2 pages of music), emailed once payment is confirmed'],
    ja:['PDF 3 ページ（表紙 1 + 楽譜 2）· 確認後にメールでお届け']
  };
  const buttons = [document.getElementById('buyScore'), ...document.querySelectorAll('[data-stripe-full]')].filter(Boolean);
  let product;

  function open(){
    if(!product) return;
    const stripe = window.stripeCheckout;
    window.scoreCheckout.open({
      name:NAME, sheetName:NAME.zh, contents:CONTENTS, cny:product.price, orderPrefix:ORDER_PREFIX,
      stripe:{url:stripe.LINKS.full, reference:PRODUCT_ID.toUpperCase(), usd:stripe.PRICE.full.usd, jpy:stripe.PRICE.full.jpy},
      analyticsItems:value => window.checkoutAnalytics ? window.checkoutAnalytics.fullScoreItems(product.id, product.title, value) : []
    });
  }
  for(const button of buttons){button.disabled = true;button.addEventListener('click', open)}

  fetch('/data/scores.json').then(response => {
    if(!response.ok) throw new Error('Product unavailable');
    return response.json();
  }).then(products => {
    const item = products.find(entry => entry.id === PRODUCT_ID);
    if(!item || item.price !== 12 || item.currency !== 'CNY' || item.type !== 'paid') throw new Error('Invalid product');
    product = Object.freeze({...item});
    for(const button of buttons) button.disabled = false;
    // From a catalogue 「购买 / Buy / 購入」 link (#buy): open the purchase dialog straight away.
    if(location.hash === '#buy'){
      history.replaceState(history.state,'',location.pathname + location.search);open();
    }
  }).catch(() => {const error = document.getElementById('productError');if(error) error.hidden = false});
})();
