/* 练习的临时记录（音程理论基础、音程听力训练、和弦记号三门课的练习共用）
   做到一半关闭页面、iPhone 回收后台页面、不小心刷新：下次打开同一个练习页，可以选择「继续上次的练习」或「重新开始」。
   - 只存在这台设备的这个浏览器里（localStorage），不上传、不同步。
   - 每个练习页一份，按网址区分；7 天没有更新就作废（共用设备时，别人不会看到很久以前的记录）。
   - 练习完成后保留最后一次的结果，回来时可以再看、再复制给老师；点「重新开始 / 重新练习」时清除。
   PracticeSession.create({key, maxAgeDays}) → {load(), save(data), clear()}
   PracticeSession.offer({title, text, resumeLabel, restartLabel, onResume, onRestart}) → 弹出选择框
   浏览器不允许本机存储时（隐私模式等），一切照旧：不保存、不提示。 */
(function (root) {
  'use strict';
  const PREFIX = 'practice-session:';
  const DAY = 24 * 60 * 60 * 1000;

  function create({key = root.location.pathname, maxAgeDays = 7} = {}) {
    const name = PREFIX + key;
    return Object.freeze({
      load() {
        try {
          const saved = JSON.parse(root.localStorage.getItem(name));
          if (!saved || typeof saved !== 'object' || !saved.data) return null;
          if (Date.now() - saved.savedAt > maxAgeDays * DAY) { root.localStorage.removeItem(name); return null; }
          return saved.data;
        } catch { return null; }
      },
      save(data) {
        try { root.localStorage.setItem(name, JSON.stringify({savedAt: Date.now(), data})); } catch {}
      },
      clear() {
        try { root.localStorage.removeItem(name); } catch {}
      }
    });
  }

  // 选择框：用页面原有的 modal 样式（practice-base.css 的 .modal-overlay / .modal-card），没有时用下面的内联样式
  function offer({title, text, resumeLabel = '继续上次的练习', restartLabel = '重新开始', onResume, onRestart}) {
    const overlay = document.createElement('div');
    overlay.className = 'practice-session-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'practiceSessionTitle');
    overlay.innerHTML = `<div class="practice-session-card">
      <h2 id="practiceSessionTitle"></h2>
      <p class="practice-session-text"></p>
      <div class="practice-session-actions">
        <button type="button" class="practice-session-resume"></button>
        <button type="button" class="practice-session-restart"></button>
      </div>
    </div>`;
    overlay.querySelector('h2').textContent = title;
    overlay.querySelector('.practice-session-text').textContent = text;
    overlay.querySelector('.practice-session-resume').textContent = resumeLabel;
    overlay.querySelector('.practice-session-restart').textContent = restartLabel;
    const close = () => overlay.remove();
    overlay.querySelector('.practice-session-resume').addEventListener('click', () => { close(); onResume?.(); });
    overlay.querySelector('.practice-session-restart').addEventListener('click', () => { close(); onRestart?.(); });
    if (!document.getElementById('practiceSessionStyle')) {
      const style = document.createElement('style');
      style.id = 'practiceSessionStyle';
      // 颜色沿用 site-visual.css 的 --site-* 变量（深色模式自动跟随）
      style.textContent = `
.practice-session-overlay { position: fixed; inset: 0; z-index: 300; display: grid; place-items: center; padding: 16px; background: rgba(15, 23, 42, .45); }
.practice-session-card { width: min(100%, 380px); box-sizing: border-box; padding: 22px 20px 18px; border-radius: var(--site-radius-card, 16px); background: var(--site-panel, #fff); color: var(--site-text, #0f172a); box-shadow: 0 12px 32px rgba(15, 23, 42, .25); font-family: var(--site-font, system-ui, sans-serif); }
.practice-session-card h2 { margin: 0 0 8px; font-size: 18px; line-height: 1.4; }
.practice-session-text { margin: 0 0 18px; font-size: 15px; line-height: 1.7; color: var(--site-muted, #475569); white-space: pre-line; }
.practice-session-actions { display: grid; gap: 10px; }
.practice-session-actions button { min-height: 46px; margin: 0; padding: 10px 16px; border-radius: var(--site-radius-control, 10px); font: inherit; font-size: 15px; font-weight: 600; cursor: pointer; }
.practice-session-resume { border: 0; background: var(--site-accent, #6366f1); color: #fff; }
.practice-session-restart { border: 1px solid var(--site-border, #cbd5e1); background: transparent; color: var(--site-text, #0f172a); }`;
      document.head.append(style);
    }
    document.body.append(overlay);
    overlay.querySelector('.practice-session-resume').focus();
  }

  // 「12 分钟前」「昨天 21:30」这类说明用：只给出大致时间
  function ago(timestamp) {
    const minutes = Math.round((Date.now() - timestamp) / 60000);
    if (minutes < 1) return '刚才';
    if (minutes < 60) return `${minutes} 分钟前`;
    const hours = Math.round(minutes / 60);
    if (hours < 24) return `${hours} 小时前`;
    return `${Math.round(hours / 24)} 天前`;
  }

  /* 用 PracticeEngine 的练习页（音程理论基础、和弦记号）共用的接法：
     PracticeSession.forEngine({engine, render, getExtra, setExtra}) → {save(), clear(), offerResume()}
     - save()：每次画面更新后调用；只在练习中与完成后保存（开始页不保存）。离开页面（切到后台、关闭）时也会自动保存一次。
     - clear()：「重新练习」时调用。
     - offerResume()：页面载入时调用；有记录就弹出选择框。
     - getExtra / setExtra：页面自己的附加状态（例如和弦练习里还没提交的输入），随记录一起保存、恢复。 */
  function forEngine({engine, render, getExtra = null, setExtra = null, key}) {
    const store = create({key});
    const save = () => {
      const snapshot = engine.snapshot();
      if (snapshot) store.save({...snapshot, savedAt: Date.now(), extra: getExtra ? getExtra() : null});
    };
    const saveIfActive = () => { if (engine.state().mode !== 'start') save(); };
    root.addEventListener('pagehide', saveIfActive);
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') saveIfActive(); });
    function offerResume() {
      const saved = store.load();
      if (!saved) return false;
      const total = saved.stats?.length || 0, solved = (saved.stats || []).filter(s => s.isSolved).length;
      const when = saved.savedAt ? `（${ago(saved.savedAt)}）` : '';
      const restore = () => {
        if (engine.restore(saved)) { if (setExtra && saved.extra) setExtra(saved.extra); }
        else store.clear();
        render();
      };
      const restart = () => { store.clear(); render(); };
      if (saved.mode === 'result') {
        const score = (saved.stats || []).reduce((sum, s) => sum + (s.firstScore ?? 0), 0);
        const firstPass = (saved.stats || []).filter(s => s.isSolved && s.attempts === 1).length;
        offer({title: '上次的练习已经完成',
          text: `正确率 ${total ? (score / total * 100).toFixed(1) : 0}%，一次答对 ${firstPass} / ${total} 题${when}。\n可以查看结果、复制给老师，也可以重新练习。`,
          resumeLabel: '查看上次的结果', restartLabel: '重新练习', onResume: restore, onRestart: restart});
      } else {
        offer({title: '继续上次的练习？',
          text: `上次做到第 ${(saved.index ?? 0) + 1} 题，已完成 ${solved} / ${total} 题${when}。\n继续的话，做过的题目、尝试次数和用时都会保留。`,
          onResume: restore, onRestart: restart});
      }
      return true;
    }
    return Object.freeze({save, clear: () => store.clear(), offerResume});
  }

  root.PracticeSession = Object.freeze({create, offer, ago, forEngine});
})(typeof window !== 'undefined' ? window : globalThis);
