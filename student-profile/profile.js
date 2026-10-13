/* Independent survey: native validity plus conditional fields, no stored answers. */
(() => {
  'use strict';
  const form = document.getElementById('studentProfile');
  const button = document.getElementById('submitProfile');
  const status = document.getElementById('submissionStatus');
  const identities = Array.from(form.querySelectorAll('[name="current_status"]'));
  function updateIdentity() {
    const selected = new Set(identities.filter(input => input.checked).map(input => input.dataset.status));
    identities[0].setCustomValidity(selected.size ? '' : '请至少选择一个目前的身份。');
    for (const group of form.querySelectorAll('[data-related]')) {
      const key = group.dataset.related;
      const visible = key === 'other' ? selected.has('other') && !selected.has('student') && !selected.has('work') : selected.has(key);
      group.hidden = !visible;
      group.disabled = !visible;
      for (const input of group.querySelectorAll('input')) {
        input.required = visible;
        if (!visible) input.checked = false;
      }
    }
    const detail = document.getElementById('statusDetail');
    document.getElementById('statusOther').hidden = !selected.has('other');
    detail.disabled = !selected.has('other');
    if (detail.disabled) detail.value = '';
    document.getElementById('identityPrompt').hidden = selected.size > 0;
  }
  const training = Array.from(form.querySelectorAll('[name="music_training_background"]'));
  function updateTraining() {
    training[0].setCustomValidity(training.some(input => input.checked) ? '' : '请至少选择一项音乐学习背景。');
    const other = training.some(input => input.checked && input.value === '其他');
    const detail = document.getElementById('trainingDetail');
    document.getElementById('trainingOther').hidden = !other;
    detail.disabled = !other;
    if (!other) detail.value = '';
  }
  training.forEach(input => input.addEventListener('change',updateTraining));
  updateTraining();
  identities.forEach(input => input.addEventListener('change',updateIdentity));
  updateIdentity();button.disabled = false;
  let submitting = false;
  form.addEventListener('submit',async event => {
    event.preventDefault();
    updateIdentity();updateTraining();
    if (submitting || !form.reportValidity()) return;
    submitting = true;button.disabled = true;button.textContent = '正在提交…';
    form.setAttribute('aria-busy','true');status.dataset.state = '';status.textContent = '正在提交你的学习背景信息…';
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(),20000);
    try {
      // FormData preserves every checked current_status entry; disabled fields are omitted.
      const data = new FormData(form);
      data.set('music_training_background',training.filter(input => input.checked).map(input => input.value).join('；'));
      const response = await fetch(form.action,{method:'POST',body:data,headers:{Accept:'application/json'},signal:controller.signal});
      if (!response.ok) throw new Error('Submission failed');
      form.reset();updateIdentity();updateTraining();
      status.dataset.state = 'success';status.textContent = '提交成功！感谢你填写学习背景信息。';
    } catch {
      status.dataset.state = 'error';status.textContent = '提交未成功，你填写的内容已保留。请稍后重试；如仍无法提交，请联系老师。';
    } finally {
      clearTimeout(timeout);submitting = false;form.removeAttribute('aria-busy');button.disabled = false;button.textContent = '提交调查 →';
    }
  });
  window.addEventListener('pageshow',() => {updateIdentity();updateTraining()});
})();
