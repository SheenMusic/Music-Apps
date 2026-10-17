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
      if (target.isContentEditable || target.closest?.('.lesson-board,.quiz-block') || (control && !control.closest('.lesson-nav'))) return;
      event.preventDefault();
      document.documentElement.classList.add('theory-keyboard-used');
      if (event.repeat) return;
      const button = document.getElementById(previous ? 'prevBtn' : 'nextBtn');
      if (button && !button.disabled && button.getAttribute('aria-disabled') !== 'true') button.click();
    });
  }
  function create({board, explanation}) {
    installNavigation();
    board.setAttribute('role','region');
    board.setAttribute('aria-label','音乐演示');
    explanation.setAttribute('role','region');
    explanation.setAttribute('aria-label','讲解与检验');
    const snapshots = new Map(), boards = new Map();
    let active = null, boardKey = null, revision = 0;
    const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
    const save = () => {
      if (!active) return;
      snapshots.set(active.id, {nodes: [...explanation.childNodes], scroll: explanation.scrollTop});
      if (boardKey !== null) boards.set(boardKey, {nodes: [...board.childNodes].filter(n => !n.classList?.contains('lesson-audio-btn')), scroll: board.scrollTop, click: board.onclick});
    };
    const clearReveal = () => explanation.querySelectorAll('.theory-new,.theory-pending').forEach(n => n.classList.remove('theory-new','theory-pending'));
    function cancelPositioning() {
      ++revision;
      explanation.scrollTo({top:explanation.scrollTop,behavior:'instant'});
      clearReveal();
    }
    // Cancel both queued and in-flight motion when the reader takes control.
    for (const event of ['wheel','touchstart','pointerdown']) explanation.addEventListener(event, cancelPositioning, {passive:true});
    function locate(node, token) {
      requestAnimationFrame(() => requestAnimationFrame(() => {
        if (revision !== token || !node?.isConnected) return;
        const container = explanation.getBoundingClientRect(), target = node.getBoundingClientRect();
        const available = explanation.clientHeight - 12;
        // Measure the untransformed layout before the small reveal starts.
        const delta = target.bottom <= container.top + explanation.clientHeight - 6 ? 0 :
          target.height > available ? target.top - container.top - 6 : target.bottom - container.top - explanation.clientHeight + 6;
        node.classList.remove('theory-pending');
        if (!reduced()) {
          node.classList.add('theory-new');
          node.addEventListener('animationend', () => node.classList.remove('theory-new'), {once:true});
        }
        if (delta > 0) explanation.scrollTo({top: explanation.scrollTop + delta, behavior: reduced() ? 'instant' : 'smooth'});
      }));
    }
    function show(step, {forward = false} = {}) {
      if (!step.id || !step.groupId || !['new-concept','continuation','check'].includes(step.kind)) throw new Error('Explicit Theory Lesson step metadata required');
      clearReveal();
      explanation.scrollTo({top:explanation.scrollTop,behavior:'instant'});
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
      let newest = null;
      if (cached) {
        explanation.replaceChildren(...cached.nodes);
        explanation.scrollTop = cached.scroll;
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
          newest = nodes[oldNodes.length];
          explanation.append(...nodes.slice(oldNodes.length));
        } else {
          explanation.replaceChildren(...nodes);
          explanation.scrollTop = 0;
          newest = explanation.lastElementChild;
        }
        step.mount?.(); // Existing course quiz handlers, never shared judging.
        if (step.kind === 'check') newest = explanation.lastElementChild;
        newest ||= explanation.lastElementChild;
      }
      active = step;
      explanation.dataset.stepId = step.id;
      explanation.dataset.stepKind = step.kind;
      explanation.dataset.groupId = step.groupId;
      if (forward && !cached && newest && step.kind !== 'new-concept') {
        if (!reduced()) newest.classList.add('theory-pending');
        locate(newest, token);
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
