/* Shared read-only link rendering. Student callers must filter allowed resources first. */
(() => {
  'use strict';
  const text = (tag, value, className) => {
    const node = document.createElement(tag);node.textContent = value;
    if (className) node.className = className;
    return node;
  };
  function link(label,url,accessibleName) {
    const anchor = text('a',`${label} ↗`,'training-link');
    anchor.href = url;anchor.target = '_blank';anchor.rel = 'noopener noreferrer';
    anchor.setAttribute('aria-label',`${accessibleName}，在新标签页打开`);
    return anchor;
  }
  function lessonRow(resource,{showType=false}={}) {
    const row = text('li','','resource-row');row.dataset.lesson = resource.number;
    const number = `Lesson ${String(resource.number).padStart(2,'0')}`;
    row.append(text('span',number,'resource-number'));
    const content = document.createElement('div');
    const title = text('p','','resource-title');
    if (!resource.listeningURL) title.append(link(resource.title,resource.practiceURL,`${number} ${resource.title}`));
    else {
      // Preserve the official title's text order, linking only its training words.
      for (const part of resource.title.split(/(听辨|模唱|构唱)/)) {
        if (part === '听辨') title.append(link(part,resource.listeningURL,`${number} ${resource.title}，听辨训练`));
        else if (part === resource.trainingType) title.append(link(part,resource.practiceURL,`${number} ${resource.title}，${part}训练`));
        else title.append(document.createTextNode(part));
      }
    }
    content.append(title);
    if (showType) content.append(text('p',`训练类型：${resource.trainingType}${resource.listeningURL ? '＋听辨' : ''}`,'resource-type'));
    if (resource.description) content.append(text('p',resource.description,'resource-description'));
    row.append(content);return row;
  }
  function supplementaryRow(resource) {
    const row = text('li','','resource-row supplementary-row');row.dataset.resource = resource.id;
    row.append(link(resource.title,resource.url,resource.title));return row;
  }
  window.courseResourceUI = {lessonRow,supplementaryRow};
})();
