// KidZonics curriculum content — vowels and CVC lessons.

export const VOWELS = [
  {
    key: "A",
    label: "A",
    name: "Letter A",
    sound: "ah",
    say: "A says ah, ah, apple.",
    letterName: "A",
    word: "Apple",
    emoji: "🍎",
    tip: "Open your mouth wide and say ah.",
    color: "#fcd34d",
  },
  {
    key: "E",
    label: "E",
    name: "Letter E",
    sound: "eh",
    say: "E says eh, eh, egg.",
    letterName: "E",
    word: "Egg",
    emoji: "🥚",
    tip: "Smile a little and say eh.",
    color: "#7dd3c0",
  },
  {
    key: "I",
    label: "I",
    name: "Letter I",
    sound: "ih",
    say: "I says ih, ih, igloo.",
    letterName: "I",
    word: "Igloo",
    emoji: "🛖",
    tip: "Keep your mouth small and say ih.",
    color: "#fca5a5",
  },
  {
    key: "O",
    label: "O",
    name: "Letter O",
    sound: "aw",
    say: "O says aw, aw, octopus.",
    letterName: "O",
    word: "Octopus",
    emoji: "🐙",
    tip: "Make a round mouth and say aw.",
    color: "#fbbf24",
  },
  {
    key: "U",
    label: "U",
    name: "Letter U",
    sound: "uh",
    say: "U says uh, uh, umbrella.",
    letterName: "U",
    word: "Umbrella",
    emoji: "☂️",
    tip: "Relax your mouth and say uh.",
    color: "#a5b4fc",
  },
];

export const CVC_WORDS = [
  {
    key: "CAT",
    label: "CAT",
    name: "Cat",
    word: "Cat",
    emoji: "🐱",
    onset: "C",
    vowel: "A",
    coda: "T",
    say: "C, A, T. Cat!",
    tip: "Stretch each sound: c – a – t.",
    color: "#fcd34d",
  },
  {
    key: "BAT",
    label: "BAT",
    name: "Bat",
    word: "Bat",
    emoji: "🦇",
    onset: "B",
    vowel: "A",
    coda: "T",
    say: "B, A, T. Bat!",
    tip: "Bounce the first sound: b – a – t.",
    color: "#7dd3c0",
  },
  {
    key: "HEN",
    label: "HEN",
    name: "Hen",
    word: "Hen",
    emoji: "🐔",
    onset: "H",
    vowel: "E",
    coda: "N",
    say: "H, E, N. Hen!",
    tip: "Keep the middle sound short: h – e – n.",
    color: "#fca5a5",
  },
  {
    key: "PIN",
    label: "PIN",
    name: "Pin",
    word: "Pin",
    emoji: "📌",
    onset: "P",
    vowel: "I",
    coda: "N",
    say: "P, I, N. Pin!",
    tip: "Pop the first sound: p – i – n.",
    color: "#fbbf24",
  },
  {
    key: "DOG",
    label: "DOG",
    name: "Dog",
    word: "Dog",
    emoji: "🐶",
    onset: "D",
    vowel: "O",
    coda: "G",
    say: "D, O, G. Dog!",
    tip: "Round your mouth in the middle: d – o – g.",
    color: "#a5b4fc",
  },
  {
    key: "SUN",
    label: "SUN",
    name: "Sun",
    word: "Sun",
    emoji: "☀️",
    onset: "S",
    vowel: "U",
    coda: "N",
    say: "S, U, N. Sun!",
    tip: "Hiss the first sound: s – u – n.",
    color: "#fcd34d",
  },
];

const SHAPES = ["#fcd34d", "#7dd3c0", "#fca5a5", "#fbbf24", "#a5b4fc", "#fdba74"];

export const MODULES = {
  vowels: {
    id: "vowels",
    title: "ABC / VOWELS",
    short: "Vowels",
    subtitle: "Meet A, E, I, O, U",
    accent: "#fcd34d",
    items: VOWELS,
    promptFor: (item) => item.label,
    practicePrompt: (item) => `Which picture starts with ${item.label}?`,
  },
  cvc: {
    id: "cvc",
    title: "CVC WORDS",
    short: "CVC",
    subtitle: "Read cat, bat, hen, pin, dog, sun",
    accent: "#0d9488",
    items: CVC_WORDS,
    promptFor: (item) => item.word,
    practicePrompt: () => "Which picture matches the word?",
  },
};

export function moduleItems(moduleId) {
  return MODULES[moduleId]?.items ?? [];
}

export function findLesson(moduleId, key) {
  const mod = MODULES[moduleId];
  if (!mod) return null;
  const item = mod.items.find((i) => String(i.key).toUpperCase() === String(key).toUpperCase());
  return item ? { module: mod, item } : null;
}

// Deterministic picture choices for a matching exercise.
export function pictureChoices(moduleId, item) {
  const items = moduleItems(moduleId);
  const others = items.filter((i) => i.key !== item.key);
  const first = others[(items.indexOf(item) + 1) % others.length];
  const second = others[(items.indexOf(item) + 3) % others.length];
  const picks = [item, first, second].filter(Boolean);
  return picks
    .map((choice, index) => ({ ...choice, shape: SHAPES[(items.indexOf(choice) + index) % SHAPES.length] }))
    .sort((a, b) => (a.key > b.key ? 1 : -1));
}
