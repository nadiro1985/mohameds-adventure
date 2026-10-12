// Voice (Web Speech API) and little sound effects (Web Audio).

let voice = null;
function pickVoice() {
  if (!('speechSynthesis' in window)) return;
  const vs = speechSynthesis.getVoices();
  voice = vs.find(v => /en-US/i.test(v.lang) && /samantha|karen|moira|google us/i.test(v.name))
       || vs.find(v => /en-US/i.test(v.lang))
       || vs.find(v => /^en/i.test(v.lang))
       || null;
}
if ('speechSynthesis' in window) {
  pickVoice();
  speechSynthesis.addEventListener?.('voiceschanged', pickVoice);
}

export function say(text, { rate = 0.82, pitch = 1.15 } = {}) {
  if (!('speechSynthesis' in window) || !text) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  if (voice) u.voice = voice;
  u.lang = voice ? voice.lang : 'en-US';
  u.rate = rate;
  u.pitch = pitch;
  speechSynthesis.speak(u);
}

let ctx = null;
// iOS only allows audio after a tap, so the first tap anywhere unlocks it.
export function unlockAudio() {
  try {
    ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
  } catch {}
}

function tone(steps, type = 'sine', vol = 0.18) {
  try {
    unlockAudio();
    let t = ctx.currentTime;
    for (const [from, to, dur] of steps) {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = type;
      o.frequency.setValueAtTime(from, t);
      o.frequency.exponentialRampToValueAtTime(to, t + dur);
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      o.connect(g).connect(ctx.destination);
      o.start(t);
      o.stop(t + dur);
      t += dur * 0.85;
    }
  } catch {}
}

export const sfx = {
  tap:   () => tone([[700, 760, 0.06]]),
  good:  () => tone([[523, 523, 0.12], [659, 659, 0.12], [784, 784, 0.24]]),
  bad:   () => tone([[260, 200, 0.22]], 'triangle'),
  pop:   () => tone([[500, 1400, 0.09]], 'triangle', 0.25),
  count: n => tone([[440 + n * 30, 440 + n * 30, 0.08]]),
  win:   () => tone([[523, 523, 0.14], [659, 659, 0.14], [784, 784, 0.14], [1047, 1047, 0.35]]),
  star:  () => tone([[880, 1320, 0.15]]),
};
