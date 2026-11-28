/* Records a score order in the seller's Google Sheet (Apps Script: scripts/order-sheet/Code.gs).
   The purchase dialog (checkout-dialog.js) calls it when the buyer clicks 「开始付款」, with four fields:
   product, amount, payment method and email.
   It records the intention to pay, not a confirmed payment; payment is still checked by hand.
   It never blocks buying: failures are ignored, and record() settles within 3 seconds. */
(() => {
  'use strict';
  const ENDPOINT = 'https://script.google.com/macros/s/AKfycbynv1g7WXCzMMku8leJOx6k_xFoEbOtAXJh_oHU2pW2Vgt4kJv0W20fmUTfMg12q4vw/exec';

  // order: {product, amount, method, email}. Resolves true when the request went out.
  function record(order){
    // A plain-text POST needs no CORS preflight; Apps Script reads it as JSON.
    // no-cors: the reply cannot be read, but the row is written all the same.
    const request = fetch(ENDPOINT, {
      method:'POST', mode:'no-cors', keepalive:true, body:JSON.stringify(order)
    }).then(() => true, () => false);
    const timeout = new Promise(resolve => setTimeout(() => resolve(false), 3000));
    return Promise.race([request, timeout]);
  }

  window.orderSheet = {record};
})();
