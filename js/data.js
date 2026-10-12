// Letter names are written the way they sound, so the phone's voice says
// "bee" instead of reading a lone "B" (or "A" as the word "a").
export const LETTERS = [
  { L: 'A', name: 'ay',         word: 'apple',     pic: '🍎' },
  { L: 'B', name: 'bee',        word: 'ball',      pic: '⚽' },
  { L: 'C', name: 'see',        word: 'cat',       pic: '🐱' },
  { L: 'D', name: 'dee',        word: 'dog',       pic: '🐶' },
  { L: 'E', name: 'ee',         word: 'egg',       pic: '🥚' },
  { L: 'F', name: 'eff',        word: 'fish',      pic: '🐟' },
  { L: 'G', name: 'jee',        word: 'grapes',    pic: '🍇' },
  { L: 'H', name: 'aitch',      word: 'hat',       pic: '🎩' },
  { L: 'I', name: 'eye',        word: 'ice cream', pic: '🍦' },
  { L: 'J', name: 'jay',        word: 'juice',     pic: '🧃' },
  { L: 'K', name: 'kay',        word: 'kite',      pic: '🪁' },
  { L: 'L', name: 'ell',        word: 'lion',      pic: '🦁' },
  { L: 'M', name: 'em',         word: 'moon',      pic: '🌙' },
  { L: 'N', name: 'en',         word: 'nose',      pic: '👃' },
  { L: 'O', name: 'oh',         word: 'octopus',   pic: '🐙' },
  { L: 'P', name: 'pee',        word: 'pig',       pic: '🐷' },
  { L: 'Q', name: 'cue',        word: 'queen',     pic: '👸' },
  { L: 'R', name: 'ar',         word: 'rabbit',    pic: '🐰' },
  { L: 'S', name: 'ess',        word: 'sun',       pic: '☀️' },
  { L: 'T', name: 'tee',        word: 'tiger',     pic: '🐯' },
  { L: 'U', name: 'you',        word: 'umbrella',  pic: '☂️' },
  { L: 'V', name: 'vee',        word: 'violin',    pic: '🎻' },
  { L: 'W', name: 'double you', word: 'whale',     pic: '🐳' },
  { L: 'X', name: 'ex',         word: 'x-ray',     pic: '🩻' },
  { L: 'Y', name: 'why',        word: 'yo-yo',     pic: '🪀' },
  { L: 'Z', name: 'zee',        word: 'zebra',     pic: '🦓' },
];
export const letter = L => LETTERS.find(x => x.L === L);

export const NUMBER_WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
  'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty'];

export const COUNT_THINGS = [
  ['🍌', 'bananas'], ['🍎', 'apples'], ['⭐', 'stars'], ['🐞', 'ladybugs'], ['🐟', 'fish'],
  ['🎈', 'balloons'], ['🍓', 'strawberries'], ['🚗', 'cars'], ['🐥', 'chicks'], ['🌸', 'flowers'],
];

export const WORLDS = [
  {
    id: 'beach', name: 'Alphabet Beach', icon: '🏖️', theme: 'beach', color: '#ffe8a3',
    desc: 'Letters A to Z',
    levels: [
      { id: 'b1', title: 'A–F', letters: 'ABCDEF' },
      { id: 'b2', title: 'G–L', letters: 'GHIJKL' },
      { id: 'b3', title: 'M–R', letters: 'MNOPQR' },
      { id: 'b4', title: 'S–Z', letters: 'STUVWXYZ' },
      { id: 'b5', title: 'A–Z', letters: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', review: true },
    ],
  },
  {
    id: 'jungle', name: 'Number Jungle', icon: '🌴', theme: 'jungle', color: '#b2f2bb',
    desc: 'Numbers 1 to 20',
    levels: [
      { id: 'j1', title: '1–5', from: 1, to: 5 },
      { id: 'j2', title: '6–10', from: 6, to: 10 },
      { id: 'j3', title: '1–10', from: 1, to: 10, review: true },
      { id: 'j4', title: '11–15', from: 11, to: 15 },
      { id: 'j5', title: '16–20', from: 16, to: 20 },
    ],
  },
  {
    id: 'farm', name: 'Word Farm', icon: '🐮', theme: 'farm', color: '#d3f9d8',
    desc: 'Animals, colors, food and more',
    levels: [
      { id: 'f1', title: 'Animals', icon: '🐶', words: 'animals' },
      { id: 'f2', title: 'Colors',  icon: '🎨', words: 'colors' },
      { id: 'f3', title: 'Food',    icon: '🍎', words: 'food' },
      { id: 'f4', title: 'My Body', icon: '✋', words: 'body' },
      { id: 'f5', title: 'Family',  icon: '👨‍👩‍👦', words: 'family' },
      { id: 'f6', title: 'Things That Go', icon: '🚗', words: 'go' },
    ],
  },
  {
    id: 'castle', name: 'Spelling Castle', icon: '🏰', theme: 'castle', color: '#f3d9fa',
    desc: 'Spell little words',
    levels: [
      { id: 'c1', title: '3 letters', icon: '🐱', spell: [['cat', '🐱'], ['dog', '🐶'], ['sun', '☀️'], ['bus', '🚌'], ['pig', '🐷'], ['hat', '🎩']] },
      { id: 'c2', title: '3 letters', icon: '🦊', spell: [['bed', '🛏️'], ['cup', '🥤'], ['fox', '🦊'], ['box', '📦'], ['bee', '🐝'], ['egg', '🥚']] },
      { id: 'c3', title: '3 letters', icon: '🐜', spell: [['ant', '🐜'], ['bat', '🦇'], ['car', '🚗'], ['cow', '🐮'], ['owl', '🦉'], ['pen', '🖊️']] },
      { id: 'c4', title: '4 letters', icon: '🐸', spell: [['fish', '🐟'], ['duck', '🦆'], ['frog', '🐸'], ['star', '⭐'], ['cake', '🎂'], ['ball', '⚽']] },
      { id: 'c5', title: '4 letters', icon: '🌙', spell: [['bird', '🐦'], ['milk', '🥛'], ['moon', '🌙'], ['tree', '🌳'], ['ship', '🚢'], ['book', '📖']] },
    ],
  },
  {
    id: 'tree', name: 'Talking Tree', icon: '🌳', theme: 'tree', color: '#ffe8cc',
    desc: 'Say the words out loud',
    levels: [
      { id: 't1', title: 'Animals', icon: '🦁', say: 'animals' },
      { id: 't2', title: 'Colors',  icon: '🌈', say: 'colors' },
      { id: 't3', title: 'Food',    icon: '🍌', say: 'food' },
      { id: 't4', title: 'Numbers', icon: '🔢', say: 'numbers' },
      { id: 't5', title: 'Hello!',  icon: '👋', say: 'phrases' },
    ],
  },
];

export const STICKERS = [
  '🦄', '🐉', '🦖', '🚀', '🌈', '🍩', '🦁', '🐼', '🐙', '🦋',
  '🏎️', '🚁', '⚽', '🎸', '🍦', '🐬', '🦕', '🤖', '👑', '💎',
  '🐧', '🦊', '🐸', '🍕', '🧁', '⛄', '🌻', '🐝', '🦜', '🐢',
  '🚒', '🚂', '🛸', '🏆', '🐳', '🦒', '🐨', '🍉', '🦈', '🏰',
  '🦩', '🦚', '🐿️', '🦔', '🐞', '🌵', '🍓', '🍿', '🎠', '🚜',
  '⛵', '🚲', '🛹', '🪐', '🍭', '🎯', '🐠', '🦓', '🧸', '🎡',
];

export const PRAISE = ['Great job!', 'Well done!', 'Super!', 'Awesome!', 'You got it!', 'Brilliant!', 'Yay!', 'Amazing!'];
export const TRY_AGAIN = ['Try again!', 'Oops, try again!', 'Almost! Try again!'];

// Word Farm topics: [word, picture]
export const WORD_SETS = {
  animals: [['cat', '🐱'], ['dog', '🐶'], ['cow', '🐮'], ['pig', '🐷'], ['duck', '🦆'], ['horse', '🐴'],
            ['sheep', '🐑'], ['chicken', '🐔'], ['rabbit', '🐰'], ['lion', '🦁'], ['monkey', '🐵'], ['elephant', '🐘']],
  colors:  [['red', '🔴'], ['blue', '🔵'], ['green', '🟢'], ['yellow', '🟡'], ['orange', '🟠'],
            ['purple', '🟣'], ['brown', '🟤'], ['black', '⚫'], ['white', '⚪']],
  food:    [['apple', '🍎'], ['banana', '🍌'], ['bread', '🍞'], ['milk', '🥛'], ['egg', '🥚'], ['cheese', '🧀'],
            ['carrot', '🥕'], ['cake', '🎂'], ['water', '💧'], ['rice', '🍚'], ['pizza', '🍕'], ['grapes', '🍇']],
  body:    [['eye', '👁️'], ['ear', '👂'], ['nose', '👃'], ['mouth', '👄'], ['hand', '✋'], ['foot', '🦶'],
            ['leg', '🦵'], ['arm', '💪'], ['tooth', '🦷'], ['hair', '💇']],
  family:  [['mom', '👩'], ['dad', '👨'], ['baby', '👶'], ['brother', '👦'], ['sister', '👧'],
            ['grandma', '👵'], ['grandpa', '👴'], ['family', '👨‍👩‍👦']],
  go:      [['car', '🚗'], ['bus', '🚌'], ['train', '🚆'], ['plane', '✈️'], ['boat', '⛵'], ['bike', '🚲'],
            ['ship', '🚢'], ['truck', '🚚'], ['rocket', '🚀'], ['taxi', '🚕'], ['tractor', '🚜'], ['helicopter', '🚁']],
};

// For "What color is it?" questions.
export const COLOR_THINGS = [
  ['red', '🍎', 'apple'], ['red', '🍓', 'strawberry'], ['yellow', '🍌', 'banana'], ['yellow', '🌻', 'sunflower'],
  ['green', '🐸', 'frog'], ['green', '🥦', 'broccoli'], ['blue', '🐳', 'whale'], ['blue', '💙', 'heart'],
  ['orange', '🥕', 'carrot'], ['orange', '🍊', 'orange'], ['purple', '🍇', 'grapes'], ['purple', '🍆', 'eggplant'],
  ['brown', '🐻', 'bear'], ['brown', '🍫', 'chocolate'], ['white', '☁️', 'cloud'], ['white', '🥛', 'milk'],
  ['black', '🎱', 'ball'],
];

// Talking Tree extra sets.
export const SAY_SETS = {
  numbers: [['one', '1️⃣'], ['two', '2️⃣'], ['three', '3️⃣'], ['four', '4️⃣'], ['five', '5️⃣'],
            ['six', '6️⃣'], ['seven', '7️⃣'], ['eight', '8️⃣'], ['nine', '9️⃣'], ['ten', '🔟']],
  phrases: [['hello', '🙋'], ['thank you', '🙏'], ['please', '🥺'], ['good morning', '🌅'], ['good night', '🌙'],
            ['I love you', '❤️'], ['bye bye', '👋'], ['yes', '👍'], ['no', '👎'], ['sorry', '😔']],
};
