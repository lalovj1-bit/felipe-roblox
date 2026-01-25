
import { Question, ScrambleQuestion } from './types';

export const SCRAMBLE_QUESTIONS: ScrambleQuestion[] = [
  { id: 501, sentence: "I like to eat red apples", translation: "Me gusta comer manzanas rojas" },
  { id: 502, sentence: "The dog is under the table", translation: "El perro está debajo de la mesa" },
  { id: 503, sentence: "I wake up at seven o'clock", translation: "Me despierto a las siete en punto" },
  { id: 504, sentence: "My favorite color is blue", translation: "Mi color favorito es el azul" },
  { id: 505, sentence: "We play football in the park", translation: "Jugamos fútbol en el parque" },
  { id: 506, sentence: "She lives in a big house", translation: "Ella vive en una casa grande" },
  { id: 507, sentence: "The cat is on the sofa", translation: "El gato está sobre el sofá" },
  { id: 508, sentence: "I have two brothers and one sister", translation: "Tengo dos hermanos y una hermana" },
  { id: 509, sentence: "It is a very hot day", translation: "Es un día muy caluroso" },
  { id: 510, sentence: "They are happy at school", translation: "Ellos están felices en la escuela" }
];

export const QUESTIONS: Question[] = [
  // MISIÓN 1: DAILY ROUTINE (1-10)
  { id: 1, mission: 1, text: "I ________ my teeth every morning.", options: ["brush", "wash", "eat", "play"], correctAnswer: "brush", hint: "It's what you do with a toothbrush!", translation: "Me cepillo los dientes cada mañana.", explanation: "Brush es cepillar." },
  { id: 2, mission: 1, text: "I ________ up at seven o'clock.", options: ["wake", "go", "sleep", "run"], correctAnswer: "wake", hint: "Opposite of sleeping!", translation: "Me despierto a las siete en punto.", explanation: "Wake up es despertarse." },
  { id: 3, mission: 1, text: "She ________ breakfast in the kitchen.", options: ["has", "is", "does", "goes"], correctAnswer: "has", hint: "To eat breakfast.", translation: "Ella desayuna en la cocina.", explanation: "Have breakfast es desayunar." },
  { id: 4, mission: 1, text: "I ________ to school by bus.", options: ["go", "jump", "dance", "read"], correctAnswer: "go", hint: "To travel to a place.", translation: "Voy a la escuela en autobús.", explanation: "Go es ir." },
  { id: 5, mission: 1, text: "My teacher ________ English very well.", options: ["speaks", "eats", "drinks", "sleeps"], correctAnswer: "speaks", hint: "Using your mouth to talk.", translation: "Mi profesor habla inglés muy bien.", explanation: "Speak es hablar." },
  { id: 6, mission: 1, text: "I ________ my homework at 5 PM.", options: ["do", "make", "play", "see"], correctAnswer: "do", hint: "Completing your school tasks.", translation: "Hago mis deberes a las 5 PM.", explanation: "Do homework es hacer deberes." },
  { id: 7, mission: 1, text: "We ________ lunch at the canteen.", options: ["eat", "wash", "brush", "listen"], correctAnswer: "eat", hint: "Putting food in your mouth.", translation: "Comemos el almuerzo en la cantina.", explanation: "Eat es comer." },
  { id: 8, mission: 1, text: "I ________ a shower before bed.", options: ["take", "make", "do", "go"], correctAnswer: "take", hint: "Cleaning your body with water.", translation: "Me doy una ducha antes de dormir.", explanation: "Take a shower es ducharse." },
  { id: 9, mission: 1, text: "He ________ to music in the evening.", options: ["listens", "looks", "smells", "walks"], correctAnswer: "listens", hint: "Using your ears.", translation: "Él escucha música por la tarde.", explanation: "Listen to music es escuchar música." },
  { id: 10, mission: 1, text: "I ________ to bed at 9 PM.", options: ["go", "run", "jump", "fly"], correctAnswer: "go", hint: "Moving to your sleeping place.", translation: "Voy a la cama a las 9 PM.", explanation: "Go to bed es ir a dormir." },

  // MISIÓN 2: PLAY TIME (11-20)
  { id: 11, mission: 2, text: "I love to ________ video games.", options: ["play", "watch", "read", "cook"], correctAnswer: "play", hint: "Use a controller!", translation: "Me encanta jugar videojuegos.", explanation: "Play es jugar." },
  { id: 12, mission: 2, text: "Can you ________ a beautiful picture?", options: ["draw", "listen", "jump", "cry"], correctAnswer: "draw", hint: "Use your pencils.", translation: "¿Puedes dibujar un dibujo hermoso?", explanation: "Draw es dibujar." },
  { id: 13, mission: 2, text: "They ________ to music at home.", options: ["listen", "look", "smell", "taste"], correctAnswer: "listen", hint: "Use your ears.", translation: "Ellos escuchan música en casa.", explanation: "Listen es escuchar." },
  { id: 14, mission: 2, text: "We ________ soccer in the park.", options: ["play", "swim", "dance", "read"], correctAnswer: "play", hint: "A sport with a ball and feet.", translation: "Jugamos fútbol en el parque.", explanation: "Play soccer es jugar fútbol." },
  { id: 15, mission: 2, text: "She likes to ________ books.", options: ["read", "eat", "jump", "wash"], correctAnswer: "read", hint: "Looking at words in a book.", translation: "A ella le gusta leer libros.", explanation: "Read es leer." },
  { id: 16, mission: 2, text: "I ________ in the pool.", options: ["swim", "fly", "cook", "write"], correctAnswer: "swim", hint: "Moving in water.", translation: "Nado en la piscina.", explanation: "Swim es nadar." },
  { id: 17, mission: 2, text: "They ________ very fast.", options: ["run", "sleep", "sing", "listen"], correctAnswer: "run", hint: "Moving quickly on your feet.", translation: "Ellos corren muy rápido.", explanation: "Run es correr." },
  { id: 18, mission: 2, text: "You ________ beautiful songs.", options: ["sing", "cook", "draw", "brush"], correctAnswer: "sing", hint: "Using your voice for music.", translation: "Tú cantas canciones hermosas.", explanation: "Sing es cantar." },
  { id: 19, mission: 2, text: "He likes to ________ his bike.", options: ["ride", "play", "eat", "swim"], correctAnswer: "ride", hint: "Using a bicycle.", translation: "Le gusta montar en su bicicleta.", explanation: "Ride a bike es montar en bici." },
  { id: 20, mission: 2, text: "Let's ________ a cake!", options: ["bake", "read", "run", "wash"], correctAnswer: "bake", hint: "Cooking in the oven.", translation: "¡Vamos a hornear un pastel!", explanation: "Bake es hornear." },

  // MISIÓN 3: DELICIOUS! (21-30)
  { id: 21, mission: 3, text: "I want a red ________, please.", options: ["apple", "elephant", "airplane", "arm"], correctAnswer: "apple", hint: "A fruit!", translation: "Quiero una manzana roja, por favor.", explanation: "Apple es manzana." },
  { id: 22, mission: 3, text: "I am thirsty. I want some ________.", options: ["water", "bread", "cheese", "cake"], correctAnswer: "water", hint: "Clear liquid.", translation: "Tengo sed. Quiero algo de agua.", explanation: "Water es agua." },
  { id: 23, mission: 3, text: "The pizza has a lot of ________.", options: ["cheese", "paper", "pencils", "toys"], correctAnswer: "cheese", hint: "Yellow and yummy.", translation: "La pizza tiene mucho queso.", explanation: "Cheese es queso." },
  { id: 24, mission: 3, text: "Monkeys like to eat ________.", options: ["bananas", "pizzas", "eggs", "meat"], correctAnswer: "bananas", hint: "Long yellow fruit.", translation: "A los monos les gusta comer plátanos.", explanation: "Bananas son plátanos." },
  { id: 25, mission: 3, text: "I drink ________ for breakfast.", options: ["milk", "bread", "rice", "chips"], correctAnswer: "milk", hint: "White liquid from cows.", translation: "Bebo leche para desayunar.", explanation: "Milk es leche." },
  { id: 26, mission: 3, text: "Ice cream is very ________.", options: ["cold", "hot", "fast", "angry"], correctAnswer: "cold", hint: "Opposite of hot.", translation: "El helado está muy frío.", explanation: "Cold es frío." },
  { id: 27, mission: 3, text: "I like ________ on my bread.", options: ["butter", "pencil", "shoes", "water"], correctAnswer: "butter", hint: "Yellow fat for bread.", translation: "Me gusta la mantequilla en mi pan.", explanation: "Butter es mantequilla." },
  { id: 28, mission: 3, text: "An ________ is orange.", options: ["orange", "apple", "grape", "pear"], correctAnswer: "orange", hint: "A fruit and a color!", translation: "Una naranja es naranja.", explanation: "Orange es naranja." },
  { id: 29, mission: 3, text: "Do you like ________?", options: ["chicken", "books", "chairs", "windows"], correctAnswer: "chicken", hint: "A type of meat.", translation: "¿Te gusta el pollo?", explanation: "Chicken es pollo." },
  { id: 30, mission: 3, text: "Sugar is ________.", options: ["sweet", "salty", "sour", "bitter"], correctAnswer: "sweet", hint: "Like honey.", translation: "El azúcar es dulce.", explanation: "Sweet es dulce." },

  // MISIÓN 4: MY LOOK (31-40)
  { id: 31, mission: 4, text: "It is sunny! I wear my ________.", options: ["sunglasses", "gloves", "jacket", "boots"], correctAnswer: "sunglasses", hint: "For your eyes.", translation: "¡Está soleado! Uso mis gafas de sol.", explanation: "Sunglasses son gafas de sol." },
  { id: 32, mission: 4, text: "My ________ are blue and soft.", options: ["socks", "shoes", "hats", "shirts"], correctAnswer: "socks", hint: "Inside your shoes.", translation: "Mis calcetines son azules y suaves.", explanation: "Socks son calcetines." },
  { id: 33, mission: 4, text: "When it rains, I use an ________.", options: ["umbrella", "pizza", "ball", "phone"], correctAnswer: "umbrella", hint: "Keeps you dry.", translation: "Cuando llueve, uso un paraguas.", explanation: "Umbrella es paraguas." },
  { id: 34, mission: 4, text: "I wear a ________ in winter.", options: ["coat", "t-shirt", "swimsuit", "shorts"], correctAnswer: "coat", hint: "A heavy jacket.", translation: "Llevo un abrigo en invierno.", explanation: "Coat es abrigo." },
  { id: 35, mission: 4, text: "My new ________ are very comfortable.", options: ["shoes", "glasses", "watches", "hats"], correctAnswer: "shoes", hint: "You wear them on your feet.", translation: "Mis zapatos nuevos son muy cómodos.", explanation: "Shoes son zapatos." },
  { id: 36, mission: 4, text: "Is that a pink ________?", options: ["dress", "car", "dog", "house"], correctAnswer: "dress", hint: "Clothing often worn by girls.", translation: "¿Es eso un vestido rosa?", explanation: "Dress es vestido." },
  { id: 37, mission: 4, text: "He is wearing a blue ________.", options: ["shirt", "apple", "book", "pencil"], correctAnswer: "shirt", hint: "Top clothing with buttons.", translation: "Él lleva una camisa azul.", explanation: "Shirt es camisa." },
  { id: 38, mission: 4, text: "I have a warm ________.", options: ["hat", "pizza", "water", "ball"], correctAnswer: "hat", hint: "Worn on your head.", translation: "Tengo un gorro abrigado.", explanation: "Hat es gorro." },
  { id: 39, mission: 4, text: "These ________ are too big!", options: ["pants", "socks", "rings", "eyes"], correctAnswer: "pants", hint: "Clothing for your legs.", translation: "¡Estos pantalones son demasiado grandes!", explanation: "Pants son pantalones." },
  { id: 40, mission: 4, text: "Your ________ is very cool!", options: ["t-shirt", "bread", "juice", "milk"], correctAnswer: "t-shirt", hint: "Short sleeve top.", translation: "¡Tu camiseta mola mucho!", explanation: "T-shirt es camiseta." }
];

