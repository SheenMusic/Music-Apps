/* Data-driven catalogue. No payment is initiated from the preparation dialog. */
(() => {
  'use strict';
  const byID = id => document.getElementById(id);
  const selected = new Set();
  let catalogue, packages, maxCount, lastFocus, previousOverflow;
  const numberLabel = n => String(n).padStart(3,'0');
  const normalize = value => value.normalize('NFKC').toLocaleLowerCase().replace(/\s+/g,'');
  function element(tag, className, text){
    const node = document.createElement(tag);
    if(className) node.className = className;
    if(text !== undefined) node.textContent = text;
    return node;
  }
  function updateSelection(){
    const count = selected.size, price = packages.get(count);
    byID('selectedCount').textContent = `已选 ${count} 首`;
    byID('selectionPrice').textContent = price === undefined ? '请选择 1、5 或 10 首' : `¥${price}`;
    byID('confirmSelection').disabled = price === undefined;
    byID('clearSelection').disabled = count === 0;
    for(const checkbox of byID('songList').querySelectorAll('input')){
      checkbox.checked = selected.has(Number(checkbox.value));
      checkbox.disabled = count >= maxCount && !checkbox.checked;
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
        link.setAttribute('aria-label',`免费下载《${track.title}》前奏乐谱`);
        link.append(element('strong','free-tag','FREE'),element('span','','查看乐谱 ↗'));
        label.append(link);
      }else{
        const choice = element('span','song-choice'), checkbox = document.createElement('input');
        checkbox.type = 'checkbox'; checkbox.value = track.number;
        checkbox.setAttribute('aria-label',`选择 ${numberLabel(track.number)} ${track.artist}《${track.title}》`);
        checkbox.addEventListener('change',()=>{
          if(checkbox.checked && selected.size < maxCount) selected.add(track.number);
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
  function preparePurchase(tracks, price, label){
    lastFocus = document.activeElement;
    byID('purchaseSummary').textContent = `${label} · ${tracks.length} 首 · ¥${price}`;
    byID('purchaseTracks').replaceChildren(...tracks.map(track=>element('li','',`${numberLabel(track.number)} ${track.artist}《${track.title}》${track.free ? ' · FREE' : ''}`)));
    previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    byID('purchaseDialog').showModal();
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
      button.type = 'button'; button.addEventListener('click',()=>preparePurchase(tracks,volume.price,volume.title));
      section.append(info,button); fragment.append(section);
    }
    byID('volumes').replaceChildren(fragment);
  }
  function validate(data){
    if(!data || !Array.isArray(data.tracks) || !Array.isArray(data.volumes) || !Array.isArray(data.selectionPackages)) throw new Error('Invalid catalogue');
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
    const counts = new Set();
    for(const pack of data.selectionPackages){
      if(![1,5,10].includes(pack.count) || counts.has(pack.count) || !Number.isFinite(pack.price) || pack.price <= 0) throw new Error('Invalid package');
      counts.add(pack.count);
    }
    if(counts.size !== 3) throw new Error('Missing package');
    const volumeIDs = new Set();
    for(const volume of data.volumes){
      if(!Number.isInteger(volume.id) || volumeIDs.has(volume.id) || !Number.isInteger(volume.start) || !Number.isInteger(volume.end) || volume.start < 1 || volume.end < volume.start || !Number.isFinite(volume.price) || volume.price <= 0 || typeof volume.title !== 'string' || typeof volume.description !== 'string') throw new Error('Invalid volume');
      volumeIDs.add(volume.id);
    }
  }
  byID('songSearch').addEventListener('input',renderSongs);
  byID('clearSelection').addEventListener('click',()=>{selected.clear();updateSelection()});
  byID('confirmSelection').addEventListener('click',()=>{
    const price = packages.get(selected.size);
    if(price !== undefined) preparePurchase(catalogue.tracks.filter(track=>selected.has(track.number) && !track.free),price,'自选前奏');
  });
  for(const id of ['closeDialog','returnToCatalog']) byID(id).addEventListener('click',()=>byID('purchaseDialog').close());
  byID('purchaseDialog').addEventListener('close',()=>{document.body.style.overflow = previousOverflow || ''; lastFocus?.focus()});
  async function init(){
    try{
      const response = await fetch('../data/piano-intros.json',{cache:'no-cache'});
      if(!response.ok) throw new Error('Catalogue unavailable');
      catalogue = await response.json();validate(catalogue);
      packages = new Map(catalogue.selectionPackages.map(pack=>[pack.count,pack.price]));
      maxCount = Math.max(...packages.keys());
      renderVolumes();renderSongs();byID('songSearch').disabled = false;
    }catch{
      byID('catalogStatus').textContent = '曲库暂时无法加载，请稍后重试。免费《江南》仍可从乐铺屋下载。';
    }
  }
  init();
})();
