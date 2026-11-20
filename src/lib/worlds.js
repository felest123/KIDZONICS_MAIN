// Themed phonics worlds used by the KidZonics adventure map and lessons.

export const WORLDS = {
  vowels: {
    A: {
      world: "Ant World",
      guide: "🐜",
      guideName: "Annie Ant",
      accent: "#0d9488",
      island: "#d9f2b8",
      props: [
        { e: "🌳", dx: -46, dy: -48, size: 30 },
        { e: "🍃", dx: 42, dy: -30, size: 22 },
        { e: "🌼", dx: -38, dy: 40, size: 20 },
      ],
    },
    E: {
      world: "Elephant World",
      guide: "🐘",
      guideName: "Ellie Elephant",
      accent: "#0f766e",
      island: "#cdeee6",
      props: [
        { e: "🌴", dx: -48, dy: -46, size: 28 },
        { e: "💧", dx: 44, dy: -26, size: 20 },
        { e: "🍃", dx: -34, dy: 42, size: 20 },
      ],
    },
    I: {
      world: "Iguana World",
      guide: "🦎",
      guideName: "Iggy Iguana",
      accent: "#15803d",
      island: "#d6f0c2",
      props: [
        { e: "🌿", dx: -46, dy: -46, size: 26 },
        { e: "🐛", dx: 42, dy: -30, size: 20 },
        { e: "🌴", dx: -36, dy: 42, size: 22 },
      ],
    },
    O: {
      world: "Owl World",
      guide: "🦉",
      guideName: "Ollie Owl",
      accent: "#4338ca",
      island: "#d3ddf8",
      props: [
        { e: "🌙", dx: -46, dy: -48, size: 24 },
        { e: "⭐", dx: 42, dy: -32, size: 18 },
        { e: "🌲", dx: -34, dy: 40, size: 24 },
      ],
    },
    U: {
      world: "Unicorn World",
      guide: "🦄",
      guideName: "Una Unicorn",
      accent: "#db2777",
      island: "#f8d9ef",
      props: [
        { e: "🌈", dx: -48, dy: -46, size: 26 },
        { e: "✨", dx: 42, dy: -30, size: 18 },
        { e: "🌸", dx: -34, dy: 40, size: 20 },
      ],
    },
  },
  cvc: {
    CAT: {
      world: "Cat Cottage",
      guide: "🐱",
      guideName: "Cleo Cat",
      accent: "#0d9488",
      island: "#d9f2b8",
      props: [
        { e: "🏠", dx: -46, dy: -48, size: 28 },
        { e: "🧶", dx: 42, dy: -30, size: 20 },
        { e: "🌼", dx: -34, dy: 40, size: 20 },
      ],
    },
    BAT: {
      world: "Bat Cave",
      guide: "🦇",
      guideName: "Benny Bat",
      accent: "#6d28d9",
      island: "#dbd6f5",
      props: [
        { e: "🌙", dx: -46, dy: -48, size: 24 },
        { e: "🕸️", dx: 42, dy: -30, size: 20 },
        { e: "🪨", dx: -34, dy: 40, size: 20 },
      ],
    },
    HEN: {
      world: "Hen Farm",
      guide: "🐔",
      guideName: "Hattie Hen",
      accent: "#c2410c",
      island: "#fbe3c2",
      props: [
        { e: "🌾", dx: -46, dy: -48, size: 26 },
        { e: "🥚", dx: 42, dy: -30, size: 20 },
        { e: "🌻", dx: -34, dy: 40, size: 22 },
      ],
    },
    PIN: {
      world: "Pin Playground",
      guide: "📌",
      guideName: "Pip Pin",
      accent: "#0ea5e9",
      island: "#d6eefb",
      props: [
        { e: "🎈", dx: -46, dy: -48, size: 26 },
        { e: "🧸", dx: 42, dy: -30, size: 22 },
        { e: "🎨", dx: -34, dy: 40, size: 20 },
      ],
    },
    DOG: {
      world: "Dog Park",
      guide: "🐶",
      guideName: "Dexter Dog",
      accent: "#b45309",
      island: "#e8e1c7",
      props: [
        { e: "🦴", dx: -46, dy: -48, size: 22 },
        { e: "🌳", dx: 42, dy: -30, size: 26 },
        { e: "🎾", dx: -34, dy: 40, size: 20 },
      ],
    },
    SUN: {
      world: "Sunny Beach",
      guide: "☀️",
      guideName: "Sunny",
      accent: "#ea8a00",
      island: "#ffe9b8",
      props: [
        { e: "🌊", dx: -46, dy: -48, size: 24 },
        { e: "🐚", dx: 42, dy: -30, size: 20 },
        { e: "🌴", dx: -34, dy: 40, size: 24 },
      ],
    },
  },
};

const FALLBACK = {
  world: "Phonics Land",
  guide: "🦁",
  guideName: "Leo",
  accent: "#0d9488",
  island: "#dcf3e9",
  props: [
    { e: "🌳", dx: -46, dy: -48, size: 26 },
    { e: "🎈", dx: 42, dy: -30, size: 20 },
    { e: "🌼", dx: -34, dy: 40, size: 20 },
  ],
};

export function worldFor(moduleId, key) {
  return WORLDS[moduleId]?.[String(key).toUpperCase()] || WORLDS[moduleId]?.[key] || FALLBACK;
}
