/* Pause the other player without changing either playback position. */
(() => {
  'use strict';
  const video = document.getElementById('animatedScore');
  const audio = document.querySelector('.work-detail audio');
  if (!video || !audio) return;
  video.addEventListener('play', () => audio.pause());
  audio.addEventListener('play', () => video.pause());
})();
