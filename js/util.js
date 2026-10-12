export const shuffle = arr => {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
export const pick = arr => arr[Math.floor(Math.random() * arr.length)];
export const sample = (arr, n) => shuffle(arr).slice(0, n);
export const range = (from, to) => Array.from({ length: to - from + 1 }, (_, i) => from + i);
export const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
export const esc = s => String(s).replace(/[&<>"']/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export function confetti(count = 16) {
  const bits = ['⭐', '🎉', '✨', '🌟', '🎈', '💛'];
  for (let i = 0; i < count; i++) {
    const s = document.createElement('div');
    s.className = 'confetti';
    s.textContent = bits[i % bits.length];
    s.style.left = Math.random() * 100 + 'vw';
    s.style.animationDelay = Math.random() * 0.35 + 's';
    document.body.appendChild(s);
    setTimeout(() => s.remove(), 2100);
  }
}

export function toast(text, ms = 6000) {
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = text;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), ms);
}

// Re-trigger a CSS animation class on an element.
export function flash(el, cls) {
  el.classList.remove(cls);
  void el.offsetWidth;
  el.classList.add(cls);
}
