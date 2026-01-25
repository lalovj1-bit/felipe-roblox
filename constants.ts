
import { Question, ScrambleQuestion } from './types';

export const SCRAMBLE_QUESTIONS: ScrambleQuestion[] = [
  { id: 101, sentence: "I love walking in the city", translation: "Amo caminar en la ciudad" },
  { id: 102, sentence: "The museum is very big and old", translation: "El museo es muy grande y viejo" },
  { id: 103, sentence: "We can buy a nice souvenir here", translation: "Podemos comprar un lindo recuerdo aquí" },
  { id: 104, sentence: "I want to eat a delicious pizza", translation: "Quiero comer una pizza deliciosa" },
  { id: 105, sentence: "The guide is showing us the park", translation: "El guía nos está mostrando el parque" },
  { id: 106, sentence: "Where is the famous central square", translation: "¿Dónde está la famosa plaza central?" },
  { id: 107, sentence: "I am taking photos of the street", translation: "Estoy tomando fotos de la calle" },
  { id: 108, sentence: "The tourist bus is yellow and fast", translation: "El bus turístico es amarillo y rápido" },
  { id: 109, sentence: "Let's send a postcard to my friend", translation: "Enviemos una postal a mi amigo" },
  { id: 110, sentence: "The city trip is over goodbye friend", translation: "El viaje por la ciudad terminó adiós amigo" }
];

export const QUESTIONS: Question[] = [
  // MISIÓN 1: BEACH PARTY
  { id: 1, mission: 1, text: "Felipe: Hello! My name ________ Felipe. What is your name?", options: ["am", "is", "are", "be"], correctAnswer: "is", hint: "Verbo To Be.", translation: "¡Hola! Mi nombre es Felipe.", explanation: "Usamos 'is' para singular." },
  { id: 2, mission: 1, text: "Felipe: Nice to meet you! How ________ you today?", options: ["is", "do", "are", "am"], correctAnswer: "are", hint: "Saludo.", translation: "¡Gusto en conocerte! ¿Cómo estás hoy?", explanation: "Con 'you' usamos 'are'." },
  { id: 3, mission: 1, text: "Felipe: I am happy! Look at the ________! They are big and blue.", options: ["cars", "waves", "pencils", "dogs"], correctAnswer: "waves", hint: "En el mar.", translation: "¡Estoy feliz! ¡Mira las olas!", explanation: "Waves son las olas." },
  { id: 4, mission: 1, text: "Felipe: Let's build a ________ on the sand together!", options: ["computer", "sandcastle", "pizza", "bicycle"], correctAnswer: "sandcastle", hint: "En la arena.", translation: "¡Construyamos un castillo de arena!", explanation: "Sandcastle: Castillo de arena." },
  { id: 5, mission: 1, text: "Felipe: Wait! The sun is hot. We need ________ for our eyes.", options: ["gloves", "socks", "boots", "sunglasses"], correctAnswer: "sunglasses", hint: "Gafas.", translation: "Necesitamos gafas.", explanation: "Sunglasses: Gafas de sol." },

  // MISIÓN 2: NATURE CAMP
  { id: 11, mission: 2, text: "Felipe: Now we are in the forest! We sleep in this ________.", options: ["airplane", "tent", "hotel", "cinema"], correctAnswer: "tent", hint: "Para acampar.", translation: "Dormimos en esta carpa.", explanation: "Tent: Carpa." },
  { id: 12, mission: 2, text: "Felipe: Good morning! I am hungry. I want to ________ breakfast.", options: ["sleep", "eat", "jump", "fly"], correctAnswer: "eat", hint: "Comida.", translation: "Quiero desayunar.", explanation: "Eat: Comer." },
  { id: 13, mission: 2, text: "Felipe: The trees are very ________. I can't see the top!", options: ["small", "short", "tall", "red"], correctAnswer: "tall", hint: "Altura.", translation: "Los árboles son muy altos.", explanation: "Tall: Alto." },
  { id: 14, mission: 2, text: "Felipe: Grab your ________. Let's go for a walk in the mountains.", options: ["backpack", "pillow", "television", "spoon"], correctAnswer: "backpack", hint: "Para cargar cosas.", translation: "Agarra tu mochila.", explanation: "Backpack: Mochila." },
  { id: 15, mission: 2, text: "Felipe: It is dark now. Switch on your ________ please.", options: ["mirror", "flashlight", "brush", "key"], correctAnswer: "flashlight", hint: "Luz.", translation: "Prende tu linterna.", explanation: "Flashlight: Linterna." },

  // MISIÓN 3: AIRPORT
  { id: 21, mission: 3, text: "Felipe: It's time to fly! We are at the ________.", options: ["supermarket", "airport", "school", "beach"], correctAnswer: "airport", hint: "Aviones.", translation: "Estamos en el aeropuerto.", explanation: "Airport: Aeropuerto." },
  { id: 22, mission: 3, text: "Felipe: Check your bag. My ________ is very heavy.", options: ["suitcase", "wallet", "pencil", "hat"], correctAnswer: "suitcase", hint: "Maleta.", translation: "Mi maleta está pesada.", explanation: "Suitcase: Maleta." },
  { id: 23, mission: 3, text: "Felipe: Do you have your ________? We need it for the plane.", options: ["cookie", "ball", "shampoo", "passport"], correctAnswer: "passport", hint: "Documento.", translation: "¿Tienes tu pasaporte?", explanation: "Passport: Pasaporte." },
  { id: 24, mission: 3, text: "Felipe: Look! The ________ is ready to fly in the sky.", options: ["airplane", "bicycle", "car", "bus"], correctAnswer: "airplane", hint: "Vuela.", translation: "El avión está listo.", explanation: "Airplane: Avión." },
  { id: 25, mission: 3, text: "Felipe: Please, sit down and fasten your ________.", options: ["seatbelt", "shoes", "glasses", "watch"], correctAnswer: "seatbelt", hint: "Cinturón.", translation: "Abrocha tu cinturón.", explanation: "Seatbelt: Cinturón." },

  // MISIÓN 4: THEME PARK
  { id: 31, mission: 4, text: "Felipe: Wow! This park is amazing. I am very ________!", options: ["sad", "excited", "angry", "bored"], correctAnswer: "excited", hint: "Feliz.", translation: "¡Estoy muy emocionado!", explanation: "Excited: Emocionado." },
  { id: 32, mission: 4, text: "Felipe: The ________ is so fast! AAAHHH!", options: ["bench", "roller coaster", "tree", "cloud"], correctAnswer: "roller coaster", hint: "Atracción.", translation: "¡La montaña rusa es rápida!", explanation: "Roller coaster: Montaña rusa." },
  { id: 33, mission: 4, text: "Felipe: I am thirsty. Can I have some ________?", options: ["pizza", "water", "hamburger", "bread"], correctAnswer: "water", hint: "Beber.", translation: "¿Puedo tomar agua?", explanation: "Water: Agua." },
  { id: 34, mission: 4, text: "Felipe: That ________ candy is very pink and sweet.", options: ["meat", "fish", "cotton", "potato"], correctAnswer: "cotton", hint: "Algodón.", translation: "Ese algodón de azúcar.", explanation: "Cotton candy: Algodón de azúcar." },
  { id: 35, mission: 4, text: "Felipe: Let's take a ________ with that giant dinosaur!", options: ["photo", "bath", "nap", "shower"], correctAnswer: "photo", hint: "Cámara.", translation: "¡Tomémonos una foto!", explanation: "Photo: Foto." }
];
