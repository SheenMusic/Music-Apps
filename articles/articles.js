/* Plain static-site article loader. New articles need only JSON + Markdown. */
(() => {
  'use strict';
  const status = document.getElementById('articleStatus');
  const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  const articleURL = slug => `./article.html?slug=${encodeURIComponent(slug)}`;

  async function loadManifest(){
    const response = await fetch('./articles.json', {cache:'no-cache'});
    if(!response.ok) throw new Error('Manifest unavailable');
    const items = await response.json();
    const seen = new Set();
    if(!Array.isArray(items)) throw new Error('Invalid manifest');
    for(const item of items){
      if(!item || typeof item.slug !== 'string' || !slugPattern.test(item.slug) || typeof item.title !== 'string' || !item.title.trim() || seen.has(item.slug)) throw new Error('Invalid article metadata');
      seen.add(item.slug);
    }
    return items;
  }

  function addDate(parent, item){
    // Empty/unspecified dates stay invisible; never invent publication dates.
    if(typeof item.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(item.date)) return;
    const time = document.createElement('time');
    time.dateTime = item.date;
    time.textContent = item.date;
    parent.append(time);
  }

  function renderList(items){
    const list = document.getElementById('articleList');
    const fragment = document.createDocumentFragment();
    for(const item of items){
      const row = document.createElement('li');
      const link = document.createElement('a');
      link.className = 'article-link';
      link.href = articleURL(item.slug);
      const title = document.createElement('h2');
      title.textContent = item.title;
      link.append(title);
      if(typeof item.description === 'string' && item.description.trim()){
        const description = document.createElement('p');
        description.textContent = item.description;
        link.append(description);
      }
      addDate(link, item);
      row.append(link);
      fragment.append(row);
    }
    list.replaceChildren(fragment);
    list.classList.add('content-ready');
    status.textContent = items.length ? '' : '暂无文章。';
  }

  function markdownFragment(markdown, sourceURL){
    if(!window.marked || !window.DOMPurify) throw new Error('Renderer unavailable');
    const fragment = DOMPurify.sanitize(marked.parse(markdown), {
      USE_PROFILES: {html:true}, RETURN_DOM_FRAGMENT:true
    });
    const usedIDs = new Set(['articleTitle', 'articleDate', 'articleBody', 'articleStatus']);
    for(const heading of fragment.querySelectorAll('h1,h2,h3')){
      const base = heading.textContent.trim().toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '') || 'section';
      let id = base, suffix = 2;
      while(usedIDs.has(id)) id = `${base}-${suffix++}`;
      usedIDs.add(id);
      heading.id = id;
    }
    for(const element of fragment.querySelectorAll('a[href],img[src]')){
      const image = element.tagName === 'IMG';
      const attribute = image ? 'src' : 'href';
      const value = element.getAttribute(attribute);
      try{
        const url = new URL(value, !image && value.startsWith('#') ? location.href : sourceURL);
        const allowed = image ? ['http:', 'https:'] : ['http:', 'https:', 'mailto:', 'tel:'];
        if(!allowed.includes(url.protocol)) element.removeAttribute(attribute);
        else element.setAttribute(attribute, url.href);
      }catch{ element.removeAttribute(attribute); }
      if(image){ element.loading = 'lazy'; element.decoding = 'async'; }
    }
    return fragment;
  }

  let renderedLanguage;
  const currentLanguage = () => document.documentElement.dataset.siteLanguage === 'en' ? 'en' : 'zh';
  async function renderArticle(items){
    const slug = new URLSearchParams(location.search).get('slug');
    const item = items.find(article => article.slug === slug);
    const title = document.getElementById('articleTitle');
    if(!item){
      title.textContent = '未找到文章';
      document.title = '未找到文章 · Sheen Yang';
      status.textContent = '请从文章列表选择要阅读的文章。';
      return;
    }
    const language = currentLanguage();
    const translated = language === 'en' ? item.translations?.en : null;
    const metadata = translated || item;
    const contentLanguage = translated ? 'en' : 'zh';
    const body = document.getElementById('articleBody');
    if (item.translations?.en) body.dataset.contentLang = contentLanguage;
    title.textContent = metadata.title;
    document.title = metadata.documentTitle || `${metadata.title} · Sheen Yang`;
    document.querySelector('meta[name="description"]').content = typeof metadata.description === 'string' ? metadata.description : '';
    const date = document.getElementById('articleDate');
    if(typeof item.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(item.date)){
      date.dateTime = item.date;
      date.textContent = item.date;
      date.hidden = false;
    }
    const sourceURL = new URL(`./posts/${encodeURIComponent(item.slug)}${translated ? ".en" : ""}.md`, location.href);
    const response = await fetch(sourceURL, {cache:'no-cache'});
    if(!response.ok) throw new Error('Article unavailable');
    const markdown = await response.text();
    // Front matter is metadata, not article prose; keep the source file intact.
    const content = markdown.replace(/^\uFEFF?---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/, '');
    const fragment = markdownFragment(content, sourceURL);
    // The template already displays the article title. Render it only once.
    const first = fragment.firstElementChild;
    if(first?.tagName === 'H1' && first.textContent.trim() === metadata.title.trim()) first.remove();
    body.replaceChildren(fragment);
    renderedLanguage = language;
    body.classList.add('content-ready');
    status.textContent = '';
    // Analytics observes successful loads without changing Markdown or layout.
    window.dispatchEvent(new CustomEvent('site:article-loaded', {
      detail: {slug:item.slug, title:metadata.title}
    }));
  }

  async function init(){
    try{
      const items = await loadManifest();
      if(document.body.dataset.articlePage === 'index') renderList(items);
      else {
        await renderArticle(items);
        // A restored Chinese URL may now inherit a newly chosen English preference.
        // Run after the shared language-state pageshow handler has resolved it.
        window.addEventListener('pageshow', event => {
          if (event.persisted) queueMicrotask(() => {
            if (currentLanguage() !== renderedLanguage) renderArticle(items).catch(() => {
              status.textContent = '文章暂时无法加载，请稍后重试。';
            });
          });
        });
      }
    }catch{
      const title = document.getElementById('articleTitle');
      if(title && !title.textContent) title.textContent = '文章';
      status.textContent = '文章暂时无法加载，请稍后重试。';
    }
  }
  init();
})();
