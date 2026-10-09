/* Public course descriptions only; practice applications remain independent. */
(() => {
  'use strict';
  const title = document.querySelector('title[data-title-en]');
  const description = document.querySelector('meta[data-description-en]');
  const chineseTitle = document.title;
  const chineseDescription = description?.content;
  function localize() {
    const english = document.documentElement.dataset.siteLanguage === 'en';
    if (title) document.title = english ? title.dataset.titleEn : chineseTitle;
    if (description) description.content = english ? description.dataset.descriptionEn : chineseDescription;
    for (const element of document.querySelectorAll('[data-aria-en]')) {
      if (!element.dataset.ariaZh) element.dataset.ariaZh = element.getAttribute('aria-label');
      element.setAttribute('aria-label', english ? element.dataset.ariaEn : element.dataset.ariaZh);
    }
  }
  const cards = [...document.querySelectorAll('.training-card')];
  for (const card of cards) {
    card.addEventListener('toggle', () => {
      card.querySelector('summary').setAttribute('aria-expanded', String(card.open));
    });
  }
  function openHash() {
    const card = cards.find(item => '#' + item.id === location.hash);
    if (!card) return;
    card.open = true;
    card.querySelector('summary').setAttribute('aria-expanded', 'true');
    requestAnimationFrame(() => card.scrollIntoView({block: 'start', behavior: 'instant'}));
  }
  localize();
  openHash();
  window.addEventListener('hashchange', openHash);
  window.addEventListener('pageshow', localize);
})();
