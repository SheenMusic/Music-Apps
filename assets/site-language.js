/* Public-site language preference. Student applications never load this file. */
(() => {
  'use strict';
  if (!document.querySelector('header[data-site-navigation]')) return;
  const key = 'sheen-lang';
  const supported = value => value === 'zh' || value === 'en';
  const isHome = /^\/(?:index\.html)?$/.test(location.pathname);
  const isEnglishHome = /^\/en\/(?:index\.html)?$/.test(location.pathname);
  const read = () => { try { return localStorage.getItem(key); } catch { return null; } };
  const save = lang => { try { localStorage.setItem(key, lang); } catch { /* URL still works without storage. */ } };
  const originalLinks = new WeakMap();
  let language;
  const labels = {
    zh: {home:'首页',about:'关于我',scores:'乐谱',courses:'课程',articles:'文章',works:'作品',contact:'联系'},
    en: {home:'Home',about:'About',scores:'Scores',courses:'Lessons',articles:'Writing',works:'Works',contact:'Contact'}
  };
  function resolve() {
    const explicit = new URL(location.href).searchParams.get('lang');
    if (supported(explicit)) return explicit;
    if (isEnglishHome) return 'en';
    if (isHome) return 'zh';
    const stored = read();
    return supported(stored) ? stored : 'zh';
  }
  function publicURL(url) {
    return url.origin === location.origin &&
      (/^\/(?:index\.html)?$/.test(url.pathname) || /^\/en\/(?:index\.html)?$/.test(url.pathname) ||
      /^\/(scores|courses|articles|works)\/(?:.*\/|.*\.html)?$/.test(url.pathname));
  }
  function localizeURL(url, lang) {
    if (/^\/(?:index\.html)?$/.test(url.pathname) || /^\/en\/(?:index\.html)?$/.test(url.pathname)) {
      url.pathname = lang === 'en' ? '/en/' : '/';
      url.searchParams.delete('lang');
    } else if (lang === 'en') url.searchParams.set('lang','en');
    else url.searchParams.delete('lang');
    return url.pathname + url.search + url.hash;
  }
  function updateContent() {
    const main = document.querySelector('main');
    const english = !!main?.querySelector('[data-content-lang="en"]') || main?.dataset.contentLang === 'en';
    const visible = language === 'en' && english ? 'en' : 'zh';
    for (const block of document.querySelectorAll('[data-content-lang]')) {
      block.lang = block.dataset.contentLang === 'en' ? 'en' : 'zh-CN';
      block.hidden = block.dataset.contentLang !== visible;
      block.inert = block.hidden;
    }
    if (!isHome && !isEnglishHome) document.documentElement.lang = visible === 'en' ? 'en' : 'zh-CN';
    let note = document.querySelector('[data-language-progress]');
    const needsNote = language === 'en' && !english && !isHome && !isEnglishHome;
    if (needsNote && main && !note) {
      note = document.createElement('p');
      note.dataset.languageProgress = '';note.className = 'site-language-progress';note.lang = 'en';
      note.textContent = 'English version in progress.';
      (main.querySelector('.reading-width,.shell') || main).prepend(note);
    } else if (!needsNote && note) note.remove();
  }
  function updateLinks() {
    for (const link of document.querySelectorAll('a[href]:not(.language-link)')) {
      if (!originalLinks.has(link)) originalLinks.set(link, link.getAttribute('href'));
      const original = originalLinks.get(link);
      if (original.startsWith('#')) continue;
      let url;
      try { url = new URL(original, location.href); } catch { continue; }
      if (!publicURL(url)) continue; // PDF, media, payment and unlisted URLs remain untouched.
      const explicit = url.searchParams.get('lang');
      const href = localizeURL(url, supported(explicit) ? explicit : language);
      if (link.getAttribute('href') !== href) link.setAttribute('href', href);
    }
  }
  function refresh() {
    updateContent();updateLinks();
  }
  function apply() {
    language = resolve();save(language);
    if ((isHome && language === 'en') || (isEnglishHome && language === 'zh')) {
      location.replace(localizeURL(new URL(location.href),language));return;
    }
    if (!isHome && !isEnglishHome && language === 'en') {
      const url = new URL(location.href);url.searchParams.set('lang','en');
      history.replaceState(history.state,'',url.pathname + url.search + url.hash);
    }
    document.documentElement.dataset.siteLanguage = language;
    const bar = document.querySelector('header[data-site-navigation] .topbar-inner');
    let link = bar.querySelector('.language-link');
    if (!link) {
      let container = bar.querySelector('.lang');
      if (!container) { container = document.createElement('div');container.className = 'lang';bar.insertBefore(container,bar.querySelector('.menu-button,.menu-toggle-placeholder')); }
      link = document.createElement('a');link.className = 'language-link';container.append(link);
      link.addEventListener('click',() => save(language === 'en' ? 'zh' : 'en'));
    }
    const next = language === 'en' ? 'zh' : 'en';
    link.textContent = next === 'en' ? 'EN' : '中文';link.lang = next === 'en' ? 'en' : 'zh-CN';link.hreflang = link.lang;
    link.setAttribute('aria-label',next === 'en' ? 'Switch to English' : '切换为中文');
    link.href = localizeURL(new URL(location.href),next);
    const button = document.getElementById('menuButton');
    button.dataset.openLabel = language === 'en' ? 'Open menu' : '打开菜单';
    button.dataset.closeLabel = language === 'en' ? 'Close menu' : '关闭菜单';
    button.setAttribute('aria-label',button.getAttribute('aria-expanded') === 'true' ? button.dataset.closeLabel : button.dataset.openLabel);
    document.getElementById('menuPanel').setAttribute('aria-label',language === 'en' ? 'Site navigation' : '网站导航');
    const nav = document.querySelector('.menu-links');nav.setAttribute('aria-label',language === 'en' ? 'Site navigation' : '网站导航');
    for (const item of nav.querySelectorAll('[data-nav-section]')) item.textContent = labels[language][item.dataset.navSection];
    refresh();
  }
  for (const link of document.querySelectorAll('.language-link')) link.addEventListener('click',() => save(language === 'en' ? 'zh' : 'en'));
  const about = document.createElement('a');
  about.href = '/articles/article.html?slug=about';
  about.dataset.navSection = 'about';
  document.querySelector('.menu-links [data-nav-section="home"]').after(about);
  apply();
  // Article lists/Markdown and other public content can add links after loading.
  let scheduled = false;
  new MutationObserver(() => {
    if (scheduled) return;
    scheduled = true;
    queueMicrotask(() => { scheduled = false;refresh(); });
  }).observe(document.querySelector('main'),{childList:true,subtree:true});
  window.addEventListener('pageshow',event => { if (event.persisted) apply(); });
})();
