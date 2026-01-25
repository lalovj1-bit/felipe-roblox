
import { Question, ScrambleQuestion } from './types';

export const QUESTIONS: Question[] = [
  // MUNDO 1: DINO LAND 🦖 (Niveles 1-9)
  { id: 1, mission: 1, text: "The dinosaur is very ________.", options: ["big", "small", "blue", "fast"], correctAnswer: "big", hint: "Like an elephant!", translation: "El dinosaurio es muy grande.", explanation: "Big es grande." },
  { id: 2, mission: 1, text: "I see a green ________ in the forest.", options: ["tree", "car", "phone", "pizza"], correctAnswer: "tree", hint: "It has leaves.", translation: "Veo un árbol verde en el bosque.", explanation: "Tree es árbol." },
  { id: 3, mission: 1, text: "The sky is ________ today.", options: ["blue", "red", "yellow", "pink"], correctAnswer: "blue", hint: "The color of the ocean.", translation: "El cielo está azul hoy.", explanation: "Blue es azul." },
  { id: 4, mission: 1, text: "Felipe has a long ________.", options: ["tail", "hat", "book", "shoe"], correctAnswer: "tail", hint: "Dinos wag this!", translation: "Felipe tiene una cola larga.", explanation: "Tail es cola." },
  { id: 5, mission: 1, text: "The volcano is ________.", options: ["hot", "cold", "funny", "sad"], correctAnswer: "hot", hint: "Opposite of cold.", translation: "El volcán está caliente.", explanation: "Hot es caliente." },
  { id: 6, mission: 1, text: "I ________ with my eyes.", options: ["see", "hear", "smell", "taste"], correctAnswer: "see", hint: "Using your vision.", translation: "Veo con mis ojos.", explanation: "See es ver." },
  { id: 7, mission: 1, text: "Grass is ________.", options: ["green", "purple", "white", "black"], correctAnswer: "green", hint: "The color of nature.", translation: "La hierba es verde.", explanation: "Green es verde." },
  { id: 8, mission: 1, text: "The sun is a ________.", options: ["star", "planet", "moon", "cloud"], correctAnswer: "star", hint: "A bright light in space.", translation: "El sol es una estrella.", explanation: "Star es estrella." },
  { id: 9, mission: 1, text: "Birds can ________ very high.", options: ["fly", "swim", "cook", "read"], correctAnswer: "fly", hint: "Moving in the air.", translation: "Los pájaros pueden volar muy alto.", explanation: "Fly es volar." },
  
  // MUNDO 2: CYBER CITY 🤖
  { id: 11, mission: 2, text: "The robot can ________.", options: ["dance", "eat", "sleep", "cry"], correctAnswer: "dance", hint: "Moving to music.", translation: "El robot puede bailar.", explanation: "Dance es bailar." },
  { id: 12, mission: 2, text: "I use a ________ to play games.", options: ["computer", "spoon", "pillow", "brush"], correctAnswer: "computer", hint: "A smart machine.", translation: "Uso una computadora para jugar.", explanation: "Computer es computadora." },
  { id: 13, mission: 2, text: "My phone is ________.", options: ["new", "hungry", "angry", "old"], correctAnswer: "new", hint: "Not old.", translation: "Mi teléfono es nuevo.", explanation: "New es nuevo." },
  { id: 14, mission: 2, text: "The lights are ________.", options: ["bright", "dark", "heavy", "slow"], correctAnswer: "bright", hint: "Very much light.", translation: "Las luces son brillantes.", explanation: "Bright es brillante." },
  { id: 15, mission: 2, text: "I have a fast ________.", options: ["internet", "bread", "chair", "tree"], correctAnswer: "internet", hint: "Global network.", translation: "Tengo un internet rápido.", explanation: "Internet es internet." },
  { id: 16, mission: 2, text: "The battery is ________.", options: ["full", "empty", "happy", "sad"], correctAnswer: "full", hint: "100 percent.", translation: "La batería está llena.", explanation: "Full es lleno." },
  { id: 17, mission: 2, text: "Press the ________ button.", options: ["red", "blue", "green", "yellow"], correctAnswer: "red", hint: "The color of an apple.", translation: "Pulsa el botón rojo.", explanation: "Red es rojo." },
  { id: 18, mission: 2, text: "I take a ________ with my camera.", options: ["photo", "sandwich", "bath", "walk"], correctAnswer: "photo", hint: "A picture.", translation: "Hago una foto con mi cámara.", explanation: "Photo es foto." },
  { id: 19, mission: 2, text: "The screen is ________.", options: ["touch", "eat", "run", "jump"], correctAnswer: "touch", hint: "Use your fingers.", translation: "La pantalla es táctil.", explanation: "Touch es tocar." },

  // MUNDO 3: SWEET KINGDOM 🍭
  { id: 21, mission: 3, text: "The cake is ________.", options: ["sweet", "salty", "sour", "bitter"], correctAnswer: "sweet", hint: "Like sugar.", translation: "El pastel es dulce.", explanation: "Sweet es dulce." },
  { id: 22, mission: 3, text: "I want an ________ ice cream.", options: ["orange", "apple", "onion", "egg"], correctAnswer: "orange", hint: "A citrus fruit.", translation: "Quiero un helado de naranja.", explanation: "Orange es naranja." },
  { id: 23, mission: 3, text: "The chocolate is ________.", options: ["brown", "white", "pink", "grey"], correctAnswer: "brown", hint: "Color of wood.", translation: "El chocolate es marrón.", explanation: "Brown es marrón." },
  { id: 24, mission: 3, text: "Milk comes from a ________.", options: ["cow", "cat", "dog", "lion"], correctAnswer: "cow", hint: "A farm animal.", translation: "La leche viene de la vaca.", explanation: "Cow es vaca." },
  { id: 25, mission: 3, text: "Apples are ________.", options: ["healthy", "bad", "scary", "noisy"], correctAnswer: "healthy", hint: "Good for you.", translation: "Las manzanas son saludables.", explanation: "Healthy es saludable." },
  { id: 26, mission: 3, text: "I eat with a ________.", options: ["fork", "shoe", "hat", "book"], correctAnswer: "fork", hint: "Used for pasta.", translation: "Como con un tenedor.", explanation: "Fork es tenedor." },
  { id: 27, mission: 3, text: "Water is ________.", options: ["good", "bad", "hot", "dry"], correctAnswer: "good", hint: "Essential for life.", translation: "El agua es buena.", explanation: "Good es bueno." },
  { id: 28, mission: 3, text: "The pizza is ________.", options: ["delicious", "sad", "angry", "blue"], correctAnswer: "delicious", hint: "Very yummy.", translation: "La pizza está deliciosa.", explanation: "Delicious es delicioso." },
  { id: 29, mission: 3, text: "I like ________ juice.", options: ["apple", "bread", "cheese", "meat"], correctAnswer: "apple", hint: "From a red fruit.", translation: "Me gusta el zumo de manzana.", explanation: "Apple es manzana." }
];

export const SCRAMBLE_QUESTIONS: ScrambleQuestion[] = [
  { id: 1, sentence: "The green dinosaur eats pizza", translation: "El dinosaurio verde come pizza" },
  { id: 2, sentence: "My robot helps me study", translation: "Mi robot me ayuda a estudiar" },
  { id: 3, sentence: "I love sweet chocolate cake", translation: "Amo el pastel de chocolate dulce" },
  { id: 4, sentence: "The pirate found the treasure", translation: "El pirata encontró el tesoro" },
  { id: 5, sentence: "Astronauts travel to the stars", translation: "Los astronautas viajan a las estrellas" }
];
