window.MTFormatTime = function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, "0")}分${String(secs).padStart(2, "0")}秒`;
};
