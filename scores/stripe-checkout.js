/* Stripe Payment Links (card, Apple Pay, Google Pay): links and prices.
   Used by the shared purchase dialog (checkout-dialog.js) when the buyer picks
   「信用卡 / Apple Pay / Google Pay」 in any language. The dialog records the order in
   the Google Sheet first, then calls redirect().
   Stripe picks USD or JPY from the buyer's location; the price shown on the page
   follows the page language. The order ID goes to Stripe as client_reference_id. */
(() => {
  'use strict';
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
  // Price for a number of paid intros, in both currencies.
  function introPrice(count){
    const n = Math.min(count, PRICE.intro.max);
    return {usd:n * PRICE.intro.usd, jpy:n * PRICE.intro.jpy};
  }
  // Stripe accepts letters, digits, '-' and '_' (up to 200 characters).
  function redirect(url, reference, email){
    const params = new URLSearchParams({client_reference_id:String(reference).replace(/[^A-Za-z0-9_-]/g, '-').slice(0, 200)});
    if (email) params.set('prefilled_email', email);
    location.href = `${url}?${params}`;
  }
  window.stripeCheckout = {LINKS, PRICE, introPrice, redirect};
})();
