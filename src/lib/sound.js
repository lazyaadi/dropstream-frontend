// Lightweight global audio manager for notification chimes
const AUDIO_PATH = '/sounds/chime.mp3';

const chimeAudio = (typeof window !== 'undefined') ? new Audio(AUDIO_PATH) : null;
if (chimeAudio) chimeAudio.preload = 'auto';

let isAudioUnlocked = false;

export const initAudioUnlocker = () => {
  if (typeof window === 'undefined') return;
  if (isAudioUnlocked) return;

  const unlock = () => {
    if (isAudioUnlocked) return;
    if (!chimeAudio) return;

    try {
      // Try to play & immediately pause to register a user gesture
      chimeAudio.currentTime = 0;
      const p = chimeAudio.play();
      if (p && p.then) {
        p.then(() => {
          try { chimeAudio.pause(); chimeAudio.currentTime = 0; } catch {}
          isAudioUnlocked = true;
        }).catch(() => { /* ignore */ });
      } else {
        try { chimeAudio.pause(); chimeAudio.currentTime = 0; } catch {}
        isAudioUnlocked = true;
      }
    } catch (err) {
      // ignore
    }

    ['click', 'touchstart', 'keydown'].forEach(ev => window.removeEventListener(ev, unlock));
  };

  ['click', 'touchstart', 'keydown'].forEach(ev => window.addEventListener(ev, unlock, { once: true }));
};

function playWebAudioOscillator() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    if (ctx.state === 'suspended') {
      try { ctx.resume(); } catch {}
    }
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.2);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.2);
  } catch (e) {
    // swallow
  }
}

export const playNotificationChime = () => {
  if (typeof window === 'undefined') return;
  try {
    if (chimeAudio) {
      try { chimeAudio.currentTime = 0; } catch {}
      chimeAudio.volume = 0.8;
      const p = chimeAudio.play();
      if (p && p.then) {
        p.catch(() => {
          playWebAudioOscillator();
        });
      }
      return;
    }
  } catch (err) {
    // fall through
  }
  playWebAudioOscillator();
};
