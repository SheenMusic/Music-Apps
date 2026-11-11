/* English / Japanese track list with its own pricing:
   English $1 per intro, $6 maximum; Japanese ¥150 per intro, ¥900 maximum.
   The Chinese purchase flow (catalog.js, checkout.js, CNY pricing) is separate.
   Names come from piano-intros.json: titleEn / titleJa per track, artists{} for singers.
   Checkout goes through stripe-checkout.js (Stripe Payment Links). */
(() => {
  'use strict';
  const lists = document.querySelectorAll('[data-intl-list]');
  if (!lists.length) return;
  const pricing = {en:{each:1,max:6,format:n => `$${n}`},ja:{each:150,max:900,format:n => `¥${n}`}};
  const priceFor = (lang,count) => Math.min(count * pricing[lang].each,pricing[lang].max);
  const numberLabel = n => String(n).padStart(3,'0');
  const selected = new Set();
  let tracksByNumber = [];  // all tracks, sorted, filled once the catalogue loads
  const text = {
    en:{
      idle:'$1 per intro · $6 maximum',
      summary:(n,price,capped) => `${n} selected · ${price}${capped ? ' (maximum reached)' : ''}`,
      choose:(number,title) => `Select ${number} ${title}`,
      free:'FREE · View ↗',error:'The track list could not be loaded. Please try again later.'
    },
    ja:{
      idle:'1曲 ¥150 · 最大 ¥900',
      summary:(n,price,capped) => `${n}曲選択中 · ${price}${capped ? '（上限）' : ''}`,
      choose:(number,title) => `${number} ${title} を選ぶ`,
      free:'FREE · 見る ↗',error:'曲目を読み込めませんでした。時間をおいて再度お試しください。'
    }
  };
  function element(tag, className, value){
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (value !== undefined) node.textContent = value;
    return node;
  }
  function update(){
    const count = selected.size;
    for (const bar of document.querySelectorAll('[data-intl-bar]')) {
      const lang = bar.dataset.intlBar, t = text[lang], rule = pricing[lang];
      const price = priceFor(lang,count), capped = count * rule.each > rule.max;
      bar.querySelector('[data-intl-summary]').textContent = count ? t.summary(count,rule.format(price),capped) : t.idle;
      bar.querySelector('[data-intl-clear]').disabled = count === 0;
      bar.querySelector('[data-intl-checkout]').disabled = count === 0;
    }
    for (const checkbox of document.querySelectorAll('[data-intl-list] input')) {
      checkbox.checked = selected.has(Number(checkbox.value));
      checkbox.closest('li').classList.toggle('selected',checkbox.checked);
    }
  }
  function render(data){
    const tracks = data.tracks.slice().sort((a,b) => a.number - b.number);
    tracksByNumber = tracks;
    for (const list of lists) {
      const lang = list.dataset.intlList, t = text[lang];
      const fragment = document.createDocumentFragment();
      for (const track of tracks) {
        const row = element('li','song-row');
        const label = element(track.free ? 'div' : 'label',track.free ? 'free-row' : 'song-label');
        const names = data.artists?.[track.artist];
        // English: romanized title first; Japanese readers see the original title.
        const title = lang === 'ja' ? track.titleJa || track.title : track.titleEn || track.title;
        const titleNode = element('span','song-title',title);
        if (lang === 'en' && track.titleEn && track.titleEn !== track.title) {
          const original = element('span','',` ${track.title}`);original.lang = 'zh-CN';titleNode.append(original);
        }
        label.append(element('span','song-number',numberLabel(track.number)),titleNode,element('span','song-artist',names?.[lang] || track.artist));
        if (track.free) {
          const link = element('a','',t.free);link.href = track.url;
          label.append(link);
        } else {
          const choice = element('span','song-choice'), checkbox = document.createElement('input');
          checkbox.type = 'checkbox';checkbox.value = track.number;
          checkbox.setAttribute('aria-label',t.choose(numberLabel(track.number),title));
          checkbox.addEventListener('change',() => {
            if (checkbox.checked) selected.add(track.number);
            else selected.delete(track.number);
            update();
          });
          choice.append(checkbox);label.append(choice);
        }
        row.append(label);fragment.append(row);
      }
      list.replaceChildren(fragment);
    }
    update();
  }
  for (const button of document.querySelectorAll('[data-intl-clear]')) button.addEventListener('click',() => { selected.clear();update(); });
  for (const button of document.querySelectorAll('[data-intl-checkout]')) button.addEventListener('click',() => window.stripeCheckout?.intros(tracksByNumber.filter(track => selected.has(track.number)), button));
  update();
  fetch('../data/piano-intros.json',{cache:'no-cache'})
    .then(response => { if (!response.ok) throw new Error('Catalogue unavailable'); return response.json(); })
    .then(render)
    .catch(() => { for (const list of lists) list.replaceChildren(element('li','muted',text[list.dataset.intlList].error)); });
})();
