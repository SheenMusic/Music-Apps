const questions = [
  {audio:'audio/q01.wav', question:'第二个音相对于第一个音，向哪个方向移动？', options:['上行','下行'], answer:0, distance:'八度'},
  {audio:'audio/q02.wav', question:'第二个音相对于第一个音，向哪个方向移动？', options:['上行','下行'], answer:0, distance:'大七度'},
  {audio:'audio/q03.wav', question:'第二个音相对于第一个音，向哪个方向移动？', options:['上行','下行'], answer:1, distance:'小七度'},
  {audio:'audio/q04.wav', question:'第二个音相对于第一个音，向哪个方向移动？', options:['上行','下行'], answer:1, distance:'大六度'},
  {audio:'audio/q05.wav', question:'第二个音相对于第一个音，向哪个方向移动？', options:['上行','下行'], answer:0, distance:'小六度'},
  {audio:'audio/q06.wav', question:'第二个音相对于第一个音，向哪个方向移动？', options:['上行','下行'], answer:1, distance:'纯五度'},
  {audio:'audio/q07.wav', question:'第二个音相对于第一个音，向哪个方向移动？', options:['上行','下行'], answer:1, distance:'三全音'},
  {audio:'audio/q08.wav', question:'第二个音相对于第一个音，向哪个方向移动？', options:['上行','下行'], answer:0, distance:'纯四度'},
  {audio:'audio/q09.wav', question:'第二个音相对于第一个音，向哪个方向移动？', options:['上行','下行'], answer:1, distance:'大三度'},
  {audio:'audio/q10.wav', question:'第二个音相对于第一个音，向哪个方向移动？', options:['上行','下行'], answer:0, distance:'小三度'},
  {audio:'audio/q11.wav', question:'第二个音相对于第一个音，向哪个方向移动？', options:['上行','下行'], answer:0, distance:'大二度'},
  {audio:'audio/q12.wav', question:'第二个音相对于第一个音，向哪个方向移动？', options:['上行','下行'], answer:1, distance:'大二度'},
  {audio:'audio/q13.wav', question:'第二个音相对于第一个音，向哪个方向移动？', options:['上行','下行'], answer:1, distance:'全音'},
  {audio:'audio/q14.wav', question:'第二个音相对于第一个音，向哪个方向移动？', options:['上行','下行'], answer:0, distance:'半音'},
  {audio:'audio/q15.wav', question:'第二个音相对于第一个音，向哪个方向移动？', options:['上行','下行'], answer:1, distance:'半音'},
  {audio:'audio/q16.wav', question:'第二个音相对于第一个音，向哪个方向移动？', options:['上行','下行'], answer:0, distance:'半音'},
  {audio:'audio/q17.wav', question:'第二个音相对于第一个音，向哪个方向移动？', options:['上行','下行'], answer:1, distance:'半音'},
  {audio:'audio/q18.wav', question:'第二个音相对于第一个音，向哪个方向移动？', options:['上行','下行'], answer:1, distance:'半音'},
  {audio:'audio/q19.wav', question:'第二个音相对于第一个音，向哪个方向移动？', options:['上行','下行'], answer:0, distance:'半音'},
  {audio:'audio/q20.wav', question:'第二个音相对于第一个音，向哪个方向移动？', options:['上行','下行'], answer:1, distance:'半音'}
];

let mode=null,current=0,score=0,selected=null,answered=false,audio=null,trainingOrder=[],trainingPos=0,trainingRound=1,testResults=[],testStart=0;

const $=id=>document.getElementById(id);

function screen(id){
  document.querySelectorAll('.screen').forEach(x=>x.classList.remove('active'));
  $(id).classList.add('active');
  window.scrollTo({top:0,behavior:'smooth'});
}

function stopAudio(){
  if(audio){
    audio.pause();
    audio.currentTime=0;
    audio=null;
  }
  $('play').textContent='▶';
}

function shuffle(arr){
  for(let i=arr.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    [arr[i],arr[j]]=[arr[j],arr[i]];
  }
  return arr;
}

function buildTrainingOrder(){
  trainingOrder=shuffle([...Array(questions.length).keys()]);
  trainingPos=0;
}

function currentQuestion(){
  return mode==='test'
    ? questions[current]
    : questions[trainingOrder[trainingPos]];
}

function updateProgress(){
  if(mode==='test'){
    $('progress').textContent=`${String(current+1).padStart(2,'0')} / 20`;
    $('bar').style.width=((current+1)/20*100)+'%';
  }else{
    $('progress').textContent=`第 ${trainingRound} 轮 · 练习 ${trainingPos+1} / 20`;
    $('bar').style.width=((trainingPos+1)/20*100)+'%';
  }
}

function load(){
  const q=currentQuestion();
  selected=null;
  answered=false;
  stopAudio();
  updateProgress();

  $('modeBadge').textContent=mode==='test'?'测验模式':'训练模式';
  $('question').textContent=q.question;
  $('feedback').className='feedback';
  $('feedback').innerHTML='';
  $('options').innerHTML='';
  $('next').disabled=true;
  $('next').textContent='下一题 →';

  q.options.forEach((x,i)=>{
    const b=document.createElement('button');
    b.className='option';
    b.textContent=x;
    b.onclick=()=>answer(i);
    $('options').appendChild(b);
  });
}

function playCurrent(){
  stopAudio();
  audio=new Audio(currentQuestion().audio);
  const p=audio.play();
  if(p&&p.catch)p.catch(()=>{});
  $('play').textContent='Ⅱ';
  audio.onended=()=>$('play').textContent='▶';
}

function answer(i){
  if(answered)return;

  const q=currentQuestion();
  selected=i;
  answered=true;

  const buttons=[...document.querySelectorAll('.option')];

  buttons.forEach((b,index)=>{
    b.disabled=true;

    if(index===i)
      b.classList.add(index===q.answer?'correct':'wrong');

    if(mode==='training'&&index===q.answer)
      b.classList.add('answer');
  });

  const correct=i===q.answer;

  if(correct)score++;

  if(mode==='training'){
    $('feedback').className='feedback '+(correct?'is-correct':'is-wrong');
    $('feedback').innerHTML=correct
      ?'<strong>正确</strong><span>听觉判断准确。</span>'
      :`<strong>不正确</strong><span>正确答案：${q.options[q.answer]} · 本题：${q.distance}</span>`;
  }else{
    $('feedback').className='feedback '+(correct?'is-correct':'is-wrong');
    $('feedback').innerHTML=correct
      ?'<strong>正确</strong><span>请继续完成测验。</span>'
      :'<strong>不正确</strong><span>请继续完成测验。</span>';

    testResults[current]={
      correct,
      selected:i,
      answer:q.answer,
      distance:q.distance
    };
  }

  $('next').disabled=false;
}

function startTraining(){
  mode='training';
  score=0;
  trainingRound=1;
  buildTrainingOrder();
  screen('quiz');
  load();
  playCurrent();
}

function startTest(){
  mode='test';
  score=0;
  current=0;
  testResults=[];
  testStart=performance.now();
  screen('quiz');
  load();
  playCurrent();
}

function quitToStart(){
  stopAudio();
  mode=null;
  screen('start');
}

function formatTime(ms){
  const sec=Math.max(0,Math.round(ms/1000));
  const m=String(Math.floor(sec/60)).padStart(2,'0');
  const s=String(sec%60).padStart(2,'0');
  return `${m}:${s}`;
}

function showResult(){
  stopAudio();

  const elapsed=performance.now()-testStart;
  const p=Math.round(score/questions.length*100);

  $('score').textContent=p+'%';
  $('correctCount').textContent=score;
  $('wrongCount').textContent=questions.length-score;
  $('elapsed').textContent=formatTime(elapsed);

  $('message').textContent=
    p===100
      ?'全部正确。听觉参照已经建立得很好。'
      :p>=80
        ?'很好。继续保持稳定的听觉判断。'
        :p>=60
          ?'已经建立初步参照，但还需要更多重复训练。'
          :'不要急于追求速度。先重新建立稳定的听觉参照。';

  $('detail').innerHTML=testResults.map((r,i)=>
    `<div class="resultRow"><span>第 ${i+1} 题</span><strong class="${r.correct?'ok':'ng'}">${r.correct?'正确':'错误'}</strong></div>`
  ).join('');

  window.lastTestText=
    `Ear Training · 第一课
测验成绩：${score}/20（${p}%）
用时：${formatTime(elapsed)}

答题结果：
${testResults.map((r,i)=>`第${i+1}题：${r.correct?'正确':'错误'}`).join('\n')}`;

  screen('result');
}

$('trainingBtn').onclick=startTraining;
$('testBtn').onclick=startTest;
$('play').onclick=playCurrent;
$('quit').onclick=quitToStart;

$('next').onclick=()=>{
  if(!answered)return;

  if(mode==='test'){
    if(current<questions.length-1){
      current++;
      load();
      setTimeout(playCurrent,180);
    }else{
      showResult();
    }
  }else{
    trainingPos++;

    if(trainingPos>=trainingOrder.length){
      trainingRound++;
      buildTrainingOrder();
    }

    load();
    setTimeout(playCurrent,180);
  }
};

$('again').onclick=startTest;
$('back').onclick=quitToStart;

$('copy').onclick=async()=>{
  try{
    await navigator.clipboard.writeText(window.lastTestText);
    $('copy').textContent='已复制 ✓';
    setTimeout(()=>$('copy').textContent='复制测验结果',1600);
  }catch(e){
    const ta=document.createElement('textarea');
    ta.value=window.lastTestText;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
    $('copy').textContent='已复制 ✓';
    setTimeout(()=>$('copy').textContent='复制测验结果',1600);
  }
};
