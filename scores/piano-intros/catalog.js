/* Data-driven catalogue; validated selections are passed to the shared checkout. */
(() => {
  'use strict';
  const byID = id => document.getElementById(id);
  const selected = new Set();
  let catalogue;
  const numberLabel = n => String(n).padStart(3,'0');
  const normalize = value => value.normalize('NFKC').toLocaleLowerCase().replace(/\s+/g,'');
  function element(tag, className, text){
    const node = document.createElement(tag);
    if(className) node.className = className;
    if(text !== undefined) node.textContent = text;
    return node;
  }
  function completeVolume(id){
    const volume = catalogue.volumes.find(volume=>volume.id === id);
    if(!volume) return null;
    const tracks = catalogue.tracks.filter(track=>track.volume === id);
    return tracks.length === volume.end-volume.start+1 && tracks.every((track,index)=>track.number === volume.start+index)
      ? {volume,tracks} : null;
  }
  function selectionPlan(){
    const tracks = catalogue.tracks.filter(track=>selected.has(track.number) && !track.free);
    const quote = window.scorePricing.quote(tracks.length);
    if(!quote) return null;
    const bundle = completeVolume(1);
    const recommend = bundle && tracks.every(track=>track.volume === 1) && quote.volume === bundle.volume.id;
    return {tracks,quote,bundle:recommend ? bundle : null};
  }
  function updateSelection(){
    const count = selected.size, plan = selectionPlan();
    byID('selectedCount').textContent = `已选 ${count} 首`;
    byID('selectedCount').hidden = !plan?.bundle;
    byID('selectionPrice').textContent = !plan ? '单首 ¥2 · 多选自动优惠'
      : plan.bundle ? `Vol. 1 全30首更划算 · ¥${plan.bundle.volume.price}` : `已选 ${count} 首 · ¥${plan.quote.price}`;
    byID('confirmSelection').disabled = !plan;
    byID('confirmSelection').textContent = plan?.bundle ? `购买 Vol.1 · ¥${plan.bundle.volume.price}` : '确认选择';
    byID('confirmSelection').closest('.selection-bar').classList.toggle('recommending',Boolean(plan?.bundle));
    byID('clearSelection').disabled = count === 0;
    for(const checkbox of byID('songList').querySelectorAll('input')){
      checkbox.checked = selected.has(Number(checkbox.value));
      checkbox.closest('li').classList.toggle('selected',checkbox.checked);
    }
  }
  function renderSongs(){
    const query = normalize(byID('songSearch').value);
    const tracks = catalogue.tracks.filter(track => !query || normalize(`${track.title} ${track.artist} ${numberLabel(track.number)}`).includes(query));
    const fragment = document.createDocumentFragment();
    for(const track of tracks){
      const row = element('li','song-row');
      const label = element(track.free ? 'div' : 'label',track.free ? 'free-row' : 'song-label');
      label.append(element('span','song-number',numberLabel(track.number)),element('span','song-title',track.title),element('span','song-artist',track.artist));
      if(track.free){
        const link = element('a','', '');
        link.href = track.url;
        link.dataset.scoreConsent = `piano-intros:${numberLabel(track.number)}`;
        link.dataset.scoreId = track.score_id || new URL(track.url,location.href).pathname.split('/').filter(Boolean).pop();
        link.dataset.scoreTitle = track.title;
        link.setAttribute('aria-label',`免费下载《${track.title}》前奏乐谱`);
        link.append(element('strong','free-tag','FREE'),element('span','','查看乐谱 ↗'));
        label.append(link);
      }else{
        const choice = element('span','song-choice'), checkbox = document.createElement('input');
        checkbox.type = 'checkbox'; checkbox.value = track.number;
        checkbox.setAttribute('aria-label',`选择 ${numberLabel(track.number)} ${track.artist}《${track.title}》`);
        checkbox.addEventListener('change',()=>{
          if(checkbox.checked) selected.add(track.number);
          else selected.delete(track.number);
          updateSelection();
        });
        choice.append(checkbox); label.append(choice);
      }
      row.append(label); fragment.append(row);
    }
    byID('songList').replaceChildren(fragment);
    byID('resultCount').textContent = `${tracks.length} 首`;
    byID('catalogStatus').textContent = tracks.length ? '' : '没有找到符合条件的曲目。';
    updateSelection();
  }
  function preparePurchase(tracks, price, label, packageType, pricingMethod, requestedTracks){
    window.scoreCheckout.open({tracks, price, label, packageType, pricingMethod, requestedTracks});
  }
  function purchaseVolume(bundle, requestedTracks){
    const {volume,tracks} = bundle;
    preparePurchase(tracks,volume.price,volume.title,`${volume.title} · 全${tracks.length}首`,
      `${volume.title} · 全${tracks.length}首 · ¥${volume.price}`,requestedTracks);
  }
  function renderVolumes(){
    const fragment = document.createDocumentFragment();
    for(const volume of catalogue.volumes){
      const tracks = catalogue.tracks.filter(track=>track.volume === volume.id);
      // Only publish an existing, complete volume; never advertise future ones.
      if(tracks.length !== volume.end-volume.start+1 || !tracks.every((track,index)=>track.number === volume.start+index)) continue;
      const section = element('section','volume'), info = element('div');
      const freeTitles = tracks.filter(track=>track.free).map(track=>`《${track.title}》`).join('、');
      info.append(element('h2','',volume.title),element('p','',volume.description),element('p','volume-range',`${numberLabel(volume.start)}–${numberLabel(volume.end)}${freeTitles ? ` · 全集包含免费样本${freeTitles}` : ''}`));
      const button = element('button','button',`购买全辑 · ¥${volume.price}`);
      button.type = 'button'; button.addEventListener('click',()=>purchaseVolume({volume,tracks}));
      section.append(info,button); fragment.append(section);
    }
    byID('volumes').replaceChildren(fragment);
  }
  function validate(data){
    if(!data || !Array.isArray(data.tracks) || !Array.isArray(data.volumes)) throw new Error('Invalid catalogue');
    const numbers = new Set();
    for(const track of data.tracks){
      if(!Number.isInteger(track.number) || track.number < 1 || numbers.has(track.number) || typeof track.title !== 'string' || typeof track.artist !== 'string' || !Number.isInteger(track.volume)) throw new Error('Invalid track');
      numbers.add(track.number);
      if(track.free){
        const url = new URL(track.url,location.href);
        if(url.origin !== location.origin || !url.pathname.includes('/scores/')) throw new Error('Invalid free score URL');
      }
    }
    data.tracks.sort((a,b)=>a.number-b.number);
    const volumeIDs = new Set();
    for(const volume of data.volumes){
      if(!Number.isInteger(volume.id) || volumeIDs.has(volume.id) || !Number.isInteger(volume.start) || !Number.isInteger(volume.end) || volume.start < 1 || volume.end < volume.start || !Number.isFinite(volume.price) || volume.price <= 0 || typeof volume.title !== 'string' || typeof volume.description !== 'string') throw new Error('Invalid volume');
      volumeIDs.add(volume.id);
    }
  }
  byID('songSearch').addEventListener('input',renderSongs);
  byID('clearSelection').addEventListener('click',()=>{selected.clear();updateSelection()});
  byID('confirmSelection').addEventListener('click',()=>{
    const plan = selectionPlan();
    if(!plan) return;
    if(plan.bundle) purchaseVolume(plan.bundle,plan.tracks);
    else preparePurchase(plan.tracks,plan.quote.price,'自选前奏',`自由选曲 · ${plan.tracks.length}首`,plan.quote.method);
  });
  async function init(){
    try{
      const response = await fetch('../data/piano-intros.json',{cache:'no-cache'});
      if(!response.ok) throw new Error('Catalogue unavailable');
      catalogue = await response.json();validate(catalogue);
      renderVolumes();renderSongs();byID('songSearch').disabled = false;
    }catch{
      byID('catalogStatus').textContent = '曲库暂时无法加载，请稍后重试。免费《江南》仍可从乐铺屋下载。';
    }
  }
  init();
})();
