/* Shared catalogue/checkout quote: base package + extra paid tracks. */
(() => {
  'use strict';
  function quote(count, catalogue){
    if(!Number.isInteger(count) || count < 1) return null;
    const prices = new Map(catalogue.selectionPackages.map(pack=>[pack.count,pack.price]));
    const base = count >= 10 ? 10 : count >= 5 ? 5 : 0;
    const extraPrice = prices.get(1);
    const price = base ? prices.get(base)+(count-base)*extraPrice : count*extraPrice;
    const method = base
      ? `${base}首套餐 ¥${prices.get(base)}${count > base ? ` + ${count-base}首 × ¥${extraPrice}` : ''}`
      : `每首 ¥${extraPrice} × ${count}`;
    return {price,method};
  }
  window.scorePricing = {quote};
})();
