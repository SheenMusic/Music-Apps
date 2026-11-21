/* 和弦记号课程 · 共享课程流程
   - ChordLesson.builder()：按小节（section）、「一步一句」写讲解（group）与课内 Quiz（quiz）
   - ChordLesson.run()：开始 / 继续学习、页眉的小节目录、页面流程、演示区、声音、Quiz 判定、上一步 / 继续
   讲解区约定：<strong> = 音乐术语；accent() = 重点词；warn() = 「注意」。
   依赖：TheoryLesson（MT 共享 Learning 框架）、ChordStage。 */
(() => {
  'use strict';
  const byID = id => document.getElementById(id);

  function builder() {
    const steps = [], sections = [];
    let section = null, page = null, pages = 0;
    /* 讲解区按「页」累积（规范 15.2）：
       - 每个小节开始一页，第一行是小节标题（固定在讲解区顶部）；这一节的句子在标题下逐句累积。
       - 课内 Quiz 单独成页；Quiz 之后另起一页，仍以小节标题开头。 */
    function startSection(id, number, title) {
      section = {id, number, title};
      sections.push(section);
      page = null;
    }
    // 小节编号做成小标签，和标题文字分开（避免「二、三和弦……」读成「二与三和弦」）；「、」只留给纯文字（进度条预览）
    const heading = () => `<h2 class="section-heading"><span class="section-no">${section.number}</span><span class="section-sep">、</span>${section.title}</h2>`;
    // 尚未制作的小节：只在目录中列出（不可点击）
    const plannedSection = (id, number, title) => sections.push({id, number, title, planned: true});
    const accent = text => `<span class="key-accent">${text}</span>`;
    const p = text => `<p>${text}</p>`;
    const warn = text => `<p class="theory-warning"><strong>注意</strong>：${text}</p>`;
    const instruction = text => `<p class="theory-instruction">${text}</p>`;
    // 给一句话的每个元素标上它在本页的序号（data-line），讲解区据此变灰、点击跳转（规范 15.12）
    function tagLine(sentence, line) {
      const template = document.createElement('template');
      template.innerHTML = sentence;
      for (const node of template.content.children) node.dataset.line = line;
      return template.innerHTML;
    }
    // group：一组相关句子，每句配一个场景。句子接在当前页后面累积；新页的第一句为 new-concept。
    // extra.hint：操作提示（如「点击琴键…」），只在这一步显示，不累积到后面的步骤
    function group(id, items) {
      items.forEach(([sentence, scene, {hint, ...extra} = {}], i) => {
        const opening = !page;
        if (opening) page = {id: `page-${++pages}`, heading: heading(), lines: []};
        const line = page.lines.length;
        page.lines.push(tagLine(sentence, line));
        steps.push({id: `${id}-${i + 1}`, kind: opening ? 'new-concept' : 'continuation', groupId: page.id, heading: page.heading, lines: page.lines, line, hint: hint ? `<p class="theory-instruction" data-hint>${hint}</p>` : '', scene, section: section.id, ...extra});
      });
    }
    // quiz：判断题、单选题或多选题（answer 为数组），单独成页。答对才能继续；答错给出提示，可以再选。
    // reveal：答对后加到谱面上方的和弦记号（黑色印刷体），如 [{slot: CENTER, root: 'C', suffix: 'm'}]
    // input：键盘输入题（ChordInput，与课后练习同一套写法）。值为答案的记号文字，或几种可接受写法的数组（第一种是标准写法），
    //        如 'Cm' 或 ['Cø7', 'Cm7(b5)']；同一结构的其他写法也算对。这时不写 options / answer。
    // 演示区说明（scene.caption）往往就是答案的提示，所以 Quiz 答对之后才显示。
    // parts：一题多问（第五课起）：[{label, options, answer}, …]，每一问单选，全部选完一起提交，全对才算对
    function quiz(id, scene, {question, options = [], answer = null, input = null, checkNotation = null, parts = null, right, wrong, reveal = null}) {
      steps.push({id: `quiz-${id}`, kind: 'check', groupId: `quiz-${id}`, scene, section: section.id, heading: heading(), quiz: {question, options, answer, input, checkNotation, parts, right, wrong, reveal, multi: Array.isArray(answer)}});
      page = null;
    }
    return {steps, sections, section: startSection, plannedSection, group, quiz, accent, p, warn, instruction, TF: [['true', '正确'], ['false', '错误']]};
  }

  // onControl(id)：演示区按钮被点击时返回新场景。preload：开始学习时预载的采样。
  // countBy：'lesson' = 整课连续计数（默认，规范 L20：进度条显示整课，方便拖动）；'section' = 按小节计数。
  // noteLength：每个音最多响几秒（如音程课固定约一拍）；省略则最后一个音像真实钢琴一样自然衰减。
  // quizTimer：课内 Quiz 计时（规范 L16），答对后显示这题用了几秒；不设门槛、不保存。
  // quizLockHint：Quiz 未答对时「继续」按钮改写为「答完测验后继续」，答对后焦点移到「继续」（和弦记号课程使用；音程课程未开启）。
  // quizExtras（和弦记号课打开；音程课不变）：还没答对的 Quiz 不显示演示区说明；反馈滚进可见范围；完成页列出「一次答对」与需要回顾的题。
  // inputLevel：键盘输入题的「输入说明」按第几课折叠（见 ChordInput.field 的 level）
  // reference：记号速查 [{title, html}]（各课的汇总表）。小节目录末尾出现「记号速查」；网址带 #reference 时打开页面就显示（课后练习从这里链接过来）。
  function run({steps, sections = [], onControl, preload = [], countBy = 'lesson', noteLength = null, storageId = null, formerPaths = [], quizTimer = false, quizLockHint = false, reference = null, inputLevel = Infinity, quizExtras = false, tapParts = false}) {
    const {Sound} = ChordStage;
    const boardEl = byID('lessonBoard');
    let stage = null;
    const timers = [];
    const clearTimers = () => { while (timers.length) clearTimeout(timers.pop()); };
    const audioIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M3 9v6h4l5 4V5L7 9H3zm13.5 3a4.5 4.5 0 0 0-2.5-4.03v8.05A4.5 4.5 0 0 0 16.5 12zm0-8.5v2.06A7 7 0 0 1 20 12a7 7 0 0 1-3.5 6.44v2.06A9 9 0 0 0 22 12a9 9 0 0 0-5.5-8.5z"/></svg>';
    /* 声音（规范 L11）
       - 只播放当前谱面显示的音；点演示区任何地方都重播（喇叭按钮只留给键盘与读屏，不显示）。scene.silent 可关闭声音。
       - 谱面上有多个和弦（不同 slot）时，从左到右依次播放，每个和弦间隔 CHORD_GAP 秒。
       - scene.offsets：分解和弦等自定义的依次发声（秒），优先使用。 */
    const CHORD_GAP = 0.9;
    let currentScene = null;
    const hasSound = scene => !!scene && !scene.silent && (scene.tones || []).length > 0;
    /* 播放高亮：谱面上正在响的音变色（已上色的音提亮）。
       开始时刻取自音频时钟，所以与声音同步；每个音亮到下一个音开始，最后一组亮 LAST_LIT 秒。 */
    const LAST_LIT = 1.4;
    // only：只播放其中几个音（scene.tap 时点到的音或和弦，一起发声）。tone.mute 的音不发声（如只听 E 与 F 的碰撞）
    // together：整个谱面一起发声（不按从左到右）；single：只点了一个音时，灰色的省略音（mute）也发声
    async function playScene(scene, only = null, {together = false, single = false} = {}) {
      if (!hasSound(scene)) return;
      const tones = (only || scene.tones).filter(t => single || !t.mute);
      if (!tones.length) return;
      let offsets = only || together ? tones.map(() => 0) : scene.offsets;
      if (!offsets) {
        const slots = [...new Set(tones.map(t => t.slot ?? 0))].sort((a, b) => a - b);
        offsets = tones.map(t => slots.indexOf(t.slot ?? 0) * CHORD_GAP);
      }
      // scene.durations：每个音的时值（秒），用于有节奏的谱例；高亮也亮到时值结束。
      // 没写时值而课程设了 noteLength：每个音响到下一个音开始，最多 noteLength 秒
      const later = o => offsets.filter(x => x > o).sort((a, b) => a - b)[0];
      const durations = (!only && scene.durations) || (noteLength && offsets.map(o => Math.min(noteLength, (later(o) ?? Infinity) - o))) || null;
      // tone.instrument = 'bass'：用贝斯的录音（见 ChordStage.Sound）
      const start = await Sound.play(tones.map(t => t.instrument === 'bass' ? 'bass:' + t.key : t.key), offsets, durations);
      if (start === null || scene !== currentScene) return;
      const onsets = [...new Set(offsets)].sort((a, b) => a - b);
      stage.highlight(tones.map((t, i) => {
        const next = onsets.find(o => o > offsets[i]);
        const end = durations ? offsets[i] + durations[i] : next ?? offsets[i] + LAST_LIT;
        return {id: t.id, at: start + offsets[i], end: start + end};
      }), Sound.heard);
    }
    function stopSound() { Sound.stop(); stage?.stopHighlight(); }
    // Quiz 答对后：谱面上方用黑色印刷体写出答案的和弦记号（练习与测验里不上色）
    // 还没答对的 Quiz：不显示演示区说明（说明常常就是答案）；答对后显示说明与 reveal 的记号
    function revealed(step) {
      if (!step.quiz) return step.scene;
      if (!solved.has(step.id)) return quizExtras && step.scene.caption ? {...step.scene, caption: ''} : step.scene;
      return step.quiz.reveal
        ? {...step.scene, staffSymbols: [...(step.scene.staffSymbols || []), ...step.quiz.reveal.map(r => ({color: ChordStage.COLOR.ink, ...r}))]}
        : step.scene;
    }
    const showAnswer = step => { if (step.quiz.reveal || (quizExtras && step.scene.caption)) showOnStage(revealed(step), {animate: true}); };
    function showOnStage(scene, options) {
      stage.show(scene, options);
      currentScene = scene;
      const button = boardEl.querySelector(':scope > .lesson-audio-btn');
      if (button) button.hidden = !hasSound(scene);
      boardEl.classList.toggle('has-sound', hasSound(scene));
    }

    function buildBoard() {
      stage = ChordStage.create(boardEl);
      boardEl.append(stage.element);
      boardEl.classList.add('tap-to-play');
    }
    function ensureAudioButton() {
      if (boardEl.querySelector(':scope > .lesson-audio-btn')) return;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'lesson-audio-btn';
      button.setAttribute('aria-label', '播放谱例');
      button.title = '播放谱例';
      button.innerHTML = audioIcon;
      boardEl.append(button);
    }
    // 单个场景：第一次向前进入该步骤（fresh）才自动发声。
    // 场景序列（如一度到八度）：每次进入（向前或退回）都从头依次演示；点喇叭也重播整个序列。
    let sequenceStep = null;
    function showScene(step, {animate, fresh}) {
      clearTimers();
      const scenes = Array.isArray(step.scene) ? step.scene : [revealed(step)];
      sequenceStep = scenes.length > 1 ? step : null;
      if (scenes.length === 1) {
        showOnStage(scenes[0], {animate: animate && step.animateEntry !== false});
        if (fresh && scenes[0].play && !scenes[0].tap) playScene(scenes[0]);
        return;
      }
      scenes.forEach((scene, i) => timers.push(setTimeout(() => {
        showOnStage(scene, {animate: animate || i > 0});
        if (scene.play) playScene(scene);
      }, i * step.sequence)));
    }
    boardEl.addEventListener('click', event => {
      const control = event.target.closest('[data-control]');
      if (control && onControl) {
        Sound.wake();
        const scene = onControl(control.dataset.control);
        showOnStage(scene, {animate: true});
        // scene.quiet：按钮只换分析（音不变）时不重播，符头也不闪
        if (!scene.quiet) playScene(scene);
        return;
      }
      // data-play：面板里的播放按钮（如对照表的每一行），值是空格分开的音（如 "C4 E4 G4 Bb4 D5"）
      const row = event.target.closest('[data-play]');
      if (row) {
        Sound.wake();
        stopSound();
        const keys = row.dataset.play.split(' ');
        Sound.play(keys);
        boardEl.querySelectorAll('[data-play].is-playing').forEach(b => b.classList.remove('is-playing'));
        row.classList.add('is-playing');
        timers.push(setTimeout(() => row.classList.remove('is-playing'), 1400));
        return;
      }
      /* 点谱面（全部课程，规范 N23）：点符头 → 这一个音；点和弦的竖列、和弦记号或标注 → 对应的和弦或音；
         其他地方 → 整个谱面（下面的重播）。scene.tap 的谱面（第三课起）点空白处时整个谱面一起发声，
         横排的音（tap: 'note'，如分解和弦）也合成一个和弦；scene.offsets 另有写法的照写法播放 */
      // tapParts：和弦课打开；音程课（已验收）保持「点哪里都重播」
      const hit = tapParts && hasSound(currentScene) && !event.target.closest('.lesson-audio-btn') ? stage.hit(event) : null;
      if (hit) {
        Sound.wake();
        stopSound();
        playScene(currentScene, currentScene.tones.filter(t => hit.ids.includes(t.id)), {single: hit.single});
        return;
      }
      if (currentScene?.tap && !sequenceStep && hasSound(currentScene)) {
        Sound.wake();
        stopSound();
        playScene(currentScene, null, {together: currentScene.tap === 'note' && !currentScene.offsets});
        return;
      }
      // 点演示区任何地方（或隐藏的喇叭按钮）：从头重播；场景序列重播整个序列
      if (!hasSound(currentScene) && !sequenceStep) return;
      Sound.wake();
      stopSound();
      if (sequenceStep) showScene(sequenceStep, {animate: true}); else playScene(currentScene);
    });

    /* 本机进度的名字：有 storageId 就用固定名字，网址改了也不丢；没有就用网址。
       新名字下还没有进度时，把旧网址（formerPaths）下的进度整份复制过来，只做一次 */
    const keyOf = (name, part) => `chord-lesson:${name}:${part}`;
    const storeName = storageId || location.pathname;
    const parts = ['solved', 'resume', 'reached', 'seen'];
    try {
      const has = name => parts.some(part => localStorage.getItem(keyOf(name, part)) !== null);
      const from = has(storeName) ? null : formerPaths.find(has);
      if (from) parts.forEach(part => {
        const value = localStorage.getItem(keyOf(from, part));
        if (value !== null) localStorage.setItem(keyOf(storeName, part), value);
      });
    } catch {}

    /* 课内 Quiz：答对的题与学习进度一起记在本机浏览器（规范 L10），回来时保持已答对的状态 */
    const solvedKey = keyOf(storeName, 'solved');
    const solved = new Set((() => { try { return JSON.parse(localStorage.getItem(solvedKey)) || []; } catch { return []; } })());
    const saveSolved = () => { try { localStorage.setItem(solvedKey, JSON.stringify([...solved])); } catch {} };
    // 答错过的 Quiz（答对之前选错或写错过）：完成页统计「一次答对」，并列出这些题供回顾
    const missedKey = keyOf(storeName, 'missed');
    const missed = new Set((() => { try { return JSON.parse(localStorage.getItem(missedKey)) || []; } catch { return []; } })());
    // 第一次答错时的答案（完成页「你的答案」）
    const yourKey = keyOf(storeName, 'yours');
    const yours = (() => { try { return JSON.parse(localStorage.getItem(yourKey)) || {}; } catch { return {}; } })();
    function markMissed(step, answer = '') {
      if (!quizExtras || solved.has(step.id) || missed.has(step.id)) return;
      missed.add(step.id);
      yours[step.id] = answer;
      try { localStorage.setItem(missedKey, JSON.stringify([...missed])); localStorage.setItem(yourKey, JSON.stringify(yours)); } catch {}
    }
    const optionText = button => button.innerHTML.replace(/^<span class="quiz-mark"[^>]*><\/span>/, '');
    // 反馈写出来后滚进讲解区的可见范围（手机上反馈常在选项下面、屏幕外）
    const revealFeedback = feedback => quizExtras && requestAnimationFrame(() => feedback.scrollIntoView({block: 'nearest', behavior: 'smooth'}));
    function quizHTML({question, options, multi, input, parts}) {
      if (parts) return `<div class="quiz-block"><div class="quiz-kicker">QUIZ</div><div class="quiz-question">${question}</div>` +
        parts.map((part, k) => `<div class="quiz-part" data-part="${k}"><div class="quiz-part-label">${part.label}${Array.isArray(part.answer) ? '（多选）' : ''}</div><div class="quiz-options">` +
          part.options.map(([value, text]) => `<button class="quiz-option" type="button" data-answer="${value}" aria-pressed="false"><span class="quiz-mark" aria-hidden="true"></span>${text}</button>`).join('') + '</div></div>').join('') +
        '<button class="quiz-submit" type="button" disabled>提交</button><p class="feedback" aria-live="polite"></p></div>';
      if (input) return `<div class="quiz-block"><div class="quiz-kicker">QUIZ</div><div class="quiz-question">${question}</div>` +
        '<div class="quiz-input"></div><button class="quiz-submit" type="button" disabled>提交</button><p class="feedback" aria-live="polite"></p></div>';
      const vertical = options.length > 2 ? ' vertical' : '';
      return `<div class="quiz-block"><div class="quiz-kicker">QUIZ</div><div class="quiz-question">${question}${multi ? '（多选）' : ''}</div>` +
        `<div class="quiz-options${vertical}${multi ? ' is-multi' : ''}">${options.map(([value, text]) => `<button class="quiz-option" type="button" data-answer="${value}"${multi ? ' aria-pressed="false"' : ''}><span class="quiz-mark" aria-hidden="true"></span>${text}</button>`).join('')}</div>` +
        (multi ? '<button class="quiz-submit" type="button" disabled>提交</button>' : '') +
        '<p class="feedback" aria-live="polite"></p></div>';
    }
    // Quiz 未答对时「继续」不可用：按钮文字改成提示，免得学生以为页面坏了；答对后恢复原来的文字
    function setNext(enabled) {
      const next = byID('nextBtn');
      if (!enabled && !next.disabled && quizLockHint) { next.dataset.label = next.textContent; next.textContent = '答完测验后继续'; }
      if (enabled && next.dataset.label) { next.textContent = next.dataset.label; delete next.dataset.label; }
      next.disabled = !enabled;
      next.setAttribute('aria-disabled', String(!enabled));
    }
    // 答对后：恢复「继续」，并把焦点移过去，键盘（Enter / 方向键）可以直接继续
    function unlockNext() { setNext(true); if (quizLockHint) byID('nextBtn').focus({preventScroll: true}); }
    // 课内 Quiz 计时（quizTimer）：进入还没答对的题开始，答对时停止，在提示下面写出用时；答错继续计时
    let quizStarted = null;
    function showTime(feedback) {
      if (!quizTimer || quizStarted === null) return;
      const time = document.createElement('span');
      time.className = 'quiz-time';
      time.textContent = `用时 ${((performance.now() - quizStarted) / 1000).toFixed(1)} 秒`;
      feedback.append(time);
      quizStarted = null;
    }
    function bindQuiz(step) {
      quizStarted = solved.has(step.id) ? null : performance.now();
      const block = byID('lessonExplanation').querySelector('.quiz-block');
      const feedback = block.querySelector('.feedback');
      const showRight = button => {
        button.classList.add('correct');
        feedback.className = 'feedback is-correct';
        feedback.textContent = step.quiz.right;
      };
      if (step.quiz.input) { bindInput(step, block, feedback); return; }
      if (step.quiz.multi) { bindMulti(step, block, feedback); return; }
      if (step.quiz.parts) { bindParts(step, block, feedback); return; }
      // 以前答对过（包括上次打开时）：直接显示答对的状态
      if (solved.has(step.id)) showRight(block.querySelector(`[data-answer="${step.quiz.answer}"]`));
      block.querySelectorAll('[data-answer]').forEach(button => button.addEventListener('click', () => {
        if (solved.has(step.id)) return;
        if (button.dataset.answer === step.quiz.answer) {
          showRight(button);
          showTime(feedback);
          solved.add(step.id);
          saveSolved();
          showAnswer(step);
          unlockNext();
        } else {
          markMissed(step, optionText(button));
          button.classList.add('wrong');
          button.disabled = true;
          feedback.className = 'feedback is-wrong';
          feedback.textContent = step.quiz.wrong;
        }
        revealFeedback(feedback);
      }));
    }

    // 一题多问：每一问选一个，全部选完才能提交；全对才算对，答错的那一问标红
    function bindParts(step, block, feedback) {
      const rows = [...block.querySelectorAll('.quiz-part')], submit = block.querySelector('.quiz-submit');
      // 每一问可以是单选（answer 为字符串）或多选（answer 为数组）
      const multiAt = k => Array.isArray(step.quiz.parts[k].answer);
      const setOn = (b, on) => { b.classList.toggle('selected', on); b.setAttribute('aria-pressed', String(on)); };
      const pick = (row, button) => {
        if (multiAt(rows.indexOf(row))) setOn(button, !button.classList.contains('selected'));
        else row.querySelectorAll('[data-answer]').forEach(b => setOn(b, b === button));
      };
      const chosen = row => [...row.querySelectorAll('.selected')].map(b => b.dataset.answer);
      const rightAt = (row, k) => { const want = [].concat(step.quiz.parts[k].answer), got = chosen(row); return got.length === want.length && got.every(v => want.includes(v)); };
      const finish = () => {
        rows.forEach((row, k) => { const want = [].concat(step.quiz.parts[k].answer); row.querySelectorAll('[data-answer]').forEach(b => { setOn(b, want.includes(b.dataset.answer)); if (want.includes(b.dataset.answer)) b.classList.add('correct'); }); });
        submit.hidden = true;
        feedback.className = 'feedback is-correct';
        feedback.textContent = step.quiz.right;
      };
      if (solved.has(step.id)) { finish(); return; }
      rows.forEach(row => row.querySelectorAll('[data-answer]').forEach(button => button.addEventListener('click', () => {
        if (solved.has(step.id)) return;
        row.querySelectorAll('[data-answer]').forEach(b => b.classList.remove('wrong'));
        pick(row, button);
        submit.disabled = !rows.every(r => r.querySelector('.selected'));
        feedback.className = 'feedback';
        feedback.textContent = '';
      })));
      submit.addEventListener('click', () => {
        const wrongRows = rows.filter((row, k) => !rightAt(row, k));
        if (!wrongRows.length) {
          solved.add(step.id);
          saveSolved();
          finish();
          showTime(feedback);
          showAnswer(step);
          unlockNext();
        } else {
          markMissed(step, rows.map(row => [...row.querySelectorAll('.selected')].map(optionText).join('、')).join('；'));
          wrongRows.forEach(row => row.querySelectorAll('.selected').forEach(b => b.classList.add('wrong')));
          feedback.className = 'feedback is-wrong';
          feedback.textContent = step.quiz.wrong;
        }
        revealFeedback(feedback);
      });
    }

    // 多选题：点选项切换选中，点「提交」判定；全部选对才算对
    function bindMulti(step, block, feedback) {
      const options = [...block.querySelectorAll('[data-answer]')], submit = block.querySelector('.quiz-submit');
      const answer = new Set(step.quiz.answer);
      const mark = (button, on) => { button.classList.toggle('selected', on); button.setAttribute('aria-pressed', String(on)); };
      const finish = () => {
        options.forEach(b => { mark(b, answer.has(b.dataset.answer)); if (answer.has(b.dataset.answer)) b.classList.add('correct'); });
        submit.hidden = true;
        feedback.className = 'feedback is-correct';
        feedback.textContent = step.quiz.right;
      };
      if (solved.has(step.id)) { finish(); return; }
      options.forEach(button => button.addEventListener('click', () => {
        if (solved.has(step.id)) return;
        options.forEach(b => b.classList.remove('wrong'));
        mark(button, !button.classList.contains('selected'));
        submit.disabled = !options.some(b => b.classList.contains('selected'));
        feedback.className = 'feedback';
        feedback.textContent = '';
      }));
      submit.addEventListener('click', () => {
        const chosen = options.filter(b => b.classList.contains('selected')).map(b => b.dataset.answer);
        if (chosen.length === answer.size && chosen.every(v => answer.has(v))) {
          solved.add(step.id);
          saveSolved();
          finish();
          showTime(feedback);
          showAnswer(step);
          unlockNext();
        } else {
          markMissed(step, options.filter(b => b.classList.contains('selected')).map(optionText).join('、'));
          options.filter(b => b.classList.contains('selected')).forEach(b => b.classList.add('wrong'));
          feedback.className = 'feedback is-wrong';
          feedback.textContent = step.quiz.wrong;
        }
        revealFeedback(feedback);
      });
    }

    /* 键盘输入题（quiz 的 input）：学生打出记号，按结构判定（同一个和弦的不同写法都算对）。
       写错时按错误类型提示：无法识别 → ChordInput 的说明；根音、低音、和弦结构不对 → 各自的提示（结构不对用 wrong）。 */
    const answersOf = input => (Array.isArray(input) ? input : [input]).map(text => ChordInput.parse(text));
    const sameNote = (a, b) => a[0] === b[0] && a[1] === b[1];
    function judgeInput(step, result) {
      if (!result.ok) return result.error || '先写出和弦记号。';
      const answers = answersOf(step.quiz.input);
      if (answers.some(a => sameNote([a.root, a.rootAcc], [result.root, result.rootAcc]) && a.key === result.key && sameNote([a.bass, a.bassAcc], [result.bass, result.bassAcc]))) {
        return step.quiz.checkNotation ? step.quiz.checkNotation(result) : null;
      }
      const a = answers[0];
      if (!sameNote([a.root, a.rootAcc], [result.root, result.rootAcc])) return '根音不对。' + (a.bass ? '斜线前面写和弦的根音。' : '根音是和弦三度叠置时最下面的音。');
      if (answers.every(x => x.key !== result.key)) return step.quiz.wrong;
      return a.bass ? '低音不对：斜线后面写实际最低的音。' : '这里的低音就是根音，不需要写斜线。';
    }
    function bindInput(step, block, feedback) {
      const submit = block.querySelector('.quiz-submit');
      const standard = (Array.isArray(step.quiz.input) ? step.quiz.input : [step.quiz.input])[0];
      const check = () => {
        if (solved.has(step.id)) return;
        const problem = judgeInput(step, field.parse());
        if (problem === null) {
          solved.add(step.id);
          saveSolved();
          lock();
          showTime(feedback);
          showAnswer(step);
          unlockNext();
        } else {
          const typed = field.parse();
          markMissed(step, typed.parts ? ChordStage.chordSymbol(...typed.parts) : field.value().replace(/[<>&]/g, ''));
          feedback.className = 'feedback is-wrong';
          feedback.textContent = problem;
        }
        revealFeedback(feedback);
      };
      const field = ChordInput.field({
        label: '用键盘写出和弦记号', level: inputLevel, reference,
        onInput: (text, result) => { submit.disabled = !result.ok; if (!solved.has(step.id)) { feedback.className = 'feedback'; feedback.textContent = ''; } },
        // 手机上：输入框右边的「提交」与键盘上的「前往」都是提交（按下不收键盘，答错可以直接改）
        onSubmit: () => { if (!submit.disabled) check(); }
      });
      block.querySelector('.quiz-input').append(field.element);
      function lock() {
        field.input.blur();
        field.input.disabled = true;
        submit.hidden = true;
        const inline = field.element.querySelector('.chord-input-submit');
        if (inline) inline.hidden = true;
        field.element.querySelector('.chord-input-keys').hidden = true;
        feedback.className = 'feedback is-correct';
        feedback.textContent = step.quiz.right;
      }
      submit.addEventListener('click', check);
      // 以前答对过：填上标准写法，直接显示答对的状态
      if (solved.has(step.id)) {
        field.input.value = standard.replace(/♭/g, 'b').replace(/♯/g, '#');
        field.input.dispatchEvent(new Event('input'));
        lock();
      }
    }

    /* 页面流程 */
    const lessonSteps = steps.map(step => ({
      ...step, boardKey: 'stage', size: 'expanded', board: buildBoard,
      explanation: () => step.quiz ? step.heading + quizHTML(step.quiz) : pageHTML(step),
      mount: step.quiz ? () => bindQuiz(step) : undefined
    }));
    // 一页显示到学过的最远那一句为止；当前这一步之后的句子由 TheoryLesson 变灰（规范 15.12）
    function pageHTML(step) {
      const index = lessonSteps.findIndex(s => s.id === step.id);
      const far = lessonSteps.filter((s, i) => s.groupId === step.groupId && i <= Math.max(reached, index)).pop().line;
      return step.heading + step.lines.slice(0, far + 1).map((html, i) => i === step.line ? html + step.hint : html).join('');
    }
    // centered：上下布局也让讲解居中，追加新句时旧句整体上移（与双栏相同）
    // lines：往回走时后面的句子留在原处变灰，当前这句移到讲解区中间
    // 文字栏滚动后，固定的小节标题下方出现渐隐遮罩，往上滚出去的句子慢慢变淡（2026-11-22，阿润反馈）
    const contentEl = byID('lessonContent');
    if (contentEl) contentEl.addEventListener('scroll', () => contentEl.classList.toggle('is-scrolled', contentEl.scrollTop > 2), {passive: true});
    const lessonView = TheoryLesson.create({board: boardEl, explanation: byID('lessonExplanation'), viewport: byID('lessonContent'), centered: true, lines: true,
      focusCurrentLine: document.documentElement.hasAttribute('data-current-line-center')});
    const visited = new Set();
    let current = -1;
    // 点讲解区里本页的某一句：跳到那一步（只有学过的句子会显示，所以不会越过没答的 Quiz）
    byID('lessonExplanation').addEventListener('click', event => {
      const line = event.target.closest('[data-line]');
      if (!line || event.target.closest('a, button') || String(getSelection()).trim()) return;
      const target = lessonSteps.findIndex(s => s.groupId === lessonSteps[current]?.groupId && s.line === Number(line.dataset.line));
      if (target === -1 || target === current) return;
      Sound.wake();
      setStage(target);
    });
    // 页眉与进度条：按小节计算，或整课连续计算
    const countedFor = step => countBy === 'lesson' ? lessonSteps : lessonSteps.filter(s => s.section === step.section);
    function showHeader(step) {
      const counted = countedFor(step), position = counted.indexOf(step) + 1, info = sectionInfo(step.section);
      TheoryLesson.progress(position, counted.length, '步');
      byID('stepCount').textContent = info ? `${info.number} · ${position} / ${counted.length}` : `${position} / ${counted.length}`;
    }

    function setStage(next) {
      const previous = current;
      clearTimers();
      stopSound();
      if (next < 0 || next >= lessonSteps.length) lessonView.leave();
      current = next;
      const learning = next >= 0 && next < lessonSteps.length;
      byID('home').hidden = next !== -1;
      byID('lesson').hidden = !learning;
      byID('summary').hidden = next !== lessonSteps.length;
      byID('lessonNav').hidden = !learning;
      document.body.classList.toggle('theory-active', learning);
      setNext(true);
      if (!learning) {
        TheoryLesson.progress(next === -1 ? 0 : 1, 1, '小节');
        byID('stepCount').textContent = next === -1 ? '开始' : '完成';
        closeMenu();
        updateStartLabel();
      }
      byID('stepCount').disabled = !learning;
      showReach();
      if (learning) {
        const step = lessonSteps[next], forward = next > previous;
        showHeader(step);
        saveResume(next);
        saveReached(next);
        markSeen(step);
        lessonView.show(step, {forward});
        ensureAudioButton();
        // 相邻步骤之间（向前或向后）都用神奇移动过渡；从首页进入则直接显示。
        showScene(step, {animate: Math.abs(next - previous) === 1 && previous >= 0, fresh: forward && !visited.has(step.id)});
        visited.add(step.id);
        byID('prevBtn').textContent = next === 0 ? '返回首页' : '← 上一步';
        const following = lessonSteps[next + 1];
        byID('nextBtn').textContent = !following ? '完成' : following.section !== step.section ? `下一节：${sectionInfo(following.section)?.number || ''} →` : '继续 →';
        if (step.kind === 'check' && !solved.has(step.id)) setNext(false);
      }
      window.scrollTo({top: 0, behavior: 'instant'});
    }

    /* 页眉的小节目录（规范 L09）：点击右上角的进度展开，跳到任意小节 */
    // 小节打勾：这一节的每一步都看过，且课内 Quiz 都已答对（只停在最后一页不算）
    const sectionDone = id => lessonSteps.filter(s => s.section === id).every(s => seen.has(s.id) && (s.kind !== 'check' || solved.has(s.id)));
    const sectionInfo = id => sections.find(s => s.id === id);
    const menu = byID('sectionMenu'), toggle = byID('stepCount');
    function renderSections() {
      const here = current >= 0 ? lessonSteps[current]?.section : null;
      menu.innerHTML = sections.map(s => s.planned
        ? `<button class="section-link" type="button" disabled><span class="section-number">${s.number}</span><span class="section-title">${s.title}</span><span class="section-state">建设中</span></button>`
        : `<button class="section-link${s.id === here ? ' is-current' : ''}" type="button" data-section="${s.id}"${s.id === here ? ' aria-current="true"' : ''}><span class="section-number">${s.number}</span><span class="section-title">${s.title}</span><span class="section-state">${sectionDone(s.id) ? '✓' : ''}</span></button>`).join('') +
        (reference ? '<button class="section-link section-reference" type="button" data-reference><span class="section-number">≡</span><span class="section-title">记号速查</span><span class="section-state"></span></button>' : '');
    }
    function closeMenu() { menu.hidden = true; toggle.setAttribute('aria-expanded', 'false'); }
    toggle.addEventListener('click', event => {
      event.stopPropagation();
      if (!menu.hidden) { closeMenu(); return; }
      renderSections();
      menu.hidden = false;
      toggle.setAttribute('aria-expanded', 'true');
    });
    // 记号速查：弹出本课的汇总表；关掉后回到原来的页面
    function openReference() {
      const dialog = document.createElement('div');
      dialog.className = 'finish-dialog reference-dialog';
      dialog.innerHTML = '<div class="finish-card reference-card" role="dialog" aria-modal="true" aria-labelledby="referenceTitle">' +
        '<h2 id="referenceTitle">记号速查</h2>' +
        reference.map(({title, html}) => `<section class="reference-block"><h3>${title}</h3>${html}</section>`).join('') +
        '<div class="finish-actions"><button class="primary" type="button" data-close>关闭</button></div></div>';
      const close = () => { dialog.remove(); document.removeEventListener('keydown', onKey, true); };
      const onKey = event => { if (event.key === 'Escape') { event.stopPropagation(); close(); } };
      dialog.addEventListener('click', event => { if (event.target === dialog || event.target.closest('[data-close]')) close(); });
      document.addEventListener('keydown', onKey, true);
      document.body.append(dialog);
      dialog.querySelector('[data-close]').focus();
    }
    menu.addEventListener('click', event => {
      if (event.target.closest('[data-reference]')) { closeMenu(); openReference(); return; }
      const button = event.target.closest('[data-section]');
      if (!button) return;
      closeMenu();
      Sound.wake();
      setStage(lessonSteps.findIndex(s => s.section === button.dataset.section));
    });
    document.addEventListener('click', event => { if (!menu.hidden && !menu.contains(event.target)) closeMenu(); });
    document.addEventListener('keydown', event => { if (event.key === 'Escape' && !menu.hidden) { closeMenu(); toggle.focus(); } });

    /* 开始 / 继续学习（规范 L10）：记住上次学到的步骤，只存在本机浏览器 */
    const resumeKey = keyOf(storeName, 'resume');
    function readResume() {
      try { const n = Number(localStorage.getItem(resumeKey)); return Number.isInteger(n) && n > 0 && n < lessonSteps.length ? n : 0; } catch { return 0; }
    }
    function saveResume(n) { try { localStorage.setItem(resumeKey, String(n)); } catch {} }
    // 学到过的最远一步：进度条只能拖到这里为止
    const reachedKey = keyOf(storeName, 'reached');
    let reached = (() => { try { return Number(localStorage.getItem(reachedKey)) || 0; } catch { return 0; } })();
    function saveReached(n) {
      if (n <= reached) return;
      reached = n;
      try { localStorage.setItem(reachedKey, String(n)); } catch {}
    }
    /* 看过的步骤（规范 L15）：记在本机，完成前检查有没有漏学的页面；小节打勾也按它。
       以前的进度没有这份记录：第一次打开时，把学到过的最远一步之前的步骤都当作看过 */
    const seenKey = keyOf(storeName, 'seen');
    const seen = new Set((() => {
      try {
        const saved = JSON.parse(localStorage.getItem(seenKey));
        if (Array.isArray(saved)) return saved;
      } catch {}
      return reached > 0 ? lessonSteps.slice(0, reached + 1).map(s => s.id) : [];
    })());
    function markSeen(step) {
      if (seen.has(step.id)) return;
      seen.add(step.id);
      try { localStorage.setItem(seenKey, JSON.stringify([...seen])); } catch {}
    }
    // 学完或从头开始：进度与 Quiz 记录一起清除
    function clearResume() {
      solved.clear();
      missed.clear();
      Object.keys(yours).forEach(key => delete yours[key]);
      seen.clear();
      reached = 0;
      try { [resumeKey, solvedKey, missedKey, yourKey, reachedKey, seenKey].forEach(key => localStorage.removeItem(key)); } catch {}
    }

    /* 完成页的 Quiz 小结：一次答对几题；答错过或没答的题列出来，附正确答案与说明，方便回顾。
       在清除进度之前写好（学完会清除进度与 Quiz 记录）。 */
    function renderQuizReport() {
      const summary = byID('summary');
      let box = summary.querySelector('.quiz-report');
      if (!box) {
        box = document.createElement('div');
        box.className = 'quiz-report';
        summary.querySelector('.lead').after(box);
      }
      const quizzes = lessonSteps.filter(s => s.kind === 'check');
      // 没有课内 Quiz 的课（如第六课）：不显示小结方框
      box.hidden = !quizzes.length;
      if (!quizzes.length) return;
      const first = quizzes.filter(s => solved.has(s.id) && !missed.has(s.id)).length;
      const review = quizzes.filter(s => !solved.has(s.id) || missed.has(s.id));
      const answerOf = q => q.parts ? q.parts.map(part => `${part.label} ${[].concat(part.answer).map(a => part.options.find(([v]) => v === a)?.[1]).join('、')}`).join('；') : q.input ? ChordStage.chordSymbol(...ChordInput.parse(Array.isArray(q.input) ? q.input[0] : q.input).parts)
        : (Array.isArray(q.answer) ? q.answer : [q.answer]).map(a => q.options.find(([v]) => v === a)?.[1]).join('、');
      box.innerHTML = `<p class="quiz-report-score">课内 Quiz 一次答对 <b>${first}</b> / ${quizzes.length}</p>` + (review.length
        ? '<details class="quiz-report-list"><summary>回顾第一次没答对或没有完成的 ' + review.length + ' 题</summary><ol>' +
          review.map(s => `<li><p class="quiz-report-q">${sectionInfo(s.section)?.number || ''}　${s.quiz.question}${solved.has(s.id) ? '' : '<span class="quiz-report-tag">没有完成</span>'}</p>` +
            (missed.has(s.id) && yours[s.id] ? `<p class="quiz-report-a quiz-report-yours">你的答案：${yours[s.id]}</p>` : '') +
            `<p class="quiz-report-a">正确答案：${answerOf(s.quiz)}</p><p class="quiz-report-why">${s.quiz.right.replace(/^正确[。，]\s*/, '')}</p></li>`).join('') + '</ol></details>'
        : '<p class="quiz-report-note">全部一次答对。</p>');
    }

    /* 完成前检查（规范 L15）：还有没看过的页或没答对的 Quiz 时，点「完成」先弹出提示：
       「确认完成」照常进入完成页；「回到未完成的页面」跳到第一个没看过的步骤或没答对的 Quiz */
    const firstUnfinished = () => lessonSteps.findIndex(s => !seen.has(s.id) || (s.kind === 'check' && !solved.has(s.id)));
    function finishLesson() {
      if (quizExtras) renderQuizReport();
      setStage(lessonSteps.length);
      // 学完：清除进度与 Quiz 记录，下次从头开始（在 setStage 离开最后一步之后）
      clearResume(); lessonView.forget(); visited.clear();
    }
    function askFinish() {
      const pages = new Set(lessonSteps.filter(s => s.kind !== 'check' && !seen.has(s.id)).map(s => s.groupId)).size;
      const quizzes = lessonSteps.filter(s => s.kind === 'check' && !solved.has(s.id)).length;
      const left = [pages && `${pages} 页没有学习`, quizzes && `${quizzes} 道 Quiz 没有完成`].filter(Boolean).join('、');
      const dialog = document.createElement('div');
      dialog.className = 'finish-dialog';
      dialog.innerHTML = '<div class="finish-card" role="alertdialog" aria-modal="true" aria-labelledby="finishTitle" aria-describedby="finishText">' +
        `<h2 id="finishTitle">还没有全部学完</h2><p id="finishText">本课还有 ${left}。现在就完成本课吗？</p>` +
        '<div class="finish-actions"><button class="ghost" type="button" data-choice="finish">确认完成</button><button class="primary" type="button" data-choice="back">回到未完成的页面</button></div></div>';
      // 点空白处或按 Esc：关掉提示，留在最后一页
      const close = () => { dialog.remove(); document.removeEventListener('keydown', onKey, true); };
      const onKey = event => { if (event.key === 'Escape') { event.stopPropagation(); close(); byID('nextBtn').focus(); } };
      dialog.addEventListener('click', event => {
        const choice = event.target.closest('[data-choice]')?.dataset.choice;
        if (!choice && event.target !== dialog) return;
        close();
        Sound.wake();
        if (choice === 'finish') finishLesson();
        else if (choice === 'back') setStage(firstUnfinished());
        else byID('nextBtn').focus();
      });
      document.addEventListener('keydown', onKey, true);
      document.body.append(dialog);
      dialog.querySelector('[data-choice="back"]').focus();
    }

    /* 拖动页眉的进度条跳转（规范 L20）
       - 进度条显示整课：看过的步骤是浅色，没看过的保持灰色（跳节学习时中间会有灰色的空档）。
       - 只能拖到看过的步骤；拖到没看过的地方，停在离它最近的看过的步骤。
       - 拖动时在进度条下方预览那一步的文字（小节标题与那一句讲解，或 Quiz 的题目），松手才跳过去。 */
    const bar = document.querySelector('.progress-wrap');
    const reachEl = document.createElement('div');
    reachEl.className = 'progress-reach';
    bar.prepend(reachEl);
    const ticks = document.createElement('div');
    ticks.className = 'progress-ticks';
    bar.append(ticks);
    bar.classList.add('is-draggable');
    const preview = document.createElement('div');
    preview.className = 'progress-preview';
    preview.hidden = true;
    preview.setAttribute('aria-live', 'polite');
    bar.after(preview);
    const countedNow = () => countedFor(lessonSteps[current]);
    const canReach = step => seen.has(step.id);
    function showReach() {
      const learning = current >= 0 && current < lessonSteps.length;
      reachEl.hidden = !learning;
      if (!learning) return;
      // 看过的步骤画成浅色段，连续的合并成一段
      const counted = countedNow(), unit = 100 / counted.length, fill = 'color-mix(in srgb, var(--primary) 22%, transparent)';
      const stops = [];
      counted.forEach((step, i) => {
        const color = canReach(step) || lessonSteps.indexOf(step) === current ? fill : 'transparent';
        stops.push(`${color} ${i * unit}%`, `${color} ${(i + 1) * unit}%`);
      });
      reachEl.style.width = '100%';
      reachEl.style.background = `linear-gradient(to right, ${stops.join(', ')})`;
      // 小节分界：每一节开头画一个节点
      ticks.replaceChildren(...counted.map((step, i) => i > 0 && step.section !== counted[i - 1].section ? i : null).filter(i => i !== null).map(i => {
        const tick = document.createElement('span');
        tick.className = 'progress-tick';
        tick.style.left = `${i * unit}%`;
        return tick;
      }));
    }
    const plain = html => { const t = document.createElement('template'); t.innerHTML = html; return t.content.textContent.trim(); };
    function showPreview(step) {
      const counted = countedNow(), info = sectionInfo(step.section);
      const where = `${info ? info.number + ' · ' : ''}${counted.indexOf(step) + 1} / ${counted.length}`;
      const title = plain(step.heading).replace(/^[^、]+、/, '');  // 编号已经在前面（「二 · 21 / 90」），标题里不再重复
      // 没看过的步骤不预览
      if (!canReach(step) && lessonSteps.indexOf(step) !== current) { preview.hidden = true; return; }
      const body = step.quiz ? 'Quiz：' + plain(step.quiz.question) : plain(step.lines[step.line]);
      preview.innerHTML = `<p class="progress-preview-meta">${where}　${title}</p><p class="progress-preview-text"></p>`;
      preview.querySelector('.progress-preview-text').textContent = body;
      preview.hidden = false;
    }
    let dragTarget = null;
    function dragTo(event) {
      const counted = countedNow(), box = bar.getBoundingClientRect();
      const position = Math.min(counted.length - 1, Math.max(0, Math.floor((event.clientX - box.left) / box.width * counted.length)));
      // 停在离手指最近的、看过的步骤（当前这一步总是可以）
      let best = null;
      counted.forEach((step, i) => {
        if (!canReach(step) && lessonSteps.indexOf(step) !== current) return;
        if (best === null || Math.abs(i - position) < Math.abs(best - position)) best = i;
      });
      const step = counted[best];
      dragTarget = lessonSteps.indexOf(step);
      showHeader(step);
      showPreview(step);
    }
    bar.addEventListener('pointerdown', event => {
      if (current < 0 || current >= lessonSteps.length) return;
      event.preventDefault();
      try { bar.setPointerCapture(event.pointerId); } catch {}
      bar.classList.add('is-dragging');
      dragTo(event);
    });
    // 鼠标悬停（不按下）：预览指到的那一步，不跳转
    bar.addEventListener('pointermove', event => {
      if (dragTarget !== null) { dragTo(event); return; }
      if (event.pointerType !== 'mouse' || current < 0 || current >= lessonSteps.length) return;
      const counted = countedNow(), box = bar.getBoundingClientRect();
      showPreview(counted[Math.min(counted.length - 1, Math.max(0, Math.floor((event.clientX - box.left) / box.width * counted.length)))]);
    });
    bar.addEventListener('pointerleave', () => { if (dragTarget === null) preview.hidden = true; });
    const endDrag = event => {
      if (dragTarget === null) return;
      const target = dragTarget;
      dragTarget = null;
      preview.hidden = true;
      bar.classList.remove('is-dragging');
      if (event.type === 'pointercancel' || target === current) { showHeader(lessonSteps[current]); return; }
      Sound.wake();
      setStage(target);
    };
    bar.addEventListener('pointerup', endDrag);
    bar.addEventListener('pointercancel', endDrag);
    // 有记录时，首页提示文字末尾出现「从头开始」：清除本课的进度与 Quiz 记录（规范 15.7）
    const note = byID('home')?.querySelector('.theory-note');
    const restartLink = document.createElement('a');
    restartLink.href = '#';
    restartLink.className = 'restart-link';
    restartLink.textContent = '从头开始';
    restartLink.addEventListener('click', event => {
      event.preventDefault();
      if (!confirm('清除本课的学习进度和 Quiz 记录，从头开始？')) return;
      clearResume();
      lessonView.forget();
      visited.clear();
      updateStartLabel();
    });
    function updateStartLabel() {
      const start = byID('startLearning'), saved = readResume() > 0 || solved.size > 0;
      if (start) start.textContent = readResume() ? '继续学习' : '开始学习';
      if (note && saved && !restartLink.isConnected) note.append(' ', restartLink);
      if (!saved) restartLink.remove();
    }
    byID('startLearning')?.addEventListener('click', () => {
      Sound.wake();
      Sound.preload(preload);
      setStage(readResume());
    });
    byID('prevBtn').addEventListener('click', () => { Sound.wake(); setStage(current - 1); });
    byID('nextBtn').addEventListener('click', () => {
      Sound.wake();
      if (current + 1 < lessonSteps.length) setStage(current + 1);
      else if (firstUnfinished() === -1) finishLesson();
      else askFinish();
    });
    byID('backHome').addEventListener('click', () => setStage(-1));
    byID('restart').addEventListener('click', () => { Sound.wake(); visited.clear(); clearResume(); lessonView.forget(); setStage(0); });
    TheoryLesson.progress(0, 1, '小节');
    updateStartLabel();
    toggle.disabled = true;
    if (reference && location.hash === '#reference') openReference();
  }

  window.ChordLesson = Object.freeze({builder, run});
})();
