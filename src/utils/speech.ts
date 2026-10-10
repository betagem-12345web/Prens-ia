// Web Speech & Audio Utilities for PRENS IA

export function playAudioChime(type: 'send' | 'receive' | 'click' = 'click') {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;

    if (type === 'send') {
      // Ascending futuristic chime
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.12);
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.12);
      osc.start(now);
      osc.stop(now + 0.12);
    } else if (type === 'receive') {
      // Soft gentle dual tone
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.setValueAtTime(880, now + 0.08); // A5
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
    } else {
      // Subtle click
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, now);
      gain.gain.setValueAtTime(0.02, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.04);
      osc.start(now);
      osc.stop(now + 0.04);
    }
  } catch {
    // Graceful silence if audio context is blocked
  }
}

// Text to speech in Spanish
export function speakSpanish(text: string, onEnd?: () => void) {
  if (!('speechSynthesis' in window)) return;

  // Clean markdown tags for natural speech
  const cleanText = text
    .replace(/```[\s\S]*?```/g, 'bloque de código omitido')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/[*_#\[\]\(\)]/g, '')
    .trim();

  window.speechSynthesis.cancel(); // Stop any ongoing speech

  const utterance = new SpeechSynthesisUtterance(cleanText);
  utterance.lang = 'es-ES';
  utterance.rate = 1.05;
  utterance.pitch = 1.0;

  // Pick best available Spanish voice
  const voices = window.speechSynthesis.getVoices();
  const esVoice =
    voices.find((v) => v.lang.startsWith('es-') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Premium'))) ||
    voices.find((v) => v.lang.startsWith('es'));

  if (esVoice) {
    utterance.voice = esVoice;
  }

  if (onEnd) {
    utterance.onend = onEnd;
    utterance.onerror = onEnd;
  }

  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking() {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

// Browser speech recognition (Speech-to-text)
export function createSpeechRecognizer(
  onResult: (text: string) => void,
  onError: (err: any) => void,
  onEnd: () => void
) {
  const SpeechRecognitionClass =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

  if (!SpeechRecognitionClass) {
    return null;
  }

  const recognition = new SpeechRecognitionClass();
  recognition.lang = 'es-ES';
  recognition.continuous = false;
  recognition.interimResults = true;

  recognition.onresult = (event: any) => {
    let transcript = '';
    for (let i = event.resultIndex; i < event.results.length; i++) {
      transcript += event.results[i][0].transcript;
    }
    onResult(transcript);
  };

  recognition.onerror = (e: any) => {
    onError(e);
  };

  recognition.onend = () => {
    onEnd();
  };

  return recognition;
}
