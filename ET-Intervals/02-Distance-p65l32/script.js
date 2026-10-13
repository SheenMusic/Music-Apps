const questions=[
  {a:'audio/q01_B.wav',b:'audio/q01_A.wav',answer:'B'},
  {a:'audio/q02_A.wav',b:'audio/q02_B.wav',answer:'A'},
  {a:'audio/q03_A.wav',b:'audio/q03_B.wav',answer:'A'},
  {a:'audio/q04_B.wav',b:'audio/q04_A.wav',answer:'B'},
  {a:'audio/q05_A.wav',b:'audio/q05_B.wav',answer:'A'},
  {a:'audio/q06_B.wav',b:'audio/q06_A.wav',answer:'B'},
  {a:'audio/q07_B.wav',b:'audio/q07_A.wav',answer:'B'},
  {a:'audio/q08_A.wav',b:'audio/q08_B.wav',answer:'A'},
  {a:'audio/q09_B.wav',b:'audio/q09_A.wav',answer:'B'},
  {a:'audio/q10_A.wav',b:'audio/q10_B.wav',answer:'A'},
  {a:'audio/q11_B.wav',b:'audio/q11_A.wav',answer:'B'},
  {a:'audio/q12_B.wav',b:'audio/q12_A.wav',answer:'B'},
  {a:'audio/q13_A.wav',b:'audio/q13_B.wav',answer:'A'},
  {a:'audio/q14_A.wav',b:'audio/q14_B.wav',answer:'A'},
  {a:'audio/q15_B.wav',b:'audio/q15_A.wav',answer:'B'},
  {a:'audio/q16_A.wav',b:'audio/q16_B.wav',answer:'A'},
  {a:'audio/q17_B.wav',b:'audio/q17_A.wav',answer:'B'},
  {a:'audio/q18_B.wav',b:'audio/q18_A.wav',answer:'B'},
  {a:'audio/q19_A.wav',b:'audio/q19_B.wav',answer:'A'},
  {a:'audio/q20_B.wav',b:'audio/q20_A.wav',answer:'B'}
];

let mode=null,current=0,score=0,answered=false;
let trainingOrder=[],trainingPos=0,trainingRound=1;
let testResults=[],testStart=0,audioA=null,audioB=null;

const $=id=>document.getElementById(id);

function screen(id){
  document.querySelectorAll(".screen").forEach(x=>x.classList.remove("active"));
  $(id).classList.add("active");
  scrollTo({top:0,behavior:"smooth"});
}

function stopAudio(){
  [audioA,audioB].forEach(a=>{
    if(a){
      a.pause();
      a.currentTime=0;
    }
  });

  audioA=audioB=null;
  $("playA").textContent="▶";
  $("playB").textContent="▶";
}

function shuffle(a){
  for(let i=a.length-1;i>0;i--){
    let j=Math.floor(Math.random()*(i+1));
    [a[i],a[j]]=[a[j],a[i]];
  }
  return a;
}

function build(){
  trainingOrder=shuffle([...Array(questions.length).keys()]);
  trainingPos=0;
}

function q(){
  return mode==="test"
    ? questions[current]
    : questions[trainingOrder[trainingPos]];
}

function update(){
  let n=mode==="test"
    ? current+1
    : trainingPos+1;

  if(mode==="test"){
    $("progress").textContent=
      String(n).padStart(2,"0")+" / 20";

    $("bar").style.width=
      (n/20*100)+"%";

  }else{
    $("progress").textContent=
      `第 ${trainingRound} 轮 · 练习 ${n} / 20`;

    $("bar").style.width=
      (n/20*100)+"%";
  }
}

function load(){
  let x=q();

  answered=false;

  stopAudio();
  update();

  $("modeBadge").textContent=
    mode==="test"
      ? "测验模式"
      : "训练模式";

  $("feedback").className="feedback";
  $("feedback").innerHTML="";

  $("options").innerHTML="";

  $("next").disabled=true;
  $("next").textContent="下一题 →";

  ["A","B"].forEach(choice=>{
    const b=document.createElement("button");

    b.className="option";
    b.textContent=choice;
    b.onclick=()=>answer(choice);

    $("options").appendChild(b);
  });

  playSequence();
}

function play(which){
  stopAudio();

  let x=q();
  let el=which==="A"
    ? $("playA")
    : $("playB");

  let aud=new Audio(
    which==="A"
      ? x.a
      : x.b
  );

  if(which==="A")
    audioA=aud;
  else
    audioB=aud;

  aud.play().catch(()=>{});

  el.textContent="Ⅱ";

  aud.onended=()=>{
    el.textContent="▶";
  };
}

function playSequence(){
  stopAudio();

  let x=q();

  let a=new Audio(x.a);
  let b=new Audio(x.b);

  audioA=a;
  audioB=b;

  $("playA").textContent="Ⅱ";
  $("playB").textContent="▶";

  a.onended=()=>{
    $("playA").textContent="▶";
    audioA=null;

    $("playB").textContent="Ⅱ";

    b.play().catch(()=>{});
  };

  b.onended=()=>{
    $("playB").textContent="▶";
    audioB=null;
  };

  a.play().catch(()=>{});
}

function answer(choice){
  if(answered)return;

  answered=true;

  let x=q();
  let correct=choice===x.answer;

  if(correct)score++;

  [...$("options").children].forEach(b=>{
    b.disabled=true;

    if(b.textContent===choice){
      b.classList.add(
        correct
          ? "correct"
          : "wrong"
      );
    }

    if(
      mode==="training" &&
      b.textContent===x.answer
    ){
      b.classList.add("answer");
    }
  });

  $("feedback").className=
    "feedback "+(
      correct
        ? "is-correct"
        : "is-wrong"
    );

  $("feedback").innerHTML=
    correct
      ? "<strong>正确</strong><span>听觉准确。</span>"
      : `<strong>不正确</strong><span>更宽的是：${x.answer}。</span>`;

  if(mode==="test"){
    testResults[current]={
      correct,
      choice,
      answer:x.answer
    };
  }

  $("next").disabled=false;
}

function startTraining(){
  mode="training";
  score=0;
  trainingRound=1;

  build();

  screen("quiz");
  load();
}

function startTest(){
  mode="test";
  score=0;
  current=0;
  testResults=[];
  testStart=performance.now();

  screen("quiz");
  load();
}

function quit(){
  stopAudio();
  screen("start");
}

function time(ms){
  let s=Math.max(
    0,
    Math.round(ms/1000)
  );

  return String(
    Math.floor(s/60)
  ).padStart(2,"0")
    +":"
    +String(s%60).padStart(2,"0");
}

function result(){
  stopAudio();

  let elapsed=
    performance.now()-testStart;

  let p=
    Math.round(score/20*100);

  $("score").textContent=p+"%";
  $("correctCount").textContent=score;
  $("wrongCount").textContent=20-score;
  $("elapsed").textContent=time(elapsed);

  $("message").textContent=
    p===100
      ? "全部正确。对音程宽窄的听觉判断已经非常稳定。"
      : p>=80
        ? "很好。继续保持对相对距离的稳定判断。"
        : p>=60
          ? "已经建立初步参照，还需要继续训练不同距离之间的比较。"
          : "先不要追求速度。重新建立对音程宽窄的基本听觉参照。";

  $("detail").innerHTML=
    testResults.map((r,i)=>
      `<div class="resultRow">
        <span>第 ${i+1} 题</span>
        <strong class="${r.correct?"ok":"ng"}">
          ${r.correct?"正确":"错误"}
        </strong>
      </div>`
    ).join("");

  window.lastTestText=
`Ear Training · 音的宽窄
测验成绩：${score}/20（${p}%）
用时：${time(elapsed)}

答题结果：
${testResults.map((r,i)=>
  `第${i+1}题：${r.correct?"正确":"错误"}`
).join("\n")}`;

  screen("result");
}

$("trainingBtn").onclick=startTraining;
$("testBtn").onclick=startTest;

$("playA").onclick=()=>play("A");
$("playB").onclick=()=>play("B");

$("quit").onclick=quit;

$("next").onclick=()=>{
  if(!answered)return;

  if(mode==="test"){

    if(current<19){
      current++;
      load();
    }else{
      result();
    }

  }else{

    trainingPos++;

    if(trainingPos>=trainingOrder.length){
      trainingRound++;
      build();
    }

    load();
  }
};

$("again").onclick=startTest;
$("back").onclick=quit;

$("copy").onclick=async()=>{
  try{
    await navigator.clipboard.writeText(
      window.lastTestText
    );

    $("copy").textContent="已复制 ✓";

    setTimeout(
      ()=>$("copy").textContent="复制测验结果",
      1600
    );

  }catch(e){

    let ta=document.createElement("textarea");

    ta.value=window.lastTestText;

    document.body.appendChild(ta);

    ta.select();

    document.execCommand("copy");

    ta.remove();

    $("copy").textContent="已复制 ✓";

    setTimeout(
      ()=>$("copy").textContent="复制测验结果",
      1600
    );
  }
};
