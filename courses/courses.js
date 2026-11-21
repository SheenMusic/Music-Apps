/* Public course descriptions only; practice applications remain independent. */
(() => {
  'use strict';
  const title = document.querySelector('title[data-title-en]');
  const description = document.querySelector('meta[data-description-en]');
  const chineseTitle = document.title;
  const chineseDescription = description?.content;
  // Japanese uses data-*-ja when a page has it, otherwise English.
  function pick(zh, en, ja) {
    const language = document.documentElement.dataset.siteLanguage;
    if (language === 'ja' && ja) return ja;
    return language === 'en' || language === 'ja' ? en : zh;
  }
  function localize() {
    if (title) document.title = pick(chineseTitle, title.dataset.titleEn, title.dataset.titleJa);
    if (description) description.content = pick(chineseDescription, description.dataset.descriptionEn, description.dataset.descriptionJa);
    for (const element of document.querySelectorAll('[data-aria-en]')) {
      if (!element.dataset.ariaZh) element.dataset.ariaZh = element.getAttribute('aria-label');
      element.setAttribute('aria-label', pick(element.dataset.ariaZh, element.dataset.ariaEn, element.dataset.ariaJa));
    }
  }
  localize();
  window.addEventListener('pageshow', localize);
})();
