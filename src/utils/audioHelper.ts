/**
 * Audio and Web Notification Helper
 * Provides synthesized chimes using Web Audio API and manages native browser notifications.
 */

export const playMessageChime = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    
    const audioCtx = new AudioContextClass();
    
    // Double beep chime (Soft, modern, high-end)
    const osc1 = audioCtx.createOscillator();
    const gain1 = audioCtx.createGain();
    
    osc1.type = 'sine';
    // Frequency: A5 (880Hz) to C#6 (1109Hz)
    osc1.frequency.setValueAtTime(880, audioCtx.currentTime);
    osc1.frequency.exponentialRampToValueAtTime(1109, audioCtx.currentTime + 0.12);
    
    gain1.gain.setValueAtTime(0.08, audioCtx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.25);
    
    osc1.connect(gain1);
    gain1.connect(audioCtx.destination);
    
    osc1.start();
    osc1.stop(audioCtx.currentTime + 0.25);
  } catch (err) {
    console.warn("Chime play error:", err);
  }
};

export const playAnnouncementChime = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    
    const audioCtx = new AudioContextClass();
    
    // Upbeat energetic double chime for announcements
    // Note 1: E5 (659.25Hz)
    const osc1 = audioCtx.createOscillator();
    const gain1 = audioCtx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(659.25, audioCtx.currentTime);
    gain1.gain.setValueAtTime(0.06, audioCtx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
    osc1.connect(gain1);
    gain1.connect(audioCtx.destination);
    osc1.start();
    osc1.stop(audioCtx.currentTime + 0.15);
    
    // Note 2: A5 (880Hz) with delay
    setTimeout(() => {
      try {
        const osc2 = audioCtx.createOscillator();
        const gain2 = audioCtx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(880, audioCtx.currentTime);
        gain2.gain.setValueAtTime(0.08, audioCtx.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
        osc2.connect(gain2);
        gain2.connect(audioCtx.destination);
        osc2.start();
        osc2.stop(audioCtx.currentTime + 0.3);
      } catch (e) {}
    }, 100);
  } catch (err) {
    console.warn("Announcement chime error:", err);
  }
};

export const triggerPhoneNotification = (title: string, body: string) => {
  // Vibrate phone if supported
  if ('vibrate' in navigator) {
    try {
      navigator.vibrate([120, 80, 120]);
    } catch (e) {}
  }
  
  if (!('Notification' in window)) return;
  
  if (Notification.permission === 'granted') {
    const options = {
      body: body,
      icon: '/logo.png', // High-res club logo for the push alert!
      badge: '/logo.png', // Badge icon for mobile status bars
      tag: 'mrc-notification-' + Date.now(),
      vibrate: [120, 80, 120],
      requireInteraction: false
    };

    // Try showing using the Service Worker (the ONLY reliable way on Android Chrome & iOS Safari!)
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready
        .then((registration) => {
          registration.showNotification(title, options);
        })
        .catch((err) => {
          console.warn("Service worker not ready, falling back to standard notification:", err);
          try {
            new Notification(title, options);
          } catch (e) {
            console.error("Standard Notification constructor failed:", e);
          }
        });
    } else {
      try {
        new Notification(title, options);
      } catch (e) {
        console.error("Standard Notification constructor failed:", e);
      }
    }
  }
};
