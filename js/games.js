// Mini-games. Each one draws into `stage` and returns a Promise that
// resolves when the child has finished it. `kit` gives access to the owl
// helper, mistake counting and an `alive()` check (false once he leaves).
import { LETTERS, NUMBER_WORDS, COUNT_THINGS, PRAISE, TRY_AGAIN, letter } from './data.js';
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
    stage.querySelector('#tgt').textContent = t.label;
    kit.owl(`Pop the ${kind} ${t.label}!`, `Pop the ${t.speak}!`);
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
    el.innerHTML = `<button style="background:${pick(BALLOON_COLORS)}">${esc(item.label)}</button>`;
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
