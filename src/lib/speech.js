// KidZonics speech helpers — browser speech synthesis for letter/word audio.

let currentUtterance = null;

export function speechAvailable() {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export function speak(text, { rate = 0.82, pitch = 1.1, onEnd } = {}) {
  if (!speechAvailable() || !text) {
    if (onEnd) onEnd();
    return;
  }
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = rate;
  utterance.pitch = pitch;
  utterance.lang = "en-US";
  const voices = window.speechSynthesis.getVoices();
  const english = voices.find((v) => /en-(US|GB)/i.test(v.lang) && /female|samantha|zira|google/i.test(v.name)) ||
    voices.find((v) => /en/i.test(v.lang));
  if (english) utterance.voice = english;
  utterance.onend = () => {
    currentUtterance = null;
    if (onEnd) onEnd();
  };
  currentUtterance = utterance;
  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking() {
  if (speechAvailable()) window.speechSynthesis.cancel();
  currentUtterance = null;
}

export function isSpeaking() {
  return Boolean(currentUtterance);
}
