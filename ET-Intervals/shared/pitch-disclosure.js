// Browser history restoration must also start with the answer hints folded.
window.addEventListener('pageshow', () => {
  const details = document.getElementById('pitchDetails');
  if (details) details.open = false;
});
