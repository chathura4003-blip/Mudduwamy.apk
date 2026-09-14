/**
 * Synthesizes a gentle, premium notification chime using the Web Audio API
 * Works across all modern browsers, mobile devices, and Android APKs without external audio files.
 */
export const playNotificationSound = () => {
  try {
    if (typeof window === 'undefined') return;
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    // First tone (Harmonic pleasant chime)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc1.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12); // A5

    gain1.gain.setValueAtTime(0.22, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.55);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);

    osc1.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.55);

    // Second harmonic crystal bell tone
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(1174.66, ctx.currentTime + 0.08); // D6
    gain2.gain.setValueAtTime(0.18, ctx.currentTime + 0.08);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.75);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);

    osc2.start(ctx.currentTime + 0.08);
    osc2.stop(ctx.currentTime + 0.75);

    setTimeout(() => {
      ctx.close().catch(() => {});
    }, 1000);
  } catch (e) {
    // Graceful fallback if audio is blocked
  }
};
