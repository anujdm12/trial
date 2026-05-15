const birthdayAudio = document.getElementById('birthday-audio');
const bdayMusicWrap = document.getElementById('bday-music-wrap');
const wishVault = document.getElementById('wish-vault');
const blowCandleButton = document.getElementById('blow-candle');
const wishAction = document.getElementById('wish-action');
const sparkleRoot = document.getElementById('birthday-sparkles');
const wishCard = document.querySelector('.birthday-wish-card');

function prepareBirthdayAudio() {
  if (!birthdayAudio) return;
  birthdayAudio.volume = 0.82;
  birthdayAudio.loop = true;
  birthdayAudio.preload = 'auto';
}

function syncMusicUi() {
  const label = birthdayAudio && !birthdayAudio.paused ? 'Pause music' : 'Play birthday music';
  document.querySelectorAll('.music-btn-inner').forEach((element) => {
    element.textContent = label;
  });
}

function attemptPlayBirthdayAudio() {
  if (!birthdayAudio) return;
  prepareBirthdayAudio();

  if (birthdayAudio.paused) {
    birthdayAudio.currentTime = 0;
    const promise = birthdayAudio.play();
    if (promise && typeof promise.catch === 'function') {
      promise.catch(syncMusicUi);
    }
  }

  syncMusicUi();
}

function toggleBirthdayAudio() {
  if (!birthdayAudio) return;

  if (birthdayAudio.paused) {
    attemptPlayBirthdayAudio();
    return;
  }

  birthdayAudio.pause();
  syncMusicUi();
}

function renderMusicButton() {
  if (!bdayMusicWrap) return;

  bdayMusicWrap.innerHTML = '';
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'music-btn';
  button.innerHTML = '<span class="music-btn-inner">Play birthday music</span>';
  button.addEventListener('click', toggleBirthdayAudio);
  bdayMusicWrap.appendChild(button);
  syncMusicUi();
}

function enableAudioAfterInteraction() {
  if (!birthdayAudio) return;

  const events = ['click', 'touchstart', 'keydown', 'pointerdown'];
  const unlockOnce = () => {
    if (birthdayAudio.paused) {
      birthdayAudio.play().then(syncMusicUi).catch(() => {});
    }
    events.forEach((eventName) => document.removeEventListener(eventName, unlockOnce));
  };

  events.forEach((eventName) => document.addEventListener(eventName, unlockOnce, { once: true }));
}

function autoPlayBirthdayAudio() {
  if (!birthdayAudio) return;
  prepareBirthdayAudio();
  birthdayAudio.currentTime = 0;

  const promise = birthdayAudio.play();
  if (promise !== undefined) {
    promise.then(syncMusicUi).catch(() => {
      syncMusicUi();
      enableAudioAfterInteraction();
    });
  }
}

function createSparkleBurst() {
  if (!sparkleRoot) return;

  const colors = ['#ffdf8a', '#fff2c7', '#e50914', '#ffffff'];
  const centerX = 50;
  const centerY = 48;

  for (let index = 0; index < 42; index += 1) {
    const sparkle = document.createElement('span');
    const angle = Math.random() * Math.PI * 2;
    const distance = 90 + Math.random() * 230;
    const size = 5 + Math.random() * 8;

    sparkle.className = 'birthday-sparkle';
    sparkle.style.setProperty('--x', `${centerX + (Math.random() * 10 - 5)}vw`);
    sparkle.style.setProperty('--y', `${centerY + (Math.random() * 8 - 4)}vh`);
    sparkle.style.setProperty('--dx', `${Math.cos(angle) * distance}px`);
    sparkle.style.setProperty('--dy', `${Math.sin(angle) * distance}px`);
    sparkle.style.setProperty('--size', `${size}px`);
    sparkle.style.setProperty('--spark', colors[index % colors.length]);
    sparkleRoot.appendChild(sparkle);

    window.setTimeout(() => sparkle.remove(), 1500);
  }
}

function blowOutCandle() {
  if (!wishVault || wishVault.classList.contains('candle-out')) return;

  wishVault.classList.add('candle-out');
  wishCard?.classList.add('wish-complete');
  if (wishAction) {
    wishAction.textContent = 'Wish sent. Candle blown out.';
  }
  if (blowCandleButton) {
    blowCandleButton.disabled = true;
    blowCandleButton.setAttribute('aria-label', 'Birthday candle blown out');
  }

  createSparkleBurst();
  attemptPlayBirthdayAudio();
}

document.addEventListener('DOMContentLoaded', () => {
  renderMusicButton();
  autoPlayBirthdayAudio();
  blowCandleButton?.addEventListener('click', blowOutCandle);
});

if (birthdayAudio) {
  birthdayAudio.addEventListener('play', syncMusicUi);
  birthdayAudio.addEventListener('pause', syncMusicUi);
}
