
import { Question } from './types';

export const FELIPE_SYSTEM_PROMPT = `You are Felipe, a green dinosaur teacher for kids A1 level.`;

export const PRIZES = [
  { id: 1, name: "Crystal Cup", icon: "🏆", desc: "You know how to say hello!" },
  { id: 2, name: "Wood Trophy", icon: "🥉", desc: "Master of the house!" },
  { id: 3, name: "Silver Chalice", icon: "🥈", desc: "A true foodie!" },
  { id: 4, name: "Golden Cup", icon: "🥇", desc: "The sports champion!" },
  { id: 5, name: "Diamond Trophy", icon: "💎", desc: "You master time and numbers!" },
  { id: 6, name: "Emerald Star", icon: "⭐", desc: "Great worker!" },
  { id: 7, name: "Ruby Heart", icon: "❤️", desc: "You know your body!" },
  { id: 8, name: "Dino Crown", icon: "👑", desc: "Master of English!" }
];

const themes = [
  { 
    id: 1, name: "Greetings", 
    qs: [
      { q: "Hello! My _______ is Felipe.", o: ["name", "book", "dog"], a: "name", t: "¡Hola! Mi nombre es Felipe.", type: 'mcq' },
      { q: "How _______ are you?", o: ["old", "tall", "blue"], a: "old", t: "¿Qué edad tienes?", type: 'mcq' },
      { q: "Nice to _______ you.", o: ["meet", "eat", "sleep"], a: "meet", t: "Mucho gusto en conocerte.", type: 'mcq' },
      { q: "The opposite of 'Hello' is...", a: "bye", t: "Lo opuesto a 'Hola' es...", type: 'writing' },
      { q: "Morning, Afternoon and...", a: "night", t: "Mañana, tarde y...", type: 'writing' }
    ],
    scrambles: [
      { s: "What is your name", t: "¿Cómo te llamas?" },
      { s: "I am ten years old", t: "Tengo diez años." },
      { s: "How are you today", t: "¿Cómo estás hoy?" },
      { s: "Nice to meet you", t: "Gusto en conocerte." },
      { s: "See you later alligator", t: "Nos vemos luego." }
    ]
  },
  { 
    id: 2, name: "My House", 
    qs: [
      { q: "I sleep in the _______.", o: ["bedroom", "kitchen", "garden"], a: "bedroom", t: "Duermo en el dormitorio.", type: 'mcq' },
      { q: "Mom cooks in the _______.", o: ["kitchen", "bathroom", "garage"], a: "kitchen", t: "Mamá cocina en la cocina.", type: 'mcq' },
      { q: "Sit on the _______.", o: ["sofa", "window", "door"], a: "sofa", t: "Siéntate en el sofá.", type: 'mcq' },
      { q: "You wash your hands in the...", a: "bathroom", t: "Te lavas las manos en el...", type: 'writing' },
      { q: "You watch TV in the living...", a: "room", t: "Ves la tele en la sala de...", type: 'writing' }
    ],
    scrambles: [
      { s: "My house is big", t: "Mi casa es grande." },
      { s: "The kitchen is clean", t: "La cocina está limpia." },
      { s: "I like my bedroom", t: "Me gusta mi dormitorio." },
      { s: "Where is the cat", t: "¿Dónde está el gato?" },
      { s: "The lamp is yellow", t: "La lámpara es amarilla." }
    ]
  },
  { 
    id: 3, name: "Food & Drinks", 
    qs: [
      { q: "I drink _______ when I am thirsty.", o: ["water", "pizza", "bread"], a: "water", t: "Bebo agua cuando tengo sed.", type: 'mcq' },
      { q: "A yellow fruit is a _______.", o: ["banana", "apple", "grape"], a: "banana", t: "Una fruta amarilla es el plátano.", type: 'mcq' },
      { q: "I like cheese on my _______.", o: ["pizza", "milk", "juice"], a: "pizza", t: "Me gusta el queso en mi pizza.", type: 'mcq' },
      { q: "The color of an orange is...", a: "orange", t: "El color de una naranja es...", type: 'writing' },
      { q: "A red fruit is an...", a: "apple", t: "Una fruta roja es una...", type: 'writing' }
    ],
    scrambles: [
      { s: "I like chocolate cake", t: "Me gusta el pastel de chocolate." },
      { s: "Milk is very good", t: "La leche es muy buena." },
      { s: "Do you like apples", t: "¿Te gustan las manzanas?" },
      { s: "I am very hungry", t: "Tengo mucha hambre." },
      { s: "Bread and butter please", t: "Pan y mantequilla por favor." }
    ]
  },
  { 
    id: 4, name: "Hobbies", 
    qs: [
      { q: "I play _______ with my feet.", o: ["football", "guitar", "chess"], a: "football", t: "Juego fútbol con los pies.", type: 'mcq' },
      { q: "I love to _______ in the pool.", o: ["swim", "run", "climb"], a: "swim", t: "Amo nadar en la piscina.", type: 'mcq' },
      { q: "She can _______ very well.", o: ["sing", "eat", "jump"], a: "sing", t: "Ella puede cantar muy bien.", type: 'mcq' },
      { q: "You use a bike to...", a: "ride", t: "Usas una bici para...", type: 'writing' },
      { q: "To move fast on your feet is to...", a: "run", t: "Moverse rápido con los pies es...", type: 'writing' }
    ],
    scrambles: [
      { s: "I play the guitar", t: "Toco la guitarra." },
      { s: "He likes to play tennis", t: "A él le gusta jugar tenis." },
      { s: "Can you dance well", t: "¿Puedes bailar bien?" },
      { s: "My hobby is reading", t: "Mi afición es leer." },
      { s: "We love video games", t: "Amamos los videojuegos." }
    ]
  },
  { 
    id: 5, name: "Numbers & Time", 
    qs: [
      { q: "Two plus three is _______.", o: ["five", "six", "four"], a: "five", t: "Dos más tres son cinco.", type: 'mcq' },
      { q: "There are _______ days in a week.", o: ["seven", "five", "twelve"], a: "seven", t: "Hay siete días en la semana.", type: 'mcq' },
      { q: "It is 10 _______.", o: ["o'clock", "hours", "time"], a: "o'clock", t: "Son las 10 en punto.", type: 'mcq' },
      { q: "The number after nine is...", a: "ten", t: "El número después del nueve es...", type: 'writing' },
      { q: "One hundred has two...", a: "zeros", t: "El cien tiene dos...", type: 'writing' }
    ],
    scrambles: [
      { s: "What time is it", t: "¿Qué hora es?" },
      { s: "Today is Monday morning", t: "Hoy es lunes por la mañana." },
      { s: "I have two brothers", t: "Tengo dos hermanos." },
      { s: "It is three o'clock", t: "Son las tres en punto." },
      { s: "Count from one to ten", t: "Cuenta del uno al diez." }
    ]
  },
  { 
    id: 6, name: "Jobs", 
    qs: [
      { q: "The _______ helps sick people.", o: ["doctor", "pilot", "chef"], a: "doctor", t: "El doctor ayuda a los enfermos.", type: 'mcq' },
      { q: "A _______ flies planes.", o: ["pilot", "driver", "teacher"], a: "pilot", t: "Un piloto vuela aviones.", type: 'mcq' },
      { q: "The _______ cooks in a restaurant.", o: ["chef", "singer", "nurse"], a: "chef", t: "El chef cocina en un restaurante.", type: 'mcq' },
      { q: "Who teaches at school?", a: "teacher", t: "¿Quién enseña en la escuela?", type: 'writing' },
      { q: "A person who sings is a...", a: "singer", t: "Una persona que canta es un...", type: 'writing' }
    ],
    scrambles: [
      { s: "My father is a doctor", t: "Mi padre es doctor." },
      { s: "I want to be a pilot", t: "Quiero ser piloto." },
      { s: "She is a good nurse", t: "Ella es una buena enfermera." },
      { s: "The firemen are brave", t: "Los bomberos son valientes." },
      { s: "Where do you work", t: "¿Dónde trabajas?" }
    ]
  },
  { 
    id: 7, name: "The Body", 
    qs: [
      { q: "I see with my _______.", o: ["eyes", "ears", "mouth"], a: "eyes", t: "Veo con mis ojos.", type: 'mcq' },
      { q: "I hear with my _______.", o: ["ears", "nose", "hands"], a: "ears", t: "Oigo con mis oídos.", type: 'mcq' },
      { q: "Wash your _______ before eating.", o: ["hands", "feet", "hair"], a: "hands", t: "Lávate las manos antes de comer.", type: 'mcq' },
      { q: "You wear a hat on your...", a: "head", t: "Llevas un sombrero en tu...", type: 'writing' },
      { q: "You walk with your...", a: "legs", t: "Caminas con tus...", type: 'writing' }
    ],
    scrambles: [
      { s: "Brush your teeth now", t: "Cepilla tus dientes ahora." },
      { s: "My hair is brown", t: "Mi pelo es castaño." },
      { s: "Open your big mouth", t: "Abre tu boca grande." },
      { s: "Touch your nose please", t: "Toca tu nariz por favor." },
      { s: "I have ten fingers", t: "Tengo diez dedos." }
    ]
  },
  { 
    id: 8, name: "Weather", 
    qs: [
      { q: "It is _______ today, wear a coat.", o: ["cold", "hot", "sunny"], a: "cold", t: "Hace frío hoy, ponte un abrigo.", type: 'mcq' },
      { q: "The _______ is shining.", o: ["sun", "rain", "snow"], a: "sun", t: "El sol está brillando.", type: 'mcq' },
      { q: "It is _______, take an umbrella.", o: ["raining", "windy", "dry"], a: "raining", t: "Está lloviendo, toma un paraguas.", type: 'mcq' },
      { q: "The season after winter is...", a: "spring", t: "La estación después del invierno es...", type: 'writing' },
      { q: "The white thing from the sky is...", a: "snow", t: "Lo blanco que cae del cielo es...", type: 'writing' }
    ],
    scrambles: [
      { s: "The sky is very blue", t: "El cielo está muy azul." },
      { s: "I like sunny days", t: "Me gustan los días soleados." },
      { s: "It is very windy today", t: "Hace mucho viento hoy." },
      { s: "Winter is very cold", t: "El invierno es muy frío." },
      { s: "The flowers grow in spring", t: "Las flores crecen en primavera." }
    ]
  }
];

export const QUESTIONS: Question[] = [];
themes.forEach(t => {
  t.qs.forEach((q, i) => {
    QUESTIONS.push({
      id: t.id * 100 + i,
      mission: t.id,
      text: q.q,
      options: q.o || [],
      correctAnswer: q.a,
      hint: "",
      explanation: "",
      translation: q.t,
      type: q.type as any
    });
  });
  t.scrambles.forEach((s, i) => {
    QUESTIONS.push({
      id: t.id * 100 + i + 5,
      mission: t.id,
      text: s.s,
      options: [],
      correctAnswer: s.s,
      hint: "",
      explanation: "",
      translation: s.t,
      type: 'scramble'
    });
  });
});
