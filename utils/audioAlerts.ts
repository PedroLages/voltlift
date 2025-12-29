/**
 * Audio Alerts Utility
 *
 * Generates loud, attention-grabbing sounds for workout events
 * using the Web Audio API for cross-platform compatibility.
 */

/**
 * Play a loud boxing bell sound (real audio file)
 * Uses the actual boxing bell MP3 from /public/sounds/
 * Falls back to synthetic sound if audio file fails to load
 */
export function playBoxingBell(): void {
  try {
    // Try to play the real boxing bell audio file
    const audio = new Audio('/sounds/boxing-bell.mp3');
    audio.volume = 1.0; // Maximum volume

    audio.play().catch((error) => {
      console.warn('Failed to play boxing bell audio file, using fallback:', error);
      playBoxingBellSynthetic();
    });
  } catch (error) {
    console.warn('Failed to initialize boxing bell audio, using fallback:', error);
    playBoxingBellSynthetic();
  }
}

/**
 * Synthetic boxing bell fallback (3-tone bell using Web Audio API)
 * Used if the audio file fails to load
 */
function playBoxingBellSynthetic(): void {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

    // Create 3 bell tones (like a boxing round bell)
    const playBellTone = (frequency: number, startTime: number, duration: number) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.type = 'triangle';
      oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);

      gainNode.gain.setValueAtTime(0, audioContext.currentTime + startTime);
      gainNode.gain.linearRampToValueAtTime(0.8, audioContext.currentTime + startTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + startTime + duration);

      oscillator.start(audioContext.currentTime + startTime);
      oscillator.stop(audioContext.currentTime + startTime + duration);
    };

    // Three bell strikes (DING-DING-DING)
    playBellTone(800, 0, 0.3);
    playBellTone(800, 0.35, 0.3);
    playBellTone(800, 0.7, 0.5);

    setTimeout(() => audioContext.close(), 1500);
  } catch (error) {
    console.warn('Failed to play synthetic boxing bell:', error);
  }
}

/**
 * Play a short beep (for PR celebrations, achievements, etc.)
 */
export function playSuccessBeep(): void {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(1000, audioContext.currentTime);

    gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.2);

    setTimeout(() => audioContext.close(), 300);
  } catch (error) {
    console.warn('Failed to play success beep:', error);
  }
}

/**
 * Play a warning beep (for deload alerts, fatigue warnings, etc.)
 */
export function playWarningBeep(): void {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(400, audioContext.currentTime);

    gainNode.gain.setValueAtTime(0.4, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);

    setTimeout(() => audioContext.close(), 400);
  } catch (error) {
    console.warn('Failed to play warning beep:', error);
  }
}
