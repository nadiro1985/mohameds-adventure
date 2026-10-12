import { WORLDS, STICKERS, WORD_SETS, SAY_SETS, letter } from './data.js';
import { store } from './store.js';
import { say, sfx, unlockAudio, englishVoices, voiceSettings } from './sound.js';
import { range, sample, pick, confetti, toast, esc } from './util.js';
import * as G from './games.js';

const $app = document.getElementById('app');
let screenId = 0; // bumps on every screen change so old games stop
let screenName = '';

document.addEventListener('pointerdown', unlockAudio, { capture: true });

function setTheme(name) { document.body.className = `theme-${name}`; }

function render(html, onAct, name = '') {
  screenId++;
  screenName = name;
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
    <div class="bar"><button class="round-btn press" data-act="settings" aria-label="Parent settings">⚙️</button><span class="spacer"></span>${starPill()}</div>
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
    if (act === 'settings') parentGate(parentCorner);
  });
}

// ---------- Parent settings: voice and speed ----------
function settings() {
  setTheme('home');
  const cur = voiceSettings.current();
  const voices = englishVoices().slice(0, 12);
  const speed = voiceSettings.speed();
  render(`
    <div class="bar">${backBtn()}<span class="spacer"></span></div>
    <h2 class="h2">🔊 Voice Settings</h2>
    <div class="panel">
      <h3>Speaking speed</h3>
      <div class="nav">
        <button class="btn press ${speed === 'slow' ? 'sel' : ''}" data-act="speed" data-s="slow">🐢 Slow</button>
        <button class="btn press ${speed === 'normal' ? 'sel' : ''}" data-act="speed" data-s="normal">🐇 Normal</button>
      </div>
      <h3>Voice</h3>
      <p class="note">Tap a voice to hear it.</p>
      <div class="voices">
        ${voices.length ? voices.map(v => `
          <button class="voice press ${cur && v.voiceURI === cur.voiceURI ? 'sel' : ''}" data-act="voice" data-uri="${esc(v.voiceURI)}">
            <span>${esc(v.name)} <small>${esc(v.lang)}</small></span>
            <span>${voiceSettings.isPremium(v) ? '🌟 Best' : ''} ${cur && v.voiceURI === cur.voiceURI ? '✅' : ''}</span>
          </button>`).join('') : '<p class="note">Loading voices… open this page again in a moment.</p>'}
      </div>
      <div class="tipbox">
        <b>Want a more natural voice?</b><br>
        On the iPhone open <b>Settings → Accessibility → Spoken Content → Voices → English</b>
        and download a voice marked <b>Enhanced</b> or <b>Premium</b> (for example “Ava (Premium)”).
        Then come back here and choose it — it will show 🌟 Best.
      </div>
    </div>
  `, (act, b) => {
    if (act === 'back') { sfx.tap(); return parentCorner(); }
    if (act === 'speed') { voiceSettings.setSpeed(b.dataset.s); say('B is for ball.'); settings(); }
    if (act === 'voice') { voiceSettings.setVoice(b.dataset.uri); say('Hello Mohamed! A is for apple.'); settings(); }
  }, 'settings');
  if (!voices.length && 'speechSynthesis' in window) {
    const me = screenId;
    speechSynthesis.addEventListener('voiceschanged', () => { if (me === screenId) settings(); }, { once: true });
  }
}

// ---------- World map ----------
function map() {
  if (store.timeUp()) return rest();
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

// Count play time while the game is on screen, and stop at the daily limit
// (never in the middle of a level).
const TICK = 15;
setInterval(() => {
  if (document.visibilityState !== 'visible') return;
  store.addPlaySeconds(TICK);
  if (store.timeUp() && !['level', 'rest', 'gate', 'parent', 'settings'].includes(screenName)) rest();
}, TICK * 1000);
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
  if (store.timeUp()) return rest();
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
            ${!open ? '🔒' : l.icon ? `<span class="ni">${l.icon}</span>` : l.title}</button>
          ${l.icon ? `<div class="node-label">${l.title}</div>` : ''}
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
  } else if (w.id === 'farm') {
    const words = sample(WORD_SETS[level.words], 6);
    steps.push((s, k) => G.introWords(s, k, words));
    add(3, (s, k) => G.wordQuestion(s, k, words, 'listen'));
    steps.push((s, k) => G.balloons(s, k, {
      kind: '', items: G.wordItems(words, { colors: level.words === 'colors' }), targets: sample(words, 5).map(x => x[0]),
    }));
    steps.push((s, k) => G.memoryMatch(s, k, words));
    if (level.words === 'colors') add(2, (s, k) => G.colorQuestion(s, k));
    add(2, (s, k) => G.wordQuestion(s, k, words, 'read'));
  } else if (w.id === 'castle') {
    steps.push((s, k) => G.introWords(s, k, level.spell, { spell: true }));
    add(3, (s, k) => G.missingLetter(s, k, pick(level.spell)));
    for (const word of sample(level.spell, 4)) steps.push((s, k) => G.spellWord(s, k, word));
  } else if (w.id === 'tree') {
    const tree = { apples: 0 };
    const nouns = level.say === 'animals';
    for (const word of sample(WORD_SETS[level.say] || SAY_SETS[level.say], 5)) {
      steps.push((s, k) => G.talkWord(s, k, word, tree, { nouns }));
    }
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
  if (store.timeUp()) return rest();
  const level = w.levels[i];
  setTheme(w.theme);
  render(`
    <div class="bar">${backBtn()}<div class="progress"><div id="prog" style="width:0%"></div></div>${starPill()}</div>
    <div class="owlbar"><button class="owl" data-act="owl" aria-label="Say it again">🦉</button><div class="bubble" id="bubble"></div></div>
    <div class="stage" id="stage"></div>
  `, act => {
    if (act === 'back') { sfx.tap(); world(w); }
    if (act === 'owl') say(lastSpeech);
  }, 'level');

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

// ---------- Time to rest (daily limit reached) ----------
function rest() {
  setTheme('home');
  render(`
    <div class="bar"><button class="round-btn press" data-act="parents" aria-label="Grown-ups">⚙️</button><span class="spacer"></span>${starPill()}</div>
    <div class="home">
      <div class="sleep">😴🦉</div>
      <h1 class="title">Time to rest!</h1>
      <p class="subtitle">Great playing today, Mohamed!<br>Let's play again tomorrow. 🌙</p>
      <button class="big-btn alt press" data-act="stickers">📒 My Stickers</button>
    </div>
  `, act => {
    sfx.tap();
    if (act === 'parents') parentGate(parentCorner);
    if (act === 'stickers') stickerBook();
  }, 'rest');
  say('Great playing today, Mohamed! The owl is sleepy now. Let’s play again tomorrow!');
}

// ---------- Grown-up check before the parent corner ----------
function parentGate(next) {
  setTheme('home');
  const a = 5 + Math.floor(Math.random() * 5), b = 4 + Math.floor(Math.random() * 6);
  let typed = '';
  render(`
    <div class="bar">${backBtn()}<span class="spacer"></span></div>
    <h2 class="h2">Grown-ups only 🔒</h2>
    <div class="stage" style="justify-content:flex-start">
      <p class="subtitle" style="color:#fff;font-size:24px;margin:0">What is ${a} + ${b}?</p>
      <div class="answer-box" id="ans"></div>
      <div class="keypad">
        ${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => `<button class="btn press" data-act="key" data-n="${n}">${n}</button>`).join('')}
        <button class="btn press" data-act="del">⌫</button>
        <button class="btn press" data-act="key" data-n="0">0</button>
        <button class="btn go press" data-act="ok">✓</button>
      </div>
    </div>
  `, (act, btn) => {
    const box = document.getElementById('ans');
    if (act === 'back') { sfx.tap(); return home(); }
    if (act === 'key' && typed.length < 3) { sfx.tap(); typed += btn.dataset.n; }
    if (act === 'del') typed = typed.slice(0, -1);
    if (act === 'ok') {
      if (+typed === a + b) return next();
      sfx.bad();
      return parentGate(next);
    }
    box.textContent = typed;
  }, 'gate');
}

// ---------- Parent corner: what he knows, play time, settings ----------
function level3(key) {
  const [right, tries] = store.stat(key);
  if (!tries) return '';
  const acc = right / tries;
  if (tries >= 2 && acc >= 0.75) return 'good';
  if (tries >= 2 && acc < 0.5) return 'hard';
  return 'mid';
}

function wordSummary() {
  const agg = {};
  for (const prefix of ['word', 'spell', 'say']) {
    for (const k of store.statKeys(prefix)) {
      const w = k.slice(prefix.length + 1);
      const [r, t] = store.stat(k);
      agg[w] = [(agg[w]?.[0] || 0) + r, (agg[w]?.[1] || 0) + t];
    }
  }
  const all = Object.entries(agg).map(([w, [r, t]]) => ({ w, r, t, acc: r / t }));
  return {
    known: all.filter(x => x.t >= 2 && x.acc >= 0.75).sort((a, b) => b.r - a.r),
    practice: all.filter(x => x.t >= 2 && x.acc < 0.5).sort((a, b) => a.acc - b.acc),
  };
}

const mins = sec => Math.round(sec / 60);

function parentCorner(confirmReset = false) {
  setTheme('home');
  const words = wordSummary();
  const limit = store.limitMin();
  const levelsDone = WORLDS.filter(w => w.levels).reduce((a, w) => a + w.levels.filter(l => store.best(l.id)).length, 0);
  const levelsAll = WORLDS.filter(w => w.levels).reduce((a, w) => a + w.levels.length, 0);
  const grid = (items, prefix) => `<div class="grid-know">${items.map(x =>
    `<div class="know ${level3(`${prefix}:${x}`)}">${x}</div>`).join('')}</div>`;
  const chips = (list, cls) => list.length
    ? `<div class="chips">${list.slice(0, 15).map(x => `<span class="chip ${cls}">${esc(x.w)}</span>`).join('')}</div>`
    : '<p class="note">Nothing yet — keep playing!</p>';

  render(`
    <div class="bar">${backBtn()}<span class="spacer"></span></div>
    <h2 class="h2">👨‍👩‍👦 Parent Corner</h2>
    <div class="panel">
      <div class="stat-row">
        <div class="stat"><b>⭐ ${store.totalStars()}</b><small>stars</small></div>
        <div class="stat"><b>${levelsDone}/${levelsAll}</b><small>levels done</small></div>
        <div class="stat"><b>📒 ${store.stickers().length}</b><small>stickers</small></div>
      </div>
      <div class="stat-row">
        <div class="stat"><b>${mins(store.playedToday())}</b><small>minutes today</small></div>
        <div class="stat"><b>${mins(store.playedLastDays(7))}</b><small>minutes this week</small></div>
        <div class="stat"><b>${words.known.length}</b><small>words known</small></div>
      </div>

      <h3>Worlds</h3>
      ${WORLDS.filter(w => w.levels).map(w => {
        const got = w.levels.reduce((a, l) => a + store.best(l.id), 0), max = w.levels.length * 3;
        return `<div class="wbar"><span style="width:28px">${w.icon}</span><div class="progress"><div style="width:${got / max * 100}%"></div></div><span>${got}/${max}</span></div>`;
      }).join('')}

      <h3>Letters</h3>
      ${grid('ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''), 'letter')}
      <div class="legend"><span style="--c:#b2f2bb">knows it</span><span style="--c:#ffec99">learning</span><span style="--c:#ffc9c9">finds it hard</span><span style="--c:#f1f3f5">not yet</span></div>

      <h3>Numbers</h3>
      ${grid(range(1, 20), 'number')}

      <h3>Words to practice</h3>
      ${chips(words.practice, '')}
      <h3>Words he knows</h3>
      ${chips(words.known, 'ok')}

      <h3>Daily play time</h3>
      <div class="chips">
        ${[0, 15, 20, 30, 45].map(m => `<button class="btn press ${limit === m ? 'sel' : ''}" style="flex:none;padding:10px 14px;font-size:18px" data-act="limit" data-m="${m}">${m ? m + ' min' : 'No limit'}</button>`).join('')}
      </div>
      ${store.timeUp() ? '<button class="btn go press" data-act="bonus" style="width:100%;margin-bottom:12px">➕ 10 more minutes today</button>' : ''}

      <h3>Voice</h3>
      <button class="btn press" data-act="voice" style="width:100%;margin-bottom:12px">🔊 Voice and speed</button>

      <button class="btn press danger" data-act="reset" style="width:100%">${confirmReset ? '⚠️ Tap again to erase everything' : '🗑️ Reset progress'}</button>
    </div>
  `, (act, b) => {
    sfx.tap();
    if (act === 'back') home();
    if (act === 'limit') { store.setLimit(+b.dataset.m); parentCorner(); }
    if (act === 'bonus') { store.addBonus(10); home(); }
    if (act === 'voice') settings();
    if (act === 'reset') {
      if (!confirmReset) return parentCorner(true);
      store.resetProgress();
      toast('Progress erased.', 3000);
      home();
    }
  }, 'parent');
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
