// Format a known pitch label at the point of display, keeping its raw value for grading.
function formatPitchLabel(label) {
  const accidentals = { '#': '♯', b: '♭', '##': '𝄪', bb: '𝄫', x: '𝄪', n: '♮' };
  return String(label).replace(/^([A-G])(##|bb|[#bxn♯♭♮𝄪𝄫])?(-?\d+)?(?=\s|$)/u,
    (_, letter, accidental, octave = '') => {
      const subscript = octave.replace(/[0-9-]/g, digit => digit === '-' ? '₋' : '₀₁₂₃₄₅₆₇₈₉'[Number(digit)]);
      return letter + (accidentals[accidental] ?? accidental ?? '') + subscript;
    });
}
