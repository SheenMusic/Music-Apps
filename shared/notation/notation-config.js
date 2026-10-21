/* One engraving policy. Course adapters supply data, never duplicate defaults. */
window.NotationConfig = {
  defaultClef: 'treble', showInitialBarline: false, staffLineCount: 5,
  defaultScale: 1, responsive: true, maxWidth: 520, height: 150,
  padding: 12, staveY: 34,
  // VexFlow default spacing; one override point for simple and custom voices.
  formatterOptions: {}
};
