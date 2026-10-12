// Saves progress on the device. Storage can be unavailable (private mode),
// so every access is guarded and the game still works without it.
import { STICKERS } from './data.js';

const KEY = 'mohamed-adventure-v1';

function read() {
  try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; }
}
const data = Object.assign({ best: {}, stickers: [], tipShown: false }, read());

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
};
