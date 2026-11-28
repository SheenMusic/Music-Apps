// Adapt presentation while keeping each lesson's audio, scoring and setup controls.
(() => {
  const practice = document.getElementById('practiceCard');
  const settings = practice.querySelector('.settings-details');
  const summary = settings.querySelector('summary');
  settings.classList.add('v2-settings');
  settings.open = false;
  summary.setAttribute('aria-label', '练习设置');
  summary.title = '练习设置';
  const icon = document.createElement('span');
  icon.className = 'v2-menu-icon';
  icon.setAttribute('aria-hidden', 'true');
  icon.append(...Array.from({length: 3}, () => document.createElement('span')));
  summary.replaceChildren(icon);

  const progress = practice.querySelector('.progress-text');
  const count = document.getElementById('passCountText');
  const steps = document.createElement('div');
  steps.className = 'v2-progress';
  steps.setAttribute('aria-hidden', 'true');
  for (let index = 0; index < 10; index++) steps.append(document.createElement('span'));
  progress.append(steps);
  function renderProgress() {
    [...steps.children].forEach((step, index) => {
      step.classList.toggle('complete', index < Number(count.textContent));
    });
  }
  new MutationObserver(renderProgress).observe(count, {childList: true});
  renderProgress();

  const table = document.querySelector('#reportCard .report-table');
  if (table) {
    const scroll = document.createElement('div');
    scroll.className = 'v2-report-scroll';
    table.before(scroll);
    scroll.append(table);
  }
})();
