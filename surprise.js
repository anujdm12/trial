// surprise.js
// Handles birthday music and button for the surprise page only

const birthdayAudio = document.getElementById('birthday-audio');
const bdayMusicWrap = document.getElementById('bday-music-wrap');

function prepareBirthdayAudio() {
  if (!birthdayAudio) return;
  birthdayAudio.volume = 0.82;
  birthdayAudio.loop = true;
  birthdayAudio.preload = 'auto';
}

function attemptPlayBirthdayAudio() {
  if (!birthdayAudio) return;
  prepareBirthdayAudio();
  if (birthdayAudio.paused) {
    birthdayAudio.currentTime = 0;
    birthdayAudio.play();
  }
  syncMusicUi();
}

function toggleBirthdayAudio() {
  if (!birthdayAudio) return;
  if (birthdayAudio.paused) {
    attemptPlayBirthdayAudio();
  } else {
    birthdayAudio.pause();
    syncMusicUi();
  }
}

function syncMusicUi() {
  const label = birthdayAudio && !birthdayAudio.paused ? '⏹ Pause music' : '🎵 Play birthday music';
  document.querySelectorAll('.music-btn-inner').forEach((element) => {
    element.textContent = label;
  });
}

function renderMusicButton() {
  if (!bdayMusicWrap) return;
  bdayMusicWrap.innerHTML = '';
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'music-btn';
  button.innerHTML = `<span class="music-btn-inner">🎵 Play birthday music</span>`;
  button.addEventListener('click', toggleBirthdayAudio);
  bdayMusicWrap.appendChild(button);
  syncMusicUi();
}

function autoPlayBirthdayAudio() {
  if (!birthdayAudio) return;
  prepareBirthdayAudio();
  birthdayAudio.currentTime = 0;
  const promise = birthdayAudio.play();
  if (promise !== undefined) {
    promise.then(() => {
      syncMusicUi();
    }).catch(() => {
      // Autoplay blocked — attach one-time interaction fallback
      syncMusicUi();
      const events = ['click', 'touchstart', 'keydown', 'pointerdown'];
      const unlockOnce = () => {
        if (birthdayAudio.paused) {
          birthdayAudio.play().then(syncMusicUi).catch(() => {});
        }
        events.forEach(e => document.removeEventListener(e, unlockOnce));
      };
      events.forEach(e => document.addEventListener(e, unlockOnce, { once: true }));
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  renderMusicButton();
  autoPlayBirthdayAudio();
});

if (birthdayAudio) {
  birthdayAudio.addEventListener('play', syncMusicUi);
  birthdayAudio.addEventListener('pause', syncMusicUi);
}