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
  localize();
  window.addEventListener('pageshow', localize);
})();
