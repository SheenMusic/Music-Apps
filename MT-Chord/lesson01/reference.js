/* 和弦记号 · 第一课：记号速查（课件与课后练习共用）
   课件：小节目录末尾的「记号速查」；课后练习：输入说明里的「本课记号速查」，在练习页里直接打开，不离开练习。
   内容与课件第三节的对照表一致。依赖：ChordStage.chordSymbol。 */
window.chordReference = (() => {
  const cs = ChordStage.chordSymbol;
  const table = '<div class="compare-table" role="table" aria-label="四种三和弦的常见记号">' +
    '<div class="compare-row compare-head" role="row"><span role="columnheader">和弦性质</span><span role="columnheader">英文缩写</span><span role="columnheader">专属符号</span></div>' +
    [['大三和弦', cs('C', 'M') + ' ' + cs('C', 'maj'), cs('C', '△')],
     ['小三和弦', cs('C', 'm') + ' ' + cs('C', 'min'), cs('C', '−')],
     ['增三和弦', cs('C', 'aug'), cs('C', '+')],
     ['减三和弦', cs('C', 'dim'), cs('C', '°')]]
      .map(cells => `<div class="compare-row" role="row">${cells.map(c => `<span role="cell">${c}</span>`).join('')}</div>`).join('') + '</div>';
  return [
    {title: '四种三和弦的常见记号', html: table},
    {title: '斜线记号', html: `<p class="symbol-row">${cs('C')}　${cs('C', '', 'E')}　${cs('C', '', 'G')}</p><ul class="reference-rules"><li>斜线左边写和弦，右边写实际最低的音（低音）。</li><li>原位直接写 C，不写 C/C。</li></ul>`}
  ];
})();
