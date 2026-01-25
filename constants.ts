
import { Question, ScrambleQuestion } from './types';

export const FELIPE_SYSTEM_PROMPT = `You are Felipe, a green dinosaur who loves English.
Keep answers very short and enthusiastic (max 15 words).
Encourage kids aged 10-12 to play.
Always provide a brief Spanish translation in parentheses for difficult words.
Example: "Great job! (¡Buen trabajo!) Let's go!"`;

export const PRIZES = [
  { id: 1, name: "Crystal Chip", icon: "💎" },
  { id: 2, name: "Golden Skate", icon: "🛹" },
  { id: 3, name: "Olympic Medal", icon: "🥇" },
  { id: 4, name: "Emerald Compass", icon: "🧭" },
  { id: 5, name: "Fusion Core", icon: "⚛️" },
  { id: 6, name: "Platinum Headphones", icon: "🎧" }
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
  { id: 2, sentence: "I lost my gaming password today", translation: "Perdí mi contraseña de juego hoy" }
];
