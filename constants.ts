
import { Question } from './types';

export const FELIPE_SYSTEM_PROMPT = `You are Felipe, a green dinosaur who loves English.
You are a friendly teacher for kids aged 10-12.
Keep responses short, pixel-themed, and super encouraging.
Always translate English phrases to Spanish in parentheses (Ej: Hello! (¡Hola!)).`;

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

const themes = [
  { 
    id: 1, name: "Pixel Academy", 
    vocab: ["book", "pen", "teacher", "desk", "ruler"], 
    phrases: ["I have a book", "My teacher is nice", "Open your desk", "Use the ruler", "Where is my pen?"] 
  },
  { 
    id: 2, name: "Adventure Street", 
    vocab: ["bus", "park", "street", "car", "shop"], 
    phrases: ["The bus is blue", "I go to the park", "Look at the street", "The car is fast", "Go to the shop"] 
  },
  { 
    id: 3, name: "Olympic Arena", 
    vocab: ["ball", "soccer", "run", "jump", "swim"], 
    phrases: ["I play with the ball", "Can you run fast?", "Jump very high", "I love soccer", "I like to swim"] 
  },
  { 
    id: 4, name: "Deep Woods", 
    vocab: ["tree", "lion", "bird", "flower", "river"], 
    phrases: ["The tree is tall", "The lion is big", "I see a bird", "A beautiful flower", "The river is cold"] 
  },
  { 
    id: 5, name: "Star Voyager", 
    vocab: ["one", "ten", "five", "eight", "three"], 
    phrases: ["I have one apple", "Ten stars in the sky", "I am five years old", "Eight big dogs", "Three little cats"] 
  },
  { 
    id: 6, name: "Word Hunter", 
    vocab: ["apple", "dog", "cat", "sun", "moon"], 
    phrases: ["Eat the apple", "The dog is happy", "The cat is small", "The sun is hot", "The moon is white"] 
  },
  { 
    id: 7, name: "Yummy Yard", 
    vocab: ["pizza", "milk", "bread", "water", "apple"], 
    phrases: ["I like pizza", "Drink the milk", "Eat some bread", "I want water", "A red apple"] 
  },
  { 
    id: 8, name: "Dino Dungeon", 
    vocab: ["sleep", "wash", "eat", "play", "study"], 
    phrases: ["I sleep at night", "Wash your hands", "Eat your breakfast", "Play with friends", "I study English"] 
  }
];

const distractorWords = ["Cloud", "Red", "Happy", "Chair", "Run", "Milk", "Jump", "Green", "Small", "Big"];

const generateMissions = (): Question[] => {
  const missions: Question[] = [];
  themes.forEach(theme => {
    // 5 Vocabulary
    theme.vocab.forEach((v, i) => {
      const options = [v];
      while(options.length < 4) {
        const rand = distractorWords[Math.floor(Math.random() * distractorWords.length)];
        if(!options.includes(rand)) options.push(rand);
      }
      missions.push({
        id: theme.id * 100 + i,
        mission: theme.id,
        text: `Choose the correct word: ${v.toUpperCase()}`,
        options: options,
        correctAnswer: v,
        hint: `Starts with ${v[0]}`,
        translation: `Elige la palabra correcta: ${v}`,
        explanation: `${v} significa ${v} en español.`
      });
    });
    // 5 Phrases
    theme.phrases.forEach((p, i) => {
      missions.push({
        id: theme.id * 100 + i + 5,
        mission: theme.id,
        text: p,
        options: [],
        correctAnswer: p,
        hint: "Order the words!",
        translation: "Ordena las palabras para formar la frase.",
        explanation: "¡Excelente construcción de frase!"
      });
    });
  });
  return missions;
};

export const QUESTIONS = generateMissions();
