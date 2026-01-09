// Variable to track the loop interval
let loopInterval: any = null;
let currentAudio: HTMLAudioElement | null = null;

export const startNotificationLoop = (type: 'incoming' | 'calling') => {
  // Stop any existing loop first
  stopNotificationLoop();

  // Determine sound file based on type
  // Default to 'notification.mp3' if type is incoming (backward compatibility for user's uploaded file)
  // or encourage them to rename.
  // Let's use specific names to be clear.
  const src = type === 'incoming' ? '/notification_in.mp3' : '/notification_call.mp3';
  
  currentAudio = new Audio(src);

  const play = () => {
     if(!currentAudio) return;
     currentAudio.currentTime = 0;
     currentAudio.play().catch(e => {
         console.warn("Audio play failed, falling back to beep", e);
         playFallbackBeep();
     });
  };

  // Play immediately
  play();
  
  // Loop every 3 seconds (slightly slower for distinctness)
  loopInterval = setInterval(play, 3000);
};

export const stopNotificationLoop = () => {
  if (loopInterval) {
    clearInterval(loopInterval);
    loopInterval = null;
  }
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null; // Release
  }
};

// Fallback beep generator
const playFallbackBeep = () => {
    try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContext) return;
    
        const ctx = new AudioContext();
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
    
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
    
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(800, ctx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.1);
        
        gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.3);
    } catch(e) {
        console.error(e);
    }
};
