const dom = {
  screens: document.querySelectorAll('.screen'),
  countdownHeader: document.getElementById('cd-head'),
  countdownMsg: document.getElementById('cd-msg'),
  countdownMicrocopy: document.getElementById('countdown-microcopy'),
  countdownDays: document.getElementById('cd-d'),
  countdownHours: document.getElementById('cd-h'),
  countdownMinutes: document.getElementById('cd-m'),
  countdownSeconds: document.getElementById('cd-s'),
  musicWrap: document.getElementById('music-wrap'),
  birthdayMusicWrap: document.getElementById('bday-music-wrap'),
  countdownProgressFill: document.getElementById('countdown-progress-fill'),
  countdownProgressValue: document.getElementById('countdown-progress-value'),
  statusChipPrimary: document.getElementById('status-chip-primary'),
  statusChipSecondary: document.getElementById('status-chip-secondary'),
  countdownBox: document.querySelector('.countdown-box'),
  countdownHype: document.getElementById('countdown-hype'),
  hypeKicker: document.getElementById('hype-kicker'),
  hypeNumber: document.getElementById('hype-number'),
  hypeBurst: document.getElementById('hype-burst'),
};

let countdownInterval = null;
let audioAutoplayFailed = false;
let audioRetryTimer = null;
let audioFallbackAttached = false;
let autoplayRetryCount = 0;
let birthdaySequenceStarted = false;
let countdownStartTarget = null;
let previousSecondValue = null;

const bellaCiaoAudio = document.getElementById('bella-ciao-audio');
const birthdayAudio = document.getElementById('birthday-audio');

function makeConfetti() {
  const confettiRoot = document.getElementById('conf');
  const palette = ['#e50914', '#7f070d', '#ffdf8a', '#b77817', '#050505', '#ffffff'];
  const pieces = 42;

  for (let index = 0; index < pieces; index += 1) {
    const piece = document.createElement('div');
    piece.className = 'cp';
    const size = Math.random() * 8 + 5;
    piece.style.cssText = `width:${size}px;height:${size}px;left:${Math.random() * 100}%;background:${palette[Math.floor(Math.random() * palette.length)]};border-radius:${Math.random() > 0.5 ? '50%' : '3px'};animation-duration:${Math.random() * 4 + 3}s;animation-delay:${Math.random() * 5}s;opacity:${Math.random() * 0.5 + 0.5}`;
    confettiRoot.appendChild(piece);
  }
}

function showScreen(screenId) {
  dom.screens.forEach((screen) => screen.classList.remove('active'));
  document.getElementById(screenId).classList.add('active');
}

function setCountdownHeader(text) {
  if (!dom.countdownHeader) return;
  dom.countdownHeader.textContent = text;
  dom.countdownHeader.dataset.text = text;
}

const COUNTDOWN_TARGET = new Date(Date.now() + 5 * 60 * 1000);
const COUNTDOWN_START = Date.now();

function getNextBirthday() {
  return COUNTDOWN_TARGET;
}

function getCountdownStartTarget(target) {
  return COUNTDOWN_START;
}

function pulseCountdownUnit(element) {
  if (!element) return;
  element.classList.remove('pulse');
  void element.offsetWidth;
  element.classList.add('pulse');
}

function setCountdownStage(stageName) {
  if (!dom.countdownBox) return;
  dom.countdownBox.classList.remove('stage-distant', 'stage-soon', 'stage-final');
  dom.countdownBox.classList.add(stageName);
}

function updateCountdownExperience(difference, days, hours, minutes, seconds) {
  const target = getNextBirthday();
  const totalDays = difference / 86400000;
  const totalHours = difference / 3600000;
  const totalMinutes = difference / 60000;

  const totalWindow = Math.max(target.getTime() - COUNTDOWN_START, 1);
  const passed = Math.min(Math.max(Date.now() - COUNTDOWN_START, 0), totalWindow);
  const progress = Math.round((passed / totalWindow) * 100);

  if (dom.countdownProgressFill) {
    dom.countdownProgressFill.style.width = `${progress}%`;
  }

  if (dom.countdownProgressValue) {
    dom.countdownProgressValue.textContent = `${progress}%`;
  }

  let primary = 'Crew on standby';
  let secondary = 'Gold room locked';
  let microcopy = 'Red lights on, crew quiet, birthday surprise locked behind the final door.';
  let stageName = 'stage-distant';

  if (totalDays >= 2) {
    primary = `${days} day${days === 1 ? '' : 's'} until the plan moves`;
    secondary = 'Blueprint still hidden';
    microcopy = 'The vault looks quiet, but every second is part of the plan.';
  } else if (totalHours >= 6) {
    primary = 'Masks ready';
    secondary = `${hours}h ${minutes}m until the door opens`;
    microcopy = 'The red room is glowing. The crew is waiting for the exact second.';
    stageName = 'stage-soon';
  } else if (totalHours >= 1) {
    primary = 'Final phase';
    secondary = `${hours} hour${hours === 1 ? '' : 's'} until the vault run`;
    microcopy = 'The lock is listening. The birthday surprise is almost in reach.';
    stageName = 'stage-soon';
  } else if (totalMinutes >= 10) {
    primary = 'Sirens armed';
    secondary = `${minutes} minutes to the vault`;
    microcopy = 'No sudden moves now. The plan is entering the dangerous part.';
    stageName = 'stage-final';
  } else if (totalMinutes >= 1) {
    primary = 'Last mask check';
    secondary = `${minutes}m ${seconds}s to go`;
    microcopy = 'The crew is at the door. The surprise is seconds away from escape.';
    stageName = 'stage-final';
  } else {
    primary = 'Vault opening';
    secondary = `${seconds} seconds to reveal`;
    microcopy = 'Do not blink. The heist ends with birthday chaos.';
    stageName = 'stage-final';
  }

  setCountdownStage(stageName);

  if (dom.statusChipPrimary) dom.statusChipPrimary.textContent = primary;
  if (dom.statusChipSecondary) dom.statusChipSecondary.textContent = secondary;
  if (dom.countdownMicrocopy) dom.countdownMicrocopy.textContent = microcopy;

  if (previousSecondValue !== null && previousSecondValue !== seconds && totalMinutes < 1) {
    pulseCountdownUnit(dom.countdownSeconds?.parentElement);
  }

  previousSecondValue = seconds;
}

function updateCountdown() {
  const now = new Date();
  const target = getNextBirthday();
  const difference = target - now;

  if (difference <= 0) {
    clearInterval(countdownInterval);
    runBirthdayHypeSequence();
    return;
  }

  const days = Math.floor(difference / 86400000);
  const hours = Math.floor((difference % 86400000) / 3600000);
  const minutes = Math.floor((difference % 3600000) / 60000);
  const seconds = Math.floor((difference % 60000) / 1000);

  dom.countdownDays.textContent = String(days).padStart(2, '0');
  dom.countdownHours.textContent = String(hours).padStart(2, '0');
  dom.countdownMinutes.textContent = String(minutes).padStart(2, '0');
  dom.countdownSeconds.textContent = String(seconds).padStart(2, '0');
  dom.countdownMsg.textContent = getCountdownMood(seconds);
  updateCountdownExperience(difference, days, hours, minutes, seconds);
}

function getCountdownMood(seconds) {
  if (seconds <= 5) {
    return 'Final siren... the birthday vault is opening.';
  }

  const phrases = [
    'The plan is set. Nobody opens the vault early.',
    'The crew is quiet, but the countdown is loud.',
    'Do not peek early. The vault remembers every move.',
    'Red lights. Locked doors. One birthday target.',
    'Every tick sounds like part of the plan.',
  ];
  return phrases[Math.floor(seconds / 12) % phrases.length];
}

function wait(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function triggerMiniConfettiBurst() {
  const confettiRoot = document.getElementById('conf');
  if (!confettiRoot) return;

  const palette = ['#e50914', '#ffdf8a', '#b77817', '#ffffff', '#050505'];
  for (let index = 0; index < 26; index += 1) {
    const piece = document.createElement('div');
    piece.className = 'cp';
    const size = Math.random() * 10 + 6;
    const left = 35 + (Math.random() * 30);
    piece.style.cssText = `width:${size}px;height:${size}px;left:${left}%;top:22%;background:${palette[Math.floor(Math.random() * palette.length)]};border-radius:${Math.random() > 0.5 ? '50%' : '3px'};animation-duration:${Math.random() * 1.8 + 1.8}s;animation-delay:0s;opacity:1`;
    confettiRoot.appendChild(piece);
    window.setTimeout(() => piece.remove(), 2600);
  }
}

async function runBirthdayHypeSequence() {
  if (birthdaySequenceStarted) return;
  birthdaySequenceStarted = true;

  document.body.classList.add('cinematic-maximum');
  dom.countdownDays.textContent = '00';
  dom.countdownHours.textContent = '00';
  dom.countdownMinutes.textContent = '00';
  dom.countdownSeconds.textContent = '00';
  setCountdownHeader('The final door is opening...');
  dom.countdownMsg.textContent = 'Masks on. Final phase engaged.';
  dom.musicWrap.innerHTML = '';

  if (dom.countdownHype) {
    dom.countdownHype.classList.add('active');
    dom.countdownHype.setAttribute('aria-hidden', 'false');
  }

  const sequence = [
    { number: '3', kicker: 'Crew in position', delay: 750 },
    { number: '2', kicker: 'Vault code accepted', delay: 750 },
    { number: '1', kicker: 'Kruthiii heist live', delay: 800 },
  ];

  for (const step of sequence) {
    if (dom.hypeKicker) dom.hypeKicker.textContent = step.kicker;
    if (dom.hypeNumber) {
      dom.hypeNumber.textContent = step.number;
      dom.hypeNumber.style.animation = 'none';
      void dom.hypeNumber.offsetWidth;
      dom.hypeNumber.style.animation = '';
    }
    await wait(step.delay);
  }

  if (dom.hypeKicker) dom.hypeKicker.textContent = 'The plan worked';
  if (dom.hypeNumber) dom.hypeNumber.textContent = '0';
  if (dom.countdownHype) dom.countdownHype.classList.add('burst');
  if (dom.countdownBox) dom.countdownBox.classList.add('party-mode');
  triggerMiniConfettiBurst();
  await wait(1150);

  if (dom.countdownHype) {
    dom.countdownHype.classList.remove('active', 'burst');
    dom.countdownHype.setAttribute('aria-hidden', 'true');
  }
  if (dom.countdownBox) dom.countdownBox.classList.remove('party-mode');
  document.body.classList.remove('cinematic-maximum');

  displayBirthdayReady();
}


function displayBirthdayReady() {
  dom.countdownDays.textContent = '00';
  dom.countdownHours.textContent = '00';
  dom.countdownMinutes.textContent = '00';
  dom.countdownSeconds.textContent = '00';
  setCountdownHeader("The vault is yours.");
  dom.countdownMsg.innerHTML = '<span style="font-size:1.1rem;color:#ffdf8a;font-weight:900">🎂 Happy Birthday Kruthiii!! Open the final reveal. 🎂</span>';
  if (dom.countdownMicrocopy) {
    dom.countdownMicrocopy.textContent = 'The heist is complete. The birthday surprise is waiting inside the vault.';
  }
  if (dom.statusChipPrimary) dom.statusChipPrimary.textContent = 'Plan complete';
  if (dom.statusChipSecondary) dom.statusChipSecondary.textContent = 'Gold room open 🎁';
  if (dom.countdownProgressFill) dom.countdownProgressFill.style.width = '100%';
  if (dom.countdownProgressValue) dom.countdownProgressValue.textContent = '100%';
  dom.musicWrap.innerHTML = '';

  const revealButton = document.createElement('a');
  revealButton.className = 'unlock-btn';
  revealButton.textContent = 'Open the Birthday Vault 🎁';
  revealButton.href = 'surprise.html';
  revealButton.style.display = 'inline-block';
  dom.musicWrap.appendChild(revealButton);
  // Auto-navigate to surprise page shortly after countdown completes
  window.setTimeout(() => {
    // stop countdown music and go to surprise page
    stopBellaCiaoAudio();
    window.location.href = 'surprise.html';
  }, 900);
}


function prepareAudio(audio, volume = 0.82, loop = true) {
  if (!audio) return;
  audio.volume = volume;
  audio.loop = loop;
  audio.autoplay = true;
  audio.preload = 'auto';
  audio.setAttribute('autoplay', '');
  audio.setAttribute('playsinline', '');
}

function prepareBirthdayAudio() {
  prepareAudio(birthdayAudio, 0.82, true);
}

function prepareBellaCiaoAudio() {
  prepareAudio(bellaCiaoAudio, 0.7, true);
}

function syncMusicUi() {
  updateMusicButtonState();
}

function queueAudioRetry() {
  if (audioRetryTimer || autoplayRetryCount >= 10) return;
  audioRetryTimer = window.setTimeout(() => {
    audioRetryTimer = null;
    autoplayRetryCount += 1;
    attemptPlayActiveAudio();
  }, 900);
}

function attemptPlayActiveAudio() {
  if (bellaCiaoAudio && !birthdaySequenceStarted) {
    attemptPlayBellaCiaoAudio();
  }

  if (birthdayAudio) {
    attemptPlayBirthdayAudio();
  }
}

function attemptPlayBirthdayAudio() {
  if (!birthdayAudio) return;

  prepareBirthdayAudio();

  const playPromise = birthdayAudio.play();
  if (playPromise !== undefined) {
    playPromise.then(() => {
      audioAutoplayFailed = false;
      syncMusicUi();
    }).catch(() => {
      audioAutoplayFailed = true;
      syncMusicUi();
      enableAudioFallback();
      queueAudioRetry();
    });
    return;
  }

  syncMusicUi();
}

function enableAudioFallback() {
  if (audioFallbackAttached) return;
  audioFallbackAttached = true;
  const events = ['click', 'touchstart', 'keydown', 'keypress', 'pointerdown', 'pointerup'];
  const playAudioOnce = () => {
    autoplayRetryCount = 0;
    attemptPlayActiveAudio();
    events.forEach(evt => document.removeEventListener(evt, playAudioOnce, true));
    audioFallbackAttached = false;
  };
  events.forEach(evt => document.addEventListener(evt, playAudioOnce, { once: true, capture: true }));
}


function startBellaCiaoAudio() {
  if (!bellaCiaoAudio) return;
  prepareBellaCiaoAudio();
  if (bellaCiaoAudio.paused) {
    bellaCiaoAudio.currentTime = 0;
    const p = bellaCiaoAudio.play();
    if (p && typeof p.catch === 'function') {
      p.catch(() => {
        // autoplay blocked — wait for user interaction
        enableAudioFallback();
        queueAudioRetry();
      });
    }
  }
}

function attemptPlayBellaCiaoAudio() {
  if (!bellaCiaoAudio) return;
  prepareBellaCiaoAudio();
  const playPromise = bellaCiaoAudio.play();
  if (playPromise !== undefined) {
    playPromise.then(() => {
      // OK
    }).catch(() => {
      enableAudioFallback();
      queueAudioRetry();
    });
  }
}

function stopBellaCiaoAudio() {
  if (!bellaCiaoAudio) return;
  bellaCiaoAudio.pause();
  bellaCiaoAudio.currentTime = 0;
}

function startBirthdayAudio() {
  if (!birthdayAudio) return;
  prepareBirthdayAudio();
  if (birthdayAudio.paused) {
    birthdayAudio.currentTime = 0;
    attemptPlayBirthdayAudio();
    return;
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

function updateMusicButtonState() {
  const label = birthdayAudio && !birthdayAudio.paused ? '⏹ Pause music' : '🎵 Play birthday music';
  document.querySelectorAll('.music-btn-inner').forEach((element) => {
    element.textContent = label;
  });
}

function renderMusicButton(containerId) {
  const wrapper = document.getElementById(containerId);
  if (!wrapper) return;

  wrapper.innerHTML = '';
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'music-btn';
  button.innerHTML = `<span class="music-btn-inner">${birthdayAudio && !birthdayAudio.paused ? '⏹ Pause music' : '🎵 Play birthday music'}</span>`;
  button.addEventListener('click', toggleBirthdayAudio);
  wrapper.appendChild(button);
}


function showSurprise() {
  stopBellaCiaoAudio();
  startBirthdayAudio();
  const surpriseScreen = document.getElementById('s-surprise');
  if (surpriseScreen) {
    showScreen('s-surprise');
    renderMusicButton('bday-music-wrap');
  } else {
    // separate page — navigate
    window.location.href = 'surprise.html';
  }
}



function stopBirthdayAudio() {
  if (!birthdayAudio) return;
  birthdayAudio.pause();
  birthdayAudio.currentTime = 0;
}


function showCountdown() {
  startBellaCiaoAudio();
  stopBirthdayAudio();
  showScreen('s-countdown');
  // Remove music button in countdown phase
  if (dom.musicWrap) dom.musicWrap.innerHTML = '';
  updateCountdown();
  countdownInterval = setInterval(updateCountdown, 1000);
}


function initializeApp() {
  makeConfetti();
  prepareBirthdayAudio();
  prepareBellaCiaoAudio();
  showCountdown();
  // try to start Bella Ciao immediately (may be blocked until user interaction)
  attemptPlayBellaCiaoAudio();
  enableAudioFallback();
  queueAudioRetry();
}

window.addEventListener('DOMContentLoaded', initializeApp);
window.addEventListener('pageshow', attemptPlayActiveAudio);
window.addEventListener('focus', attemptPlayActiveAudio);
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    attemptPlayActiveAudio();
  }
});


// Only attach music UI sync events, not auto-play events
if (birthdayAudio) {
  birthdayAudio.addEventListener('play', syncMusicUi);
  birthdayAudio.addEventListener('pause', syncMusicUi);
}
