/* GA4 ecommerce events for every paid score checkout (Chinese dialogs and Stripe buttons).
   - Each event fires at most once per order ID.
   - No email, payment name or other personal data is sent.
   - Analytics must never block buying: every failure is ignored.
   "purchase" means the order was submitted, not that payment was confirmed. */
(() => {
  'use strict';
  const sent = new Set();
  const numberLabel = n => String(n).padStart(3, '0');

  function send(name, {order, currency, value, items, ...extra}, callback){
    const key = `${order}:${name}`;
    if (!order || sent.has(key) || typeof window.gtag !== 'function') return false;
    sent.add(key);
    try {
      const params = {transaction_id:order, currency, value, items, ...extra};
      if (callback) params.event_callback = callback;
      window.gtag('event', name, params);
      return true;
    } catch {
      return false;
    }
  }

  // Fire and forget.
  function track(name, data){
    send(name, data);
  }

  // For a step that leaves the page (Stripe). Resolves once GA4 has the event, at most 1 second.
  // Usage: await checkoutAnalytics.trackBeforeLeaving('purchase', data); then redirect.
  function trackBeforeLeaving(name, data){
    return new Promise(resolve => {
      if (send(name, data, resolve)) setTimeout(resolve, 1000);
      else resolve();
    });
  }

  // Piano Intros tracks. The discounted total is spread across tracks so item revenue adds up.
  function introItems(tracks, value, variant){
    const paid = tracks.filter(track => !track.free);
    const price = Math.round(value / Math.max(paid.length, 1) * 100) / 100;
    return paid.map(track => ({
      item_id:`PI-${numberLabel(track.number)}`, item_name:track.title, item_brand:track.artist,
      item_category:'Piano Intros', item_variant:variant, price, quantity:1
    }));
  }

  // A full score sold on its own page, e.g. pusa-man.
  function fullScoreItems(id, title, value){
    return [{item_id:id, item_name:title, item_category:'Full Score', price:value, quantity:1}];
  }

  window.checkoutAnalytics = {track, trackBeforeLeaving, introItems, fullScoreItems};
})();
