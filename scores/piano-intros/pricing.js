/* Automatic paid-track pricing, shared by selection and checkout. */
(() => {
  'use strict';
  const UNIT_PRICE = 2;
  const DISCOUNTS = [{count:10,price:17},{count:5,price:9}];
  const VOLUME_THRESHOLD = 16;
  const VOLUME_PRICE = 29;
  function quote(count){
    if(!Number.isInteger(count) || count < 1) return null;
    if(count >= VOLUME_THRESHOLD) return {price:VOLUME_PRICE,volume:1,method:'Piano Intros Vol. 1 · 全30首 · ¥29'};
    const discount = DISCOUNTS.find(tier=>count >= tier.count);
    const price = discount ? discount.price+(count-discount.count)*UNIT_PRICE : count*UNIT_PRICE;
    return {price,volume:null,method:discount ? '多选自动优惠' : '单首 ¥2'};
  }
  window.scorePricing = {quote};
})();
