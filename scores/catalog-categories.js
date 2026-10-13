/* Independent native disclosures; direct category links reveal their cards. */
(() => {
  'use strict';
  const categories = [...document.querySelectorAll('.scores-catalog .score-category')];
  const sync = category => category.querySelector('summary').setAttribute('aria-expanded', String(category.open));
  for (const category of categories) category.addEventListener('toggle', () => sync(category));
  function revealHash() {
    const category = categories.find(item => '#' + item.id === location.hash);
    if (!category) return;
    category.open = true;sync(category);
    requestAnimationFrame(() => category.scrollIntoView({block:'start',behavior:'instant'}));
  }
  window.addEventListener('hashchange', revealHash);
  window.addEventListener('pageshow', revealHash);
  revealHash();
})();
