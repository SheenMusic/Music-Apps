/* Public-site language preference. Student applications never load this file. */
(() => {
  'use strict';
  if (!document.querySelector('header[data-site-navigation]')) return;
  const key = 'sheen-lang';
  const supported = value => value === 'zh' || value === 'en' || value === 'ja';
  const isHome = /^\/(?:index\.html)?$/.test(location.pathname);
  const isEnglishHome = /^\/en\/(?:index\.html)?$/.test(location.pathname);
  const isJapaneseHome = /^\/ja\/(?:index\.html)?$/.test(location.pathname);
  const homes = {zh:'/',en:'/en/',ja:'/ja/'};
  const isAnyHome = isHome || isEnglishHome || isJapaneseHome;
  const homeLanguage = isJapaneseHome ? 'ja' : isEnglishHome ? 'en' : isHome ? 'zh' : null;
  const homePath = /^\/(?:(?:en|ja)\/)?(?:index\.html)?$/;
  const read = () => { try { return localStorage.getItem(key); } catch { return null; } };
  const save = lang => { try { localStorage.setItem(key, lang); } catch { /* URL still works without storage. */ } };
  const originalLinks = new WeakMap();
  let language;
  const labels = {
    zh: {home:'首页',about:'关于我',scores:'乐谱',courses:'课程',articles:'文章',works:'作品',contact:'联系'},
    en: {home:'Home',about:'About',scores:'Scores',courses:'Courses',articles:'Writing',works:'Works',contact:'Contact'},
    ja: {home:'ホーム',about:'プロフィール',scores:'楽譜',courses:'コース',articles:'記事',works:'作品',contact:'お問い合わせ'}
  };
  // Japanese is added page by page; pages without it fall back to English, then Chinese.
  const switchLabels = {zh:'中文',en:'EN',ja:'日本語'};
  const htmlLang = {zh:'zh-CN',en:'en',ja:'ja'};
  const progressNotes = {en:'English version in progress.',ja:'日本語版は準備中です。'};
  // Language in the URL is a bare key: ?en or ?ja. The older ?lang=en form still works.
  function urlLanguage(url) {
    const params = url.searchParams;
    if (supported(params.get('lang'))) return params.get('lang');
    return ['en','ja','zh'].find(lang => params.has(lang)) || null;
  }
  function withLanguage(url, lang) {
    for (const key of ['lang','en','ja','zh']) url.searchParams.delete(key);
    const rest = url.searchParams.toString();
    const search = [rest, lang].filter(Boolean).join('&');
    return url.pathname + (search ? `?${search}` : '') + url.hash;
  }
  function resolve() {
    const explicit = urlLanguage(new URL(location.href));
    if (explicit) return explicit;
    if (homeLanguage) return homeLanguage;
    const stored = read();
    return supported(stored) ? stored : 'zh';
  }
  function publicURL(url) {
    return url.origin === location.origin &&
      (homePath.test(url.pathname) ||
      /^\/(scores|courses|articles|works)\/(?:.*\/|.*\.html)?$/.test(url.pathname));
  }
  function localizeURL(url, lang) {
    if (homePath.test(url.pathname)) {
      // Each language has its own home page: /, /en/ and /ja/.
      url.pathname = homes[lang];
      return withLanguage(url, '');
    }
    return withLanguage(url, lang === 'zh' ? '' : lang);
  }
  function updateContent() {
    const main = document.querySelector('main');
    const available = new Set(['zh']);
    if (main?.dataset.contentLang) available.add(main.dataset.contentLang);
    // A block may serve several languages, e.g. data-content-lang="zh en".
    const langsOf = block => block.dataset.contentLang.split(/\s+/);
    for (const block of main?.querySelectorAll('[data-content-lang]') || []) for (const lang of langsOf(block)) available.add(lang);
    const visible = available.has(language) ? language : language === 'ja' && available.has('en') ? 'en' : 'zh';
    for (const block of document.querySelectorAll('[data-content-lang]')) {
      const langs = langsOf(block);
      if (langs.length === 1) block.lang = htmlLang[langs[0]] || 'zh-CN';
      else block.removeAttribute('lang');
      block.hidden = !langs.includes(visible);
      block.inert = block.hidden;
    }
    if (!isAnyHome) document.documentElement.lang = htmlLang[visible];
    document.documentElement.dataset.contentLanguage = visible;
    // Page titles: <title data-title-en="…" data-title-ja="…"> follows the language shown.
    const title = document.querySelector('title[data-title-en]');
    if (title) {
      title.dataset.titleZh ??= title.textContent;
      title.textContent = visible === 'ja' ? title.dataset.titleJa || title.dataset.titleEn : visible === 'en' ? title.dataset.titleEn : title.dataset.titleZh;
    }
    let note = document.querySelector('[data-language-progress]');
    const needsNote = language !== 'zh' && visible !== language && !isAnyHome;
    if (note && (!needsNote || note.lang !== htmlLang[language])) { note.remove();note = null; }
    if (needsNote && main && !note) {
      note = document.createElement('p');
      note.dataset.languageProgress = '';note.className = 'site-language-progress';note.lang = htmlLang[language];
      note.textContent = progressNotes[language];
      (main.querySelector('.reading-width,.shell') || main).prepend(note);
    }
  }
  function updateLinks() {
    for (const link of document.querySelectorAll('a[href]:not(.language-link)')) {
      if (!originalLinks.has(link)) originalLinks.set(link, link.getAttribute('href'));
      const original = originalLinks.get(link);
      if (original.startsWith('#')) continue;
      let url;
      try { url = new URL(original, location.href); } catch { continue; }
      if (!publicURL(url)) continue; // PDF, media, payment and unlisted URLs remain untouched.
      const href = localizeURL(url, urlLanguage(url) || language);
      if (link.getAttribute('href') !== href) link.setAttribute('href', href);
    }
  }
  function refresh() {
    updateContent();updateLinks();
  }
  function apply() {
    language = resolve();save(language);
    if (homeLanguage && language !== homeLanguage) {
      location.replace(localizeURL(new URL(location.href),language));return;
    }
    if (!isAnyHome && language !== 'zh') {
      history.replaceState(history.state,'',withLanguage(new URL(location.href),language));
    }
    document.documentElement.dataset.siteLanguage = language;
    const bar = document.querySelector('header[data-site-navigation] .topbar-inner');
    // One link per other language, e.g. 「EN · 日本語」 while reading Chinese.
    let container = bar.querySelector('.lang');
    if (!container) { container = document.createElement('div');container.className = 'lang';bar.insertBefore(container,bar.querySelector('.menu-button,.menu-toggle-placeholder')); }
    container.replaceChildren();
    for (const next of ['zh','en','ja'].filter(lang => lang !== language)) {
      const link = document.createElement('a');link.className = 'language-link';
      link.textContent = switchLabels[next];link.lang = htmlLang[next];link.hreflang = link.lang;
      link.setAttribute('aria-label',{zh:'切换为中文',en:'Switch to English',ja:'日本語に切り替える'}[next]);
      link.href = localizeURL(new URL(location.href),next);
      link.addEventListener('click',() => save(next));
      container.append(link);
    }
    const ui = {
      zh:{open:'打开菜单',close:'关闭菜单',nav:'网站导航'},
      en:{open:'Open menu',close:'Close menu',nav:'Site navigation'},
      ja:{open:'メニューを開く',close:'メニューを閉じる',nav:'サイトナビゲーション'}
    }[language];
    const button = document.getElementById('menuButton');
    button.dataset.openLabel = ui.open;
    button.dataset.closeLabel = ui.close;
    button.setAttribute('aria-label',button.getAttribute('aria-expanded') === 'true' ? button.dataset.closeLabel : button.dataset.openLabel);
    document.getElementById('menuPanel').setAttribute('aria-label',ui.nav);
    const nav = document.querySelector('.menu-links');nav.setAttribute('aria-label',ui.nav);
    for (const item of nav.querySelectorAll('[data-nav-section]')) item.textContent = labels[language][item.dataset.navSection];
    refresh();
  }
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
