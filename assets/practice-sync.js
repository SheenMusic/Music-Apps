/* Practice results → the teacher's Google Sheet (sheet 「练习记录」; Apps Script source:
   scripts/order-sheet/Code.gs).

   Loaded by site-analytics.js on every page that uses assets/practice-report.js.
   Whenever a practice page builds its result report (the student taps 「复制并提交结果」, or
   ET01 / ET02 finish a test), one row is sent: student, practice, summary, time and the
   full report text the student would otherwise paste into WeChat.

   Who the student is: the student's own dashboard stores {id, name} in this browser
   (localStorage 'sheen.student'). On the teacher's own device (marked by /teacher/ as
   'sheen.teacherDevice') results are recorded as 「老师」, as reference data.

   This file wraps PracticeReport.generate to submit results separately from formatting. Failures are ignored and never affect a page. */
(() => {
  'use strict';
  const ENDPOINT = 'https://script.google.com/macros/s/AKfycbynv1g7WXCzMMku8leJOx6k_xFoEbOtAXJh_oHU2pW2Vgt4kJv0W20fmUTfMg12q4vw/exec';
  const sent = new Map();

  const read = key => {
    try { return JSON.parse(localStorage.getItem(key)); } catch { return null; }
  };

  function send(data, text){
    if (sent.has(text)) return sent.get(text);
    const student = read('sheen.teacherDevice') ? {name:'老师', id:'teacher'} : read('sheen.student');
    const sections = text.split('\n\n');
    // The summary is the section with 「用时」, e.g. 「完成：20/20题 · 用时：6分12秒 / 正确率：85% …」.
    const summary = (sections.find(part => part.includes('用时')) || '').replace(/\n/g, ' · ');
    const row = {
      kind:'practice',
      student:student && student.name ? student.name : '未识别',
      studentId:student && student.id ? student.id : '',
      practice:`${data.code} ${data.title}`,
      summary,
      time:window.PracticeReport.time(data.seconds || 0),
      report:text,
      page:location.pathname
    };
    const delivery = fetch(ENDPOINT, {method:'POST', mode:'no-cors', keepalive:true, body:JSON.stringify(row)}).then(() => true, () => {
      sent.delete(text);
      return false;
    });
    sent.set(text, delivery);
    return delivery;
  }

  // Pages with their own report text (e.g. 和弦记号 06 Snowman) call PracticeSync.send(data, text) directly.
  window.PracticeSync = Object.freeze({send});

  // Replace PracticeReport with a copy whose generate() also sends the result.
  function wrap(){
    const original = window.PracticeReport;
    if (!original) return false;
    if (original.synced) return true;
    const generate = data => {
      const text = original.generate(data);
      try { send(data, text); } catch { /* recording must never break the report */ }
      return text;
    };
    window.PracticeReport = Object.freeze({...original, generate, synced:true});
    return true;
  }

  if (!wrap()) {
    document.addEventListener('DOMContentLoaded', wrap);
    window.addEventListener('load', wrap);
  }
})();
