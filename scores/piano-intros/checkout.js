/* Piano Intros: turns a track selection into the shared purchase dialog (../checkout-dialog.js).
   Called by catalog.js (Chinese list) and catalog-intl.js (English / Japanese lists):
     window.introCheckout.open({tracks, price, label, packageType})
   tracks: the tracks being bought (a whole collection includes its free tracks);
   price: the Alipay / WeChat Pay price in CNY (pricing.js); packageType: e.g. 「自选 3 首」.
   Stripe uses its own price per number of paid intros (stripe-checkout.js). */
(() => {
  'use strict';
  const numberLabel = n => String(n).padStart(3,'0');

  function open(options){
    if(!options.tracks.length || !Number.isFinite(options.price) || options.price <= 0) return;
    const bundle = options.packageType.startsWith('Piano Intros Vol.');
    if(!bundle && options.tracks.some(track => track.free)) return;
    // Snapshot the tracks, independent of later search / filter state.
    const tracks = options.tracks.map(track => ({...track}));
    const paid = tracks.filter(track => !track.free);
    const count = tracks.length;
    const zhName = bundle ? `${options.label} · 全${count}首` : `钢琴前奏 · ${options.packageType}`;
    const name = {
      zh:zhName,
      en:bundle ? `Piano Intros Vol. 1 — all ${count} intros` : `Piano Intros — ${paid.length} ${paid.length === 1 ? 'intro' : 'intros'}`,
      ja:bundle ? `Piano Intros Vol. 1 · 全${count}曲` : `ピアノ・イントロ · ${paid.length}曲`
    };
    const line = track => `${numberLabel(track.number)} ${track.artist}《${track.title}》${track.free ? ' · FREE' : ''}`;
    const lines = tracks.map(line);
    const stripe = window.stripeCheckout, usd = stripe.introPrice(paid.length);
    window.scoreCheckout.open({
      name, contents:{zh:lines, en:lines, ja:lines}, intros:true, cny:options.price, orderPrefix:'PI',
      // Order sheet: the collection name, or the chosen track numbers.
      sheetName:bundle ? zhName : `${zhName}：${paid.map(track => numberLabel(track.number)).join('、')}`,
      stripe:{
        url:stripe.LINKS.intro[Math.min(paid.length, stripe.PRICE.intro.max) - 1],
        reference:bundle ? 'PI-ALL' : 'PI-' + paid.map(track => numberLabel(track.number)).join('-'),
        usd:usd.usd, jpy:usd.jpy
      },
      analyticsItems:value => window.checkoutAnalytics ? window.checkoutAnalytics.introItems(tracks, value, options.packageType) : []
    });
  }

  window.introCheckout = {open};
})();
