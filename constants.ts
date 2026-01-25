
import { Question, ScrambleQuestion } from './types';

export const QUESTIONS: Question[] = [
  // MUNDO 1: DINO LAND 🦖 (Naturaleza y Básicos)
  { id: 1, mission: 1, text: "The dinosaur is very ________.", options: ["big", "small", "blue", "fast"], correctAnswer: "big", hint: "Like an elephant!", translation: "El dinosaurio es muy grande.", explanation: "Big es grande." },
  { id: 2, mission: 1, text: "I see a green ________ in the forest.", options: ["tree", "car", "phone", "pizza"], correctAnswer: "tree", hint: "It has leaves.", translation: "Veo un árbol verde en el bosque.", explanation: "Tree es árbol." },
  { id: 3, mission: 1, text: "The sky is ________ today.", options: ["blue", "red", "yellow", "pink"], correctAnswer: "blue", hint: "The color of the ocean.", translation: "El cielo está azul hoy.", explanation: "Blue es azul." },
  { id: 4, mission: 1, text: "Felipe has a long ________.", options: ["tail", "hat", "book", "shoe"], correctAnswer: "tail", hint: "Dinos wag this!", translation: "Felipe tiene una cola larga.", explanation: "Tail es cola." },
  { id: 5, mission: 1, text: "The volcano is ________.", options: ["hot", "cold", "funny", "sad"], correctAnswer: "hot", hint: "Opposite of cold.", translation: "El volcán está caliente.", explanation: "Hot es caliente." },
  { id: 6, mission: 1, text: "I ________ with my eyes.", options: ["see", "hear", "smell", "taste"], correctAnswer: "see", hint: "Using your vision.", translation: "Veo con mis ojos.", explanation: "See es ver." },
  { id: 7, mission: 1, text: "Grass is ________.", options: ["green", "purple", "white", "black"], correctAnswer: "green", hint: "The color of nature.", translation: "La hierba es verde.", explanation: "Green es verde." },
  { id: 8, mission: 1, text: "The sun is a ________.", options: ["star", "planet", "moon", "cloud"], correctAnswer: "star", hint: "A bright light in space.", translation: "El sol es una estrella.", explanation: "Star es estrella." },
  { id: 9, mission: 1, text: "Birds can ________ very high.", options: ["fly", "swim", "cook", "read"], correctAnswer: "fly", hint: "Moving in the air.", translation: "Los pájaros pueden volar muy alto.", explanation: "Fly es volar." },
  { id: 10, mission: 1, text: "I love my ________.", options: ["family", "pencil", "socks", "box"], correctAnswer: "family", hint: "Mom, Dad, and you.", translation: "Amo a mi familia.", explanation: "Family es familia." },

  // MUNDO 2: CYBER CITY 🤖 (Tecnología)
  { id: 11, mission: 2, text: "The robot can ________.", options: ["dance", "eat", "sleep", "cry"], correctAnswer: "dance", hint: "Moving to music.", translation: "El robot puede bailar.", explanation: "Dance es bailar." },
  { id: 12, mission: 2, text: "I use a ________ to play games.", options: ["computer", "spoon", "pillow", "brush"], correctAnswer: "computer", hint: "A smart machine.", translation: "Uso una computadora para jugar.", explanation: "Computer es computadora." },
  { id: 13, mission: 2, text: "My phone is ________.", options: ["new", "hungry", "angry", "old"], correctAnswer: "new", hint: "Not old.", translation: "Mi teléfono es nuevo.", explanation: "New es nuevo." },
  { id: 14, mission: 2, text: "The lights are ________.", options: ["bright", "dark", "heavy", "slow"], correctAnswer: "bright", hint: "Very much light.", translation: "Las luces son brillantes.", explanation: "Bright es brillante." },
  { id: 15, mission: 2, text: "I have a fast ________.", options: ["internet", "bread", "chair", "tree"], correctAnswer: "internet", hint: "Global network.", translation: "Tengo un internet rápido.", explanation: "Internet es internet." },
  { id: 16, mission: 2, text: "The battery is ________.", options: ["full", "empty", "happy", "sad"], correctAnswer: "full", hint: "100 percent.", translation: "La batería está llena.", explanation: "Full es lleno." },
  { id: 17, mission: 2, text: "Press the ________ button.", options: ["red", "blue", "green", "yellow"], correctAnswer: "red", hint: "The color of an apple.", translation: "Pulsa el botón rojo.", explanation: "Red es rojo." },
  { id: 18, mission: 2, text: "I take a ________ with my camera.", options: ["photo", "sandwich", "bath", "walk"], correctAnswer: "photo", hint: "A picture.", translation: "Hago una foto con mi cámara.", explanation: "Photo es foto." },
  { id: 19, mission: 2, text: "The screen is ________.", options: ["touch", "eat", "run", "jump"], correctAnswer: "touch", hint: "Use your fingers.", translation: "La pantalla es táctil.", explanation: "Touch es tocar." },
  { id: 20, mission: 2, text: "Robots don't ________.", options: ["sleep", "talk", "walk", "move"], correctAnswer: "sleep", hint: "They are always on!", translation: "Los robots no duermen.", explanation: "Sleep es dormir." },

  // MUNDO 3: SWEET KINGDOM 🍭 (Comida)
  { id: 21, mission: 3, text: "The cake is ________.", options: ["sweet", "salty", "sour", "bitter"], correctAnswer: "sweet", hint: "Like sugar.", translation: "El pastel es dulce.", explanation: "Sweet es dulce." },
  { id: 22, mission: 3, text: "I want an ________ ice cream.", options: ["orange", "apple", "onion", "egg"], correctAnswer: "orange", hint: "A citrus fruit.", translation: "Quiero un helado de naranja.", explanation: "Orange es naranja." },
  { id: 23, mission: 3, text: "The chocolate is ________.", options: ["brown", "white", "pink", "grey"], correctAnswer: "brown", hint: "Color of wood.", translation: "El chocolate es marrón.", explanation: "Brown es marrón." },
  { id: 24, mission: 3, text: "Milk comes from a ________.", options: ["cow", "cat", "dog", "lion"], correctAnswer: "cow", hint: "A farm animal.", translation: "La leche viene de la vaca.", explanation: "Cow es vaca." },
  { id: 25, mission: 3, text: "Apples are ________.", options: ["healthy", "bad", "scary", "noisy"], correctAnswer: "healthy", hint: "Good for you.", translation: "Las manzanas son saludables.", explanation: "Healthy es saludable." },
  { id: 26, mission: 3, text: "I eat with a ________.", options: ["fork", "shoe", "hat", "book"], correctAnswer: "fork", hint: "Used for pasta.", translation: "Como con un tenedor.", explanation: "Fork es tenedor." },
  { id: 27, mission: 3, text: "Water is ________.", options: ["good", "bad", "hot", "dry"], correctAnswer: "good", hint: "Essential for life.", translation: "El agua es buena.", explanation: "Good es bueno." },
  { id: 28, mission: 3, text: "The pizza is ________.", options: ["delicious", "sad", "angry", "blue"], correctAnswer: "delicious", hint: "Very yummy.", translation: "La pizza está deliciosa.", explanation: "Delicious es delicioso." },
  { id: 29, mission: 3, text: "I like ________ juice.", options: ["apple", "bread", "cheese", "meat"], correctAnswer: "apple", hint: "From a red fruit.", translation: "Me gusta el zumo de manzana.", explanation: "Apple es manzana." },
  { id: 30, mission: 3, text: "Cookies are ________.", options: ["crunchy", "soft", "hot", "fast"], correctAnswer: "crunchy", hint: "They make a sound when you eat!", translation: "Las galletas son crujientes.", explanation: "Crunchy es crujiente." },

  // MUNDO 4: PIRATE COVE 🏴‍☠️ (Aventura)
  { id: 31, mission: 4, text: "The ship is in the ________.", options: ["ocean", "forest", "desert", "city"], correctAnswer: "ocean", hint: "Big salt water.", translation: "El barco está en el océano.", explanation: "Ocean es océano." },
  { id: 32, mission: 4, text: "The pirate has a ________.", options: ["map", "phone", "bike", "car"], correctAnswer: "map", hint: "To find gold.", translation: "El pirata tiene un mapa.", explanation: "Map es mapa." },
  { id: 33, mission: 4, text: "I found the ________!", options: ["treasure", "homework", "socks", "trash"], correctAnswer: "treasure", hint: "Gold and gems.", translation: "¡Encontré el tesoro!", explanation: "Treasure es tesoro." },
  { id: 34, mission: 4, text: "The parrot says ________!", options: ["hello", "goodbye", "no", "yes"], correctAnswer: "hello", hint: "A greeting.", translation: "¡El loro dice hola!", explanation: "Hello es hola." },
  { id: 35, mission: 4, text: "The island is ________.", options: ["far", "near", "big", "small"], correctAnswer: "far", hint: "Not close.", translation: "La isla está lejos.", explanation: "Far es lejos." },
  { id: 36, mission: 4, text: "We need a ________.", options: ["boat", "plane", "train", "bus"], correctAnswer: "boat", hint: "To travel on water.", translation: "Necesitamos un bote.", explanation: "Boat es bote." },
  { id: 37, mission: 4, text: "Look at the ________!", options: ["flag", "tree", "dog", "cat"], correctAnswer: "flag", hint: "Pirate skull sign.", translation: "¡Mira la bandera!", explanation: "Flag es bandera." },
  { id: 38, mission: 4, text: "The captain is ________.", options: ["brave", "scared", "little", "pink"], correctAnswer: "brave", hint: "Not afraid.", translation: "El capitán es valiente.", explanation: "Brave es valiente." },
  { id: 39, mission: 4, text: "The sword is ________.", options: ["silver", "paper", "wood", "glass"], correctAnswer: "silver", hint: "A shiny metal.", translation: "La espada es de plata.", explanation: "Silver es plata." },
  { id: 40, mission: 4, text: "I want to be a ________.", options: ["hero", "monster", "rock", "table"], correctAnswer: "hero", hint: "A good person.", translation: "Quiero ser un héroe.", explanation: "Hero es héroe." },

  // MUNDO 5: STAR GALAXY 🌌 (Espacio y Final)
  { id: 41, mission: 5, text: "The ________ is full of stars.", options: ["galaxy", "room", "box", "pocket"], correctAnswer: "galaxy", hint: "The whole universe.", translation: "La galaxia está llena de estrellas.", explanation: "Galaxy es galaxia." },
  { id: 42, mission: 5, text: "I wear a ________ suit.", options: ["space", "swim", "sleep", "snow"], correctAnswer: "space", hint: "For astronauts.", translation: "Llevo un traje espacial.", explanation: "Space es espacio." },
  { id: 43, mission: 5, text: "The rocket is ________.", options: ["fast", "slow", "funny", "sad"], correctAnswer: "fast", hint: "Like a racing car.", translation: "El cohete es rápido.", explanation: "Fast es rápido." },
  { id: 44, mission: 5, text: "Mars is the ________ planet.", options: ["red", "blue", "green", "white"], correctAnswer: "red", hint: "Color of a tomato.", translation: "Marte es el planeta rojo.", explanation: "Red es rojo." },
  { id: 45, mission: 5, text: "I see the ________ through the window.", options: ["moon", "sun", "earth", "stars"], correctAnswer: "moon", hint: "White circle at night.", translation: "Veo la luna por la ventana.", explanation: "Moon es luna." },
  { id: 46, mission: 5, text: "Gravity is ________.", options: ["low", "high", "blue", "fast"], correctAnswer: "low", hint: "You can jump very high!", translation: "La gravedad es baja.", explanation: "Low es bajo." },
  { id: 47, mission: 5, text: "Alien friends are ________.", options: ["kind", "bad", "noisy", "angry"], correctAnswer: "kind", hint: "They are nice.", translation: "Los amigos alienígenas son amables.", explanation: "Kind es amable." },
  { id: 48, mission: 5, text: "The journey is ________.", options: ["long", "short", "easy", "bad"], correctAnswer: "long", hint: "It takes much time.", translation: "El viaje es largo.", explanation: "Long es largo." },
  { id: 49, mission: 5, text: "I am a space ________.", options: ["traveler", "cook", "driver", "doctor"], correctAnswer: "traveler", hint: "Someone who journeys.", translation: "Soy un viajero espacial.", explanation: "Traveler es viajero." },
  { id: 50, mission: 5, text: "The mission is ________.", options: ["finished", "starting", "bad", "blue"], correctAnswer: "finished", hint: "The end!", translation: "La misión ha terminado.", explanation: "Finished es terminado." }
];

export const SCRAMBLE_QUESTIONS: ScrambleQuestion[] = [
  { id: 501, sentence: "The astronaut visits the red planet", translation: "El astronauta visita el planeta rojo" },
  { id: 502, sentence: "The giant whale swims in the ocean", translation: "La ballena gigante nada en el océano" }
];
