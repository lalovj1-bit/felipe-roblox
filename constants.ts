
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
  { id: 1, mission: 1, text: "Felipe: Hello! My name ________ Felipe. What is your name?", options: ["am", "is", "are", "be"], correctAnswer: "is", hint: "Verbo To Be para 'My name'.", translation: "¡Hola! Mi nombre es Felipe.", explanation: "Usamos 'is' para nombres en singular." },
  { id: 2, mission: 1, text: "Felipe: Nice to meet you! How ________ you today?", options: ["do", "am", "are", "is"], correctAnswer: "are", hint: "Pregunta de saludo.", translation: "¡Gusto en conocerte! ¿Cómo estás hoy?", explanation: "Con 'you' siempre usamos 'are'." },
  { id: 3, mission: 1, text: "Felipe: I am happy! Look at the ________! They are big and blue.", options: ["cars", "waves", "dogs", "pencils"], correctAnswer: "waves", hint: "Están en el mar.", translation: "¡Estoy feliz! ¡Mira las olas!", explanation: "Waves son las olas del mar." },
  { id: 4, mission: 1, text: "Felipe: Let's build a ________ on the sand together!", options: ["computer", "pizza", "sandcastle", "bicycle"], correctAnswer: "sandcastle", hint: "Un castillo de...", translation: "¡Construyamos un castillo de arena juntos!", explanation: "Sand (arena) + Castle (castillo)." },
  { id: 5, mission: 1, text: "Felipe: Wait! The sun is hot. We need ________ for our eyes.", options: ["gloves", "socks", "sunglasses", "boots"], correctAnswer: "sunglasses", hint: "Protección visual.", translation: "¡Espera! El sol quema. Necesitamos gafas.", explanation: "Sunglasses protegen del sol." },

  // MISIÓN 2: NATURE CAMP
  { id: 11, mission: 2, text: "Felipe: Now we are in the forest! We sleep in this ________.", options: ["airplane", "tent", "hotel", "cinema"], correctAnswer: "tent", hint: "Donde duermes al acampar.", translation: "¡Ahora estamos en el bosque! Dormimos en esta carpa.", explanation: "Tent es una tienda de campaña." },
  { id: 12, mission: 2, text: "Felipe: Good morning! I am hungry. I want to ________ breakfast.", options: ["sleep", "eat", "jump", "fly"], correctAnswer: "eat", hint: "Acción con comida.", translation: "¡Buen día! Tengo hambre. Quiero desayunar.", explanation: "Eat es comer." },
  { id: 13, mission: 2, text: "Felipe: The trees are very ________. I can't see the top!", options: ["tall", "small", "short", "red"], correctAnswer: "tall", hint: "Mucho tamaño hacia arriba.", translation: "Los árboles son muy altos.", explanation: "Tall se usa para altura física." },
  { id: 14, mission: 2, text: "Felipe: Grab your ________. Let's go for a walk in the mountains.", options: ["pillow", "backpack", "television", "spoon"], correctAnswer: "backpack", hint: "Cargas tus cosas en ella.", translation: "Agarra tu mochila. Vamos a caminar.", explanation: "Backpack es mochila." },
  { id: 15, mission: 2, text: "Felipe: It is dark now. Switch on your ________ please.", options: ["mirror", "flashlight", "brush", "key"], correctAnswer: "flashlight", hint: "Luz portátil.", translation: "Está oscuro ahora. Prende tu linterna.", explanation: "Flashlight es linterna." },

  // MISIÓN 3: AIRPORT
  { id: 21, mission: 3, text: "Felipe: It's time to fly! We are at the ________.", options: ["supermarket", "airport", "school", "beach"], correctAnswer: "airport", hint: "Donde están los aviones.", translation: "¡Es hora de volar! Estamos en el aeropuerto.", explanation: "Airport es aeropuerto." },
  { id: 22, mission: 3, text: "Felipe: Check your bag. My ________ is very heavy.", options: ["suitcase", "wallet", "pencil", "hat"], correctAnswer: "suitcase", hint: "Donde guardas la ropa.", translation: "Revisa tu bolso. Mi maleta está muy pesada.", explanation: "Suitcase es maleta." },
  { id: 23, mission: 3, text: "Felipe: Do you have your ________? We need it for the plane.", options: ["cookie", "ball", "passport", "shampoo"], correctAnswer: "passport", hint: "Documento de viaje.", translation: "¿Tienes tu pasaporte?", explanation: "Passport es pasaporte." },
  { id: 24, mission: 3, text: "Felipe: Look! The ________ is ready to fly in the sky.", options: ["bicycle", "airplane", "car", "bus"], correctAnswer: "airplane", hint: "Vuela sobre las nubes.", translation: "¡Mira! El avión está listo.", explanation: "Airplane es avión." },
  { id: 25, mission: 3, text: "Felipe: Please, sit down and fasten your ________.", options: ["seatbelt", "shoes", "glasses", "watch"], correctAnswer: "seatbelt", hint: "Cinturón de seguridad.", translation: "Por favor, siéntate y abrocha tu cinturón.", explanation: "Seatbelt es cinturón de seguridad." },

  // MISIÓN 4: THEME PARK
  { id: 31, mission: 4, text: "Felipe: Wow! This park is amazing. I am very ________!", options: ["sad", "excited", "angry", "bored"], correctAnswer: "excited", hint: "Muy feliz.", translation: "¡Guau! Este parque es increíble. ¡Estoy muy emocionado!", explanation: "Excited es emocionado." },
  { id: 32, mission: 4, text: "Felipe: The ________ is so fast! AAAHHH!", options: ["bench", "roller coaster", "tree", "cloud"], correctAnswer: "roller coaster", hint: "La atracción más rápida.", translation: "¡La montaña rusa es muy rápida!", explanation: "Roller coaster es montaña rusa." },
  { id: 33, mission: 4, text: "Felipe: I am thirsty. Can I have some ________?", options: ["water", "pizza", "hamburger", "bread"], correctAnswer: "water", hint: "Líquido para beber.", translation: "Tengo sed. ¿Puedo tomar agua?", explanation: "Water es agua." },
  { id: 34, mission: 4, text: "Felipe: That ________ candy is very pink and sweet.", options: ["cotton", "meat", "fish", "potato"], correctAnswer: "cotton", hint: "Algodón de...", translation: "Ese algodón de azúcar es rosa.", explanation: "Cotton candy es algodón de azúcar." },
  { id: 35, mission: 4, text: "Felipe: Let's take a ________ with that giant dinosaur!", options: ["bath", "photo", "nap", "shower"], correctAnswer: "photo", hint: "Imagen con cámara.", translation: "¡Tomémonos una foto!", explanation: "Take a photo es tomar una foto." }
];
