// Speech recognition for the Talking Tree. iPhones support it in Safari
// (Siri & Dictation must be on), but it can be missing or blocked, so the
// game always has a "tap ✅ when you said it" fallback.
import { NUMBER_WORDS } from './data.js';

const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
let blocked = false; // set when the phone refuses the microphone

export const canListen = () => !!SR && !blocked;

// Resolves with { heard: [transcripts] } or { error: 'no-speech' | 'blocked' | ... }.
export function listen(timeoutMs = 6000) {
  return new Promise(resolve => {
    if (!canListen()) return resolve({ error: 'blocked' });
    let done = false, timer = null;
    const finish = r => { if (!done) { done = true; clearTimeout(timer); resolve(r); } };
    let rec;
    try {
      if ('speechSynthesis' in window) speechSynthesis.cancel(); // don't hear the owl
      rec = new SR();
      rec.lang = 'en-US';
      rec.interimResults = false;
      rec.continuous = false;
      rec.maxAlternatives = 5;
      rec.onresult = e => {
        const heard = [];
        for (const res of e.results) for (const alt of res) heard.push(alt.transcript);
        finish({ heard });
      };
      rec.onerror = e => {
        if (e.error === 'not-allowed' || e.error === 'service-not-allowed') { blocked = true; finish({ error: 'blocked' }); }
        else finish({ error: e.error || 'no-speech' });
      };
      rec.onend = () => finish({ error: 'no-speech' });
      rec.start();
    } catch {
      blocked = true;
      return finish({ error: 'blocked' });
    }
    timer = setTimeout(() => { try { rec.stop(); } catch {} }, timeoutMs);
  });
}

// Words that sound the same, so the phone's spelling doesn't count as wrong.
const SOUNDS_LIKE = {
  eye: ['i', 'aye', 'ai'], two: ['to', 'too'], four: ['for', 'fore'], eight: ['ate'], one: ['won'],
  red: ['read'], blue: ['blew'], no: ['know'], night: ['knight'], bye: ['by', 'buy'],
  pear: ['pair'], hair: ['hare'], sun: ['son'], see: ['sea'], bee: ['be'], ear: ['year', 'here'],
  mom: ['mum', 'mam', 'mommy', 'mummy'], dad: ['daddy'], hello: ['hallo', 'hullo', 'hi'],
};

const normalize = t => ` ${t.toLowerCase()
  .replace(/\d+/g, n => NUMBER_WORDS[+n] || n)
  .replace(/[^a-z\s]/g, ' ')
  .replace(/\s+/g, ' ').trim()} `;

function editDistance(a, b) {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
  }
  return dp[a.length][b.length];
}

// Lenient on purpose: young children's pronunciation is still developing.
export function matches(target, heard) {
  const want = normalize(target).trim();
  const wantWords = want.split(' ');
  const variants = [want, ...wantWords.flatMap(w => (SOUNDS_LIKE[w] || []).map(v => want.replace(w, v)))];
  for (const h of heard) {
    const got = normalize(h);
    if (variants.some(v => got.includes(` ${v} `))) return true;
    // Compare against every run of words the same length as the target.
    const words = got.trim().split(' ');
    for (let i = 0; i + wantWords.length <= words.length; i++) {
      const chunk = words.slice(i, i + wantWords.length).join(' ');
      const allowed = want.length <= 4 ? 1 : 2;
      if (editDistance(chunk, want) <= allowed) return true;
    }
  }
  return false;
}
