
import { Question, ScrambleQuestion } from './types';

export const FELIPE_SYSTEM_PROMPT = `You are Felipe, a friendly and enthusiastic green dinosaur who loves helping children aged 10-12 learn English. 
Your tone is encouraging, fun, and adventurous. 
You speak mostly in English using simple A1/A2-level vocabulary. 
When a child asks something, respond with short, clear sentences. 
You can provide brief Spanish translations in parentheses if the word is difficult. 
You love technology, extreme sports, and making new friends. 
Always encourage the user to practice their English.
Be funny but always helpful.`;

export const PRIZES = [
  { id: 1, name: "Chip de Cristal", icon: "💎" },
  { id: 2, name: "Skate de Oro", icon: "🛹" },
  { id: 3, name: "Medalla Olímpica", icon: "🥇" },
  { id: 4, name: "Brújula de Esmeralda", icon: "🧭" },
  { id: 5, name: "Núcleo de Fusión", icon: "⚛️" },
  { id: 6, name: "Auriculares de Platino", icon: "🎧" }
];

export const QUESTIONS: Question[] = [
  // MUNDO 1: PIXEL ACADEMY 💻
  { id: 1, mission: 1, text: "I need a fast ________ to play games.", options: ["computer", "chair", "bed", "window"], correctAnswer: "computer", hint: "It has a CPU.", translation: "Necesito una computadora rápida para jugar.", explanation: "Computer es computadora." },
  { id: 2, mission: 1, text: "The password is very ________.", options: ["secure", "salty", "green", "heavy"], correctAnswer: "secure", hint: "Safety first!", translation: "La contraseña es muy segura.", explanation: "Secure es seguro." },
  { id: 3, mission: 1, text: "Please ________ the file now.", options: ["download", "eat", "dance", "sleep"], correctAnswer: "download", hint: "Get it from the internet.", translation: "Por favor descarga el archivo ahora.", explanation: "Download es descargar." },
  { id: 4, mission: 1, text: "My screen is ________.", options: ["broken", "angry", "hungry", "sad"], correctAnswer: "broken", hint: "It has a crack.", translation: "Mi pantalla está rota.", explanation: "Broken es roto." },
  { id: 5, mission: 1, text: "Connect to the ________ network.", options: ["wireless", "wooden", "spicy", "cold"], correctAnswer: "wireless", hint: "No cables!", translation: "Conéctate a la red inalámbrica.", explanation: "Wireless es inalámbrico." },
  { id: 6, mission: 1, text: "The robot has a clever ________.", options: ["brain", "apple", "shoe", "socks"], correctAnswer: "brain", hint: "Where it thinks.", translation: "El robot tiene un cerebro inteligente.", explanation: "Brain es cerebro." },
  { id: 7, mission: 1, text: "I like to ________ online.", options: ["chat", "cook", "swim", "fly"], correctAnswer: "chat", hint: "Talk with friends.", translation: "Me gusta chatear en línea.", explanation: "Chat es charlar." },
  { id: 8, mission: 1, text: "Use the ________ to click.", options: ["mouse", "cat", "dog", "bird"], correctAnswer: "mouse", hint: "Not the animal!", translation: "Usa el ratón para hacer clic.", explanation: "Mouse es ratón." },
  { id: 9, mission: 1, text: "The battery is ________.", options: ["low", "tall", "blue", "hot"], correctAnswer: "low", hint: "Needs charging.", translation: "La batería está baja.", explanation: "Low es bajo." },
  { id: 10, mission: 1, text: "Turn on the ________.", options: ["monitor", "pizza", "grass", "cloud"], correctAnswer: "monitor", hint: "The screen.", translation: "Enciende el monitor.", explanation: "Monitor es monitor." },
  
  // MUNDO 2: ADVENTURE STREET 🛹
  { id: 11, mission: 2, text: "I go to the ________ with my friends.", options: ["skatepark", "forest", "moon", "cloud"], correctAnswer: "skatepark", hint: "Where the ramps are.", translation: "Voy al skatepark con mis amigos.", explanation: "Skatepark es pista de patinaje." },
  { id: 12, mission: 2, text: "The city is very ________ tonight.", options: ["busy", "small", "pink", "sour"], correctAnswer: "busy", hint: "Many cars and people.", translation: "La ciudad está muy concurrida esta noche.", explanation: "Busy es ocupada/concurrida." },
  { id: 13, mission: 2, text: "Wait for the ________ light.", options: ["green", "purple", "white", "black"], correctAnswer: "green", hint: "Now you can go.", translation: "Espera a la luz verde.", explanation: "Green es verde." },
  { id: 14, mission: 2, text: "Let's take the ________ to school.", options: ["bus", "plane", "ship", "horse"], correctAnswer: "bus", hint: "Yellow transport.", translation: "Tomemos el autobús a la escuela.", explanation: "Bus es autobús." },
  { id: 15, mission: 2, text: "My ________ is very fast.", options: ["scooter", "apple", "book", "pencil"], correctAnswer: "scooter", hint: "Two wheels and a handle.", translation: "Mi patinete es muy rápido.", explanation: "Scooter es patinete." },
  { id: 16, mission: 2, text: "My new shoes are ________.", options: ["cool", "angry", "hungry", "tired"], correctAnswer: "cool", hint: "Stylish!", translation: "Mis zapatos nuevos son geniales.", explanation: "Cool es genial." },
  { id: 17, mission: 2, text: "Turn ________ at the corner.", options: ["left", "up", "blue", "down"], correctAnswer: "left", hint: "Opposite of right.", translation: "Gira a la izquierda en la esquina.", explanation: "Left es izquierda." },
  { id: 18, mission: 2, text: "I'm wearing a black ________.", options: ["hoodie", "pizza", "pencil", "tree"], correctAnswer: "hoodie", hint: "A warm jacket with a hood.", translation: "Llevo puesta una sudadera negra.", explanation: "Hoodie es sudadera." },
  { id: 19, mission: 2, text: "The music is too ________.", options: ["loud", "heavy", "sweet", "dry"], correctAnswer: "loud", hint: "High volume!", translation: "La música está muy alta.", explanation: "Loud es fuerte/alto." },
  { id: 20, mission: 2, text: "See you at the ________ stop.", options: ["metro", "mountain", "beach", "sky"], correctAnswer: "metro", hint: "Underground train.", translation: "Nos vemos en la parada del metro.", explanation: "Metro es metro." },

  // MUNDO 3: OLYMPIC ARENA 🏆
  { id: 21, mission: 3, text: "She is a very fast ________.", options: ["runner", "cook", "teacher", "driver"], correctAnswer: "runner", hint: "She wins races.", translation: "Ella es una corredora muy rápida.", explanation: "Runner es corredor." },
  { id: 22, mission: 3, text: "You need to ________ every day.", options: ["exercise", "shout", "cry", "fall"], correctAnswer: "exercise", hint: "Move your body.", translation: "Necesitas hacer ejercicio todos los días.", explanation: "Exercise es ejercicio." },
  { id: 23, mission: 3, text: "The team won the ________.", options: ["match", "water", "bread", "shoe"], correctAnswer: "match", hint: "The game.", translation: "El equipo ganó el partido.", explanation: "Match es partido." },
  { id: 24, mission: 3, text: "I want to be ________.", options: ["strong", "sad", "weak", "tiny"], correctAnswer: "strong", hint: "Like a superhero.", translation: "Quiero ser fuerte.", explanation: "Strong es fuerte." },
  { id: 25, mission: 3, text: "Pass me the ________ please.", options: ["helmet", "apple", "cat", "chair"], correctAnswer: "helmet", hint: "Protect your head.", translation: "Pásame el casco por favor.", explanation: "Helmet es casco." },

  // MISION 6: CAZADOR DE PALABRAS 🔊 (Audio -> Imagen)
  { id: 61, mission: 6, text: "Headphones", options: ["🎧", "👓", "⌚", "🎒"], correctAnswer: "🎧", hint: "", translation: "Auriculares", explanation: "Headphones" },
  { id: 62, mission: 6, text: "Telescope", options: ["🔭", "🔬", "🔦", "📷"], correctAnswer: "🔭", hint: "", translation: "Telescopio", explanation: "Telescope" },
  { id: 63, mission: 6, text: "Joystick", options: ["🕹️", "🖱️", "⌨️", "💻"], correctAnswer: "🕹️", hint: "", translation: "Mando de juego", explanation: "Joystick" },
  { id: 64, mission: 6, text: "Compass", options: ["🧭", "🗺️", "🔦", "⛺"], correctAnswer: "🧭", hint: "", translation: "Brújula", explanation: "Compass" },
  { id: 65, mission: 6, text: "Satellite", options: ["🛰️", "🚀", "🛸", "☄️"], correctAnswer: "🛰️", hint: "", translation: "Satélite", explanation: "Satellite" },
  { id: 66, mission: 6, text: "Microscope", options: ["🔬", "🔭", "🧪", "🧫"], correctAnswer: "🔬", hint: "", translation: "Microscopio", explanation: "Microscope" },
  { id: 67, mission: 6, text: "Sneakers", options: ["👟", "👕", "👖", "🧢"], correctAnswer: "👟", hint: "", translation: "Zapatillas", explanation: "Sneakers" },
  { id: 68, mission: 6, text: "Skateboard", options: ["🛹", "🚲", "🛵", "🛴"], correctAnswer: "🛹", hint: "", translation: "Monopatín", explanation: "Skateboard" },
  { id: 69, mission: 6, text: "Drone", options: ["🚁", "🛸", "✈️", "🚀"], correctAnswer: "🚁", hint: "", translation: "Dron", explanation: "Drone" },
  { id: 70, mission: 6, text: "Smartwatch", options: ["⌚", "📱", "💻", "📟"], correctAnswer: "⌚", hint: "", translation: "Reloj inteligente", explanation: "Smartwatch" }
];

export const SCRAMBLE_QUESTIONS: ScrambleQuestion[] = [
  { id: 1, sentence: "The robot can code very fast", translation: "El robot puede programar muy rápido" },
  { id: 2, sentence: "I lost my gaming password today", translation: "Perdí mi contraseña de juego hoy" },
  { id: 3, sentence: "The city street is very busy", translation: "La calle de la ciudad está muy concurrida" },
  { id: 4, sentence: "I love skating with my friends", translation: "Amo patinar con mis amigos" },
  { id: 5, sentence: "The athlete wins the gold medal", translation: "El atleta gana la medalla de oro" },
  { id: 6, sentence: "Exercise is good for your body", translation: "El ejercicio es bueno para tu cuerpo" },
  { id: 7, sentence: "The wild wolf lives in nature", translation: "El lobo salvaje vive en la naturaleza" },
  { id: 8, sentence: "Protect the earth and the trees", translation: "Protege la tierra y los árboles" },
  { id: 9, sentence: "Astronauts travel to distant stars", translation: "Los astronautas viajan a estrellas lejanas" },
  { id: 10, sentence: "Gravity makes the planets move slow", translation: "La gravedad hace que los planeta se muevan lento" }
];
