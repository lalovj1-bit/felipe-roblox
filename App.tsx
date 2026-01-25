
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Modality } from "@google/genai";
import { QUESTIONS, SCRAMBLE_QUESTIONS } from './constants';
import { GameState, Accessory, ChatMessage } from './types';

// --- CONSTANTS ---
const missions = [
  { id: 1, title: 'Dino Land', icon: '🦖', reward: 'Hero', color: 'bg-green-500' },
  { id: 2, title: 'Cyber City', icon: '🤖', reward: 'Super', color: 'bg-blue-500' },
  { id: 3, title: 'Sweet Kingdom', icon: '🍭', reward: 'Mega', color: 'bg-pink-500' },
  { id: 4, title: 'Pirate Cove', icon: '🏴‍☠️', reward: 'Ultra', color: 'bg-orange-500' },
  { id: 5, title: 'Star Galaxy', icon: '🌌', reward: 'Legend', color: 'bg-purple-500' },
];

// --- UTILS ---
const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// --- AUDIO ENGINE (TURBO MARIO MODE) ---
const play8BitNote = (ctx: AudioContext, freq: number, duration: number, type: OscillatorType = 'square', volume = 0.08) => {
  if (freq === 0) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime);
  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + duration);
};

const playCorrectSound = (ctx: AudioContext) => {
  const notes = [523, 659, 783, 1046, 1568]; 
  notes.forEach((f, i) => {
    setTimeout(() => play8BitNote(ctx, f, 0.15, 'square', 0.1), i * 45);
  });
};

const playTetrisTheme = (ctx: AudioContext) => {
  const melody = [
    659, 494, 523, 587, 523, 494, 440, 440, 523, 659, 587, 523, 494, 523, 587, 659, 523, 440, 440,
    0, 587, 698, 880, 783, 698, 659, 523, 659, 587, 523, 494, 494, 523, 587, 659, 523, 440, 440
  ];
  let time = 0;
  melody.forEach((f) => {
    setTimeout(() => play8BitNote(ctx, f, 0.12, 'square', 0.06), time);
    time += 110; // ULTRA FAST
  });
};

const playIntroTheme = (ctx: AudioContext) => {
  const intro = [330, 330, 0, 330, 0, 262, 330, 0, 392, 0, 196];
  intro.forEach((f, i) => {
    setTimeout(() => play8BitNote(ctx, f, 0.08, 'square', 0.07), i * 80);
  });
};

const VoxelFelipe = ({ isActive, isDancing, isNight, size = "w-24 h-24", mood = "normal" }: { isActive: boolean, isDancing?: boolean, isNight: boolean, size?: string, mood?: string }) => (
  <div className={`relative ${size} flex items-center justify-center transition-all duration-300 ${isActive ? 'scale-110' : 'scale-100'} ${isDancing ? 'animate-bounce' : ''}`}>
    <svg viewBox="0 0 100 100" className={`w-full h-full drop-shadow-xl ${isNight ? 'brightness-75' : ''}`}>
      <rect x="30" y="45" width="45" height="40" fill="#55aa55" stroke="#000" strokeWidth="3" />
      <rect x="35" y="15" width="35" height="35" fill="#88cc88" stroke="#000" strokeWidth="3" />
      <rect x="42" y="30" width="6" height="8" fill={mood === 'sad' ? "#333" : "#000"} />
      <rect x="58" y="30" width="6" height="8" fill={mood === 'sad' ? "#333" : "#000"} />
      <rect x="40" y="60" width="25" height="4" fill="#000" opacity="0.2" />
    </svg>
  </div>
);

export default function App() {
  const [state, setState] = useState<GameState>({
    screen: 'intro', activeMission: 1, currentQuestionIndex: 0, userAnswer: '', attempts: 0, score: 0, hunger: 80, 
    isNight: new Date().getHours() > 19 || new Date().getHours() < 7,
    feedbackType: 'none', showExplanation: false, stamps: [], postcards: {}, diaries: {}, isGeneratingPostcard: false,
    equippedAccessory: 'none', unlockedAccessories: ['none'], scrambleWords: [], selectedWords: [], chatHistory: [], dailyChallenge: ''
  });

  const [shuffledOptions, setShuffledOptions] = useState<string[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const tetrisLoopRef = useRef<any>(null);

  const initAudio = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      if (state.screen === 'intro') playIntroTheme(audioContextRef.current);
    }
    if (audioContextRef.current.state === 'suspended') audioContextRef.current.resume();
  };

  const playTTS = async (text: string) => {
    try {
      initAudio();
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text }] }],
        config: { 
          responseModalities: [Modality.AUDIO], 
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } } 
        },
      });
      const base64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64 && audioContextRef.current) {
        const binaryString = window.atob(base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
        const dataInt16 = new Int16Array(bytes.buffer);
        const buffer = audioContextRef.current.createBuffer(1, dataInt16.length, 24000);
        const channelData = buffer.getChannelData(0);
        for (let i = 0; i < dataInt16.length; i++) channelData[i] = dataInt16[i] / 32768.0;
        const source = audioContextRef.current.createBufferSource();
        source.buffer = buffer; 
        source.connect(audioContextRef.current.destination);
        source.start();
      }
    } catch { }
  };

  const checkAnswer = (opt: string, currentQ: any) => {
    initAudio();
    if (opt === currentQ.correctAnswer) {
      if (audioContextRef.current) playCorrectSound(audioContextRef.current);
      setState(s => ({ ...s, score: s.score + 10, attempts: 0, showExplanation: true, userAnswer: opt }));
      playTTS(`${opt}! Correct!`);
    } else {
      if (audioContextRef.current) play8BitNote(audioContextRef.current, 110, 0.2, 'sawtooth');
      setState(s => ({ ...s, attempts: s.attempts + 1 }));
      playTTS("Try again!");
    }
  };

  useEffect(() => {
    if (state.screen === 'playing') {
      const missionQs = QUESTIONS.filter(q => q.mission === state.activeMission);
      if (missionQs[state.currentQuestionIndex]) {
        setShuffledOptions(shuffleArray(missionQs[state.currentQuestionIndex].options));
      }
    }
  }, [state.screen, state.currentQuestionIndex, state.activeMission]);

  useEffect(() => {
    if (state.screen === 'game_over') {
      const loop = () => { if (audioContextRef.current) playTetrisTheme(audioContextRef.current); };
      loop();
      tetrisLoopRef.current = setInterval(loop, 4000);
    } else {
      if (tetrisLoopRef.current) clearInterval(tetrisLoopRef.current);
    }
    return () => clearInterval(tetrisLoopRef.current);
  }, [state.screen]);

  // --- RENDERS ---
  if (state.screen === 'intro') return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-blue-500 overflow-hidden" onClick={initAudio}>
      <div className="mc-panel p-6 max-w-xs w-full text-center shadow-[10px_10px_0px_rgba(0,0,0,0.5)] bg-white border-4 border-black">
        <h1 className="mc-logo text-xl text-black leading-tight mb-1">SUPER FELIPE Y GUILLE</h1>
        <h2 className="mc-logo text-sm text-red-600 animate-pulse mb-6">La Gran Aventura</h2>
        <VoxelFelipe isActive={true} isDancing={true} isNight={state.isNight} size="w-32 h-32 mx-auto mb-8" />
        <div className="space-y-4">
          <button onClick={() => setState(s => ({ ...s, screen: 'mission_select' }))} className="mc-button w-full text-sm py-4 bg-green-500 text-white">START GAME</button>
          <button onClick={() => setState(s => ({ ...s, screen: 'passport' }))} className="mc-button w-full text-xs py-3 bg-yellow-400 text-black">PASSPORT</button>
        </div>
      </div>
    </div>
  );

  if (state.screen === 'passport') return (
    <div className="min-h-screen p-4 flex flex-col items-center bg-orange-100">
      <h2 className="mc-logo text-lg mb-6 text-black">MY PROGRESS</h2>
      <div className="mc-panel w-full max-w-sm p-4 bg-white border-4 border-black shadow-[8px_8px_0px_#8b4513]">
        <div className="flex items-center gap-4 mb-6 border-b-4 border-black pb-4">
          <VoxelFelipe isActive={false} isNight={state.isNight} size="w-16 h-16" />
          <div>
            <p className="text-xs font-black text-gray-400">HERO</p>
            <p className="text-lg font-black text-black font-mono">FELIPE_&_GUILLE</p>
            <p className="text-sm font-bold text-red-600">XP: {state.score}</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {missions.map(m => {
            const isDone = state.stamps.includes(m.id);
            return (
              <div key={m.id} className={`p-2 border-2 border-black flex flex-col items-center ${isDone ? 'bg-yellow-100' : 'bg-gray-200 grayscale opacity-40'}`}>
                <span className="text-2xl">{m.icon}</span>
                <span className="text-[8px] font-black uppercase mt-1">{m.reward}</span>
              </div>
            );
          })}
        </div>
        <button onClick={() => setState(s => ({ ...s, screen: 'intro' }))} className="mt-8 mc-button w-full bg-blue-600 text-white py-3 text-xs">BACK</button>
      </div>
    </div>
  );

  if (state.screen === 'mission_select') return (
    <div className="min-h-screen p-4 bg-sky-300 flex flex-col items-center">
      <h2 className="mc-logo text-lg mb-6 text-black">WORLD MAP</h2>
      <div className="grid grid-cols-2 gap-4 w-full max-w-sm overflow-y-auto pb-8">
        {missions.map(m => {
          const isCompleted = state.stamps.includes(m.id);
          return (
            <button key={m.id} onClick={() => {
              setState(s => ({ ...s, screen: 'playing', activeMission: m.id, currentQuestionIndex: 0, showExplanation: false, attempts: 0 }));
              playTTS(`World ${m.id}`);
            }} className={`mc-panel p-4 relative border-4 border-black flex flex-col items-center gap-2 ${isCompleted ? 'bg-green-100' : 'bg-white'}`}>
              <span className="text-4xl">{m.icon}</span>
              <span className="font-black text-[10px] text-black uppercase">{m.title}</span>
              {isCompleted && <span className="absolute top-1 right-1 text-xs">✅</span>}
            </button>
          );
        })}
      </div>
      <button onClick={() => setState(s => ({ ...s, screen: 'intro' }))} className="mt-auto mc-button bg-black text-white py-3 px-8 text-xs mb-4">EXIT</button>
    </div>
  );

  if (state.screen === 'playing') {
    const missionQs = QUESTIONS.filter(q => q.mission === state.activeMission);
    const currentQ = missionQs[state.currentQuestionIndex];
    const displaySentence = state.showExplanation 
      ? currentQ.text.replace('________', `<span class="text-green-700 underline font-black bg-green-200 px-2 rounded-sm border-2 border-green-800">${currentQ.correctAnswer}</span>`)
      : currentQ.text;

    return (
      <div className="min-h-screen flex flex-col items-center p-3 bg-emerald-700">
        <header className="w-full max-w-sm flex justify-between items-center p-2 mb-4 bg-black/40 border-2 border-black">
          <button onClick={() => setState(s => ({ ...s, screen: 'mission_select' }))} className="mc-button bg-red-600 text-white text-[8px] p-2">QUIT</button>
          <div className="text-white font-black flex gap-4 text-xs">
             <span>Lvl {state.currentQuestionIndex + 1}</span>
             <span className="text-yellow-400">XP {state.score}</span>
          </div>
        </header>

        <main className="mc-panel w-full max-w-sm p-4 bg-white border-4 border-black shadow-[6px_6px_0px_rgba(0,0,0,0.5)]">
          <div className="flex items-center gap-4 mb-4">
            <VoxelFelipe isActive={state.showExplanation} isDancing={state.showExplanation} mood={state.attempts >= 2 ? 'sad' : 'normal'} isNight={state.isNight} size="w-16 h-16" />
            <div className="bg-blue-50 border-2 border-black p-3 flex-1 text-black font-black text-sm leading-tight text-center rounded-lg">
              <div dangerouslySetInnerHTML={{ __html: displaySentence }} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {shuffledOptions.map((o, i) => (
              <button key={i} disabled={state.showExplanation} onClick={() => checkAnswer(o, currentQ)} 
                className={`mc-button text-[10px] py-4 border-2 ${state.showExplanation && o === currentQ.correctAnswer ? 'bg-green-500 border-green-800 text-white' : 'bg-gray-100'}`}>
                {o}
              </button>
            ))}
          </div>

          {state.attempts >= 2 && !state.showExplanation && (
            <div className="mt-4 p-2 bg-orange-100 border-2 border-orange-500 text-center rounded-lg">
              <p className="font-black text-orange-900 text-[10px] uppercase">HINT: {currentQ.hint}</p>
            </div>
          )}

          {state.showExplanation && (
            <div className="mt-4 p-4 bg-yellow-400 border-4 border-black text-center rounded-xl animate-in fade-in">
              <p className="text-xs font-black mb-4 italic">" {currentQ.translation} "</p>
              <button onClick={() => {
                if (state.currentQuestionIndex + 1 < missionQs.length) {
                  setState(s => ({ ...s, currentQuestionIndex: s.currentQuestionIndex + 1, showExplanation: false, attempts: 0 }));
                } else {
                  setState(s => ({ ...s, screen: 'game_over', stamps: [...new Set([...s.stamps, state.activeMission])] }));
                }
              }} className="mc-button w-full bg-emerald-700 text-white text-xs py-3">NEXT »</button>
            </div>
          )}
        </main>
      </div>
    );
  }

  if (state.screen === 'game_over') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-black overflow-hidden">
        <div className="mc-panel p-8 text-center max-w-xs w-full bg-white border-8 border-black shadow-[15px_15px_0px_#333]">
          <h2 className="mc-logo text-emerald-600 mb-4 text-xl animate-bounce tracking-tighter">WORLD CLEAR!</h2>
          <VoxelFelipe isActive={true} isDancing={true} isNight={state.isNight} size="w-32 h-32 mx-auto mb-6" />
          <div className="bg-gray-100 p-4 border-4 border-black mb-6">
             <p className="text-[10px] uppercase text-gray-400 mb-1 font-black">TOTAL XP</p>
             <p className="font-black text-4xl text-black">{state.score}</p>
          </div>
          <button onClick={() => setState(s => ({ ...s, screen: 'mission_select' }))} className="mc-button w-full py-4 text-sm bg-orange-600 text-white">CONTINUE</button>
        </div>
      </div>
    );
  }

  return null;
}
