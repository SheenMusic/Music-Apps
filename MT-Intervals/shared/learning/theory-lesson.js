/* Display-only Learning runtime. Courses own their content, checks and audio. */
(() => {
  'use strict';
  let navigationInstalled = false;
  function installNavigation() {
    if (navigationInstalled) return;
    navigationInstalled = true;
    for (const [id, keys, arrows] of [
      ['prevBtn','ArrowLeft ArrowUp','← / ↑'],
      ['nextBtn','ArrowRight ArrowDown','→ / ↓']
    ]) {
      const button = document.getElementById(id);
      if (!button) continue;
      button.setAttribute('aria-keyshortcuts',keys);
      // Native hover text needs no extra footer row or touch-screen space.
      // Read the current label: Continue may become Finish or Return Home.
      const updateHint = () => {
        const label = button.textContent.replace(/[←↑→↓]/g,'').replace(/\s+/g,' ').trim();
        button.title = `${label}（键盘：${arrows}）`;
      };
      updateHint();
      new MutationObserver(updateHint).observe(button,{childList:true,characterData:true,subtree:true});
    }
    document.addEventListener('keydown', event => {
      if (event.defaultPrevented || !document.body.classList.contains('theory-active') || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
      const previous = ['ArrowLeft','ArrowUp'].includes(event.key);
      if (!previous && !['ArrowRight','ArrowDown'].includes(event.key)) return;
      const target = event.target;
      const control = target.closest?.('input,textarea,select,button,a,[role=slider],[role=combobox],[role=listbox],[role=spinbutton],[role=tablist]');
      const reading = target.matches?.('.lesson-content') && target.scrollHeight > target.clientHeight && ['ArrowUp','ArrowDown'].includes(event.key);
      if (target.isContentEditable || reading || target.closest?.('.lesson-board,.quiz-block') || (control && !control.closest('.lesson-nav'))) return;
      event.preventDefault();
      if (event.repeat) return;
      const button = document.getElementById(previous ? 'prevBtn' : 'nextBtn');
      if (button && !button.disabled && button.getAttribute('aria-disabled') !== 'true') button.click();
    });
  }
  // SVG viewport whitespace is not music. Preserve every drawing coordinate,
  // but fit the viewport vertically to painted geometry plus a stroke-safe inset.
  function fitMusic(svg) {
    if (svg.dataset.theoryMusicFit) return;
    const inverse = svg.getScreenCTM()?.inverse();
    if (!inverse) return;
    const ys = [];
    const painted = color => color !== 'none' && color !== 'transparent' && !/rgba\(.*,[ ]*0\)$/.test(color);
    for (const node of svg.querySelectorAll('path,line,rect,circle,ellipse,polygon,polyline,text,use')) {
      if (node.closest('defs,clipPath,mask')) continue;
      let visible = true;
      for (let parent = node; parent; parent = parent.parentElement) {
        const style = getComputedStyle(parent);
        if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) { visible = false; break; }
        if (parent === svg) break;
      }
      if (!visible) continue;
      const style = getComputedStyle(node);
      const fill = node.tagName.toLowerCase() !== 'line' && painted(style.fill) && Number(style.fillOpacity) > 0;
      const stroke = painted(style.stroke) && Number(style.strokeOpacity) > 0 && parseFloat(style.strokeWidth) > 0;
      if (!fill && !stroke) continue;
      const box = node.getBBox(), matrix = inverse.multiply(node.getScreenCTM());
      if (!box.width && !box.height) continue;
      for (const x of [box.x,box.x+box.width]) for (const y of [box.y,box.y+box.height]) ys.push(new DOMPoint(x,y).matrixTransform(matrix).y);
    }
    if (!ys.length) return;
    const view = svg.viewBox.baseVal, width = view.width || Number(svg.getAttribute('width'));
    if (!width) return;
    const top = Math.min(...ys)-8, height = Math.max(...ys)-top+8;
    svg.setAttribute('viewBox',`${view.width ? view.x : 0} ${top} ${width} ${height}`);
    svg.setAttribute('height',String(height));
    svg.style.height = 'auto';
    svg.dataset.theoryMusicFit = 'true';
  }
  function fitRevealedMap(map) {
    // The quality map deliberately keeps unrevealed grid cells. Fit only its
    // painted text, preserving every cell, reveal class and relative position.
    let canvas = map.parentElement;
    if (!canvas.classList.contains('theory-map-viewport')) {
      canvas = document.createElement('div');
      canvas.className = 'theory-map-viewport';
      map.before(canvas); canvas.append(map);
    }
    map.style.position = 'relative'; map.style.top = '0'; map.style.height = 'auto';
    const origin = map.getBoundingClientRect().top, bounds = [];
    const walker = document.createTreeWalker(map,NodeFilter.SHOW_TEXT);
    for (let text; (text = walker.nextNode());) {
      if (!text.textContent.trim()) continue;
      let visible = true;
      for (let node = text.parentElement; node && node !== canvas; node = node.parentElement) {
        const style = getComputedStyle(node);
        if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) { visible = false; break; }
      }
      if (!visible) continue;
      const range = document.createRange(); range.selectNodeContents(text);
      for (const rect of range.getClientRects()) bounds.push(rect.top-origin,rect.bottom-origin);
    }
    if (!bounds.length) return;
    canvas.style.height = `${Math.max(...bounds)-Math.min(...bounds)+16}px`;
    map.style.position = 'absolute'; map.style.top = `${8-Math.min(...bounds)}px`;
  }
  function updateBoardLayout(board) {
    for (const map of board.querySelectorAll('.quality-map')) fitRevealedMap(map);
    board.dispatchEvent(new Event('theory-board-layout'));
    for (const host of board.querySelectorAll('[data-theory-layout]')) host.dispatchEvent(new Event('theory-board-layout'));
  }
  function prepareBoard(board) {
    let frame = board.querySelector(':scope > .theory-board-content');
    if (!frame) {
      frame = document.createElement('div');
      frame.className = 'theory-board-content';
      frame.append(...[...board.childNodes].filter(n => !n.classList?.contains('lesson-audio-btn')));
      board.prepend(frame);
    }
    for (const svg of frame.querySelectorAll('svg')) {
      // Renderer hosts historically used inline 100% heights. Let their height
      // follow the real score instead of inheriting the entire Board viewport.
      for (let host = svg.parentElement; host && host !== frame; host = host.parentElement) {
        if (host.style.height === '100%') host.style.height = 'auto';
      }
      fitMusic(svg);
    }
    updateBoardLayout(board);
    requestAnimationFrame(() => updateBoardLayout(board));
  }
  // centered: the page also centres the explanation in the stacked layout
  // (chord-stage.css), so retained text moves there too and is FLIPped.
  // lines: steps carry `line` and their page marks sentences with data-line.
  // Within a page the sentences stay put: later ones turn grey and the
  // current one moves to the middle of the reading area (shared stage 15.12).
  function create({board, explanation, viewport, centered = false, lines = false}) {
    installNavigation();
    board.setAttribute('role','region');
    board.setAttribute('aria-label','音乐演示');
    viewport.setAttribute('role','region');
    viewport.setAttribute('aria-label','讲解与检验');
    viewport.tabIndex = 0;
    new ResizeObserver(() => updateBoardLayout(board)).observe(board);
    const snapshots = new Map(), boards = new Map(), unclassed = new WeakSet();
    let active = null, boardKey = null, revision = 0, movement = null;
    const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
    const save = () => {
      if (!active) return;
      snapshots.set(active.id, {nodes: [...explanation.childNodes], scroll: viewport.scrollTop});
      if (boardKey !== null) boards.set(boardKey, {nodes: [...board.childNodes].filter(n => !n.classList?.contains('lesson-audio-btn')), scroll: board.scrollTop, click: board.onclick});
    };
    function clearNodeReveal(node) {
      node.classList.remove('theory-new','theory-pending');
      // Do not leave class="" on originally unclassed paragraphs: it would
      // invalidate the continuation prefix and replace retained reader nodes.
      if (unclassed.has(node) && !node.getAttribute('class')) node.removeAttribute('class');
      unclassed.delete(node);
    }
    const clearReveal = () => explanation.querySelectorAll('.theory-new,.theory-pending').forEach(clearNodeReveal);
    function cancelPositioning() {
      ++revision;
      viewport.scrollTo({top:viewport.scrollTop,behavior:'instant'});
      movement?.cancel();
      clearReveal();
    }
    // Cancel both queued and in-flight motion when the reader takes control.
    window.addEventListener('resize',cancelPositioning);
    for (const event of ['wheel','touchstart','pointerdown']) viewport.addEventListener(event, cancelPositioning, {passive:true});
    viewport.addEventListener('keydown', event => {
      if (event.target === viewport && ['ArrowUp','ArrowDown','PageUp','PageDown','Home','End',' '].includes(event.key)) cancelPositioning();
    });
    function locate(node, token, delta) {
      requestAnimationFrame(() => requestAnimationFrame(() => {
        if (revision !== token || !node?.isConnected) return;
        node.classList.remove('theory-pending');
        if (!reduced()) {
          node.classList.add('theory-new');
          node.addEventListener('animationend', () => clearNodeReveal(node), {once:true});
        }
        if (delta > 0) viewport.scrollTo({top: viewport.scrollTop + delta, behavior: reduced() ? 'instant' : 'smooth'});
      }));
    }
    // Elements of one page, keyed by sentence and position, so a sentence
    // already on screen is kept (and moved) rather than replaced.
    function keyed(nodes) {
      const count = {};
      return nodes.map(n => {
        const base = n.dataset.line ?? (n.classList.contains('section-heading') ? 'heading' : null);
        if (base === null) return [null, n];
        count[base] = (count[base] || 0) + 1;
        return [`${base}:${count[base]}`, n];
      });
    }
    function showLines(step, samePage, forward) {
      const template = document.createElement('template');
      template.innerHTML = step.explanation();
      const kept = new Map(samePage ? keyed([...explanation.children]).filter(([key]) => key) : []);
      const before = new Map([...kept.values()].map(n => [n, n.getBoundingClientRect().top]));
      const nodes = keyed([...template.content.children]).map(([key, n]) => kept.get(key) || n);
      explanation.replaceChildren(...nodes);
      for (const n of explanation.querySelectorAll('[data-line]')) {
        n.classList.toggle('is-later', Number(n.dataset.line) > step.line);
        n.classList.toggle('is-current', Number(n.dataset.line) === step.line);
      }
      // Measure the natural, centred layout, then choose shift and scroll.
      explanation.style.setProperty('--line-shift', '0px');
      viewport.scrollTop = 0;
      const frame = viewport.getBoundingClientRect();
      const heading = explanation.querySelector('.section-heading');
      const body = nodes.filter(n => n !== heading);
      const reading = body.filter(n => n.classList.contains('is-current') || n.hasAttribute('data-hint'));
      const top = Math.min(...reading.map(n => n.getBoundingClientRect().top)) - frame.top;
      const bottom = Math.max(...reading.map(n => n.getBoundingClientRect().bottom)) - frame.top;
      const areaTop = heading ? heading.getBoundingClientRect().bottom - frame.top : 0;
      const maxScroll = viewport.scrollHeight - viewport.clientHeight;
      let shift = 0, scroll = 0;
      if (body.some(n => n.classList.contains('is-later'))) {
        // Sentences after this one: put this one in the middle of the reading area.
        const below = (top + bottom) / 2 - (areaTop + viewport.clientHeight) / 2;
        const firstTop = body[0].getBoundingClientRect().top - frame.top;
        if (below < 0) shift = -below;
        else if (maxScroll > 0) scroll = Math.min(below, maxScroll);
        else shift = -Math.min(below, Math.max(0, firstTop - areaTop));
      } else if (maxScroll > 0) {
        // The newest sentence: keep it in view, as when it was first shown.
        scroll = Math.min(maxScroll, Math.max(0, bottom - viewport.clientHeight + 6));
      }
      explanation.style.setProperty('--line-shift', `${shift}px`);
      viewport.scrollTop = scroll;
      if (reduced() || !samePage) return null;
      const style = getComputedStyle(explanation);
      const duration = parseFloat(style.getPropertyValue('--theory-reveal-duration'));
      const easing = style.getPropertyValue('--theory-reveal-easing').trim() || 'ease-out';
      const moving = [];
      for (const n of nodes) {
        if (n === heading) continue;
        if (!before.has(n)) {
          // A sentence (or hint) that was not on screen: rise and fade in.
          if (forward || n.hasAttribute('data-hint')) {
            n.classList.add('theory-new');
            n.addEventListener('animationend', () => n.classList.remove('theory-new'), {once: true});
          }
          continue;
        }
        const offset = before.get(n) - n.getBoundingClientRect().top;
        if (Math.abs(offset) > .1) moving.push(n.animate([{transform: `translateY(${offset}px)`}, {transform: 'translateY(0)'}], {duration, easing}));
      }
      return {cancel: () => moving.forEach(a => a.cancel())};
    }
    function show(step, {forward = false} = {}) {
      if (!step.id || !step.groupId || !['new-concept','continuation','check'].includes(step.kind)) throw new Error('Explicit Theory Lesson step metadata required');
      // Track the first non-sticky node: a pinned heading (position: sticky)
      // stays put while the text beneath it is re-centred.
      const anchor = [...explanation.children].find(n => !['sticky','absolute'].includes(getComputedStyle(n).position));
      const topOf = () => (anchor?.isConnected ? anchor : explanation).getBoundingClientRect().top;
      const oldTop = topOf();
      movement?.cancel();
      clearReveal();
      viewport.scrollTo({top:viewport.scrollTop,behavior:'instant'});
      const previous = active, oldNodes = [...explanation.childNodes];
      save();
      const token = ++revision;
      board.dataset.size = step.size || 'standard';
      if (step.boardKey !== boardKey) {
        board.onclick = null;
        board.removeAttribute('data-audio-page');
        const cached = boards.get(step.boardKey);
        if (cached) { board.replaceChildren(...cached.nodes); board.onclick = cached.click; board.scrollTop = cached.scroll; }
        else { board.replaceChildren(); step.board?.(); board.scrollTop = 0; }
        prepareBoard(board);
        boardKey = step.boardKey;
      }
      const byLine = lines && step.line != null;
      const cached = !byLine && snapshots.get(step.id);
      let newest = null, appended = false;
      if (!byLine) explanation.style.removeProperty('--line-shift');
      if (byLine) {
        movement = showLines(step, previous?.groupId === step.groupId, forward);
      } else if (cached) {
        // Stepping back within the same page (centered pages only): the newest
        // lines leave downwards while the retained text moves back down.
        const retreat = centered && !forward && !reduced() && previous?.groupId === step.groupId &&
          cached.nodes.length < oldNodes.length && cached.nodes.every((n,i) => n === oldNodes[i]);
        const leaving = retreat ? oldNodes.slice(cached.nodes.length).filter(n => n.nodeType === 1).map(n => ({node:n, box:n.getBoundingClientRect()})) : [];
        explanation.replaceChildren(...cached.nodes);
        viewport.scrollTop = cached.scroll;
        if (retreat) {
          const style = getComputedStyle(explanation);
          const duration = parseFloat(style.getPropertyValue('--theory-reveal-duration'));
          const easing = style.getPropertyValue('--theory-reveal-easing').trim() || 'ease-out';
          const offset = oldTop - topOf(), frame = explanation.getBoundingClientRect();
          const moving = Math.abs(offset) > .1 ? [...explanation.children].filter(n => getComputedStyle(n).position !== 'sticky')
            .map(n => n.animate([{transform:`translateY(${offset}px)`},{transform:'translateY(0)'}], {duration,easing})) : [];
          // Leaving lines: copies at their old place, sliding down and fading out.
          const ghosts = leaving.map(({node, box}) => {
            const ghost = node.cloneNode(true);
            Object.assign(ghost.style, {position:'absolute', left:`${box.left - frame.left}px`, top:`${box.top - frame.top}px`, width:`${box.width}px`, margin:'0', pointerEvents:'none'});
            ghost.setAttribute('aria-hidden', 'true');
            explanation.prepend(ghost); // first, so :last-child centring rules still see the real text
            ghost.animate([{opacity:1, transform:'none'}, {opacity:0, transform:'translateY(18px)'}], {duration: duration * .7, easing, fill:'forwards'}).onfinish = () => ghost.remove();
            setTimeout(() => ghost.remove(), duration + 200); // also when a background tab never finishes the animation
            return ghost;
          });
          movement = {cancel: () => { moving.forEach(a => a.cancel()); ghosts.forEach(g => g.remove()); }};
        }
      } else if (step.explanation === null) {
        // Explicit board-only step: leave the explanation and reading position.
      } else {
        const template = document.createElement('template');
        template.innerHTML = step.explanation?.() || '';
        const nodes = [...template.content.childNodes];
        const append = forward && previous?.groupId === step.groupId && step.kind === 'continuation';
        // Continuations explicitly provide their cumulative content. Validate
        // the existing prefix instead of inferring a knowledge chain by index.
        if (append && oldNodes.length && oldNodes.length < nodes.length && oldNodes.every((n,i) => n.isEqualNode(nodes[i]))) {
          appended = true;
          newest = nodes[oldNodes.length];
          explanation.append(...nodes.slice(oldNodes.length));
        } else {
          explanation.replaceChildren(...nodes);
          viewport.scrollTop = 0;
          newest = explanation.lastElementChild;
        }
        step.mount?.(); // Existing course quiz handlers, never shared judging.
        if (step.kind === 'check') newest = explanation.lastElementChild;
        newest ||= explanation.lastElementChild;
      }
      active = step;
      viewport.dataset.stepId = step.id;
      viewport.dataset.stepKind = step.kind;
      viewport.dataset.groupId = step.groupId;
      if (forward && !cached && newest && step.kind !== 'new-concept') {
        // Measure final, untransformed geometry before either animation starts.
        const region = viewport.getBoundingClientRect(), target = newest.getBoundingClientRect();
        const available = viewport.clientHeight - 12;
        const requested = target.bottom <= region.top + viewport.clientHeight - 6 ? 0 :
          target.height > available ? target.top - region.top - 6 : target.bottom - region.top - viewport.clientHeight + 6;
        const delta = Math.max(0, Math.min(requested, viewport.scrollHeight - viewport.clientHeight - viewport.scrollTop));
        if (!reduced()) {
          if (!newest.hasAttribute('class')) unclassed.add(newest);
          newest.classList.add('theory-pending');
          const offset = oldTop - topOf();
          const layout = getComputedStyle(board.parentElement);
          const split = layout.display === 'grid' && layout.gridTemplateColumns.split(' ').length === 2;
          if ((split || centered) && appended && Math.abs(offset) > .1) {
            // FLIP the retained content as one unit. Auto margins perform the
            // actual centering; the compositor interpolates its layout change.
            const style = getComputedStyle(explanation);
            const duration = parseFloat(style.getPropertyValue('--theory-reveal-duration'));
            const easing = style.getPropertyValue('--theory-reveal-easing').trim() || 'ease-out';
            const frames = [{transform:`translateY(${offset}px)`},{transform:'translateY(0)'}];
            const pinned = [...explanation.children].some(n => getComputedStyle(n).position === 'sticky');
            if (!pinned) movement = explanation.animate(frames, {duration,easing});
            else {
              // Move the retained text, not the pinned heading.
              const moving = [...explanation.children].filter(n => n !== newest && getComputedStyle(n).position !== 'sticky').map(n => n.animate(frames, {duration,easing}));
              movement = {cancel: () => moving.forEach(a => a.cancel())};
            }
          }
        }
        locate(newest, token, delta);
      }
      return {restored: !!cached, boardKey};
    }
    function leave() { cancelPositioning(); save(); active = null; boardKey = null; ++revision; }
    // forget: drop saved reading states, e.g. when the learner restarts the lesson.
    function forget() { snapshots.clear(); }
    return {show, leave, forget};
  }
  function progress(value, total, unit) {
    const bar = document.querySelector('.progress-wrap');
    document.getElementById('progress').style.width = `${value / total * 100}%`;
    bar.setAttribute('role','progressbar');
    bar.setAttribute('aria-valuemin','0');
    bar.setAttribute('aria-valuemax',String(total));
    bar.setAttribute('aria-valuenow',String(value));
    bar.setAttribute('aria-valuetext',`${value} / ${total} ${unit}`);
  }
  window.TheoryLesson = Object.freeze({create,progress});
})();
