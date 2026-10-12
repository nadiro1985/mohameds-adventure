// Voice (Web Speech API) and little sound effects (Web Audio).

const VOICE_KEY = 'mohamed-adventure-voice';
const SPEEDS = { slow: 0.7, normal: 0.85 };

function loadPrefs() {
  try { return JSON.parse(localStorage.getItem(VOICE_KEY)) || {}; } catch { return {}; }
}
const prefs = Object.assign({ voiceURI: null, speed: 'slow' }, loadPrefs());
function savePrefs() {
  try { localStorage.setItem(VOICE_KEY, JSON.stringify(prefs)); } catch {}
}

// iPhones ship joke voices (robots, whispers, singing) that sound awful for
// learning, so they are never used.
const NOVELTY = /albert|bad news|bahh|bells|boing|bubbles|cellos|good news|jester|organ|superstar|trinoids|whisper|wobble|zarvox|fred|junior|ralph|kathy|grandma|grandpa|eddy|flo|reed|rocko|sandy|shelley/i;
const NICE = /ava|allison|samantha|susan|zoe|nicky|evan|nathan|joelle|noelle|karen|daniel|serena|moira|tessa|kate|google us english/i;

function quality(v) {
  const id = `${v.name} ${v.voiceURI}`;
  let s = 0;
  if (/premium/i.test(id)) s += 4;
  if (/enhanced|neural|natural/i.test(id)) s += 3;
  if (NICE.test(v.name)) s += 2;
  if (/en[-_]US/i.test(v.lang)) s += 1;
  if (v.localService) s += 0.5;
  return s;
}

export function englishVoices() {
  if (!('speechSynthesis' in window)) return [];
  return speechSynthesis.getVoices()
    .filter(v => /^en/i.test(v.lang) && !NOVELTY.test(v.name))
    .sort((a, b) => quality(b) - quality(a));
}

let voice = null;
function pickVoice() {
  const list = englishVoices();
  voice = list.find(v => v.voiceURI === prefs.voiceURI) || list[0] || null;
}
if ('speechSynthesis' in window) {
  pickVoice();
  speechSynthesis.addEventListener?.('voiceschanged', pickVoice);
}

export const voiceSettings = {
  current: () => voice,
  speed: () => prefs.speed,
  setVoice(uri) { prefs.voiceURI = uri; savePrefs(); pickVoice(); },
  setSpeed(s) { if (SPEEDS[s]) { prefs.speed = s; savePrefs(); } },
  isPremium: v => /premium|enhanced|neural|natural/i.test(`${v.name} ${v.voiceURI}`),
};

export function say(text) {
  if (!('speechSynthesis' in window) || !text) return;
  if (!voice) pickVoice();
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    if (voice) u.voice = voice;
    u.lang = voice ? voice.lang : 'en-US';
    u.rate = SPEEDS[prefs.speed] || SPEEDS.slow;
    u.pitch = 1;
    speechSynthesis.speak(u);
  } catch {} // a voice problem must never stop the game
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
