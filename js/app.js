import { WORLDS, STICKERS, letter } from './data.js';
import { store } from './store.js';
import { say, sfx, unlockAudio } from './sound.js';
import { range, sample, confetti, toast } from './util.js';
import * as G from './games.js';

const $app = document.getElementById('app');
let screenId = 0; // bumps on every screen change so old games stop

document.addEventListener('pointerdown', unlockAudio, { capture: true });

function setTheme(name) { document.body.className = `theme-${name}`; }

function render(html, onAct) {
  screenId++;
  $app.innerHTML = html;
  $app.onclick = e => {
    const b = e.target.closest('[data-act]');
    if (!b || !$app.contains(b)) return;
    onAct && onAct(b.dataset.act, b);
  };
  window.scrollTo(0, 0);
}

const starPill = () => `<div class="pill">⭐ <span id="starCount">${store.totalStars()}</span></div>`;
const backBtn = () => `<button class="round-btn press" data-act="back" aria-label="Back">⬅️</button>`;
const starsRow = n => '⭐'.repeat(n) + '☆'.repeat(3 - n);

// ---------- Home ----------
function home() {
  setTheme('home');
  render(`
    <div class="bar"><span class="spacer"></span>${starPill()}</div>
    <div class="home">
      <div class="mascot">🦉</div>
      <h1 class="title">Mohamed's<br>Adventure</h1>
      <p class="subtitle">Let's learn English together!</p>
      <button class="big-btn press" data-act="play">▶️ Play</button>
      <button class="big-btn alt press" data-act="stickers">📒 My Stickers</button>
      <p class="hint">No sound? Switch off silent mode 🔔</p>
    </div>
  `, act => {
    sfx.tap();
    if (act === 'play') { say("Let's go on an adventure!"); map(); }
    if (act === 'stickers') stickerBook();
  });
}

// ---------- World map ----------
function map() {
  setTheme('home');
  render(`
    <div class="bar">${backBtn()}<span class="spacer"></span>${starPill()}</div>
    <h2 class="h2">Pick a world</h2>
    <div class="worlds">
      ${WORLDS.map(w => {
        if (w.soon) return `<button class="world press locked" data-act="soon" data-id="${w.id}" style="background:#fff">
          <span class="em">${w.icon}</span><span>${w.name}<small>🔒 Coming soon</small></span></button>`;
        const got = w.levels.reduce((a, l) => a + store.best(l.id), 0);
        return `<button class="world press" data-act="world" data-id="${w.id}" style="background:${w.color}">
          <span class="em">${w.icon}</span><span>${w.name}<small>${w.desc} · ⭐ ${got}/${w.levels.length * 3}</small></span></button>`;
      }).join('')}
    </div>
  `, (act, b) => {
    sfx.tap();
    if (act === 'back') home();
    if (act === 'soon') say('This world is coming soon!');
    if (act === 'world') {
      const w = WORLDS.find(x => x.id === b.dataset.id);
      say(w.name);
      world(w);
    }
  });
}

// ---------- Levels in a world ----------
function world(w) {
  setTheme(w.theme);
  const firstNew = w.levels.findIndex((l, i) => store.isUnlocked(w, i) && !store.best(l.id));
  render(`
    <div class="bar">${backBtn()}<span class="spacer"></span>${starPill()}</div>
    <h2 class="h2">${w.icon} ${w.name}</h2>
    <div class="path">
      ${w.levels.map((l, i) => {
        const open = store.isUnlocked(w, i);
        return `<div class="node-wrap">
          <button class="node press ${open ? '' : 'locked'} ${i === firstNew ? 'next' : ''}" data-act="level" data-i="${i}">
            ${open ? l.title : '🔒'}</button>
          <div class="node-stars">${open ? starsRow(store.best(l.id)) : ''}</div>
        </div>`;
      }).join('')}
    </div>
  `, (act, b) => {
    if (act === 'back') { sfx.tap(); return map(); }
    if (act !== 'level') return;
    const i = +b.dataset.i;
    if (!store.isUnlocked(w, i)) { sfx.bad(); return say('Finish the level before this one first!'); }
    sfx.tap();
    playLevel(w, i);
  });
}

// ---------- Building a level ----------
function buildSteps(w, level) {
  const steps = [];
  const add = (n, fn) => { for (let k = 0; k < n; k++) steps.push(fn); };
  const big = level.review ? 1 : 0;

  if (w.id === 'beach') {
    const set = level.letters.split('').map(letter);
    if (!level.review) steps.push((s, k) => G.introLetters(s, k, set));
    add(3 + big, (s, k) => G.letterQuestion(s, k, set));
    steps.push((s, k) => G.balloons(s, k, {
      kind: 'letter', items: G.letterItems(set), targets: sample(set, 5 + big).map(x => x.L),
    }));
    add(3 + big, (s, k) => G.letterQuestion(s, k, set));
  } else {
    const nums = range(level.from, level.to);
    if (!level.review) steps.push((s, k) => G.introNumbers(s, k, nums));
    add(2 + big, (s, k) => G.countQuestion(s, k, level.from, level.to));
    steps.push((s, k) => G.balloons(s, k, {
      kind: 'number', items: G.numberItems(nums), targets: sample(nums, 5).map(String),
    }));
    if (level.to <= 10) add(2, (s, k) => G.feedMonkey(s, k, Math.max(2, pickNum(level))));
    else add(2, (s, k) => G.nextNumberQuestion(s, k, level.from, level.to));
    add(2 + big, (s, k) => G.hearNumberQuestion(s, k, level.from, level.to));
  }
  return steps;
}

const pickNum = l => l.from + Math.floor(Math.random() * (l.to - l.from + 1));

async function playLevel(w, i) {
  const level = w.levels[i];
  setTheme(w.theme);
  render(`
    <div class="bar">${backBtn()}<div class="progress"><div id="prog" style="width:0%"></div></div>${starPill()}</div>
    <div class="owlbar"><button class="owl" data-act="owl" aria-label="Say it again">🦉</button><div class="bubble" id="bubble"></div></div>
    <div class="stage" id="stage"></div>
  `, act => {
    if (act === 'back') { sfx.tap(); world(w); }
    if (act === 'owl') say(lastSpeech);
  });

  const me = screenId;
  let mistakes = 0, lastSpeech = '';
  const kit = {
    alive: () => me === screenId,
    miss: () => { mistakes++; },
    owl(text, speech) {
      lastSpeech = speech || text;
      const b = document.getElementById('bubble');
      if (b) b.textContent = text;
      say(lastSpeech);
    },
    // Never resolves once he has left the level, so nothing runs on the wrong screen.
    wait: ms => new Promise(res => setTimeout(() => { if (me === screenId) res(); }, ms)),
  };

  const stage = document.getElementById('stage');
  const prog = document.getElementById('prog');
  const steps = buildSteps(w, level);
  for (let k = 0; k < steps.length; k++) {
    prog.style.width = (k / steps.length * 100) + '%';
    await steps[k](stage, kit);
    if (!kit.alive()) return;
  }
  prog.style.width = '100%';

  const ratio = mistakes / steps.length;
  const stars = ratio <= 0.15 ? 3 : ratio <= 0.5 ? 2 : 1;
  store.saveStars(level.id, stars);
  result(w, i, stars);
}

// ---------- Level complete ----------
function result(w, i, stars) {
  const hasNext = i + 1 < w.levels.length;
  const msg = stars === 3 ? 'Amazing!' : stars === 2 ? 'Great job!' : 'Well done!';
  render(`
    <div class="bar">${backBtn()}<span class="spacer"></span>${starPill()}</div>
    <div class="result">
      <h2>${msg}</h2>
      <div class="result-stars"><span>⭐</span><span>⭐</span><span>⭐</span></div>
      <p class="subtitle" id="giftText">Tap the present! 🎁</p>
      <button class="gift" data-act="gift" id="gift">🎁</button>
      <div class="nav">
        <button class="btn press" data-act="again">🔁 Again</button>
        <button class="btn go press" data-act="${hasNext ? 'next' : 'map'}">${hasNext ? 'Next ▶️' : '🗺️ Map'}</button>
      </div>
    </div>
  `, (act, b) => {
    if (act === 'back') { sfx.tap(); world(w); }
    if (act === 'again') { sfx.tap(); playLevel(w, i); }
    if (act === 'next') { sfx.tap(); playLevel(w, i + 1); }
    if (act === 'map') { sfx.tap(); world(w); }
    if (act === 'gift' && !b.dataset.opened) {
      b.dataset.opened = '1';
      const s = store.newSticker();
      sfx.win();
      confetti(24);
      b.outerHTML = `<div class="sticker-new">${s || '🏆'}</div>`;
      document.getElementById('giftText').textContent = s ? 'A new sticker for your book!' : 'Your sticker book is full! 🏆';
      say(s ? 'Wow! A new sticker!' : 'You have all the stickers! Champion!');
    }
  });

  const me = screenId;
  sfx.win();
  confetti(20);
  say(`${msg} You got ${stars} ${stars === 1 ? 'star' : 'stars'}!`);
  document.querySelectorAll('.result-stars span').forEach((el, k) => {
    if (k < stars) setTimeout(() => { if (me === screenId) { el.classList.add('on'); sfx.star(); } }, 500 + k * 450);
  });
}

// ---------- Sticker book ----------
function stickerBook() {
  setTheme('home');
  const mine = store.stickers();
  render(`
    <div class="bar">${backBtn()}<span class="spacer"></span><div class="pill">📒 ${mine.length}/${STICKERS.length}</div></div>
    <h2 class="h2">My Sticker Book</h2>
    <div class="book">
      ${STICKERS.map(s => mine.includes(s)
        ? `<button class="slot" data-act="sticker">${s}</button>`
        : `<div class="slot empty">?</div>`).join('')}
    </div>
    <p class="hint">Finish levels to win more stickers!</p>
  `, (act, b) => {
    if (act === 'back') { sfx.tap(); home(); }
    if (act === 'sticker') { sfx.pop(); b.classList.remove('bounce'); void b.offsetWidth; b.classList.add('bounce'); }
  });
  say(mine.length ? `You have ${mine.length} stickers!` : 'Play to win stickers!');
}

home();

// Works offline once loaded.
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}

// On an iPhone in Safari, explain once how to install it as an app.
const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
const standalone = navigator.standalone || matchMedia('(display-mode: standalone)').matches;
if (isIOS && !standalone && !store.tipShown()) {
  toast('To install: tap Share ⬆️ then "Add to Home Screen" ➕', 9000);
  store.markTipShown();
}
