// Saves progress on the device. Storage can be unavailable (private mode),
// so every access is guarded and the game still works without it.
import { STICKERS } from './data.js';

const KEY = 'mohamed-adventure-v1';

function read() {
  try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; }
}
const data = Object.assign({
  best: {}, stickers: [], tipShown: false,
  stats: {},     // 'letter:A' -> [right first time, tries]
  play: {},      // 'YYYY-MM-DD' -> seconds played
  limitMin: 0,   // daily limit in minutes, 0 = no limit
  bonus: {},     // 'YYYY-MM-DD' -> extra minutes a parent allowed today
}, read());

const dayKey = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const today = () => dayKey();

function persist() {
  try { localStorage.setItem(KEY, JSON.stringify(data)); } catch {}
}

export const store = {
  totalStars() { return Object.values(data.best).reduce((a, b) => a + b, 0); },
  best(levelId) { return data.best[levelId] || 0; },
  saveStars(levelId, n) {
    if (n > this.best(levelId)) { data.best[levelId] = n; persist(); }
  },
  isUnlocked(world, i) { return i === 0 || this.best(world.levels[i - 1].id) > 0; },
  stickers() { return data.stickers.slice(); },
  // Returns a sticker he doesn't have yet, or null when the book is full.
  newSticker() {
    const left = STICKERS.filter(s => !data.stickers.includes(s));
    if (!left.length) return null;
    const s = left[Math.floor(Math.random() * left.length)];
    data.stickers.push(s);
    persist();
    return s;
  },
  tipShown() { return data.tipShown; },
  markTipShown() { data.tipShown = true; persist(); },

  // ----- What he knows -----
  record(key, right) {
    const st = data.stats[key] || [0, 0];
    st[1]++;
    if (right) st[0]++;
    data.stats[key] = st;
    persist();
  },
  stat(key) { return data.stats[key] || [0, 0]; },
  statKeys(prefix) { return Object.keys(data.stats).filter(k => k.startsWith(prefix + ':')); },

  // ----- Play time -----
  addPlaySeconds(sec) {
    const d = today();
    data.play[d] = (data.play[d] || 0) + sec;
    persist();
  },
  playedToday() { return data.play[today()] || 0; },
  playedLastDays(n) {
    let total = 0;
    for (let i = 0; i < n; i++) {
      total += data.play[dayKey(new Date(Date.now() - i * 86400000))] || 0;
    }
    return total;
  },
  limitMin() { return data.limitMin; },
  setLimit(min) { data.limitMin = min; persist(); },
  addBonus(min) { const d = today(); data.bonus = { [d]: (data.bonus[d] || 0) + min }; persist(); },
  timeUp() {
    if (!data.limitMin) return false;
    return this.playedToday() >= (data.limitMin + (data.bonus[today()] || 0)) * 60;
  },

  resetProgress() {
    Object.assign(data, { best: {}, stickers: [], stats: {}, play: {}, bonus: {} });
    persist();
  },
};
