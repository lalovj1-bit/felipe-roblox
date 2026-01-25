

import { Question, ScrambleQuestion } from './types';

export const SCRAMBLE_QUESTIONS: ScrambleQuestion[] = [
  { id: 101, sentence: "The big dinosaur is very hungry", translation: "El gran dinosaurio tiene mucha hambre" },
  { id: 102, sentence: "I see a green egg today", translation: "Veo un huevo verde hoy" },
  { id: 103, sentence: "The forest is full of giants", translation: "El bosque está lleno de gigantes" },
  { id: 104, sentence: "Dinos like to eat green leaves", translation: "A los dinosaurios les gusta comer hojas verdes" },
  { id: 105, sentence: "Let's run fast from the raptor", translation: "Corramos rápido del raptor" },
  { id: 106, sentence: "The volcano is hot and red", translation: "El volcán está caliente y rojo" },
  { id: 107, sentence: "A small bird is flying high", translation: "Un pájaro pequeño está volando alto" },
  { id: 108, sentence: "I want to be a paleontologist", translation: "Quiero ser un paleontólogo" },
  { id: 109, sentence: "The ground is shaking very hard", translation: "El suelo está temblando muy fuerte" },
  { id: 110, sentence: "Goodbye my old dinosaur friend", translation: "Adiós mi viejo amigo dinosaurio" }
];

export const QUESTIONS: Question[] = [
  // MISIÓN 1: SPACE ADVENTURE
  { id: 1, mission: 1, text: "Felipe: Welcome to my ________! It is very fast.", options: ["house", "rocket", "car", "bike"], correctAnswer: "rocket", hint: "Vuela al espacio.", translation: "¡Bienvenidos a mi cohete! Es muy rápido.", explanation: "Rocket es cohete." },
  { id: 2, mission: 1, text: "Felipe: Look at the moon. It is so ________.", options: ["small", "big", "blue", "hot"], correctAnswer: "big", hint: "Lo contrario de pequeño.", translation: "Mira la luna. Es muy grande.", explanation: "Big es grande." },
  { id: 3, mission: 1, text: "Felipe: There are millions of ________ in the sky.", options: ["dogs", "apples", "stars", "books"], correctAnswer: "stars", hint: "Brillan de noche.", translation: "Hay millones de estrellas en el cielo.", explanation: "Stars son estrellas." },
  { id: 4, mission: 1, text: "Felipe: I am wearing my ________ to breathe.", options: ["hat", "helmet", "glasses", "socks"], correctAnswer: "helmet", hint: "Protege la cabeza.", translation: "Llevo mi casco para respirar.", explanation: "Helmet es casco." },
  { id: 5, mission: 1, text: "Felipe: Mars is the ________ planet.", options: ["green", "red", "yellow", "black"], correctAnswer: "red", hint: "Un color cálido.", translation: "Marte es el planeta rojo.", explanation: "Red es rojo." },

  // MISIÓN 2: DEEP OCEAN
  { id: 11, mission: 2, text: "Felipe: I can see a giant ________ swimming!", options: ["lion", "whale", "cat", "bird"], correctAnswer: "whale", hint: "El animal más grande del mar.", translation: "¡Puedo ver una ballena gigante nadando!", explanation: "Whale es ballena." },
  { id: 12, mission: 2, text: "Felipe: Let's find the hidden ________ chest.", options: ["food", "treasure", "shoe", "toy"], correctAnswer: "treasure", hint: "Oro y joyas.", translation: "Busquemos el cofre del tesoro escondido.", explanation: "Treasure es tesoro." },
  { id: 13, mission: 2, text: "Felipe: The water here is very ________.", options: ["dry", "deep", "hot", "pink"], correctAnswer: "deep", hint: "Mucha distancia hacia abajo.", translation: "El agua aquí es muy profunda.", explanation: "Deep es profundo." },
  { id: 14, mission: 2, text: "Felipe: Look! An ________ has eight arms.", options: ["octopus", "fish", "shark", "crab"], correctAnswer: "octopus", hint: "Animal de 8 brazos.", translation: "¡Mira! Un pulpo tiene ocho brazos.", explanation: "Octopus es pulpo." },
  { id: 15, mission: 2, text: "Felipe: The submarine is ________.", options: ["yellow", "flying", "eating", "sleeping"], correctAnswer: "yellow", hint: "Color del sol.", translation: "El submarino es amarillo.", explanation: "Yellow es amarillo." },

  // MISIÓN 3: WINTER WORLD
  { id: 21, mission: 3, text: "Felipe: It is very ________ outside. Wear a coat!", options: ["hot", "cold", "sunny", "nice"], correctAnswer: "cold", hint: "Necesitas abrigo.", translation: "Hace mucho frío afuera. ¡Ponte un abrigo!", explanation: "Cold es frío." },
  { id: 22, mission: 3, text: "Felipe: Let's build a ________ in the snow.", options: ["sandcastle", "snowman", "pizza", "car"], correctAnswer: "snowman", hint: "Hombre de nieve.", translation: "Construyamos un muñeco de nieve.", explanation: "Snowman es muñeco de nieve." },
  { id: 23, mission: 3, text: "Felipe: The ________ are sliding on the ice.", options: ["monkeys", "penguins", "lions", "tigers"], correctAnswer: "penguins", hint: "Aves blancas y negras.", translation: "Los pingüinos se deslizan en el hielo.", explanation: "Penguins son pingüinos." },
  { id: 24, mission: 3, text: "Felipe: I am wearing a warm ________ around my neck.", options: ["hat", "scarf", "belt", "ring"], correctAnswer: "scarf", hint: "Para el cuello.", translation: "Llevo una bufanda abrigada en mi cuello.", explanation: "Scarf es bufanda." },
  { id: 25, mission: 3, text: "Felipe: The ground is covered in white ________.", options: ["sand", "snow", "water", "grass"], correctAnswer: "snow", hint: "Hielo suave del cielo.", translation: "El suelo está cubierto de nieve blanca.", explanation: "Snow es nieve." },

  // MISIÓN 4: MAGIC FOREST
  { id: 31, mission: 4, text: "Felipe: Can you see the ________ flying? She is tiny!", options: ["fairy", "elephant", "bus", "dog"], correctAnswer: "fairy", hint: "Tiene alas y magia.", translation: "¿Puedes ver al hada volando? ¡Es pequeñita!", explanation: "Fairy es hada." },
  { id: 32, mission: 4, text: "Felipe: This ________ mushroom is magic!", options: ["boring", "glowing", "dead", "square"], correctAnswer: "glowing", hint: "Tiene luz propia.", translation: "¡Este hongo brillante es mágico!", explanation: "Glowing es brillante/reluciente." },
  { id: 33, mission: 4, text: "Felipe: The witch is making a blue ________.", options: ["soup", "potion", "cake", "salad"], correctAnswer: "potion", hint: "Bebida mágica.", translation: "La bruja está haciendo una poción azul.", explanation: "Potion es poción." },
  { id: 34, mission: 4, text: "Felipe: Don't walk on the ________ flowers!", options: ["talking", "sleeping", "running", "singing"], correctAnswer: "talking", hint: "Ellas dicen 'hello'.", translation: "¡No pises las flores que hablan!", explanation: "Talking es hablando." },
  { id: 35, mission: 4, text: "Felipe: The trees have silver ________.", options: ["hands", "leaves", "eyes", "feet"], correctAnswer: "leaves", hint: "Parte verde del árbol.", translation: "Los árboles tienen hojas plateadas.", explanation: "Leaves son hojas." }
];
