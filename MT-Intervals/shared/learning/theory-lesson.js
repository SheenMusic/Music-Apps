/* Display-only Learning runtime. Courses own their content, checks and audio. */
(() => {
  'use strict';
  let navigationInstalled = false;
  function installNavigation() {
    if (navigationInstalled) return;
    navigationInstalled = true;
    const hint = document.createElement('p');
    hint.className = 'theory-keyboard-hint';
    hint.textContent = '方向键：← ↑ 上一步 · → ↓ 继续';
    document.querySelector('.footer')?.append(hint);
    document.getElementById('prevBtn')?.setAttribute('aria-keyshortcuts','ArrowLeft ArrowUp');
    document.getElementById('nextBtn')?.setAttribute('aria-keyshortcuts','ArrowRight ArrowDown');
    document.addEventListener('keydown', event => {
      if (event.defaultPrevented || !document.body.classList.contains('theory-active') || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
      const previous = ['ArrowLeft','ArrowUp'].includes(event.key);
      if (!previous && !['ArrowRight','ArrowDown'].includes(event.key)) return;
      const target = event.target;
      const control = target.closest?.('input,textarea,select,button,a,[role=slider],[role=combobox],[role=listbox],[role=spinbutton],[role=tablist]');
      const reading = target.matches?.('.lesson-content') && target.scrollHeight > target.clientHeight && ['ArrowUp','ArrowDown'].includes(event.key);
      if (target.isContentEditable || reading || target.closest?.('.lesson-board,.quiz-block') || (control && !control.closest('.lesson-nav'))) return;
      event.preventDefault();
      document.documentElement.classList.add('theory-keyboard-used');
      if (event.repeat) return;
      const button = document.getElementById(previous ? 'prevBtn' : 'nextBtn');
      if (button && !button.disabled && button.getAttribute('aria-disabled') !== 'true') button.click();
    });
  }
  function create({board, explanation, viewport}) {
    installNavigation();
    board.setAttribute('role','region');
    board.setAttribute('aria-label','音乐演示');
    viewport.setAttribute('role','region');
    viewport.setAttribute('aria-label','讲解与检验');
    viewport.tabIndex = 0;
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
    function show(step, {forward = false} = {}) {
      if (!step.id || !step.groupId || !['new-concept','continuation','check'].includes(step.kind)) throw new Error('Explicit Theory Lesson step metadata required');
      const oldTop = explanation.getBoundingClientRect().top;
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
        boardKey = step.boardKey;
      }
      const cached = snapshots.get(step.id);
      let newest = null, appended = false;
      if (cached) {
        explanation.replaceChildren(...cached.nodes);
        viewport.scrollTop = cached.scroll;
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
          const offset = oldTop - explanation.getBoundingClientRect().top;
          if (appended && Math.abs(offset) > .1) {
            // FLIP the retained content as one unit. Auto margins perform the
            // actual centering; the compositor interpolates its layout change.
            const duration = parseFloat(getComputedStyle(explanation).getPropertyValue('--theory-reveal-duration'));
            movement = explanation.animate([{transform:`translateY(${offset}px)`},{transform:'translateY(0)'}], {duration,easing:'ease-out'});
          }
        }
        locate(newest, token, delta);
      }
      return {restored: !!cached, boardKey};
    }
    function leave() { cancelPositioning(); save(); active = null; boardKey = null; ++revision; }
    return {show, leave};
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
