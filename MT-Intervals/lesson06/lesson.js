/* Four review strategies from lesson-06.pdf. External exercise URLs are the
   original PDF hyperlink annotations, not newly generated configurations. */
(() => {
  'use strict';
  const exercises = {
    seconds: [
      ['大小二度识别', 'brwyryyroyybnyynbyb'],
      ['增减二度识别', 'brwyrybyyeybnyynbyb'],
      ['大小三度识别', 'brwyryyeybybnyynbyb'],
      ['增减三度识别', 'brwyrynyyoybnyynbyb']
    ],
    fourths: [
      ['纯四度 / 纯五度识别', 'brwyryyobyybnyynbyb'],
      ['增减四度 / 五度识别', 'brwyrycyyydbnyynbyb']
    ],
    inversions: [
      ['大小六度 / 七度识别', 'brwyryyyggybnyynbyb'],
      ['增减六度 / 七度识别', 'brwyryobyycbnyynbyb']
    ],
    compound: [['9–15 度复音程识别', 'brwyry99999bnbynbyb']]
  };
  const modules = [
    {
      title: '二度与三度', group: 'seconds',
      copy: `<h2>先找到自然音程的参照</h2><ul><li>自然二度中，<strong>B–C、E–F 是小二度</strong>，其余是大二度。</li><li>自然三度中，<strong>C–E、F–A、G–B 是大三度</strong>，其余是小三度。</li></ul><h2>再看变化音怎样改变距离</h2><p>先判断不带变化音的参考音程，再根据变化音推导性质。</p><ul><li>升高下音或降低上音 → 音程变窄。</li><li>降低下音或升高上音 → 音程变宽。</li></ul>`
    },
    {
      title: '四度与五度', group: 'fourths',
      copy: `<h2>抓住两个特例</h2><p>自然音程中，<strong>F–B 是增四度，B–F 是减五度</strong>，它们都是三全音。其余自然四度、五度是纯音程。</p><h2>先看度数，再判断性质</h2><ul><li>四度：一个音在线上，一个音在间上。</li><li>五度：两个音同在线上，或同在间上。</li></ul><p>先确认是四度还是五度，再对照纯音程或三全音；有变化音时，按变宽、变窄推导。<strong>位形帮助读度数，不直接决定性质。</strong></p>`
    },
    {
      title: '六度与七度', group: 'inversions',
      copy: `<h2>把大跨度转成熟悉的小跨度</h2><ul><li><strong>六度转位为三度。</strong></li><li><strong>七度转位为二度。</strong></li></ul><h2>判断转位，再还原性质</h2><p>先判断转位后的二度、三度，再把性质反转：<strong>大 ↔ 小，增 ↔ 减</strong>。例如大三度对应小六度，大二度对应小七度。</p><p>遇到不确定的六度、七度，不必从头逐个计算音数，先试着转位。</p>`
    },
    {
      title: '复音程', group: 'compound',
      copy: `<h2>先回到对应的单音程</h2><p>对于这组 <strong>9–15 度</strong>练习，将复音程度数减去 7，先判断对应单音程的性质。</p><h2>度数变化，性质保留</h2><p>对应单音程与复音程的<strong>大、小、纯、增、减性质相同</strong>。例如纯四度对应纯十一度。</p><p>点击左侧或上方的度数，整理每一组对应关系，再进入综合练习。</p>`
    }
  ];
  const byID = id => document.getElementById(id);
  let current = -1, compoundDegree = 9, inverted = false;
  const names = ['二','三','四','五','六','七','八'];
  function staffExample(interval) {
    const upperY = interval === 4 ? 93 : 88;
    const upperName = interval === 4 ? 'F' : 'G';
    return `<figure><svg class="staff-example" viewBox="0 0 150 145" role="img" aria-label="C 与 ${upperName}：${interval === 4 ? '四度，一线一间' : '五度，同在线上'}">${[58,68,78,88,98].map(y=>`<line x1="12" y1="${y}" x2="138" y2="${y}"/>`).join('')}<line x1="33" y1="108" x2="58" y2="108"/><ellipse cx="45" cy="108" rx="7" ry="5" transform="rotate(-18 45 108)"/><ellipse cx="105" cy="${upperY}" rx="7" ry="5" transform="rotate(-18 105 ${upperY})"/><text x="40" y="136">C</text><text x="100" y="136">${upperName}</text></svg><figcaption>${interval === 4 ? '四度 · 一线一间' : '五度 · 同在线上'}</figcaption></figure>`;
  }
  function renderBoard() {
    const board = byID('lessonBoard');
    if(current === 0) board.innerHTML = `<p class="board-label">二度的例外</p><div class="board-pair"><p class="reference-notes">B–C　E–F</p><p class="reference-caption">小二度 · 其余自然二度为大二度</p></div><div class="board-divider"></div><p class="board-label">三度的参考锚点</p><div class="board-pair"><p class="reference-notes">C–E　F–A　G–B</p><p class="reference-caption">大三度 · 其余自然三度为小三度</p></div>`;
    if(current === 1) board.innerHTML = `<p class="board-label">先看五线谱上的位形</p><div class="staff-examples">${staffExample(4)}${staffExample(5)}</div><div class="board-divider"></div><p class="reference-notes">F–B 增四度 · B–F 减五度</p><p class="reference-caption">自然四度、五度中的两个特例</p>`;
    if(current === 2) {
      board.innerHTML = `<p class="board-label">借助转位，换一个角度判断</p><div class="board-pair"><p class="board-equation" id="inversionSix"></p><p class="board-equation" id="inversionSeven"></p></div><p class="reference-caption">大 ↔ 小　增 ↔ 减</p><div class="board-controls"><button type="button" id="invertButton" aria-pressed="${inverted}">切换转位参照</button></div>`;
      updateInversion();
    }
    if(current === 3) {
      board.innerHTML = `<p class="board-label">复音程 → 对应单音程</p><p class="board-equation" id="compoundPair" aria-live="polite"></p><div class="board-controls" role="group" aria-label="选择复音程度数">${Array.from({length:7},(_,i)=>i+9).map(n=>`<button type="button" data-degree="${n}" aria-pressed="${n===compoundDegree}">${n} 度</button>`).join('')}</div><div class="board-divider"></div><p class="reference-caption">度数减去 7 · 性质保持不变</p><p class="reference-caption">纯十一度 → 纯四度</p>`;
      updateCompound();
    }
  }
  function updateInversion() {
    byID('inversionSix').textContent = inverted ? '大三度 → 小六度' : '小六度 → 大三度';
    byID('inversionSeven').textContent = inverted ? '大二度 → 小七度' : '小七度 → 大二度';
    byID('invertButton').setAttribute('aria-pressed', String(inverted));
  }
  function updateCompound() {
    byID('compoundPair').textContent = `${compoundDegree} 度 − 7 → ${names[compoundDegree - 9]}度`;
    byID('lessonBoard').querySelectorAll('[data-degree]').forEach(button=>button.setAttribute('aria-pressed',String(Number(button.dataset.degree)===compoundDegree)));
  }
  function setStage(stage) {
    current = stage;
    const reviewing = stage >= 0 && stage < modules.length;
    byID('home').hidden = stage !== -1;
    byID('lesson').hidden = !reviewing;
    byID('summary').hidden = stage !== modules.length;
    byID('lessonNav').hidden = !reviewing;
    document.body.classList.toggle('review-active',reviewing);
    const completed = stage < 0 ? 0 : Math.min(stage, modules.length);
    byID('progress').style.width = `${completed / modules.length * 100}%`;
    document.querySelector('.progress-wrap').setAttribute('aria-valuenow',String(completed));
    byID('stepCount').textContent = stage === -1 ? '开始' : reviewing ? `${stage+1} / 4` : '完成';
    if(reviewing) {
      const module = modules[stage];
      byID('moduleNumber').textContent = `复习 ${String(stage+1).padStart(2,'0')}`;
      byID('moduleTitle').textContent = module.title;
      byID('moduleCopy').innerHTML = module.copy;
      byID('exerciseLinks').replaceChildren(...exercises[module.group].map(([title,config])=>{
        const link = document.createElement('a');link.className='secondary exercise-link';
        link.href=`https://www.musictheory.net/exercises/interval/${config}`;
        link.target='_blank';link.rel='noopener noreferrer';
        link.setAttribute('aria-label',`${title}，MusicTheory.net 外部练习，新窗口打开`);
        const text=document.createElement('span');text.textContent=title;
        const arrow=document.createElement('span');arrow.textContent='↗';arrow.setAttribute('aria-hidden','true');
        link.append(text,arrow);return link;
      }));
      renderBoard();
      byID('prevBtn').textContent = stage === 0 ? '返回首页' : '← 上一步';
      byID('nextBtn').textContent = stage === modules.length-1 ? '完成复习' : '继续 →';
      byID('lessonContent').scrollTop=0;byID('lessonBoard').scrollTop=0;
    }
    window.scrollTo({top:0,behavior:'instant'});
    byID(reviewing ? 'moduleTitle' : stage === -1 ? 'homeTitle' : 'summaryTitle').focus({preventScroll:true});
  }
  byID('startReview').addEventListener('click',()=>setStage(0));
  byID('prevBtn').addEventListener('click',()=>setStage(current-1));
  byID('nextBtn').addEventListener('click',()=>setStage(current+1));
  byID('backHome').addEventListener('click',()=>setStage(-1));
  byID('reviewAgain').addEventListener('click',()=>setStage(0));
  byID('lessonBoard').addEventListener('click',event=>{
    const button=event.target.closest('button');if(!button)return;
    if(button.id==='invertButton'){inverted=!inverted;updateInversion()}
    if(button.dataset.degree){compoundDegree=Number(button.dataset.degree);updateCompound()}
  });
})();
