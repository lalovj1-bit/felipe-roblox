
import { Question, ScrambleQuestion } from './types';

export const SCRAMBLE_QUESTIONS: ScrambleQuestion[] = [
  { id: 501, sentence: "I like to eat red apples", translation: "Me gusta comer manzanas rojas" },
  { id: 502, sentence: "The dog is under the table", translation: "El perro está debajo de la mesa" },
  { id: 503, sentence: "I wake up at seven o'clock", translation: "Me despierto a las siete en punto" },
  { id: 504, sentence: "My favorite color is blue", translation: "Mi color favorito es el azul" },
  { id: 505, sentence: "We play football in the park", translation: "Jugamos fútbol en el parque" }
];

export const QUESTIONS: Question[] = [
  // MISIÓN 1: DAILY ROUTINE
  { id: 1, mission: 1, text: "Every morning, I ________ my teeth.", options: ["wash", "brush", "eat", "play"], correctAnswer: "brush", hint: "Usas un cepillo.", translation: "Cada mañana, me cepillo los dientes.", explanation: "Brush es cepillar." },
  { id: 2, mission: 1, text: "I ________ up at 7:00 AM.", options: ["go", "sleep", "wake", "run"], correctAnswer: "wake", hint: "Abrir los ojos al despertar.", translation: "Me despierto a las 7:00 AM.", explanation: "Wake up es despertarse." },
  { id: 3, mission: 1, text: "I have ________ for breakfast.", options: ["cereal", "homework", "shoes", "a car"], correctAnswer: "cereal", hint: "Comida de la mañana.", translation: "Desayuno cereal.", explanation: "Breakfast es desayuno." },
  
  // MISIÓN 2: MY HOBBIES
  { id: 11, mission: 2, text: "I love to ________ video games.", options: ["watch", "play", "read", "cook"], correctAnswer: "play", hint: "Usar un control o consola.", translation: "Me encanta jugar videojuegos.", explanation: "Play es jugar." },
  { id: 12, mission: 2, text: "She likes to ________ beautiful pictures.", options: ["draw", "listen", "jump", "cry"], correctAnswer: "draw", hint: "Usar lápices y colores.", translation: "A ella le gusta dibujar dibujos hermosos.", explanation: "Draw es dibujar." },
  { id: 13, mission: 2, text: "We ________ to music every day.", options: ["look", "listen", "smell", "taste"], correctAnswer: "listen", hint: "Usar los oídos.", translation: "Escuchamos música todos los días.", explanation: "Listen es escuchar." },

  // MISIÓN 3: FOOD MARKET
  { id: 21, mission: 3, text: "Can I have an ________ please?", options: ["apple", "elephant", "airplane", "arm"], correctAnswer: "apple", hint: "Fruta roja o verde.", translation: "¿Puedo tener una manzana por favor?", explanation: "Apple es manzana." },
  { id: 22, mission: 3, text: "I am thirsty. I want some ________.", options: ["bread", "water", "cheese", "cake"], correctAnswer: "water", hint: "Líquido transparente.", translation: "Tengo sed. Quiero algo de agua.", explanation: "Water es agua." },
  { id: 23, mission: 3, text: "The pizza has a lot of ________.", options: ["paper", "cheese", "pencils", "toys"], correctAnswer: "cheese", hint: "Es amarillo y delicioso.", translation: "La pizza tiene mucho queso.", explanation: "Cheese es queso." },

  // MISIÓN 4: MY CLOTHES
  { id: 31, mission: 4, text: "It is sunny! I am wearing ________.", options: ["gloves", "a jacket", "sunglasses", "boots"], correctAnswer: "sunglasses", hint: "Para proteger los ojos.", translation: "¡Está soleado! Llevo gafas de sol.", explanation: "Sunglasses son gafas de sol." },
  { id: 32, mission: 4, text: "My ________ are blue and very soft.", options: ["shoes", "socks", "hats", "shirts"], correctAnswer: "socks", hint: "Van dentro de los zapatos.", translation: "Mis calcetines son azules y muy suaves.", explanation: "Socks son calcetines." },
  { id: 33, mission: 4, text: "When it rains, I use my ________.", options: ["umbrella", "pizza", "ball", "phone"], correctAnswer: "umbrella", hint: "Te protege del agua.", translation: "Cuando llueve, uso mi paraguas.", explanation: "Umbrella es paraguas." }
];

