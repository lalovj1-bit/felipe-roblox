
import { Question, ScrambleQuestion } from './types';

export const FELIPE_SYSTEM_PROMPT = `You are Felipe, a green dinosaur who loves English.
Keep answers very short and enthusiastic (max 10 words).
You are an English teacher for kids. Be encouraging!
Always include a Spanish translation in parentheses.`;

export const PRIZES = [
  { id: 1, name: "Pencil Scepter", icon: "✏️" },
  { id: 2, name: "City Badge", icon: "🏙️" },
  { id: 3, name: "Gold Medal", icon: "🥇" },
  { id: 4, name: "Forest Leaf", icon: "🍃" },
  { id: 5, name: "Moon Stone", icon: "🌙" },
  { id: 6, name: "Sonic Wave", icon: "🌊" },
  { id: 7, name: "Golden Burger", icon: "🍔" },
  { id: 8, name: "Magic Clock", icon: "⏰" }
];

// Generador de preguntas para las 8 misiones
const generateMissions = (): Question[] => {
  const missions: Question[] = [];
  const themes = [
    { id: 1, name: "School", vocab: ["book", "pen", "teacher", "desk", "ruler"], phrases: ["I have a book", "My teacher is nice", "Open your desk", "Use the ruler", "Where is my pen?"] },
    { id: 2, name: "City", vocab: ["bus", "park", "street", "car", "shop"], phrases: ["The bus is blue", "I go to the park", "Look at the street", "The car is fast", "Go to the shop"] },
    { id: 3, name: "Sports", vocab: ["ball", "run", "jump", "soccer", "swim"], phrases: ["I play with the ball", "Can you run fast?", "Jump very high", "I love soccer", "I like to swim"] },
    { id: 4, name: "Nature", vocab: ["tree", "lion", "bird", "flower", "river"], phrases: ["The tree is tall", "The lion is big", "I see a bird", "A beautiful flower", "The river is cold"] },
    { id: 5, name: "Numbers", vocab: ["one", "ten", "five", "eight", "three"], phrases: ["I have one apple", "Ten stars in the sky", "I am five years old", "Eight big dogs", "Three little cats"] },
    { id: 6, name: "Listening", vocab: ["apple", "dog", "cat", "sun", "moon"], phrases: ["Eat the apple", "The dog is happy", "The cat is small", "The sun is hot", "The moon is white"] },
    { id: 7, name: "Food", vocab: ["pizza", "milk", "bread", "water", "apple"], phrases: ["I like pizza", "Drink the milk", "Eat some bread", "I want water", "A red apple"] },
    { id: 8, name: "Routine", vocab: ["sleep", "wash", "eat", "play", "study"], phrases: ["I sleep at night", "Wash your hands", "Eat your breakfast", "Play with friends", "I study English"] }
  ];

  themes.forEach(theme => {
    // 5 de Vocabulario (Opción múltiple)
    theme.vocab.forEach((v, i) => {
      missions.push({
        id: theme.id * 10 + i,
        mission: theme.id,
        text: `Choose the correct word: ${v.toUpperCase()}`,
        options: [v, "wrong1", "wrong2", "wrong3"], // Se barajan en App.tsx
        correctAnswer: v,
        hint: `It starts with ${v[0]}`,
        translation: `Elige la palabra correcta: ${v}`,
        explanation: `${v} significa ${v} en español.`
      });
    });
    // 5 de Frases (En App.tsx se manejarán como Scramble si el index es > 4)
    theme.phrases.forEach((p, i) => {
      missions.push({
        id: theme.id * 10 + i + 5,
        mission: theme.id,
        text: p,
        options: [], // No se usan en scramble
        correctAnswer: p,
        hint: "Order the words!",
        translation: "Ordena las palabras para formar la frase.",
        explanation: "Good sentence construction!"
      });
    });
  });

  return missions;
};

export const QUESTIONS = generateMissions();

export const SCRAMBLE_QUESTIONS: ScrambleQuestion[] = QUESTIONS
  .filter(q => q.id % 10 >= 5)
  .map(q => ({
    id: q.id,
    sentence: q.correctAnswer,
    translation: q.translation
  }));
