// Each course opts into one rule type; parameters and judging stay in the lesson.
(() => {
  const rules = {
    basic: ['聆听示范音，模唱相同音高。连续正确 10 题即可完成。'],
    octave: ['聆听示范音，在指定八度模唱目标音高。本课严格判定八度，连续正确 10 题即可完成。'],
    construct: ['聆听参考音，根据指定音程关系构唱目标音高。连续正确 10 题即可完成。'],
    harmonic: [
      '播放示范音，分别模唱并锁定低音与高音。',
      '音高辅助：展开音高提示后，在示范音播放期间点击低音或高音卡片，可使对应声部短暂振荡一次，随后恢复原始音高。',
      '连续完成 10 道无辅助正确题即可通过。展开音高提示即视为使用辅助，连续成绩归零。'
    ]
  };
  document.querySelectorAll('[data-practice-rules]').forEach(panel => {
    const paragraphs = rules[panel.dataset.practiceRules];
    if (!paragraphs) return;
    panel.replaceChildren();
    paragraphs.forEach((text, i) => {
      if (i) panel.append(document.createElement('br'), document.createElement('br'));
      panel.append(document.createTextNode(text));
    });
  });
})();
