// Simple HTML5-based chime player for direct user actions
const AUDIO_PATH = '/sounds/chime.mp3';

export const playUserChime = (isMuted) => {
  if (typeof window === 'undefined') return;
  if (isMuted) return;
  try {
    console.debug('[sound] playUserChime() attempt', { AUDIO_PATH, isMuted });
    const chime = new Audio(AUDIO_PATH);
    try { chime.currentTime = 0; } catch {}
    chime.volume = 0.8;
    const p = chime.play();
    if (p && p.then) {
      p.then(() => console.debug('[sound] chime.play() resolved'))
       .catch((err) => console.warn('[sound] chime.play() rejected', err));
    }
  } catch (e) {
    console.warn('[sound] playUserChime() error', e);
  }
};
