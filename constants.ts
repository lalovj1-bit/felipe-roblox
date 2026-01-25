
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
  { id: 5, name: "Núcleo de Fusión", icon: "⚛️" }
];

export const QUESTIONS: Question[] = [
  // MUNDO 1: PIXEL ACADEMY 💻 (Tecnología y Gaming)
  { id: 1, mission: 1, text: "I need a fast ________ to play games.", options: ["computer", "chair", "bed", "window"], correctAnswer: "computer", hint: "It has a CPU.", translation: "Necesito una computadora rápida para jugar.", explanation: "Computer es computadora." },
  { id: 2, mission: 1, text: "The password is very ________.", options: ["secure", "salty", "green", "heavy"], correctAnswer: "secure", hint: "Safety first!", translation: "La contraseña es muy segura.", explanation: "Secure es seguro." },
  { id: 3, mission: 1, text: "Please ________ the file now.", options: ["download", "eat", "dance", "sleep"], correctAnswer: "download", hint: "Get it from the internet.", translation: "Por favor descarga el archivo ahora.", explanation: "Download es descargar." },
  { id: 4, mission: 1, text: "My screen is ________.", options: ["broken", "angry", "hungry", "sad"], correctAnswer: "broken", hint: "It has a crack.", translation: "Mi pantalla está rota.", explanation: "Broken es roto." },
  { id: 6, mission: 1, text: "The robot has a clever ________.", options: ["brain", "apple", "shoe", "socks"], correctAnswer: "brain", hint: "Where it thinks.", translation: "El robot tiene un cerebro inteligente.", explanation: "Brain es cerebro." },
  { id: 7, mission: 1, text: "I like to ________ online.", options: ["chat", "cook", "swim", "fly"], correctAnswer: "chat", hint: "Talk with friends.", translation: "Me gusta chatear en línea.", explanation: "Chat es charlar." },
  { id: 8, mission: 1, text: "Use the ________ to click.", options: ["mouse", "cat", "dog", "bird"], correctAnswer: "mouse", hint: "Not the animal!", translation: "Usa el ratón para hacer clic.", explanation: "Mouse es ratón." },
  { id: 9, mission: 1, text: "The battery is ________.", options: ["low", "tall", "blue", "hot"], correctAnswer: "low", hint: "Needs charging.", translation: "La batería está baja.", explanation: "Low es bajo." },
  
  // MUNDO 2: ADVENTURE STREET 🛹 (Vida urbana y Skatepark)
  { id: 11, mission: 2, text: "I go to the ________ with my friends.", options: ["skatepark", "forest", "moon", "cloud"], correctAnswer: "skatepark", hint: "Where the ramps are.", translation: "Voy al skatepark con mis amigos.", explanation: "Skatepark es pista de patinaje." },
  { id: 12, mission: 2, text: "The city is very ________ tonight.", options: ["busy", "small", "pink", "sour"], correctAnswer: "busy", hint: "Many cars and people.", translation: "La ciudad está muy concurrida esta noche.", explanation: "Busy es ocupada/concurrida." },
  { id: 13, mission: 2, text: "Wait for the ________ light.", options: ["green", "purple", "white", "black"], correctAnswer: "green", hint: "Now you can go.", translation: "Espera a la luz verde.", explanation: "Green es verde." },
  { id: 14, mission: 2, text: "Let's take the ________ to school.", options: ["bus", "plane", "ship", "horse"], correctAnswer: "bus", hint: "Yellow transport.", translation: "Tomemos el autobús a la escuela.", explanation: "Bus es autobús." },
  { id: 16, mission: 2, text: "My new shoes are ________.", options: ["cool", "angry", "hungry", "tired"], correctAnswer: "cool", hint: "Stylish!", translation: "Mis zapatos nuevos son geniales.", explanation: "Cool es genial." },
  { id: 17, mission: 2, text: "Turn ________ at the corner.", options: ["left", "up", "blue", "down"], correctAnswer: "left", hint: "Opposite of right.", translation: "Gira a la izquierda en la esquina.", explanation: "Left es izquierda." },
  { id: 18, mission: 2, text: "I'm wearing a black ________.", options: ["hoodie", "pizza", "pencil", "tree"], correctAnswer: "hoodie", hint: "A warm jacket with a hood.", translation: "Llevo puesta una sudadera negra.", explanation: "Hoodie es sudadera." },
  { id: 19, mission: 2, text: "The music is too ________.", options: ["loud", "heavy", "sweet", "dry"], correctAnswer: "loud", hint: "High volume!", translation: "La música está muy alta.", explanation: "Loud es fuerte/alto." },

  // MUNDO 3: OLYMPIC ARENA 🏆 (Deportes y Salud)
  { id: 21, mission: 3, text: "She is a very fast ________.", options: ["runner", "cook", "teacher", "driver"], correctAnswer: "runner", hint: "She wins races.", translation: "Ella es una corredora muy rápida.", explanation: "Runner es corredor." },
  { id: 22, mission: 3, text: "You need to ________ every day.", options: ["exercise", "shout", "cry", "fall"], correctAnswer: "exercise", hint: "Move your body.", translation: "Necesitas hacer ejercicio todos los días.", explanation: "Exercise es ejercicio." },
  { id: 23, mission: 3, text: "The team won the ________.", options: ["match", "water", "bread", "shoe"], correctAnswer: "match", hint: "The game.", translation: "El equipo ganó el partido.", explanation: "Match es partido." },
  { id: 24, mission: 3, text: "I want to be ________.", options: ["strong", "sad", "weak", "tiny"], correctAnswer: "strong", hint: "Like a superhero.", translation: "Quiero ser fuerte.", explanation: "Strong es fuerte." },
  { id: 26, mission: 3, text: "Basketball is a ________ sport.", options: ["team", "solo", "hot", "dry"], correctAnswer: "team", hint: "Played with others.", translation: "El baloncesto es un deporte de equipo.", explanation: "Team es equipo." },
  { id: 27, mission: 3, text: "Eat fruit to stay ________.", options: ["healthy", "angry", "blue", "broken"], correctAnswer: "healthy", hint: "Good for your body.", translation: "Come fruta para mantenerte sano.", explanation: "Healthy es saludable." },
  { id: 28, mission: 3, text: "Jump into the ________.", options: ["pool", "table", "chair", "wall"], correctAnswer: "pool", hint: "Where you swim.", translation: "Salta a la piscina.", explanation: "Pool es piscina." },
  { id: 29, mission: 3, text: "The coach is ________.", options: ["strict", "sweet", "pink", "tiny"], correctAnswer: "strict", hint: "Follow the rules!", translation: "El entrenador es estricto.", explanation: "Strict es estricto." },

  // MUNDO 4: DEEP WOODS 🌲 (Naturaleza y Ecología)
  { id: 31, mission: 4, text: "The mountain is very ________.", options: ["high", "salty", "delicious", "soft"], correctAnswer: "high", hint: "Close to the clouds.", translation: "La montaña es muy alta.", explanation: "High es alto." },
  { id: 32, mission: 4, text: "Don't touch the ________!", options: ["fire", "water", "air", "moon"], correctAnswer: "fire", hint: "It is hot.", translation: "¡No toques el fuego!", explanation: "Fire es fuego." },
  { id: 33, mission: 4, text: "I can hear the ________.", options: ["wind", "bread", "sock", "phone"], correctAnswer: "wind", hint: "Air moving fast.", translation: "Puedo oír el viento.", explanation: "Wind es viento." },
  { id: 34, mission: 4, text: "We must protect the ________.", options: ["planet", "pizza", "ball", "hat"], correctAnswer: "planet", hint: "Our home, Earth.", translation: "Debemos proteger el planeta.", explanation: "Planet es planeta." },
  { id: 36, mission: 4, text: "The lake is ________.", options: ["calm", "angry", "hungry", "busy"], correctAnswer: "calm", hint: "No waves.", translation: "El lago está tranquilo.", explanation: "Calm es tranquilo." },
  { id: 37, mission: 4, text: "Look at the wild ________.", options: ["wolf", "car", "computer", "bottle"], correctAnswer: "wolf", hint: "A wild forest dog.", translation: "Mira el lobo salvaje.", explanation: "Wolf es lobo." },
  { id: 38, mission: 4, text: "The forest is ________.", options: ["dark", "pink", "yellow", "hot"], correctAnswer: "dark", hint: "Not enough light.", translation: "El bosque está oscuro.", explanation: "Dark es oscuro." },
  { id: 39, mission: 4, text: "The river ________ fast.", options: ["flows", "eats", "jumps", "talks"], correctAnswer: "flows", hint: "Water moving.", translation: "El río fluye rápido.", explanation: "Flows es fluye." }
];

export const SCRAMBLE_QUESTIONS: ScrambleQuestion[] = [
  // Misión 1: Pixel Academy
  { id: 1, sentence: "The robot can code very fast", translation: "El robot puede programar muy rápido" },
  { id: 2, sentence: "I lost my gaming password today", translation: "Perdí mi contraseña de juego hoy" },
  // Misión 2: Adventure Street
  { id: 3, sentence: "The city street is very busy", translation: "La calle de la ciudad está muy concurrida" },
  { id: 4, sentence: "I love skating with my friends", translation: "Amo patinar con mis amigos" },
  // Misión 3: Olympic Arena
  { id: 5, sentence: "The athlete wins the gold medal", translation: "El atleta gana la medalla de oro" },
  { id: 6, sentence: "Exercise is good for your body", translation: "El ejercicio es bueno para tu cuerpo" },
  // Misión 4: Deep Woods
  { id: 7, sentence: "The wild wolf lives in nature", translation: "El lobo salvaje vive en la naturaleza" },
  { id: 8, sentence: "Protect the earth and the trees", translation: "Protege la tierra y los árboles" },
  // Misión 5: Star Voyager
  { id: 9, sentence: "Astronauts travel to distant stars", translation: "Los astronautas viajan a estrellas lejanas" },
  { id: 10, sentence: "Gravity makes the planets move slow", translation: "La gravedad hace que los planetas se muevan lento" },
  { id: 11, sentence: "The rocket travels through deep space", translation: "El cohete viaja a través del espacio profundo" },
  { id: 12, sentence: "Look at the moon tonight please", translation: "Mira la luna esta noche por favor" },
  { id: 13, sentence: "Mars is called the red planet", translation: "Marte es llamado el planeta rojo" },
  { id: 14, sentence: "I want to visit other galaxies", translation: "Quiero visitar otras galaxias" },
  { id: 15, sentence: "The sun is a very big star", translation: "El sol es una estrella muy grande" },
  { id: 16, sentence: "Alien life might exist out there", translation: "La vida alienígena podría existir ahí fuera" },
  { id: 17, sentence: "Space suits are very heavy here", translation: "Los trajes espaciales son muy pesados aquí" },
  { id: 18, sentence: "Science helps us understand the universe", translation: "La ciencia nos ayuda a entender el universo" }
];
