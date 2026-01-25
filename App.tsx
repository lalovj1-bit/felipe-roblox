
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { GoogleGenAI, Modality } from "@google/genai";
import { QUESTIONS, SCRAMBLE_QUESTIONS, PRIZES, FELIPE_SYSTEM_PROMPT } from './constants';
import { GameState, ChatMessage } from './types';

// Decodificadores manuales requeridos para el flujo de audio de Gemini
function decodeBase64(base64: string) {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  // El API de Gemini devuelve PCM 16-bit (2 bytes por muestra)
  // Creamos una vista de 16 bits sobre el buffer de bytes
  const dataInt16 = new Int16Array(data.buffer, data.byteOffset, data.byteLength / 2);
  const frameCount = dataInt16.length / numChannels;
  const audioBuffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = audioBuffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      // Normalización a Float32 (-1.0 a 1.0)
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return audioBuffer;
}

const missions = [
  { id: 1, title: 'Pixel Academy', icon: '💻' },
  { id: 2, title: 'Adventure Street', icon: '🛹' },
  { id: 3, title: 'Olympic Arena', icon: '🏆' },
  { id: 4, title: 'Deep Woods', icon: '🌲' },
  { id: 5, title: 'Star Voyager', icon: '🌌' },
  { id: 6, title: 'Word Hunter', icon: '🔊' },
];

// Efectos de sonido retro 8-bit
const playSynthNote = (ctx: AudioContext, freq: number, duration: number, volume = 0.05) => {
  if (!ctx || ctx.state !== 'running') return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'square';
  osc.frequency.setValueAtTime(freq, ctx.currentTime);
  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + duration);
};

const playCoinSound = (ctx: AudioContext) => {
  playSynthNote(ctx, 987.77, 0.1);
  setTimeout(() => playSynthNote(ctx, 1318.51, 0.4), 100);
};

const shuffle = <T,>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);

const VoxelFelipe = ({ isDancing, isSpeaking, isLoadingAudio }: { isDancing?: boolean, isSpeaking?: boolean, isLoadingAudio?: boolean }) => (
  <div className={`relative w-40 h-40 flex items-center justify-center transition-all ${isDancing ? 'animate-bounce' : 'animate-felipe'}`}>
    {isSpeaking && (
      <div className="absolute -top-12 bg-white border-4 border-black px-3 py-1 rounded-full text-[10px] font-bold animate-pulse shadow-md z-10 text-black mc-logo">
        SPEAKING!
      </div>
    )}
    {isLoadingAudio && (
      <div className="absolute -top-12 bg-yellow-400 border-4 border-black px-3 py-1 rounded-full text-[10px] font-bold animate-bounce shadow-md z-10 text-black mc-logo">
        LOADING...
      </div>
    )}
    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-xl">
      <rect x="30" y="45" width="45" height="40" fill="#00a800" stroke="#000" strokeWidth="4" />
      <rect x="35" y="15" width="35" height="35" fill="#00ff00" stroke="#000" strokeWidth="4" />
      <rect x="42" y="30" width="8" height="10" fill="#000" />
      <rect x="58" y="30" width="8" height="10" fill="#000" />
      <rect x="40" y="60" width="25" height="5" fill="#000" opacity={isSpeaking ? "0.8" : "0.3"} className={isSpeaking ? "animate-pulse" : ""} />
    </svg>
  </div>
);

export default function App() {
  const [state, setState] = useState<GameState>({
    screen: 'intro', activeMission: 1, currentQuestionIndex: 0, userAnswer: '', attempts: 0, score: 0, hunger: 100,
    isNight: false, feedbackType: 'none', showExplanation: false, stamps: [], postcards: {}, diaries: {},
    isGeneratingPostcard: false, equippedAccessory: 'none', unlockedAccessories: ['none'],
    scrambleWords: [], selectedWords: [], chatHistory: [{ role: 'felipe', text: "Hello! Ready for adventure?" }], dailyChallenge: ''
  });

  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isFelipeSpeaking, setIsFelipeSpeaking] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [shuffledOptions, setShuffledOptions] = useState<string[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const bgmIntervalRef = useRef<number | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Inicialización de audio crítica al primer clic
  const ensureAudioContext = async () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }
    if (audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume();
    }
    return audioContextRef.current;
  };

  const playTTS = async (text: string) => {
    if (!text || isMuted) return;
    try {
      const ctx = await ensureAudioContext();
      setIsLoadingAudio(true);
      
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text }] }],
        config: { 
          responseModalities: [Modality.AUDIO], 
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Charon' } } } 
        },
      });

      const audioPart = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
      const base64Data = audioPart?.inlineData?.data;

      if (base64Data) {
        const audioBuffer = await decodeAudioData(decodeBase64(base64Data), ctx, 24000, 1);
        const source = ctx.createBufferSource();
        source.buffer = audioBuffer; 
        source.connect(ctx.destination);
        
        setIsLoadingAudio(false);
        setIsFelipeSpeaking(true);
        source.onended = () => setIsFelipeSpeaking(false);
        source.start();
      } else {
        setIsLoadingAudio(false);
      }
    } catch (error) {
      console.error("Error en TTS:", error);
      setIsLoadingAudio(false);
      setIsFelipeSpeaking(false);
    }
  };

  const startBGM = async () => {
    const ctx = await ensureAudioContext();
    if (bgmIntervalRef.current) return;

    const melody = [261, 329, 392, 523, 392, 329];
    let idx = 0;
    bgmIntervalRef.current = window.setInterval(() => {
      if (!isMuted && state.screen !== 'intro' && ctx.state === 'running') {
        playSynthNote(ctx, melody[idx], 0.2, 0.02);
        idx = (idx + 1) % melody.length;
      }
    }, 400);
  };

  useEffect(() => {
    if (state.screen === 'playing') {
      const missionQs = QUESTIONS.filter(q => q.mission === state.activeMission);
      const currentQ = missionQs[state.currentQuestionIndex];
      if (currentQ) {
        setShuffledOptions(shuffle(currentQ.options));
        if (state.activeMission === 6) {
          // Breve pausa para no chocar con efectos de transición
          setTimeout(() => playTTS(currentQ.text), 700);
        }
      }
    }
  }, [state.screen, state.currentQuestionIndex, state.activeMission]);

  const Header = () => (
    <header className="w-full max-w-[500px] flex justify-between items-center p-4 mb-4 bg-black/50 border-4 border-black">
      <button onClick={async () => {
        await ensureAudioContext();
        setState(s => ({ ...s, screen: 'intro' }));
      }} className="mario-button text-[10px] bg-red-600 text-white py-2 px-4">QUIT</button>
      <div className="flex items-center gap-4">
        <button onClick={() => setIsMuted(!isMuted)} className="text-2xl">{isMuted ? '🔇' : '🔊'}</button>
        <span className="text-white font-bold text-[18px]">XP {state.score}</span>
      </div>
    </header>
  );

  if (state.screen === 'intro') return (
    <div className="game-container justify-center bg-[#5c94fc]">
      <div className="mario-panel p-10 max-w-[480px] w-full text-center">
        <h1 className="mc-logo text-xl text-black mb-6">SUPER FELIPE XL</h1>
        <div className="flex justify-center mb-8">
          <VoxelFelipe isSpeaking={isFelipeSpeaking} isLoadingAudio={isLoadingAudio} />
        </div>
        <div className="space-y-4">
          <button onClick={async () => { 
            const ctx = await ensureAudioContext();
            playSynthNote(ctx, 523, 0.1, 0.1);
            startBGM();
            setState(s => ({ ...s, screen: 'mission_select' })); 
          }} className="mario-button w-full text-[14px] py-6 bg-green-500 text-white uppercase font-black">START ADVENTURE</button>
          
          <button onClick={async () => { 
            await ensureAudioContext();
            startBGM();
            setState(s => ({ ...s, screen: 'chat' }));
          }} className="mario-button w-full text-[12px] py-4 bg-sky-500 text-white uppercase font-black">CHAT WITH FELIPE</button>
        </div>
      </div>
    </div>
  );

  if (state.screen === 'playing') {
    const missionQs = QUESTIONS.filter(q => q.mission === state.activeMission);
    const currentQ = missionQs[state.currentQuestionIndex];
    if (!currentQ) return null;

    return (
      <div className="game-container p-4 bg-emerald-600">
        <Header />
        <main className="mario-panel w-full max-w-[500px] p-8 bg-white flex flex-col shadow-2xl min-h-[550px]">
          {state.activeMission === 6 ? (
            <div className="flex flex-col items-center flex-1">
              <div className="bg-purple-600 text-white text-[12px] p-3 text-center font-bold mb-6 border-4 border-black w-full mc-logo shadow-[4px_4px_0px_#000]">WORD HUNTER!</div>
              <div className="flex flex-col items-center gap-6 mb-8">
                 <VoxelFelipe isSpeaking={isFelipeSpeaking} isDancing={state.showExplanation} isLoadingAudio={isLoadingAudio} />
                 <button 
                   onClick={async () => {
                     await ensureAudioContext();
                     playTTS(currentQ.text);
                   }} 
                   disabled={isLoadingAudio || isFelipeSpeaking}
                   className={`mario-button ${isLoadingAudio ? 'bg-gray-300' : 'bg-yellow-400'} p-5 rounded-full transition-transform active:scale-90`}
                 >
                    <span className="text-3xl">🔊 REPLAY</span>
                 </button>
                 <p className="text-[14px] font-bold text-gray-500 uppercase tracking-widest">Listen carefully!</p>
              </div>

              <div className="grid grid-cols-2 gap-6 w-full flex-1">
                {shuffledOptions.map((o, i) => (
                  <button key={i} disabled={state.showExplanation} onClick={async () => {
                    const ctx = await ensureAudioContext();
                    if (o === currentQ.correctAnswer) {
                       playCoinSound(ctx);
                       setState(s => ({ ...s, score: s.score + 15, showExplanation: true }));
                       playTTS(`Correct! ${currentQ.text}`); 
                    } else {
                       playSynthNote(ctx, 110, 0.2, 0.1);
                    }
                  }} className={`mario-button flex items-center justify-center py-10 text-7xl ${state.showExplanation && o === currentQ.correctAnswer ? 'bg-green-300 scale-105' : 'bg-gray-50'}`}>
                    {o}
                  </button>
                ))}
              </div>

              {state.showExplanation && (
                <div className="mt-8 p-6 bg-yellow-400 border-4 border-black text-center w-full animate-bounce shadow-[6px_6px_0px_#000]">
                  <p className="text-2xl font-bold mb-2 uppercase text-black">"{currentQ.text}"</p>
                  <p className="text-[16px] font-bold mb-4 text-blue-900">({currentQ.translation})</p>
                  <button onClick={async () => {
                    await ensureAudioContext();
                    if (state.currentQuestionIndex === 9) setState(s => ({ ...s, screen: 'game_over', stamps: [...new Set([...s.stamps, s.activeMission])] }));
                    else setState(s => ({ ...s, currentQuestionIndex: s.currentQuestionIndex + 1, showExplanation: false }));
                  }} className="mario-button w-full text-[12px] py-4 bg-blue-600 text-white font-black mc-logo">NEXT »</button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col flex-1">
              <div className="flex flex-col items-center gap-6 mb-10">
                <VoxelFelipe isDancing={state.showExplanation} isSpeaking={isFelipeSpeaking} isLoadingAudio={isLoadingAudio} />
                <div className="bg-sky-50 border-4 border-black p-6 w-full text-black font-bold text-2xl text-center rounded-xl min-h-[120px] flex items-center justify-center shadow-inner">
                  {state.showExplanation ? currentQ.text.replace('________', currentQ.correctAnswer) : currentQ.text}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {shuffledOptions.map((o, i) => (
                  <button key={i} disabled={state.showExplanation} onClick={async () => {
                    const ctx = await ensureAudioContext();
                    if (o === currentQ.correctAnswer) {
                       playCoinSound(ctx);
                       setState(s => ({ ...s, score: s.score + 10, showExplanation: true }));
                       playTTS(currentQ.text.replace('________', currentQ.correctAnswer)); 
                    } else {
                       playSynthNote(ctx, 110, 0.2, 0.1);
                    }
                  }} className={`mario-button text-[14px] py-6 ${state.showExplanation && o === currentQ.correctAnswer ? 'bg-green-400 text-white' : 'bg-white'}`}>
                    {o}
                  </button>
                ))}
              </div>
              {state.showExplanation && (
                <div className="mt-10 p-6 bg-yellow-400 border-4 border-black text-center animate-bounce shadow-[6px_6px_0px_#000]">
                  <p className="text-[16px] font-bold mb-6 italic">"{currentQ.translation}"</p>
                  <button onClick={async () => {
                    await ensureAudioContext();
                    setState(s => ({ ...s, currentQuestionIndex: s.currentQuestionIndex + 1, showExplanation: false }));
                  }} className="mario-button w-full text-[12px] py-4 bg-blue-600 text-white font-black mc-logo">CONTINUE »</button>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    );
  }

  if (state.screen === 'mission_select') return (
    <div className="game-container p-8 bg-sky-400">
      <Header />
      <h2 className="mc-logo text-xl mb-10 text-black text-center">WORLD MAP</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-[500px]">
        {missions.map(m => {
          const done = state.stamps.includes(m.id);
          return (
            <button key={m.id} onClick={async () => {
              await ensureAudioContext();
              setState(s => ({ ...s, screen: 'playing', activeMission: m.id, currentQuestionIndex: 0, showExplanation: false }));
              playTTS(`Entering World ${m.id}`);
            }} className={`mario-panel p-6 flex flex-col items-center gap-3 transition-all active:scale-95 ${done ? 'bg-yellow-100 border-yellow-500' : 'bg-white'}`}>
              <span className="text-5xl">{m.icon}</span>
              <span className="text-[12px] font-bold uppercase mc-logo">{m.title}</span>
              {done && <span className="text-[10px] text-green-600 font-bold mc-logo">CLEARED!</span>}
            </button>
          );
        })}
      </div>
    </div>
  );

  return null;
}

