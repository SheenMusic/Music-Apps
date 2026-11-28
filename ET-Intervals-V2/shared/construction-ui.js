/* 构唱课的界面（音程听力训练 V2.1）：设置菜单、菜单里的当前值、10 格进度、「重新开始」。
   练习流程与判定在各课的 script.js；这里只读取页面状态。 */
(() => {
  const byId = id => document.getElementById(id);
  const menu = byId('settingsMenu');
  const menuButton = menu.querySelector('summary');
  // 菜单里每一行的选择框和旁边显示的当前值（各课的练习模式行由练习程序生成）
  const settingValues = Array.from(menu.querySelectorAll('.setting-row'))
    .map(row => ({ select: row.querySelector('select'), display: row.querySelector('.setting-value') }))
    .filter(item => item.select && item.display);

  // 菜单：点菜单外面或按 Esc 收起
  function closeSettings(restoreFocus) {
    if (!menu.open) return;
    menu.open = false;
    if (restoreFocus) menuButton.focus();
  }
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape' || !menu.open) return;
    event.preventDefault();
    closeSettings(true);
  });
  document.addEventListener('click', event => {
    if (!menu.contains(event.target)) closeSettings(false);
  });

  // 菜单里每个设置旁显示当前值（下拉框本身透明地盖在「⋯」上）
  function showSettingValues() {
    for (const { select, display } of settingValues) {
      display.textContent = select.selectedOptions[0]?.textContent.trim() ?? '';
    }
  }
  settingValues.forEach(({ select }) => select.addEventListener('change', showSettingValues));
  menu.addEventListener('toggle', showSettingValues);

  // 10 格进度：跟随连续唱准数（「继续上次练习」恢复时也会直接改这个数）
  const passCount = byId('passCountText');
  const track = byId('progressSteps');
  const steps = Array.from({ length: 10 }, () => document.createElement('span'));
  track.append(...steps);
  function showProgress() {
    const done = Number(passCount.textContent) || 0;
    steps.forEach((step, index) => step.classList.toggle('is-complete', index < done));
    track.setAttribute('aria-label', `已连续唱准 ${Math.min(done, 10)} / 10 题`);
  }
  new MutationObserver(showProgress).observe(passCount, { childList: true, characterData: true, subtree: true });

  byId('resetPractice').addEventListener('click', () => {
    restartPractice();
    closeSettings(false);
  });
  byId('finishBtn').addEventListener('click', () => {
    const title = byId('reportTitle');
    title.tabIndex = -1;
    title.focus();
  });

  window.addEventListener('load', () => {
    showSettingValues();
    showProgress();
  });
})();
