// Mini-games. Each one draws into `stage` and returns a Promise that
// resolves when the child has finished it. `kit` gives access to the owl
// helper, mistake counting and an `alive()` check (false once he leaves).
import { LETTERS, NUMBER_WORDS, COUNT_THINGS, COLOR_THINGS, WORD_SETS, PRAISE, TRY_AGAIN, letter } from './data.js';
import { say, sfx } from './sound.js';
import { shuffle, pick, sample, range, cap, esc, confetti, flash } from './util.js';

const BALLOON_COLORS = ['#ff6b6b', '#4dabf7', '#51cf66', '#fcc419', '#cc5de8', '#ff922b', '#20c997', '#f06595'];

// ---------- Shared: one multiple-choice question ----------
function ask(stage, kit, { show = '', owlText, speech, options, answer, nameOf, onExtra }) {
  stage.innerHTML = `
    ${show ? `<div class="question" data-act="repeat">${show}</div>`
           : `<button class="speak press" data-act="repeat" aria-label="Hear it again">🔊</button>`}
    <div class="choices">
      ${options.map(o => `<button class="choice press" data-k="${esc(o.key)}">${o.html}</button>`).join('')}
    </div>`;
  kit.owl(owlText, speech);
  return new Promise(resolve => {
    let done = false;
    stage.onclick = e => {
      const extra = e.target.closest('[data-extra]');
      if (extra && onExtra) return onExtra(extra);
      if (e.target.closest('[data-act="repeat"]')) return say(speech);
      const b = e.target.closest('.choice');
      if (!b || done) return;
      if (b.dataset.k === String(answer)) {
        done = true;
        b.classList.add('right');
        sfx.good();
        confetti(10);
        say(`${pick(PRAISE)} ${nameOf(answer)}!`);
        kit.wait(1400).then(resolve);
      } else {
        kit.miss();
        flash(b, 'wrong');
        sfx.bad();
        say(`That's ${nameOf(b.dataset.k)}. ${pick(TRY_AGAIN)}`);
      }
    };
  });
}

// ---------- Letters ----------
const letterName = L => letter(L.toUpperCase()).name;

export function introLetters(stage, kit, letters) {
  return new Promise(resolve => {
    let i = 0;
    const show = () => {
      const x = letters[i];
      const word = cap(x.word);
      stage.innerHTML = `
        <button class="card press" data-act="repeat">
          <div class="glyph">${x.L}<span class="lo">${x.L.toLowerCase()}</span></div>
          <div class="pic">${x.pic}</div>
          <div class="word"><b>${esc(word[0])}</b>${esc(word.slice(1))}</div>
        </button>
        <div class="nav">
          <button class="btn press" data-act="prev" ${i === 0 ? 'style="visibility:hidden"' : ''}>⬅️</button>
          <button class="btn go press" data-act="next">${i === letters.length - 1 ? "Let's play! ▶️" : '➡️'}</button>
        </div>`;
      kit.owl(`${x.L} is for ${word}`, `${x.name} is for ${x.word}.`);
    };
    stage.onclick = e => {
      const b = e.target.closest('[data-act]');
      if (!b) return;
      const x = letters[i];
      if (b.dataset.act === 'repeat') say(`${x.name} is for ${x.word}.`);
      if (b.dataset.act === 'prev' && i > 0) { sfx.tap(); i--; show(); }
      if (b.dataset.act === 'next') {
        sfx.tap();
        if (i < letters.length - 1) { i++; show(); } else resolve();
      }
    };
    show();
  });
}

// One random letter question. `set` is the level's letters.
export function letterQuestion(stage, kit, set) {
  const target = pick(set);
  const others = n => {
    const pool = set.length > n ? set : LETTERS;
    return sample(pool.filter(x => x.L !== target.L), n);
  };
  const kind = pick(['hear', 'starts', 'small', 'picture']);
  const name = target.name;

  if (kind === 'hear') {
    const opts = shuffle([target, ...others(2)]);
    return ask(stage, kit, {
      owlText: `Find the letter ${target.L}`, speech: `Find the letter ${name}.`,
      options: opts.map(x => ({ key: x.L, html: x.L })), answer: target.L, nameOf: letterName,
    });
  }
  if (kind === 'starts') {
    const opts = shuffle([target, ...others(2)]);
    return ask(stage, kit, {
      show: `<div class="q-pic">${target.pic}</div><div class="q-word">${esc(cap(target.word))}</div>`,
      owlText: `${cap(target.word)} starts with…?`, speech: `${target.word}. Which letter does ${target.word} start with?`,
      options: opts.map(x => ({ key: x.L, html: x.L })), answer: target.L, nameOf: letterName,
    });
  }
  if (kind === 'small') {
    const opts = shuffle([target, ...others(2)]);
    return ask(stage, kit, {
      show: `<div class="q-big">${target.L}</div>`,
      owlText: `Find the small ${target.L}`, speech: `Find the small letter ${name}.`,
      options: opts.map(x => ({ key: x.L.toLowerCase(), html: x.L.toLowerCase() })),
      answer: target.L.toLowerCase(), nameOf: l => `small ${letterName(l)}`,
    });
  }
  // picture: which picture starts with this letter?
  const opts = shuffle([target, ...others(2)]);
  return ask(stage, kit, {
    show: `<div class="q-big">${target.L}<span style="color:#1c7ed6">${target.L.toLowerCase()}</span></div>`,
    owlText: `What starts with ${target.L}?`, speech: `Which picture starts with ${name}?`,
    options: opts.map(x => ({ key: x.L, html: x.pic })), answer: target.L,
    nameOf: L => letter(L).word,
  });
}

// ---------- Numbers ----------
const numName = n => NUMBER_WORDS[+n];
const thingsHTML = (n, emoji) =>
  `<div class="things">${Array.from({ length: n }, () =>
    `<button class="thing" data-extra="thing">${emoji}</button>`).join('')}</div>`;

// Tapping things counts them out loud and puts a number badge on each one.
function countAlong() {
  let counted = 0;
  return btn => {
    if (btn.classList.contains('counted')) return;
    counted++;
    btn.classList.add('counted');
    btn.insertAdjacentHTML('beforeend', `<span class="badge">${counted}</span>`);
    sfx.count(counted);
    say(numName(counted));
  };
}

function nearby(n, from, to, count) {
  const lo = Math.max(1, Math.min(from, n - 3));
  const hi = Math.max(to, n + 3);
  return sample(range(lo, hi).filter(x => x !== n), count);
}

export function introNumbers(stage, kit, nums) {
  return new Promise(resolve => {
    let i = 0, tapper;
    const show = () => {
      const n = nums[i];
      const [emoji] = COUNT_THINGS[i % COUNT_THINGS.length];
      tapper = countAlong();
      stage.innerHTML = `
        <div class="card">
          <button class="glyph" data-act="repeat" style="background:none;color:#f76707">${n}</button>
          <div class="word">${numName(n)}</div>
        </div>
        ${thingsHTML(n, emoji)}
        <div class="nav">
          <button class="btn press" data-act="prev" ${i === 0 ? 'style="visibility:hidden"' : ''}>⬅️</button>
          <button class="btn go press" data-act="next">${i === nums.length - 1 ? "Let's play! ▶️" : '➡️'}</button>
        </div>`;
      kit.owl(`${n} — ${numName(n)}. Tap to count!`, `This is ${numName(n)}. Tap to count!`);
    };
    stage.onclick = e => {
      const t = e.target.closest('[data-extra="thing"]');
      if (t) return tapper(t);
      const b = e.target.closest('[data-act]');
      if (!b) return;
      if (b.dataset.act === 'repeat') say(numName(nums[i]));
      if (b.dataset.act === 'prev' && i > 0) { sfx.tap(); i--; show(); }
      if (b.dataset.act === 'next') {
        sfx.tap();
        if (i < nums.length - 1) { i++; show(); } else resolve();
      }
    };
    show();
  });
}

export function countQuestion(stage, kit, from, to) {
  const n = pick(range(from, to));
  const [emoji, plural] = pick(COUNT_THINGS);
  const opts = shuffle([n, ...nearby(n, from, to, 2)]);
  return ask(stage, kit, {
    show: thingsHTML(n, emoji),
    owlText: `How many ${plural}? Tap to count!`, speech: `How many ${plural}? Tap them to count.`,
    options: opts.map(x => ({ key: String(x), html: x })), answer: n, nameOf: numName,
    onExtra: countAlong(),
  });
}

export function hearNumberQuestion(stage, kit, from, to) {
  const n = pick(range(from, to));
  const opts = shuffle([n, ...nearby(n, from, to, 2)]);
  return ask(stage, kit, {
    owlText: `Find the number ${numName(n)}`, speech: `Find the number ${numName(n)}.`,
    options: opts.map(x => ({ key: String(x), html: x })), answer: n, nameOf: numName,
  });
}

export function nextNumberQuestion(stage, kit, from, to) {
  const n = pick(range(Math.max(from, 3), to));
  const opts = shuffle([n, ...nearby(n, from, to, 2)]);
  return ask(stage, kit, {
    show: `<div class="q-seq">${n - 2}, ${n - 1}, ❓</div>`,
    owlText: 'What comes next?', speech: `${numName(n - 2)}, ${numName(n - 1)}... what comes next?`,
    options: opts.map(x => ({ key: String(x), html: x })), answer: n, nameOf: numName,
  });
}

// Give the monkey exactly n bananas.
export function feedMonkey(stage, kit, n) {
  const speech = `Give the monkey ${numName(n)} bananas!`;
  const draw = () => {
    stage.innerHTML = `
      <div class="feed">
        <div class="monkey" id="monkey">🐵</div>
        <div class="basket" id="basket">0</div>
      </div>
      <div class="tree">${Array.from({ length: 12 }, () => '<button class="banana" data-b>🍌</button>').join('')}</div>
      <div class="nav">
        <button class="btn press" data-act="reset">↩️</button>
        <button class="btn go press" data-act="done">Done ✅</button>
      </div>`;
  };
  draw();
  kit.owl(`Give the monkey ${n} bananas!`, speech);
  return new Promise(resolve => {
    let got = 0, finished = false;
    stage.onclick = e => {
      if (finished) return;
      const banana = e.target.closest('[data-b]');
      if (banana && !banana.classList.contains('gone')) {
        banana.classList.add('gone');
        got++;
        document.getElementById('basket').textContent = got;
        flash(document.getElementById('monkey'), 'eat');
        sfx.count(got);
        say(numName(got));
        return;
      }
      const b = e.target.closest('[data-act]');
      if (!b) return;
      if (b.dataset.act === 'reset') { sfx.tap(); got = 0; draw(); say(speech); }
      if (b.dataset.act === 'done') {
        if (got === n) {
          finished = true;
          sfx.good();
          confetti(14);
          document.getElementById('monkey').textContent = '🙈';
          say(`Yummy! ${numName(n)} bananas! Thank you!`);
          kit.wait(1800).then(resolve);
        } else if (got < n) {
          kit.miss();
          sfx.bad();
          say(`More bananas, please! I want ${numName(n)}.`);
        } else {
          kit.miss();
          sfx.bad();
          say(`Too many! I want ${numName(n)}. Let's try again.`);
          got = 0;
          draw();
        }
      }
    };
  });
}

// ---------- Balloon pop (letters or numbers) ----------
// items: [{ key, label, speak }]; targets: keys to pop, in order.
export function balloons(stage, kit, { items, targets, kind }) {
  stage.innerHTML = `
    <div class="target"><span>Pop</span><span class="t" id="tgt"></span>
      <button class="speak press" data-act="repeat" style="width:48px;height:48px;font-size:24px">🔊</button></div>
    <div class="dots">${targets.map(() => '<span></span>').join('')}</div>
    <div class="sky" id="sky"></div>`;
  const sky = stage.querySelector('#sky');
  const dots = stage.querySelectorAll('.dots span');
  const byKey = k => items.find(x => x.key === k);
  let ti = 0, finished = false, lane = Math.floor(Math.random() * 4);

  const announce = () => {
    const t = byKey(targets[ti]);
    const shown = t.name || t.label; // words show the word, not the picture
    stage.querySelector('#tgt').textContent = shown;
    kit.owl(`Pop the ${kind ? kind + ' ' : ''}${shown}!`, `Pop the ${t.speak}!`);
  };

  const spawn = () => {
    if (!kit.alive() || finished) return;
    const live = [...sky.children].filter(b => !b.classList.contains('popped'));
    if (live.length >= 6) return;
    const target = targets[ti];
    const hasTarget = live.some(b => b.dataset.k === target);
    const others = items.filter(x => x.key !== target);
    const item = !hasTarget || Math.random() < 0.3 ? byKey(target) : pick(others);
    const el = document.createElement('div');
    el.className = 'balloon';
    el.dataset.k = item.key;
    // Four lanes taken in turn so balloons don't pile on top of each other.
    lane = (lane + 1 + Math.floor(Math.random() * 2)) % 4;
    el.style.left = (3 + lane * 23 + Math.random() * 4) + '%';
    el.style.animationDuration = (7 + Math.random() * 2.5) + 's';
    el.innerHTML = `<button style="background:${item.bg || pick(BALLOON_COLORS)}">${esc(item.label)}</button>`;
    el.addEventListener('animationend', e => { if (e.target === el) el.remove(); });
    sky.appendChild(el);
  };

  return new Promise(resolve => {
    stage.onclick = e => {
      if (e.target.closest('[data-act="repeat"]')) say(`Pop the ${byKey(targets[ti]).speak}!`);
    };
    sky.addEventListener('pointerdown', e => {
      const el = e.target.closest('.balloon');
      if (!el || finished || el.classList.contains('popped')) return;
      if (el.dataset.k === targets[ti]) {
        el.classList.add('popped');
        sfx.pop();
        setTimeout(() => el.remove(), 320);
        dots[ti].classList.add('on');
        ti++;
        if (ti === targets.length) {
          finished = true;
          clearInterval(timer);
          sfx.good();
          confetti(18);
          say(`${pick(PRAISE)} You popped them all!`);
          kit.wait(1800).then(resolve);
        } else {
          say(pick(['Pop!', 'Yes!', 'Great!']));
          kit.wait(700).then(announce);
        }
      } else {
        kit.miss();
        flash(el, 'nope');
        sfx.bad();
        say(`That's ${byKey(el.dataset.k).speak}.`);
      }
    });
    announce();
    spawn();
    setTimeout(spawn, 500);
    const timer = setInterval(() => (kit.alive() ? spawn() : clearInterval(timer)), 1100);
  });
}

export const letterItems = set => set.map(x => ({ key: x.L, label: x.L, speak: `letter ${x.name}` }));
export const numberItems = nums => nums.map(n => ({ key: String(n), label: String(n), speak: `number ${numName(n)}` }));

// ---------- Words (Word Farm) ----------
// words: [[word, picture], ...]
const COLOR_CSS = { red: '#fa5252', blue: '#339af0', green: '#40c057', yellow: '#fcc419', orange: '#fd7e14',
  purple: '#9c36b5', brown: '#8d5a3b', black: '#212529', white: '#f8f9fa' };
// For the Colors level each balloon is painted the color itself, with no picture.
export const wordItems = (words, { colors = false } = {}) => words.map(([w, p]) =>
  ({ key: w, label: colors ? '' : p, name: w, speak: w, bg: colors ? COLOR_CSS[w] : null }));

const spellOut = word => word.split('').map(ch => letterName(ch)).join(', ');

// Picture-and-word cards. With `spell`, the letters are said one by one too.
export function introWords(stage, kit, words, { spell = false } = {}) {
  const speechFor = ([w]) => spell ? `${w}. ${spellOut(w)}. ${w}!` : `${w}.`;
  return new Promise(resolve => {
    let i = 0;
    const show = () => {
      const [w, p] = words[i];
      stage.innerHTML = `
        <button class="card press" data-act="repeat">
          <div class="pic" style="font-size:120px">${p}</div>
          <div class="word ${spell ? 'spaced' : ''}">${esc(w)}</div>
        </button>
        <div class="nav">
          <button class="btn press" data-act="prev" ${i === 0 ? 'style="visibility:hidden"' : ''}>⬅️</button>
          <button class="btn go press" data-act="next">${i === words.length - 1 ? "Let's play! ▶️" : '➡️'}</button>
        </div>`;
      kit.owl(spell ? `${w.toUpperCase().split('').join(' - ')}` : cap(w), speechFor(words[i]));
    };
    stage.onclick = e => {
      const b = e.target.closest('[data-act]');
      if (!b) return;
      if (b.dataset.act === 'repeat') say(speechFor(words[i]));
      if (b.dataset.act === 'prev' && i > 0) { sfx.tap(); i--; show(); }
      if (b.dataset.act === 'next') {
        sfx.tap();
        if (i < words.length - 1) { i++; show(); } else resolve();
      }
    };
    show();
  });
}

// Hear a word (listen) or read it (read), then tap its picture.
export function wordQuestion(stage, kit, words, mode) {
  const [w, p] = pick(words);
  const opts = shuffle([[w, p], ...sample(words.filter(x => x[0] !== w), 2)]);
  const nameOf = k => k;
  const options = opts.map(([ow, op]) => ({ key: ow, html: op }));
  if (mode === 'read') {
    return ask(stage, kit, {
      show: `<div class="q-word" style="font-size:52px">${esc(w)}</div>`,
      owlText: 'Read the word. Tap the picture!', speech: 'Can you read this word? Tap the picture.',
      options, answer: w, nameOf,
    });
  }
  return ask(stage, kit, {
    owlText: `Find: ${w}`, speech: `Where is the ${w}?`,
    options, answer: w, nameOf,
  });
}

export function colorQuestion(stage, kit) {
  const [color, pic, thing] = pick(COLOR_THINGS);
  const circles = Object.fromEntries(WORD_SETS.colors);
  const others = sample(Object.keys(circles).filter(c => c !== color), 2);
  return ask(stage, kit, {
    show: `<div class="q-pic">${pic}</div><div class="q-word">${esc(cap(thing))}</div>`,
    owlText: `What color is the ${thing}?`, speech: `What color is the ${thing}?`,
    options: shuffle([color, ...others]).map(c => ({ key: c, html: circles[c] })),
    answer: color, nameOf: c => c,
  });
}

// Flip cards to find pairs of the same picture. Each flip says the word.
export function memoryMatch(stage, kit, words) {
  const chosen = sample(words, 4);
  const cards = shuffle([...chosen, ...chosen]);
  stage.innerHTML = `<div class="mem">${cards.map((_, k) =>
    `<button class="mcard press" data-k="${k}">❓</button>`).join('')}</div>`;
  kit.owl('Find the pairs!', 'Find two pictures that are the same!');
  return new Promise(resolve => {
    let open = [], found = 0, busy = false;
    stage.onclick = e => {
      const b = e.target.closest('.mcard');
      if (!b || busy || b.classList.contains('open') || b.classList.contains('done')) return;
      const [w, p] = cards[+b.dataset.k];
      sfx.tap();
      b.textContent = p;
      b.classList.add('open');
      say(w);
      open.push(b);
      if (open.length < 2) return;
      const [a, c] = open;
      open = [];
      if (cards[+a.dataset.k][0] === cards[+c.dataset.k][0]) {
        a.classList.replace('open', 'done');
        c.classList.replace('open', 'done');
        found++;
        sfx.good();
        if (found === chosen.length) {
          confetti(18);
          kit.wait(700).then(() => say(`${pick(PRAISE)} You found them all!`));
          kit.wait(2200).then(resolve);
        }
      } else {
        busy = true;
        kit.wait(1000).then(() => {
          for (const x of [a, c]) { x.classList.remove('open'); x.textContent = '❓'; }
          busy = false;
        });
      }
    };
  });
}

// ---------- Spelling Castle ----------
// Picture + word with one letter missing: c _ t
export function missingLetter(stage, kit, [w, p]) {
  const at = Math.floor(Math.random() * w.length);
  const ch = w[at];
  const vowels = 'aeiou'.split('');
  const pool = vowels.includes(ch) ? vowels : 'bcdfghmnprst'.split('');
  const opts = shuffle([ch, ...sample(pool.filter(x => x !== ch), 2)]);
  const shown = w.split('').map((x, k) => k === at ? '<span class="gap">_</span>' : esc(x)).join('');
  return ask(stage, kit, {
    show: `<div class="q-pic">${p}</div><div class="q-word spaced" style="font-size:48px">${shown}</div>`,
    owlText: `${cap(w)}: which letter is missing?`, speech: `${w}. Which letter is missing?`,
    options: opts.map(x => ({ key: x, html: x })), answer: ch,
    nameOf: x => x === ch ? `${letterName(x)}. ${w}` : letterName(x),
  });
}

// Tap the letter tiles in the right order to spell the word.
export function spellWord(stage, kit, [w, p]) {
  const letters = w.split('');
  let tiles = shuffle(letters.map((ch, k) => ({ ch, k })));
  if (tiles.every((t, k) => t.ch === letters[k])) tiles = tiles.reverse();
  stage.innerHTML = `
    <button class="question press" data-act="repeat"><div class="q-pic">${p}</div></button>
    <div class="slots">${letters.map((_, k) => `<div class="slot-l" id="sl${k}"></div>`).join('')}</div>
    <div class="tiles">${tiles.map(t => `<button class="tile press" data-ch="${esc(t.ch)}">${esc(t.ch)}</button>`).join('')}</div>`;
  kit.owl(`Spell ${w}!`, `Let's spell ${w}!`);
  return new Promise(resolve => {
    let pos = 0;
    stage.onclick = e => {
      if (e.target.closest('[data-act="repeat"]')) return say(w);
      const b = e.target.closest('.tile');
      if (!b || b.classList.contains('used') || pos >= letters.length) return;
      if (b.dataset.ch === letters[pos]) {
        b.classList.add('used');
        const slot = document.getElementById('sl' + pos);
        slot.textContent = letters[pos];
        slot.classList.add('filled');
        sfx.count(pos + 1);
        pos++;
        if (pos === letters.length) {
          sfx.good();
          confetti(14);
          say(`${spellOut(w)}. ${w}! ${pick(PRAISE)}`);
          kit.wait(2600).then(resolve);
        } else {
          say(letterName(letters[pos - 1]));
        }
      } else {
        kit.miss();
        sfx.bad();
        flash(b, 'wrong');
        say(`That's ${letterName(b.dataset.ch)}. ${pick(TRY_AGAIN)}`);
      }
    };
  });
}
