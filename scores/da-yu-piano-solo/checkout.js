/* 《大鱼》钢琴独奏完整版: buy buttons on this page open the shared purchase dialog (../checkout-dialog.js).
   Chinese: #buyScore. English / Japanese: the [data-stripe-full] buttons.
   The other full-score pages use the same code; only the constants at the top differ. */
(() => {
  'use strict';
  const PRODUCT_ID = 'da-yu-piano-solo';
  const ORDER_PREFIX = 'DYPS';
  const NAME = {zh:'大鱼 · 钢琴独奏完整版', en:'Big Fish 大鱼 — full piano solo', ja:'大鱼 · ピアノソロ完全版'};
  const CONTENTS = {
    zh:['4 页 PDF（1 页封面 + 3 页乐谱）· 人工核对后邮箱交付'],
    en:['4-page PDF (cover + 3 pages of music), emailed once payment is confirmed'],
    ja:['PDF 4 ページ（表紙 1 + 楽譜 3）· 確認後にメールでお届け']
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
