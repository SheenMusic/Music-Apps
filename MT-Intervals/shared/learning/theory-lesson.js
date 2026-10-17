/* Display-only Learning runtime. Courses own their content, checks and audio. */
(() => {
  'use strict';
  function create({board, explanation}) {
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
    // A new navigation or a manual reading gesture cancels queued positioning.
    for (const event of ['wheel','touchstart','pointerdown']) explanation.addEventListener(event, () => ++revision, {passive:true});
    function locate(node, token) {
      requestAnimationFrame(() => requestAnimationFrame(() => {
        if (revision !== token || !node?.isConnected) return;
        const container = explanation.getBoundingClientRect(), target = node.getBoundingClientRect();
        const available = explanation.clientHeight - 12;
        if (target.bottom <= container.top + explanation.clientHeight - 6) return;
        // A paragraph larger than the viewport starts at its top; the reader
        // can then scroll through it. Never jump past the start of long text.
        const delta = target.height > available ? target.top - container.top - 6 : target.bottom - container.top - explanation.clientHeight + 6;
        explanation.scrollTo({top: explanation.scrollTop + Math.max(0,delta), behavior: reduced() ? 'instant' : 'smooth'});
      }));
    }
    function show(step, {forward = false} = {}) {
      if (!step.id || !step.groupId || !['new-concept','continuation','check'].includes(step.kind)) throw new Error('Explicit Theory Lesson step metadata required');
      explanation.querySelectorAll('.theory-new').forEach(n => n.classList.remove('theory-new'));
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
        newest ||= explanation.lastElementChild;
      }
      active = step;
      explanation.dataset.stepId = step.id;
      explanation.dataset.stepKind = step.kind;
      explanation.dataset.groupId = step.groupId;
      if (forward && !cached && newest && step.kind !== 'new-concept') {
        if (!reduced()) newest.classList.add('theory-new');
        newest.addEventListener('animationend', () => newest.classList.remove('theory-new'), {once:true});
        locate(newest, token);
      }
      return {restored: !!cached, boardKey};
    }
    function leave() { save(); active = null; boardKey = null; ++revision; }
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
