/* Localized score labels only; the shared state owns language and navigation. */
(() => {
  const sync = () => {
    const language = document.documentElement.dataset.siteLanguage === 'en' ? 'en' : 'zh';
    for (const label of document.querySelectorAll('[data-score-label-zh]')) {
      label.textContent = language === 'en' ? label.dataset.scoreLabelEn : label.dataset.scoreLabelZh;
      label.lang = language === 'en' ? 'en' : 'zh-CN';
    }
  };
  sync();
  new MutationObserver(sync).observe(document.documentElement, {attributes:true,attributeFilter:['data-site-language']});
  window.addEventListener('pageshow',sync);
})();
