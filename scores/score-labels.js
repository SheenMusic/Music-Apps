/* Localized score labels only; the shared state owns language and navigation.
   Japanese uses data-score-label-ja when present, otherwise the English label. */
(() => {
  const sync = () => {
    const site = document.documentElement.dataset.siteLanguage;
    const language = site === 'ja' || site === 'en' ? site : 'zh';
    for (const label of document.querySelectorAll('[data-score-label-zh]')) {
      const ja = language === 'ja' && label.dataset.scoreLabelJa;
      const text = language === 'zh' ? label.dataset.scoreLabelZh : ja || label.dataset.scoreLabelEn;
      label.textContent = text;
      label.lang = language === 'zh' ? 'zh-CN' : ja ? 'ja' : 'en';
    }
  };
  sync();
  new MutationObserver(sync).observe(document.documentElement, {attributes:true,attributeFilter:['data-site-language']});
  window.addEventListener('pageshow',sync);
})();
