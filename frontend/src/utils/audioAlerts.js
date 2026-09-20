// Web Audio API Trading Sound Synthesizer
// Clean, low-latency institutional chimes without external audio assets

let audioCtx = null;

function getAudioContext() {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Play a tone with frequency, type, duration, and gain ramp
 */
function playTone(freq, type = 'sine', duration = 0.18, startTime = 0, gainLevel = 0.15) {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime + startTime);

    gainNode.gain.setValueAtTime(gainLevel, ctx.currentTime + startTime);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + startTime + duration);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start(ctx.currentTime + startTime);
    osc.stop(ctx.currentTime + startTime + duration);
  } catch (err) {
    console.warn('Audio play error:', err);
  }
}

/**
 * Upward harmonic chime for bullish trigger or profit take
 */
export function playBullishChime() {
  playTone(523.25, 'triangle', 0.15, 0, 0.18);      // C5
  playTone(659.25, 'triangle', 0.15, 0.08, 0.18);   // E5
  playTone(783.99, 'sine', 0.35, 0.16, 0.22);       // G5
  playTone(1046.50, 'sine', 0.45, 0.24, 0.15);      // C6
}

/**
 * Downward tone for bearish trigger
 */
export function playBearishChime() {
  playTone(783.99, 'triangle', 0.15, 0, 0.18);      // G5
  playTone(659.25, 'triangle', 0.15, 0.08, 0.18);   // E5
  playTone(523.25, 'sine', 0.35, 0.16, 0.22);       // C5
}

/**
 * High-precision double tick for order execution or TP hit
 */
export function playOrderFilledChime() {
  playTone(880.0, 'sine', 0.08, 0, 0.2);            // A5
  playTone(1318.5, 'sine', 0.25, 0.06, 0.22);       // E6
}

/**
 * Subtle caution tone for Stop Loss or limit breaches
 */
export function playAlertWarningChime() {
  playTone(440.0, 'sawtooth', 0.12, 0, 0.12);       // A4
  playTone(370.0, 'sawtooth', 0.25, 0.12, 0.14);    // F#4
}
