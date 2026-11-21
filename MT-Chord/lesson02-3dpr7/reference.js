/* 和弦记号 · 第二课：记号速查（课件与课后练习共用）
   课件：小节目录末尾的「记号速查」；课后练习：输入说明里的「本课记号速查」，在练习页里直接打开，不离开练习。
   内容与课件第三节的七和弦对照表一致。依赖：ChordStage.chordSymbol。 */
window.chordReference = (() => {
  const cs = ChordStage.chordSymbol;
  // [名称, 英文缩写, 专属符号]（根音 C）
  const table = (label, rows) => `<div class="compare-table" role="table" aria-label="${label}">` +
    '<div class="compare-row compare-head" role="row"><span role="columnheader">名称</span><span role="columnheader">英文缩写</span><span role="columnheader">专属符号</span></div>' +
    rows.map(([name, abbr, sign]) => `<div class="compare-row" role="row"><span role="cell">${name}</span><span role="cell">${cs('C', abbr)}</span><span role="cell">${cs('C', sign)}</span></div>`).join('') + '</div>';
  return [
    {title: '核心的七和弦', html: table('核心的七和弦', [['大七和弦', 'maj7', '△7'], ['小七和弦', 'm7', '−7'], ['大小七和弦', '7', '7'], ['减七和弦', 'dim7', '°7']])},
    {title: '带变化音的七和弦', html: table('带变化音的七和弦', [['减小七和弦', 'm7(♭5)', 'ø7'], ['小大七和弦', 'm(maj7)', '−△7'], ['增小七和弦', '7(♯5)', '+7'], ['增大七和弦', 'maj7(♯5)', '△7(♯5)']])},
    {title: '读记号的要点', html: '<ul class="reference-rules"><li>单独的 7 是小七度；maj 紧挨着 7 时说的是七度（大七度）。</li><li>m、−、° 说的是三和弦：小、小、减。°7 的七度是减七度。</li><li>斜线左边写和弦，右边写低音：C7/B♭ 是第三转位。</li></ul>'}
  ];
})();
