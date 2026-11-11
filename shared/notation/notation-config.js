/* One engraving policy. Course adapters supply data, never duplicate defaults. */
window.NotationConfig = {
  defaultClef: 'treble', showInitialBarline: false, staffLineCount: 5,
  // 规范 N02/N03（v1.2）：谱线纯黑 0.5、加线 0.65；单独的演示谱表不画结束小节线。
  // 多个谱表拼接（调用 createStave 时传入选项）以及谱表内部的 BarNote 不受影响。
  staffLineColor: '#000000', staffLineWidth: .5, ledgerLineWidth: .65, showFinalBarline: false,
  defaultScale: 1, responsive: true, maxWidth: 520, height: 150,
  padding: 12, staveY: 34,
  // VexFlow default spacing; one override point for simple and custom voices.
  formatterOptions: {}
};
