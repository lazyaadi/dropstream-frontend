// Simple HTML5-based chime player for direct user actions
const AUDIO_PATH = '/sounds/chime.mp3';

export const playUserChime = (isMuted) => {
  if (typeof window === 'undefined') return;
  if (isMuted) return;
  try {
    const chime = new Audio(AUDIO_PATH);
    try { chime.currentTime = 0; } catch {}
    chime.volume = 0.8;
    chime.play().catch(() => {});
  } catch (e) {
    // swallow playback errors
  }
};
